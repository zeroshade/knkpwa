package models

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Hunt struct {
	ID       uint   `json:"id"`
	Name     string `json:"title" gorm:"type:varchar(100)" binding:"required"`
	Descript string `json:"desc" gorm:"type:text"`
	Clues    []Clue `json:"clues,omitempty"`
	Type     string `json:"type"`
}

func (Hunt) TableName() string {
	return "knkscavenger"
}

type MapPiece struct {
	ID     uint   `json:"id" gorm:"primary_key" binding:"required"`
	Title  string `json:"title" gorm:"unique" binding:"required"`
	Class  string `json:"class" binding:"required"`
	Top    uint   `json:"top" binding:"required"`
	Left   uint   `json:"left" binding:"required"`
	Width  uint   `json:"width" binding:"required"`
	Height uint   `json:"height" binding:"required"`
}

func (MapPiece) TableName() string {
	return "knk_maps"
}

type Clue struct {
	ID         string    `json:"id" gorm:"primary_key;type:varchar(40)" binding:"required"`
	Title      string    `json:"title" gorm:"type:varchar(20)" binding:"required"`
	Text       string    `json:"text" gorm:"type:text" binding:"required"`
	HuntID     uint      `json:"huntId" binding:"required"`
	BgColor    string    `json:"bgColor" gorm:"type:varchar(7)"`
	Color      string    `json:"color" gorm:"type:varchar(7)"`
	MapPieceID uint      `json:"mapId"`
	Piece      *MapPiece `json:"mapPiece"`
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

func GetMapPieces(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pieces []MapPiece
		db.Find(&pieces)
		c.JSON(http.StatusOK, pieces)
	}
}

func getPieceMap(db *gorm.DB) map[uint]*MapPiece {
	var pieces []MapPiece
	db.Find(&pieces)

	piecemap := make(map[uint]*MapPiece)
	for i := range pieces {
		piecemap[pieces[i].ID] = &pieces[i]
	}
	return piecemap
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

		piecemap := getPieceMap(db)
		for i, c := range clues {
			if c.MapPieceID > 0 {
				clues[i].Piece = piecemap[c.MapPieceID]
			}
		}
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

		var pieces []MapPiece
		db.Find(&pieces)

		piecemap := getPieceMap(db)

		for i, h := range hunts {
			for j, c := range h.Clues {
				if c.MapPieceID > 0 {
					hunts[i].Clues[j].Piece = piecemap[c.MapPieceID]
				}
			}
		}

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
