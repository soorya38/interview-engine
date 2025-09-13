package repository

import (
	"context"
	"database/sql"
	"mip/entity"
)

// Repository is the repository for the application
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new repository
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// CreateQuestionByTopic creates a new question by topic
func (r *Repository) CreateQuestionByTopic(ctx context.Context, topicID string, question string) error {
	_, err := r.db.ExecContext(ctx, "INSERT INTO questions (topic_id, question) VALUES (?, ?)", topicID, question)
	return err
}

// CreateTopic creates a new topic
func (r *Repository) CreateTopic(ctx context.Context, topic string) error {
	_, err := r.db.ExecContext(ctx, "INSERT INTO topics (topic) VALUES (?)", topic)
	return err
}

// GetQuestionsByTopicID gets questions by topic ID
func (r *Repository) GetQuestionsByTopicID(ctx context.Context, topicID string) (*entity.Question, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, topic_id, question, created_at, updated_at FROM questions WHERE topic_id = ?", topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	questions := &entity.Question{}
	return questions, nil
}

// GetTopics gets all topics
func (r *Repository) GetTopics(ctx context.Context) ([]*entity.Topic, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, topic, created_at, updated_at FROM topics")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	topics := []*entity.Topic{}
	return topics, nil
}
