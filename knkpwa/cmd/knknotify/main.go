package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
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
		user_id := data["user_id"].(string)
		user_metadata := data["user_metadata"].(map[string]interface{})
		idToFavs[user_id] = user_metadata["favs"].([]int)
	}
	fmt.Println(idToFavs)
}
