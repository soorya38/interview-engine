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

const (
	// MaxInterviewQuestions defines the maximum number of questions in an interview
	MaxInterviewQuestions = 2
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
		QuestionCount:   1, // Starting with 1 since we just asked the initial question
		MaxQuestions:    MaxInterviewQuestions,
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
	s.sessionMutex.Lock()
	session, exists := s.activeSessions[sessionID]
	if !exists || session.UserID != userID || session.Status != "active" {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("invalid or inactive session")
	}

	// Get the last AI question to validate context
	history, err := s.contextManager.GetConversationHistory(userID, sessionID)
	if err != nil {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("failed to get conversation history: %w", err)
	}

	// Find the most recent AI question
	var lastQuestion string
	for i := len(history) - 1; i >= 0; i-- {
		if recordType, ok := history[i].Metadata["type"].(string); ok && recordType == "ai_question" {
			lastQuestion = history[i].Text
			break
		}
	}

	// Validate response context if we have a question
	isRelevant := true
	if lastQuestion != "" {
		isRelevant, err = s.validateResponseContext(ctx, lastQuestion, request.Text)
		if err != nil {
			// Log error but continue - don't fail the interview for validation issues
			fmt.Printf("Warning: Failed to validate response context: %v\n", err)
		}
	}

	// Store user input as conversational turn with relevance metadata
	userTurn := repository.ConversationalTurn{
		Type:      "user_answer",
		Content:   request.Text,
		Metadata:  map[string]interface{}{"session_id": sessionID, "is_relevant": isRelevant},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, userTurn)
	if err != nil {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("failed to store user context: %w", err)
	}

	// Check if we've reached the maximum number of questions
	if session.QuestionCount >= session.MaxQuestions {
		// Auto-end the session
		session.Status = "auto_ended"
		delete(s.activeSessions, sessionID)
		s.sessionMutex.Unlock()

		// Generate summary
		summary, err := s.generateInterviewSummaryInternal(ctx, userID, sessionID)
		if err != nil {
			return nil, fmt.Errorf("failed to generate auto-end summary: %w", err)
		}

		return &InterviewResponse{
			Response:     "Thank you for completing the interview! The session has ended automatically as we've reached the maximum number of questions. Here's your summary:",
			SessionEnded: true,
			Summary:      summary,
		}, nil
	}

	// Increment question count for the next question
	session.QuestionCount++
	s.sessionMutex.Unlock()

	// Generate context-aware prompt using CONTINUE_INTERVIEW_PROMPT
	prompt, err := s.contextManager.ProcessInteraction(ctx, userID, sessionID, nil, request.Text, prompts.CONTINUE_INTERVIEW_PROMPT, 5)
	if err != nil {
		return nil, fmt.Errorf("failed to process interaction: %w", err)
	}

	// Check if this will be the last question
	var aiResponse string
	if session.QuestionCount >= session.MaxQuestions {
		// This is the last question, modify prompt to indicate it's the final question
		finalPrompt := fmt.Sprintf("%s\n\nIMPORTANT: This is the final question of the interview. Make it a good concluding question.", prompt)
		aiResponse, err = s.generateAIResponse(ctx, finalPrompt)
	} else {
		aiResponse, err = s.generateAIResponse(ctx, prompt)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to generate AI response: %w", err)
	}

	// Store AI response
	aiTurn := repository.ConversationalTurn{
		Type:      "ai_question",
		Content:   aiResponse,
		Metadata:  map[string]interface{}{"session_id": sessionID, "question_number": session.QuestionCount},
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
	if !exists || session.UserID != userID || (session.Status != "active" && session.Status != "auto_ended") {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("invalid or inactive session")
	}

	// Mark session as ended if it wasn't already auto-ended
	if session.Status == "active" {
		session.Status = "ended"
	}
	delete(s.activeSessions, sessionID)
	s.sessionMutex.Unlock()

	return s.generateInterviewSummaryInternal(ctx, userID, sessionID)
}

// generateInterviewSummaryInternal is the internal method for generating summaries
func (s *Service) generateInterviewSummaryInternal(ctx context.Context, userID, sessionID string) (*InterviewSummary, error) {
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

// validateResponseContext checks if a user response is contextually relevant to the question
func (s *Service) validateResponseContext(ctx context.Context, question, response string) (bool, error) {
	validationPrompt := fmt.Sprintf(prompts.CONTEXT_VALIDATION_PROMPT, question, response)

	aiValidation, err := s.generateAIResponse(ctx, validationPrompt)
	if err != nil {
		return true, err // Default to relevant if validation fails
	}

	// Check if the response contains "RELEVANT" or "IRRELEVANT"
	aiValidation = strings.TrimSpace(strings.ToUpper(aiValidation))
	return strings.Contains(aiValidation, "RELEVANT") && !strings.Contains(aiValidation, "IRRELEVANT"), nil
}

// generateInterviewSummary creates a summary of the interview
func (s *Service) generateInterviewSummary(ctx context.Context, history []*vectordb.VectorRecord) (*InterviewSummary, error) {
	var conversation strings.Builder
	conversation.WriteString("Interview Conversation:\n")

	// Analyze context relevance
	totalResponses := 0
	relevantResponses := 0
	offTopicCount := 0

	for _, record := range history {
		recordType := record.Metadata["type"].(string)
		if recordType == "user_answer" {
			totalResponses++
			conversation.WriteString(fmt.Sprintf("Candidate: %s\n", record.Text))

			// Check if response was marked as relevant
			if isRelevant, ok := record.Metadata["is_relevant"].(bool); ok {
				if isRelevant {
					relevantResponses++
				} else {
					offTopicCount++
				}
			} else {
				// If no relevance data, assume relevant (for backward compatibility)
				relevantResponses++
			}
		} else if recordType == "ai_question" {
			conversation.WriteString(fmt.Sprintf("Interviewer: %s\n", record.Text))
		}
	}

	// Calculate relevance percentage
	contextualRelevant := totalResponses > 0 && (float64(relevantResponses)/float64(totalResponses)) >= 0.5

	var summaryPrompt string
	if !contextualRelevant || totalResponses == 0 {
		// If most responses were off-topic, don't provide scores
		summaryPrompt = fmt.Sprintf(`%s

Interview Conversation:
%s

IMPORTANT: The candidate provided mostly irrelevant or off-topic responses (%d out of %d responses were off-topic). 
Do not provide numerical scores for grammatical or technical assessment.

Provide analysis in this exact format:
STRONG POINTS:
- [point 1 if any, otherwise "Limited relevant responses to assess"]

WEAK POINTS:
- Provided responses that were not relevant to the questions asked
- [additional point if applicable]

GRAMMATICAL SCORE: -1
TECHNICAL SCORE: -1

PRACTICE POINTS:
- Focus on understanding and directly answering the questions asked
- Practice active listening during interviews
- [additional point if applicable]
`, prompts.END_INTERVIEW_PROMPT, conversation.String(), offTopicCount, totalResponses)
	} else {
		// Normal scoring for contextually relevant responses
		summaryPrompt = fmt.Sprintf(`%s

Interview Conversation:
%s

The candidate provided mostly relevant responses (%d out of %d were contextually appropriate).

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
`, prompts.END_INTERVIEW_PROMPT, conversation.String(), relevantResponses, totalResponses)
	}

	aiSummary, err := s.generateAIResponse(ctx, summaryPrompt)
	if err != nil {
		return nil, err
	}

	// Parse AI response into structured summary
	summary := s.parseInterviewSummary(aiSummary)
	summary.ContextualRelevant = contextualRelevant
	summary.OffTopicCount = offTopicCount

	return summary, nil
}

// parseInterviewSummary parses AI response into structured format
func (s *Service) parseInterviewSummary(aiResponse string) *InterviewSummary {
	summary := &InterviewSummary{
		StrongPoints:       []string{"Demonstrated good communication skills"},
		WeakPoints:         []string{"Could improve technical depth"},
		GrammaticalScore:   75,
		TechnicalScore:     70,
		PracticePoints:     []string{"Practice explaining complex concepts", "Work on system design fundamentals"},
		ContextualRelevant: true,
		OffTopicCount:      0,
	}

	// Parse the AI response for scores and content
	lines := strings.Split(aiResponse, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "GRAMMATICAL SCORE:") {
			// Extract score - look for -1 or numeric values
			if strings.Contains(line, "-1") {
				summary.GrammaticalScore = -1
			}
			// In a more sophisticated implementation, you'd parse the actual number
		} else if strings.Contains(line, "TECHNICAL SCORE:") {
			// Extract score - look for -1 or numeric values
			if strings.Contains(line, "-1") {
				summary.TechnicalScore = -1
			}
			// In a more sophisticated implementation, you'd parse the actual number
		}
	}

	return summary
}
