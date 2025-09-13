package repository

import (
	"context"
	"database/sql"
	"log"
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
func (r *Repository) CreateTopic(ctx context.Context, topic *entity.Topic) error {
	query := "INSERT INTO topics (id, topic, created_by, updated_by) VALUES (?, ?, ?, ?)"
	_, err := r.db.ExecContext(ctx, query, topic.ID, topic.Topic, topic.CreatedBy, topic.UpdatedBy)
	if err != nil {
		log.Printf("err=%v", err)
		return err
	}
	return nil
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
	rows, err := r.db.QueryContext(ctx, "SELECT id, topic, created_by, updated_by, created_at, updated_at FROM topics")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	topics := []*entity.Topic{}
	for rows.Next() {
		topic := &entity.Topic{}
		err = rows.Scan(&topic.ID, &topic.Topic, &topic.CreatedBy, &topic.UpdatedBy, &topic.CreatedAt, &topic.UpdatedAt)
		if err != nil {
			return nil, err
		}
		topics = append(topics, topic)
	}
	return topics, nil
}

// CreateQuestion creates a new question
func (r *Repository) CreateQuestion(ctx context.Context, question *entity.Question) error {
	query := "INSERT INTO questions (id, topic_id, question, created_by, updated_by) VALUES (?, ?, ?, ?, ?)"
	_, err := r.db.ExecContext(
		ctx,
		query,
		question.ID,
		question.TopicID,
		question.Question,
		question.CreatedBy,
		question.UpdatedBy,
	)
	if err != nil {
		log.Printf("err=%v", err)
		return err
	}
	return nil
}

// GetQuestions gets all questions
func (r *Repository) GetQuestions(ctx context.Context) ([]*entity.Question, error) {
	rows, err := r.db.QueryContext(
		ctx,
		"SELECT id, topic_id, question, created_by, updated_by, created_at, updated_at FROM questions",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	questions := []*entity.Question{}
	for rows.Next() {
		question := &entity.Question{}
		err = rows.Scan(
			&question.ID,
			&question.TopicID,
			&question.Question,
			&question.CreatedBy,
			&question.UpdatedBy,
			&question.CreatedAt,
			&question.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		questions = append(questions, question)
	}
	return questions, nil
}

// GetQuestionByID gets a question by ID
func (r *Repository) GetQuestionByID(ctx context.Context, id string) (*entity.Question, error) {
	row := r.db.QueryRowContext(
		ctx,
		"SELECT id, topic_id, question, created_by, updated_by, created_at, updated_at FROM questions WHERE id = ?",
		id,
	)
	question := &entity.Question{}
	if err := row.Scan(
		&question.ID,
		&question.TopicID,
		&question.Question,
		&question.CreatedBy,
		&question.UpdatedBy,
		&question.CreatedAt,
		&question.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return question, nil
}
