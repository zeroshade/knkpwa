package main

import (
	"encoding/json"
	"time"
)

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

type DraftEvent struct {
	Event
}

func (DraftEvent) TableName() string {
	return "knk_draft_events"
}
