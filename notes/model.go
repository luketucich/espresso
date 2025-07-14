package notes

import "time"

type Note struct {
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	LastUpdated time.Time `json:"last_updated"`
}
