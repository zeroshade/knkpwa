package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
  "log"
  "time"

  "github.com/zeroshade/knkpwa/knkpwa/models"

  "github.com/jinzhu/gorm"
  _ "github.com/jinzhu/gorm/dialects/mysql"

  webpush "github.com/SherClockHolmes/webpush-go"
)

func getAccessToken(clientId, clientSecret, aud, url string) (string, error) {
	payload := strings.NewReader(fmt.Sprintf("{\"client_id\":\"%s\", \"client_secret\":\"%s\",\"audience\":\"%s\", \"grant_type\":\"client_credentials\"}",
		clientId, clientSecret, aud))

	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		return "", err
	}

	req.Header.Add("content-type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}

	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return "", err
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return "", err
	}

	return data["access_token"].(string), nil
}

func getUserList(token string) (data []interface{}, err error) {
	api := "https://knk.auth0.com/api/v2/users"
	req, err := http.NewRequest("GET", api, nil)
	if err != nil {
		return
	}

	req.Header.Add("authorization", "Bearer "+token)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}

	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return
	}

	err = json.Unmarshal(body, &data)
	return
}

func resolveTime(start string, day time.Time) time.Time {
  t, _ := time.ParseInLocation("3:04 PM", start, day.Location())
  if t.Hour() <= 3 {
    day = day.AddDate(0, 0, 1)
  }
  y, m, d := day.Date()
  return time.Date(y, m, d, t.Hour(), t.Minute(), 0, 0, t.Location())
}

type Notif struct {
  Message string `json:"body"`
  Title string `json:"title"`
}

func createNotif(d time.Duration, ev *models.Event) (n Notif) {
  n.Message = fmt.Sprintf("'%s' starting in %s in %.0f minutes!", ev.Name, ev.Room, d.Minutes())
  n.Title = "Hey! Listen!"
  return
}

func main() {
	CLIENT_ID := os.Getenv("CLIENT_ID")
	CLIENT_SECRET := os.Getenv("CLIENT_SECRET")
	AUDIENCE := os.Getenv("CLIENT_AUD")

	url := "https://knk.auth0.com/oauth/token"
	token, _ := getAccessToken(CLIENT_ID, CLIENT_SECRET, AUDIENCE, url)

	users, _ := getUserList(token)

	idToFavs := make(map[string][]int)
	for _, v := range users {
		data := v.(map[string]interface{})
    if data["user_metadata"] != nil {
      user_id := data["user_id"].(string)
      //fmt.Println(data["name"].(string))
      //fmt.Println(user_id)
      user_metadata := data["user_metadata"].(map[string]interface{})
      //fmt.Println(user_metadata)

      favs := user_metadata["favs"].([]interface{})
      idToFavs[user_id] = make([]int, 0, len(favs))
      for _, i := range favs {
        switch v := i.(type) {
        case int:
          idToFavs[user_id] = append(idToFavs[user_id], v)
        case float64:
          idToFavs[user_id] = append(idToFavs[user_id], int(v))
        case float32:
          idToFavs[user_id] = append(idToFavs[user_id], int(v))
        }
      }
    }
	}
	//fmt.Println(idToFavs)

  db, err := gorm.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True&loc=America%2FNew_York",
    os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
  if err != nil {
    log.Fatal("Could not connect to DB", err)
  }
  defer db.Close()
  db.AutoMigrate(&models.Subscription{}, &models.Event{})

  vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")

  var s []models.Subscription
  db.Find(&s)

  for _, sub := range s {
    favs := idToFavs[sub.UserID]
    var evs []models.Event
    db.Find(&evs, favs)

    for _, e := range evs {
      t := resolveTime(e.Start, e.Day)
      d := t.Sub(time.Now().In(e.Day.Location()))
      if d.Minutes() > 0 && d.Minutes() <= 10 {
        n, err := json.Marshal(createNotif(d, &e))
        if err != nil {
          log.Println(err)
          continue
        }
        resp, err := webpush.SendNotification(n, &sub.SubJSON, &webpush.Options{
          Subscriber: "zotthewizard@gmail.com",
          VAPIDPrivateKey: vapidPrivateKey,
        })

        if err != nil {
          log.Println(sub.UserID, err)
        } else {
          log.Println(fmt.Sprintf("Sent Notif to: %s For EV: %s, Status: %d", sub.UserID, e.Name, resp.StatusCode))
        }
      }
    }
  }
}
