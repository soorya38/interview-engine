package usecase

import (
	"context"
	"mip/entity"
)

// InterviewSession represents an active interview session
type InterviewSession struct {
	SessionID       string `json:"session_id"`
	UserID          string `json:"user_id"`
	StartTime       string `json:"start_time"`
	Status          string `json:"status"`           // "active", "ended", "auto_ended"
	InitialQuestion string `json:"initial_question"` // First question from AI
	QuestionCount   int    `json:"question_count"`   // Number of questions asked so far
	MaxQuestions    int    `json:"max_questions"`    // Maximum questions allowed
}

// InterviewRequest represents a request to continue an interview
type InterviewRequest struct {
	Text string `json:"text"`
}

// InterviewResponse represents the response from the interview system
type InterviewResponse struct {
	Response     string            `json:"response"`
	SessionID    string            `json:"session_id,omitempty"`
	SessionEnded bool              `json:"session_ended,omitempty"`
	Summary      *InterviewSummary `json:"summary,omitempty"` // Included when session auto-ends
}

// InterviewSummary represents the final interview summary
type InterviewSummary struct {
	StrongPoints       []string `json:"strong_points"`
	WeakPoints         []string `json:"weak_points"`
	GrammaticalScore   int      `json:"grammatical_score"` // 0-100 based on actual content quality
	TechnicalScore     int      `json:"technical_score"`   // 0-100 based on actual content quality
	PracticePoints     []string `json:"practice_points"`
	ContextualRelevant bool     `json:"contextual_relevant"` // Whether responses were relevant
	OffTopicCount      int      `json:"off_topic_count"`     // Number of off-topic responses
}

type Repository interface {
	Reader
	Writer
}

type Reader interface {
	GetQuestionsByTopicID(ctx context.Context, topicID string) (*entity.Question, error)
	GetTopics(ctx context.Context) ([]*entity.Topic, error)
	GetQuestions(ctx context.Context) ([]*entity.Question, error)
	GetQuestionByID(ctx context.Context, id string) (*entity.Question, error)
}

type Writer interface {
	CreateQuestionByTopic(ctx context.Context, topicID string, question string) error
	CreateTopic(ctx context.Context, topic *entity.Topic) error
	CreateQuestion(ctx context.Context, question *entity.Question) error
}

type Usecase interface {
	StartInterview(ctx context.Context, userID string) (*InterviewSession, error)
	ContinueInterview(ctx context.Context, userID, sessionID string, request *InterviewRequest) (*InterviewResponse, error)
	EndInterview(ctx context.Context, userID, sessionID string) (*InterviewSummary, error)
	CreateTopic(ctx context.Context, userID, topic string) (string, error)
	GetTopics(ctx context.Context) ([]*entity.Topic, error)
	CreateQuestion(ctx context.Context, userID, topicID, question string) (string, error)
	GetQuestions(ctx context.Context) ([]*entity.Question, error)
	GetQuestionByID(ctx context.Context, id string) (*entity.Question, error)
}
