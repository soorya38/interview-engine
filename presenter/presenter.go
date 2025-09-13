package presenter

import "time"

// Question represents a question in the database
type Question struct {
	ID        string    `json:"id,omitempty"`
	TopicID   string    `json:"topic_id,omitempty"`
	Question  string    `json:"question,omitempty"`
	CreatedBy string    `json:"created_by,omitempty"`
	UpdatedBy string    `json:"updated_by,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

// Topic represents a topic in the database
type Topic struct {
	ID        string    `json:"id,omitempty"`
	Topic     string    `json:"topic,omitempty"`
	CreatedBy string    `json:"created_by,omitempty"`
	UpdatedBy string    `json:"updated_by,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}
