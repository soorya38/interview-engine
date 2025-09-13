package usecase

import (
	"context"
)

// InterviewSession represents an active interview session
type InterviewSession struct {
	SessionID       string `json:"session_id"`
	UserID          string `json:"user_id"`
	StartTime       string `json:"start_time"`
	Status          string `json:"status"`           // "active", "ended"
	InitialQuestion string `json:"initial_question"` // First question from AI
}

// InterviewRequest represents a request to continue an interview
type InterviewRequest struct {
	Text string `json:"text"`
}

// InterviewResponse represents the response from the interview system
type InterviewResponse struct {
	Response  string `json:"response"`
	SessionID string `json:"session_id,omitempty"`
}

// InterviewSummary represents the final interview summary
type InterviewSummary struct {
	StrongPoints     []string `json:"strong_points"`
	WeakPoints       []string `json:"weak_points"`
	GrammaticalScore int      `json:"grammatical_score"` // 0-100
	TechnicalScore   int      `json:"technical_score"`   // 0-100
	PracticePoints   []string `json:"practice_points"`
}

type Usecase interface {
	StartInterview(ctx context.Context, userID string) (*InterviewSession, error)
	ContinueInterview(ctx context.Context, userID, sessionID string, request *InterviewRequest) (*InterviewResponse, error)
	EndInterview(ctx context.Context, userID, sessionID string) (*InterviewSummary, error)
}
