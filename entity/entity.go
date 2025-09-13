package entity

import "time"

// Question represents a question in the database
type Question struct {
	ID        string
	TopicID   string
	Question  string
	CreatedBy string
	UpdatedBy string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Topic represents a topic in the database
type Topic struct {
	ID        string
	Topic     string
	CreatedBy string
	UpdatedBy string
	CreatedAt time.Time
	UpdatedAt time.Time
}
