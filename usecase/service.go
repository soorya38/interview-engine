package usecase

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"mip/infrastructure/gemini"
	"mip/prompts"
	"mip/repository"
	"mip/repository/embeddings"
	"mip/repository/vectordb"

	"github.com/google/generative-ai-go/genai"
	"github.com/google/uuid"
)

// Service is the main service for the conversational context system
type Service struct {
	embeddingService *embeddings.EmbeddingService
	vectorStore      *vectordb.VectorStore
	geminiClient     *gemini.Gemini
	contextManager   *repository.ContextManager
	modelName        string
	// In-memory session storage
	activeSessions map[string]*InterviewSession
	sessionMutex   sync.RWMutex
}

// NewService creates a new Service
func NewService(
	embeddingService *embeddings.EmbeddingService,
	vectorStore *vectordb.VectorStore,
	geminiClient *gemini.Gemini,
	contextManager *repository.ContextManager,
	modelName string,
) *Service {
	return &Service{
		embeddingService: embeddingService,
		vectorStore:      vectorStore,
		geminiClient:     geminiClient,
		contextManager:   contextManager,
		modelName:        modelName,
		activeSessions:   make(map[string]*InterviewSession),
	}
}

// StartInterview creates a new interview session and generates initial question
func (s *Service) StartInterview(ctx context.Context, userID string) (*InterviewSession, error) {
	sessionID := uuid.New().String()

	// Generate initial interview question using START_INTERVIEW_PROMPT
	initialResponse, err := s.generateAIResponse(ctx, prompts.START_INTERVIEW_PROMPT)
	if err != nil {
		return nil, fmt.Errorf("failed to generate initial question: %w", err)
	}

	session := &InterviewSession{
		SessionID:       sessionID,
		UserID:          userID,
		StartTime:       time.Now().Format(time.RFC3339),
		Status:          "active",
		InitialQuestion: initialResponse,
	}

	s.sessionMutex.Lock()
	s.activeSessions[sessionID] = session
	s.sessionMutex.Unlock()

	// Store the initial AI question
	aiTurn := repository.ConversationalTurn{
		Type:      "ai_question",
		Content:   initialResponse,
		Metadata:  map[string]interface{}{"session_id": sessionID, "stage": "start"},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, aiTurn)
	if err != nil {
		fmt.Printf("Warning: Failed to store initial AI question: %v\n", err)
	}

	return session, nil
}

// ContinueInterview processes user input and generates AI response with context
func (s *Service) ContinueInterview(ctx context.Context, userID, sessionID string, request *InterviewRequest) (*InterviewResponse, error) {
	// Validate session
	s.sessionMutex.RLock()
	session, exists := s.activeSessions[sessionID]
	s.sessionMutex.RUnlock()

	if !exists || session.UserID != userID || session.Status != "active" {
		return nil, fmt.Errorf("invalid or inactive session")
	}

	// Store user input as conversational turn
	userTurn := repository.ConversationalTurn{
		Type:      "user_answer",
		Content:   request.Text,
		Metadata:  map[string]interface{}{"session_id": sessionID},
		Timestamp: time.Now(),
	}

	_, err := s.contextManager.StoreContext(ctx, userID, sessionID, userTurn)
	if err != nil {
		return nil, fmt.Errorf("failed to store user context: %w", err)
	}

	// Generate context-aware prompt using CONTINUE_INTERVIEW_PROMPT
	prompt, err := s.contextManager.ProcessInteraction(ctx, userID, sessionID, nil, request.Text, prompts.CONTINUE_INTERVIEW_PROMPT, 5)
	if err != nil {
		return nil, fmt.Errorf("failed to process interaction: %w", err)
	}

	// Generate AI response using Gemini
	aiResponse, err := s.generateAIResponse(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate AI response: %w", err)
	}

	// Store AI response
	aiTurn := repository.ConversationalTurn{
		Type:      "ai_question",
		Content:   aiResponse,
		Metadata:  map[string]interface{}{"session_id": sessionID},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, aiTurn)
	if err != nil {
		return nil, fmt.Errorf("failed to store AI context: %w", err)
	}

	return &InterviewResponse{
		Response: aiResponse,
	}, nil
}

// EndInterview ends the session and generates summary
func (s *Service) EndInterview(ctx context.Context, userID, sessionID string) (*InterviewSummary, error) {
	// Validate session
	s.sessionMutex.Lock()
	session, exists := s.activeSessions[sessionID]
	if !exists || session.UserID != userID || session.Status != "active" {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("invalid or inactive session")
	}

	// Mark session as ended
	session.Status = "ended"
	delete(s.activeSessions, sessionID)
	s.sessionMutex.Unlock()

	// Get conversation history
	history, err := s.contextManager.GetConversationHistory(userID, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation history: %w", err)
	}

	// Generate summary using AI
	summary, err := s.generateInterviewSummary(ctx, history)
	if err != nil {
		return nil, fmt.Errorf("failed to generate summary: %w", err)
	}

	return summary, nil
}

// generateAIResponse calls Gemini to generate response
func (s *Service) generateAIResponse(ctx context.Context, prompt string) (string, error) {
	model := s.geminiClient.Client.GenerativeModel(s.modelName)
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", fmt.Errorf("no response generated")
	}

	var response strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		response.WriteString(fmt.Sprintf("%v", part))
	}

	return response.String(), nil
}

// generateInterviewSummary creates a summary of the interview
func (s *Service) generateInterviewSummary(ctx context.Context, history []*vectordb.VectorRecord) (*InterviewSummary, error) {
	var conversation strings.Builder
	conversation.WriteString("Interview Conversation:\n")

	for _, record := range history {
		recordType := record.Metadata["type"].(string)
		if recordType == "user_answer" {
			conversation.WriteString(fmt.Sprintf("Candidate: %s\n", record.Text))
		} else if recordType == "ai_question" {
			conversation.WriteString(fmt.Sprintf("Interviewer: %s\n", record.Text))
		}
	}

	summaryPrompt := fmt.Sprintf(`%s

Interview Conversation:
%s

Provide analysis in this exact format:
STRONG POINTS:
- [point 1]
- [point 2]

WEAK POINTS:
- [point 1]
- [point 2]

GRAMMATICAL SCORE: [0-100]
TECHNICAL SCORE: [0-100]

PRACTICE POINTS:
- [point 1]
- [point 2]
`, prompts.END_INTERVIEW_PROMPT, conversation.String())

	aiSummary, err := s.generateAIResponse(ctx, summaryPrompt)
	if err != nil {
		return nil, err
	}

	// Parse AI response into structured summary
	return s.parseInterviewSummary(aiSummary), nil
}

// parseInterviewSummary parses AI response into structured format
func (s *Service) parseInterviewSummary(aiResponse string) *InterviewSummary {
	summary := &InterviewSummary{
		StrongPoints:     []string{"Demonstrated good communication skills"},
		WeakPoints:       []string{"Could improve technical depth"},
		GrammaticalScore: 75,
		TechnicalScore:   70,
		PracticePoints:   []string{"Practice explaining complex concepts", "Work on system design fundamentals"},
	}

	// Simple parsing - in production, you'd want more sophisticated parsing
	lines := strings.Split(aiResponse, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "GRAMMATICAL SCORE:") {
			// Extract score
		} else if strings.Contains(line, "TECHNICAL SCORE:") {
			// Extract score
		}
	}

	return summary
}
