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
	Clues    []Clue `json:"clues"`
}

func (Hunt) TableName() string {
	return "knkscavenger"
}

type Clue struct {
	ID      string `json:"id" gorm:"primary_key;type:varchar(40)" binding:"required"`
	Text    string `json:"text" gorm:"type:text" binding:"required"`
	HuntID  uint   `json:"huntId" binding:"required"`
	BgColor string `json:"bgColor" gorm:"type:varchar(7)"`
	Color   string `json:"color" gorm:"type:varchar(7)"`
}

func (Clue) TableName() string {
	return "knkclues"
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
