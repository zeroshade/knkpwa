package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"

	webpush "github.com/SherClockHolmes/webpush-go"
)

var loc *time.Location

func init() {
	loc, _ = time.LoadLocation("America/New_York")
}

func ServeFile(urlPrefix, root string) gin.HandlerFunc {
	fs := static.LocalFile(root, false)
	fileserver := http.FileServer(fs)
	if urlPrefix != "" {
		fileserver = http.StripPrefix(urlPrefix, fileserver)
	}
	return func(c *gin.Context) {
		if fs.Exists(urlPrefix, c.Request.URL.Path) {
			c.Header("Cache-Control", "public, max-age=31536000")
			fileserver.ServeHTTP(c.Writer, c.Request)
			c.Abort()
		}
	}
}

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

	db, err := gorm.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True&loc=Local",
		os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		log.Fatal("Could not connect to DB", err)
	}
	defer db.Close()

	db.AutoMigrate(&Subscription{}, &Schedule{}, &Event{}, &ColorMap{})

	config := cors.DefaultConfig()
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	config.AllowOrigins = []string{"http://localhost:8080", "http://fxdeva16.factset.com:8090",
		"http://localhost:8090", "https://knksched.herokuapp.com"}

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

	router.GET("/scheds", func(c *gin.Context) {
		var scheds []Schedule
		db.Preload("ColorMap").Order("day_start desc").Find(&scheds)

		c.JSON(http.StatusOK, scheds)
	})

	router.GET("/scheds/:id", func(c *gin.Context) {
		var sc Schedule
		db.Preload("ColorMap").Find(&sc, "id = ?", c.Param("id"))
		c.JSON(http.StatusOK, &sc)
	})

	router.PUT("/scheds/:id", checkJWT("modify:schedule"), func(c *gin.Context) {
		var sc Schedule
		c.BindJSON(&sc)
		db.Save(&sc)
		c.Status(http.StatusOK)
	})

	router.GET("/scheds/:id/events", func(c *gin.Context) {
		var events []Event
		db.Find(&events, "sched_id = ?", c.Param("id"))

		c.JSON(http.StatusOK, events)
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
		_, file := path.Split(c.Request.RequestURI)
		ext := filepath.Ext(file)
		if file == "" || ext == "" {
			c.File("./dist/index.html")
		}
	})

	router.Run(":" + port)
}
