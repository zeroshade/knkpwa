package models

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Hunt struct {
	ID       uint   `json:"id"`
	Name     string `json:"title" gorm:"type:varchar(100)" binding:"required"`
	Descript string `json:"desc" gorm:"type:text"`
	Clues    []Clue `json:"clues,omitempty"`
}

func (Hunt) TableName() string {
	return "knkscavenger"
}

type Clue struct {
	ID      string `json:"id" gorm:"primary_key;type:varchar(40)" binding:"required"`
	Title   string `json:"title" gorm:"type:varchar(20)" binding:"required"`
	Text    string `json:"text" gorm:"type:text" binding:"required"`
	HuntID  uint   `json:"huntId" binding:"required"`
	BgColor string `json:"bgColor" gorm:"type:varchar(7)"`
	Color   string `json:"color" gorm:"type:varchar(7)"`
}

func (Clue) TableName() string {
	return "knkclues"
}

type UserClue struct {
	UserID string
	ClueID string
}

func (UserClue) TableName() string {
	return "knk_user_clue"
}

func HuntInfo(db *gorm.DB) gin.HandlerFunc {
	type Ret struct {
		Hunt
		NumClues uint `json:"numClues"`
	}

	return func(c *gin.Context) {
		var ret []Ret
		db.Table(Hunt{}.TableName()).Select("id, name, descript, (?) as num_clues",
			db.Table(Clue{}.TableName()).Select("count(*)").Where("hunt_id = knkscavenger.id").QueryExpr()).Find(&ret)
		c.JSON(http.StatusOK, ret)
	}
}

func AddUserClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userSub := c.MustGet("user_id").(string)
		u := &UserClue{UserID: userSub, ClueID: c.Param("id")}
		db.Create(&u)
		c.Status(http.StatusOK)
	}
}

func GetUserClueList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userSub := c.MustGet("user_id").(string)
		var clues []Clue
		db.Where("id in (?)", db.Table(UserClue{}.TableName()).Select("clue_id").
			Where("user_id = ?", userSub).QueryExpr()).Find(&clues)
		c.JSON(http.StatusOK, clues)
	}
}

func SaveHunt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var hunt Hunt
		if err := c.ShouldBindJSON(&hunt); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if db.NewRecord(hunt) {
			db.Create(&hunt)
		} else {
			db.Save(&hunt)
		}
		c.Status(http.StatusOK)
	}
}

func DeleteHunt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db.Delete(&Hunt{}, "id = ?", c.Param("id"))
		c.Status(http.StatusOK)
	}
}

func ListHunts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var hunts []Hunt
		db.Preload("Clues").Find(&hunts)

		c.JSON(http.StatusOK, hunts)
	}
}

func AddClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var clue Clue
		if err := c.ShouldBindJSON(&clue); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		db.Create(&clue)
		c.Status(http.StatusOK)
	}
}

func UpdateClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var clue Clue
		if err := c.ShouldBindJSON(&clue); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		db.Save(&clue)
		c.Status(http.StatusOK)
	}
}

func DeleteClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db.Delete(Clue{}, "id = ?", c.Param("id"))
		c.Status(http.StatusOK)
	}
}

func GetClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var clue Clue
		db.Find(&clue, "id = ?", c.Param("id"))
		c.JSON(http.StatusOK, clue)
	}
}
