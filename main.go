package main

import (
	"bytes"
	"encoding/json"
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

const (
	vapidPrivateKey = "7-axl4mKWJC81o6vLAzKZoDiEeSOAdRjx3OXdLmS9h0"
)

var loc *time.Location

func init() {
	loc, _ = time.LoadLocation("America/New_York")
}

type Schedule struct {
	ID       uint       `json:"id"`
	Title    string     `json:"title" gorm:"type:varchar(50)"`
	Start    string     `json:"start" gorm:"type:varchar(5)"`
	DayStart time.Time  `json:"dayStart" gorm:"type:date"`
	DayEnd   time.Time  `json:"dayEnd" gorm:"type:date"`
	NumHours uint       `json:"numHours"`
	DefColor string     `json:"defColor" gorm:"type:varchar(50)"`
	ColorMap []ColorMap `json:"-" gorm:"foreignkey:SchedID"`
	Events   []Event    `json:"events,omitempty" gorm:"foreignkey:SchedID"`
}

type Event struct {
	ID         uint      `json:"id"`
	SchedID    uint      `json:"schedId"`
	Name       string    `json:"title" gorm:"type:varchar(100)"`
	Room       string    `json:"room" gorm:"type:varchar(20)"`
	Icon       string    `json:"icon" gorm:"type:varchar(30)"`
	Start      string    `json:"startTime" gorm:"type:varchar(10)"`
	End        string    `json:"endTime" gorm:"type:varchar(10)"`
	Day        time.Time `json:"day" gorm:"type:date"`
	Organizer  string    `json:"organizer" gorm:"type:varchar(50)"`
	Descript   string    `json:"desc" gorm:"type:text"`
	HideAgenda bool      `json:"hideAgenda"`
}

func (s *Schedule) MarshalJSON() ([]byte, error) {
	colors := make(map[string]string)
	for _, c := range s.ColorMap {
		colors[c.Room] = c.Color
	}

	type Alias Schedule
	return json.Marshal(&struct {
		DayStart string            `json:"dayStart"`
		DayEnd   string            `json:"dayEnd"`
		ColorMap map[string]string `json:"colorMap"`
		*Alias
	}{
		DayStart: s.DayStart.Format("2006-01-02"),
		DayEnd:   s.DayEnd.Format("2006-01-02"),
		ColorMap: colors,
		Alias:    (*Alias)(s),
	})
}

func (s *Schedule) UnmarshalJSON(data []byte) error {
	type Alias Schedule
	aux := &struct {
		DayStart string            `json:"dayStart"`
		DayEnd   string            `json:"dayEnd"`
		ColorMap map[string]string `json:"colorMap"`
		*Alias
	}{
		Alias: (*Alias)(s),
	}
	err := json.Unmarshal(data, &aux)
	if err != nil {
		return err
	}

	s.DayStart, err = time.ParseInLocation("2006-01-02", aux.DayStart, loc)
	s.DayEnd, err = time.ParseInLocation("2006-01-02", aux.DayEnd, loc)
	for k, v := range aux.ColorMap {
		s.ColorMap = append(s.ColorMap, ColorMap{Room: k, Color: v, SchedID: aux.ID})
	}

	return err
}

type ColorMap struct {
	Room    string `gorm:"primary_key"`
	Color   string
	SchedID uint `gorm:"primary_key"`
}

func (e *Event) MarshalJSON() ([]byte, error) {
	type Alias Event
	return json.Marshal(&struct {
		Day string `json:"day"`
		*Alias
	}{
		Day:   e.Day.Format("2006-01-02"),
		Alias: (*Alias)(e),
	})
}

func (e *Event) UnmarshalJSON(data []byte) error {
	type Alias Event
	aux := &struct {
		Day string `json:"day"`
		*Alias
	}{
		Alias: (*Alias)(e),
	}

	err := json.Unmarshal(data, &aux)
	if err != nil {
		return err
	}

	e.Day, err = time.ParseInLocation("2006-01-02", aux.Day, loc)
	return err
}

func (Event) TableName() string {
	return "knkevents"
}

func (ColorMap) TableName() string {
	return "knkroom_colors"
}

func (Schedule) TableName() string {
	return "knkscheds"
}

type Subscription struct {
	ID      uint                 `json:"id"`
	UserID  string               `json:"-" gorm:"index"`
	SubText string               `json:"-" gorm:"type:text"`
	SubJSON webpush.Subscription `json:"subscription" binding:"required" gorm:"-"`
}

func (s *Subscription) PopulateText() (err error) {
	b, err := json.Marshal(s.SubJSON)
	if err == nil {
		s.SubText = string(b)
	}
	return
}

func (s *Subscription) PopulateJSON() (err error) {
	err = json.NewDecoder(bytes.NewBufferString(s.SubText)).Decode(&s.SubJSON)
	return
}

func (s *Subscription) BeforeSave() (err error) {
	err = s.PopulateText()
	return
}

func (s *Subscription) AfterFind() (err error) {
	err = s.PopulateJSON()
	return
}

type Notify struct {
	UserID  string `json:"userId" binding:"required"`
	Message string `json:"message" binding:"required"`
}

func main() {
	port := os.Getenv("PORT")

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
	config.AllowOrigins = []string{"http://localhost:8080", "http://localhost:8090"}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(cors.New(config))

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

	router.PUT("/scheds/:id", func(c *gin.Context) {
		var sc Schedule
		c.BindJSON(&sc)
		db.Save(&sc)
		c.Status(http.StatusOK)
	})

	router.GET("/scheds/:id/events", func(c *gin.Context) {
		var events []Event
		db.Debug().Find(&events, "sched_id = ?", c.Param("id"))

		c.JSON(http.StatusOK, events)
	})

	router.PUT("/events/:id", func(c *gin.Context) {
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

	router.Use(static.ServeRoot("/", "./dist"))
	router.NoRoute(func(c *gin.Context) {
		_, file := path.Split(c.Request.RequestURI)
		ext := filepath.Ext(file)
		if file == "" || ext == "" {
			c.File("./dist/index.html")
		}
	})

	router.Run(":" + port)
}
