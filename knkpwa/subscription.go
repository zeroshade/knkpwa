package main

import (
	"bytes"
	"encoding/json"

	webpush "github.com/SherClockHolmes/webpush-go"
)

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
