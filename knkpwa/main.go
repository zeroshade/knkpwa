package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	. "github.com/zeroshade/knkpwa/knkpwa/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"

	webpush "github.com/SherClockHolmes/webpush-go"
)

// ServeFile Create HandlerFunc to serve up static files at the specified prefix
func ServeFile(urlPrefix, root string) gin.HandlerFunc {
	fs := static.LocalFile(root, false)
	fileserver := http.FileServer(fs)
	if urlPrefix != "" {
		fileserver = http.StripPrefix(urlPrefix, fileserver)
	}
	return func(c *gin.Context) {
		if fs.Exists(urlPrefix, c.Request.URL.Path) {
			if !strings.Contains(c.Request.URL.Path, "service-worker.js") {
				c.Header("Cache-Control", "public, max-age=31536000")
			}
			fileserver.ServeHTTP(c.Writer, c.Request)
			c.Abort()
		}
	}
}

// Notify struct for receiving requests to send notifications
type Notify struct {
	UserID  string `json:"userId" binding:"required"`
	Message string `json:"message" binding:"required"`
}

func main() {
	port := os.Getenv("PORT")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")

	if port == "" {
		log.Fatal("$PORT must be set")
	}

	db, err := gorm.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True&loc=America%%2FNew_York",
		os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		log.Fatal("Could not connect to DB", err)
	}
	defer db.Close()

	db.AutoMigrate(&Subscription{}, &Schedule{}, &Event{}, &ColorMap{}, &Solution{},
		&DraftEvent{}, &RoomOrdering{}, &Hunt{}, &Clue{}, &UserClue{}, &MapPiece{})
	db.Model(&Clue{}).AddForeignKey("hunt_id", Hunt{}.TableName()+"(id)", "CASCADE", "RESTRICT")
	db.Model(&UserClue{}).AddForeignKey("clue_id", Clue{}.TableName()+"(id)", "CASCADE", "RESTRICT")
	db.Model(&MapPiece{}).AddForeignKey("hunt_id", MapPiece{}.TableName()+"(id)", "CASCADE", "RESTRICT")
	db.Model(&MapPiece{}).Association("Clues")

	config := cors.DefaultConfig()
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	config.AllowOrigins = []string{"http://localhost:8080", "http://fxdeva11:8081",
		"http://localhost:8090", "https://schedule.kithandkink.com"}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(cors.New(config))

	router.Use(func(c *gin.Context) {
		host := c.Request.Host
		proto := c.GetHeader("x-forwarded-proto")
		if host != "localhost:8090" && host != "fxdeva16.factset.com:8090" && proto != "https" {
			c.Redirect(http.StatusMovedPermanently, "https://"+host+c.Request.URL.RequestURI())
			return
		}
		c.Next()
	})

	router.POST("/hunt", SaveHunt(db))
	router.POST("/hunt/:id/answers", SaveSolutions(db))
	router.DELETE("/hunt/:id", DeleteHunt(db))
	router.GET("/hunts", ListHunts(db))
	router.PUT("/hunts/clue", AddClue(db))
	router.POST("/hunts/clue", UpdateClue(db))
	router.DELETE("/hunts/clue/:id", DeleteClue(db))
	router.POST("/hunts/maps/:id", UpdateMapClueList(db))
	router.GET("/hunts/clue/:id", GetClue(db))
	router.GET("/my/clues", checkJWT(), GetUserClueList(db))
	router.PUT("/my/clues/:huntid/:id", checkJWT(), AddUserClue(db))
	router.GET("/huntinfo", HuntInfo(db))
	router.GET("/huntinfo/maps", GetMapPieces(db))
  router.GET("/huntinfo/guess/:id", checkJWT(), GetOptions(db))

	router.GET("/scheds", func(c *gin.Context) {
		var scheds []Schedule
		db.Preload("ColorMap").Preload("RoomOrdering").Order("day_start desc").Find(&scheds)

		c.JSON(http.StatusOK, scheds)
	})

	router.GET("/scheds/:id", func(c *gin.Context) {
		var sc Schedule
		db.Preload("ColorMap").Preload("RoomOrdering").Find(&sc, "id = ?", c.Param("id"))
		c.JSON(http.StatusOK, &sc)
	})

	router.PUT("/scheds/:id", checkJWT("modify:schedule"), func(c *gin.Context) {
		var sc Schedule
		c.BindJSON(&sc)
		db.Save(&sc)
		c.Status(http.StatusOK)
	})

	router.POST("/scheds", checkJWT("create:schedule"), func(c *gin.Context) {
		var sc Schedule
		if err := c.ShouldBindJSON(&sc); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if db.NewRecord(sc) {
			db.Create(&sc)
		} else {
			db.Save(&sc)
		}
		c.Status(http.StatusOK)
	})

	router.DELETE("/scheds/:id", func(c *gin.Context) {
		db.Delete(Schedule{}, "id = ?", c.Param("id"))
		c.Status(http.StatusOK)
	})

	router.GET("/scheds/:id/events", func(c *gin.Context) {
		var events []Event
		db.Find(&events, "sched_id = ?", c.Param("id"))

		c.JSON(http.StatusOK, events)
	})

	router.GET("/scheds/:id/draft", func(c *gin.Context) {
		var events []DraftEvent
		db.Find(&events, "sched_id = ?", c.Param("id"))
		c.JSON(http.StatusOK, events)
	})

	router.DELETE("/draft/:id", func(c *gin.Context) {
		db.Delete(DraftEvent{}, "id = ?", c.Param("id"))
		c.Status(http.StatusOK)
	})

	router.PUT("/draft/publish/:id", checkJWT("create:event"), func(c *gin.Context) {
		var ev DraftEvent
		db.Find(&ev, "id = ?", c.Param("id"))

		pub := ev.Event
		pub.ID = 0
		db.Create(&pub)
		db.Delete(&ev)
		c.Status(http.StatusOK)
	})

	router.POST("/draft", func(c *gin.Context) {
		var ev DraftEvent
		if err := c.ShouldBindJSON(&ev); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if db.NewRecord(ev) {
			db.Create(&ev)
		} else {
			db.Save(&ev)
		}
		c.JSON(http.StatusOK, gin.H{"id": ev.ID})
	})

	router.POST("/events", checkJWT("create:event"), func(c *gin.Context) {
		var ev Event
		if err := c.ShouldBindJSON(&ev); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if db.NewRecord(ev) {
			db.Create(&ev)
		} else {
			db.Save(&ev)
		}
		c.Status(http.StatusOK)
	})

	router.PUT("/events/:id", checkJWT("modify:event"), func(c *gin.Context) {
		var ev Event
		c.BindJSON(&ev)
		db.Save(&ev)
		c.Status(http.StatusOK)
	})

	router.DELETE("/events/:id", func(c *gin.Context) {
		db.Delete(Event{}, "id = ?", c.Param("id"))
		c.Status(http.StatusOK)
	})

	router.PUT("/sub", checkJWT(), func(c *gin.Context) {
		var sub Subscription
		c.BindJSON(&sub)

		sub.UserID = c.GetString("user_id")

		db.Create(&sub)
		c.Status(http.StatusOK)
	})

	router.DELETE("/sub", checkJWT(), func(c *gin.Context) {
		var sub Subscription
		c.BindJSON(&sub)
		sub.UserID = c.GetString("user_id")
		sub.PopulateText()

		db.Where("user_id = ? AND sub_text = ?", sub.UserID, sub.SubText).Delete(&Subscription{})
	})

	router.PUT("/notify", checkJWT("create:schedule"), func(c *gin.Context) {
		var n Notify
		c.BindJSON(&n)

		var s []Subscription
		db.Debug().Find(&s, "user_id = ?", n.UserID)

		for _, sub := range s {
			resp, err := webpush.SendNotification([]byte(n.Message), &sub.SubJSON, &webpush.Options{
				Subscriber:      "zotthewizard@gmail.com",
				VAPIDPrivateKey: vapidPrivateKey,
			})
			if err != nil {
				log.Println(err)
			}
			log.Println(resp.StatusCode)

			if resp.StatusCode == http.StatusCreated {
				log.Println("success")
			} else if resp.StatusCode == http.StatusTooManyRequests {
				log.Println("too many requests")
			} else if resp.StatusCode == http.StatusBadRequest {
				log.Println("Bad Request")
			} else if resp.StatusCode == http.StatusNotFound ||
				resp.StatusCode == http.StatusGone {
				log.Println("Removing bad subscription")
				db.Delete(&sub)
			}
		}

		c.Status(200)
	})

	router.GET("/test", checkJWT("create:schedule"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"text": "howdy"})
	})

	router.Use(Gzip(DefaultCompression, 1024))
	router.Use(ServeFile("/", "./dist"))
	router.NoRoute(func(c *gin.Context) {
		start, file := path.Split(c.Request.RequestURI)
		ext := filepath.Ext(file)

		if strings.Contains(start, "/admin") {
			c.File("./dist/admin/index.html")
		} else if file == "" || ext == "" {
			c.File("./dist/index.html")
		} else {
			c.Status(http.StatusNotFound)
		}
	})

	router.Run(":" + port)
}
