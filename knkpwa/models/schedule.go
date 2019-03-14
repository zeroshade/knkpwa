package models

import (
	"encoding/json"
	"time"
)

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

type ColorMap struct {
	Room    string `gorm:"primary_key"`
	Color   string
	SchedID uint `gorm:"primary_key"`
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

func (ColorMap) TableName() string {
	return "knkroom_colors"
}

func (Schedule) TableName() string {
	return "knkscheds"
}
