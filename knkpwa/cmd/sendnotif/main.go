package main

import (
	"fmt"
	"log"
	"os"

	"github.com/zeroshade/knkpwa/knkpwa/models"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

func main() {
	user_id := "google-oauth2|106274189334051581038"
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")

	db, err := gorm.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True&loc=Local",
		os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		log.Fatal("Could not connect to DB", err)
	}
	defer db.Close()

	var s models.Subscription
	db.Find(&s, "user_id = ?", user_id)

	resp, _ := webpush.SendNotification([]byte("Howdy Ash!"), &s.SubJSON, &webpush.Options{
		Subscriber:      "zotthewizard@gmail.com",
		VAPIDPrivateKey: vapidPrivateKey,
	})
	fmt.Println(resp.StatusCode)
}
