package models

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Hunt struct {
	ID        uint       `json:"id"`
	Name      string     `json:"title" gorm:"type:varchar(100)" binding:"required"`
	Descript  string     `json:"desc" gorm:"type:text"`
	Clues     []Clue     `json:"clues,omitempty"`
	Pieces    []MapPiece `json:"mapPieces"`
	Answers   []Solution `json:"answers"`
	MapImg    string     `json:"mapImg"`
	MapHeight float32    `json:"mapHeight"`
	MapWidth  float32    `json:"mapWidth"`
}

func (Hunt) TableName() string {
	return "knkscavenger"
}

type Solution struct {
	HuntID    uint     `json:"huntId" binding:"required"`
	Title     string   `json:"title" binding:"required"`
	Solution  uint     `json:"solution" binding:"required"`
	Options   []string `json:"options" gorm:"-" binding:"required"`
	OptionSql string   `json:"-"`
}

func (Solution) TableName() string {
	return "knk_hunt_solutions"
}

func (s *Solution) BeforeSave() (err error) {
	s.OptionSql = strings.Join(s.Options, "][")
	return
}

func (s *Solution) AfterFind() (err error) {
	s.Options = strings.Split(s.OptionSql, "][")
	return
}

type MapPiece struct {
	ID     uint    `json:"id" gorm:"primary_key" binding:"required"`
	Title  string  `json:"title" gorm:"unique" binding:"required"`
	Class  string  `json:"class" binding:"required"`
	Top    uint    `json:"top" binding:"required"`
	Left   uint    `json:"left" binding:"required"`
	Width  uint    `json:"width" binding:"required"`
	Height uint    `json:"height" binding:"required"`
	HuntID uint    `json:"huntId"`
	Clues  []*Clue `json:"-" gorm:"many2many:knk_maps_clues"`
}

func (p *MapPiece) MarshalJSON() ([]byte, error) {
	type Alias MapPiece
	idlist := make([]string, 0, len(p.Clues))
	for _, c := range p.Clues {
		idlist = append(idlist, c.ID)
	}
	return json.Marshal(&struct {
		Clues []string `json:"clues"`
		*Alias
	}{
		Alias: (*Alias)(p),
		Clues: idlist,
	})
}

func (MapPiece) TableName() string {
	return "knk_maps"
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

type Solves struct {
	UserID uint `gorm:"primary_key"`
	HuntID uint `gorm:"primary_key"`
	When   time.Time
}

func (Solves) TableName() string {
	return "knk_hunt_solved"
}

func GetMapPieces(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pieces []MapPiece
		db.Find(&pieces)

		for i, p := range pieces {
			db.Model(&p).Association("Clues").Find(&pieces[i].Clues)
		}
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
		NumMaps  uint `json:"numMaps"`
	}

	return func(c *gin.Context) {
		var ret []Ret
		db.Table(Hunt{}.TableName()).Select("id, name, descript, map_img, map_height, map_width, (?) as num_clues, (?) as num_maps",
			db.Table(Clue{}.TableName()).Select("count(*)").Where("hunt_id = knkscavenger.id").QueryExpr(),
			db.Table(MapPiece{}.TableName()).Select("count(*)").Where("hunt_id = knkscavenger.id").QueryExpr()).Find(&ret)
		c.JSON(http.StatusOK, ret)
	}
}

func GetOptions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var hunt Hunt
		db.Preload("Answers").Find(&hunt, "id = ?", c.Param("id"))

		c.JSON(http.StatusOK, hunt.Answers)
	}
}

func UpdateMapClueList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type IdList struct {
			IDs []string `json:"ids" binding:"required"`
		}

		var ids IdList
		if err := c.ShouldBindJSON(&ids); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var clues []Clue
		for _, i := range ids.IDs {
			clues = append(clues, Clue{ID: i})
		}

		var piece MapPiece
		db.Find(&piece, "id = ?", c.Param("id"))
		db.Model(&piece).Association("Clues").Replace(clues)
	}
}

func AddUserClue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userSub := c.MustGet("user_id").(string)

		clue := &Clue{ID: c.Param("id")}
		db.Find(&clue)

		hid, _ := strconv.Atoi(c.Param("huntid"))
		if clue.HuntID != uint(hid) {
			c.Status(http.StatusConflict)
			return
		}

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
		db.Preload("Clues").Preload("Answers").Preload("Pieces").Preload("Pieces.Clues").Find(&hunts)

		for i, h := range hunts {
			for j := range h.Pieces {
				db.Model(&hunts[i].Pieces[j]).Association("Clues").Find(&hunts[i].Pieces[j].Clues)
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

func SaveSolutions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var answers []Solution
		if err := c.ShouldBindJSON(&answers); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		db.Delete(Solution{}, "hunt_id = ?", c.Param("id"))
		for _, s := range answers {
			db.Create(&s)
		}

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
