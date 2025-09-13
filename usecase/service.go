package usecase

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"mip/entity"
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
	MaxInterviewQuestions = 4
	StatusActive          = "active"
	StatusAutoEnded       = "auto_ended"
	StatusEnded           = "ended"

	QuestionEnded  = "ended"
	QuestionTypeAI = "ai_question"
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
	repo           Repository
}

// NewService creates a new Service
func NewService(
	embeddingService *embeddings.EmbeddingService,
	vectorStore *vectordb.VectorStore,
	geminiClient *gemini.Gemini,
	contextManager *repository.ContextManager,
	modelName string,
	repo Repository,
) *Service {
	return &Service{
		embeddingService: embeddingService,
		vectorStore:      vectorStore,
		geminiClient:     geminiClient,
		contextManager:   contextManager,
		modelName:        modelName,
		activeSessions:   make(map[string]*InterviewSession),
		repo:             repo,
	}
}

// StartInterview creates a new interview session and generates initial question
func (s *Service) StartInterview(ctx context.Context, userID string) (*InterviewSession, error) {
	sessionID := uuid.New().String()

	questions := ""
	firstQuestion := ""
	initialPrompt := fmt.Sprintf(prompts.START_INTERVIEW_PROMPT, questions, firstQuestion)
	initialResponse, err := s.generateAIResponse(ctx, initialPrompt)
	if err != nil {
		log.Printf("Unable to generate initial question, err=%v", err)
		return nil, fmt.Errorf("unable to generate initial question, err=%w", err)
	}

	session := &InterviewSession{
		SessionID:       sessionID,
		UserID:          userID,
		StartTime:       time.Now().Format(time.RFC3339),
		Status:          StatusActive,
		InitialQuestion: initialResponse,
		QuestionCount:   1,
		MaxQuestions:    MaxInterviewQuestions,
	}

	s.sessionMutex.Lock()
	s.activeSessions[sessionID] = session
	s.sessionMutex.Unlock()

	aiTurn := repository.ConversationalTurn{
		Type:      QuestionTypeAI,
		Content:   initialResponse,
		Metadata:  map[string]interface{}{"session_id": sessionID, "stage": "start"},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, aiTurn)
	if err != nil {
		fmt.Printf("Warning: unable to store initial AI question: %v\n", err)
	}

	return session, nil
}

// ContinueInterview processes user input and generates AI response with context
func (s *Service) ContinueInterview(
	ctx context.Context,
	userID,
	sessionID string,
	request *InterviewRequest,
) (*InterviewResponse, error) {
	s.sessionMutex.Lock()
	session, exists := s.activeSessions[sessionID]
	if !exists || session.UserID != userID || session.Status != StatusActive {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("invalid or inactive session")
	}

	history, err := s.contextManager.GetConversationHistory(userID, sessionID)
	if err != nil {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("unable to get conversation history: %w", err)
	}

	var lastQuestion string
	for i := len(history) - 1; i >= 0; i-- {
		if recordType, ok := history[i].Metadata["type"].(string); ok && recordType == QuestionTypeAI {
			lastQuestion = history[i].Text
			break
		}
	}

	isRelevant := true
	if lastQuestion != "" {
		isRelevant, err = s.validateResponseContext(ctx, lastQuestion, request.Text)
		if err != nil {
			// Log error but continue - don't fail the interview for validation issues
			fmt.Printf("Warning: unable to validate response context: %v\n", err)
		}
	}

	userTurn := repository.ConversationalTurn{
		Type:      "user_answer",
		Content:   request.Text,
		Metadata:  map[string]interface{}{"session_id": sessionID, "is_relevant": isRelevant},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, userTurn)
	if err != nil {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("unable to store user context: %w", err)
	}

	if session.QuestionCount >= session.MaxQuestions {
		session.Status = "auto_ended"
		delete(s.activeSessions, sessionID)
		s.sessionMutex.Unlock()

		summary, err := s.generateInterviewSummaryInternal(ctx, userID, sessionID)
		if err != nil {
			return nil, fmt.Errorf("unable to generate auto-end summary: %w", err)
		}

		return &InterviewResponse{
			Response:     prompts.COMPLETION_PROMPT,
			SessionEnded: true,
			Summary:      summary,
		}, nil
	}

	session.QuestionCount++
	s.sessionMutex.Unlock()

	questions := ""
	continuePrompt := fmt.Sprintf(prompts.CONTINUE_INTERVIEW_PROMPT, questions)
	prompt, err := s.contextManager.ProcessInteraction(
		ctx, userID, sessionID, nil, request.Text, continuePrompt, 5,
	)
	if err != nil {
		return nil, fmt.Errorf("unable to process interaction: %w", err)
	}

	var aiResponse string
	if session.QuestionCount >= session.MaxQuestions {
		finalPrompt := fmt.Sprintf(prompts.FINAL_QUESTION_PROMPT, prompt)
		aiResponse, err = s.generateAIResponse(ctx, finalPrompt)
	} else {
		aiResponse, err = s.generateAIResponse(ctx, prompt)
	}

	if err != nil {
		return nil, fmt.Errorf("unable to generate AI response: %w", err)
	}

	aiTurn := repository.ConversationalTurn{
		Type:      QuestionTypeAI,
		Content:   aiResponse,
		Metadata:  map[string]interface{}{"session_id": sessionID, "question_number": session.QuestionCount},
		Timestamp: time.Now(),
	}

	_, err = s.contextManager.StoreContext(ctx, userID, sessionID, aiTurn)
	if err != nil {
		return nil, fmt.Errorf("unable to store AI context: %w", err)
	}

	return &InterviewResponse{
		Response: aiResponse,
	}, nil
}

// EndInterview ends the session and generates summary
func (s *Service) EndInterview(ctx context.Context, userID, sessionID string) (*InterviewSummary, error) {
	s.sessionMutex.Lock()
	session, exists := s.activeSessions[sessionID]
	if !exists || session.UserID != userID || (session.Status != StatusActive && session.Status != StatusAutoEnded) {
		s.sessionMutex.Unlock()
		return nil, fmt.Errorf("invalid or inactive session")
	}

	if session.Status == StatusActive {
		session.Status = "ended"
	}
	delete(s.activeSessions, sessionID)
	s.sessionMutex.Unlock()

	return s.generateInterviewSummaryInternal(ctx, userID, sessionID)
}

// generateInterviewSummaryInternal is the internal method for generating summaries
func (s *Service) generateInterviewSummaryInternal(
	ctx context.Context,
	userID, sessionID string,
) (*InterviewSummary, error) {
	history, err := s.contextManager.GetConversationHistory(userID, sessionID)
	if err != nil {
		return nil, fmt.Errorf("unable to get conversation history: %w", err)
	}

	summary, err := s.generateInterviewSummary(ctx, history)
	if err != nil {
		return nil, fmt.Errorf("unable to generate summary: %w", err)
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
		return true, err
	}

	aiValidation = strings.TrimSpace(strings.ToUpper(aiValidation))
	return strings.Contains(aiValidation, "RELEVANT") && !strings.Contains(aiValidation, "IRRELEVANT"), nil
}

// generateInterviewSummary creates a summary of the interview
func (s *Service) generateInterviewSummary(
	ctx context.Context,
	history []*vectordb.VectorRecord,
) (*InterviewSummary, error) {
	var conversation strings.Builder
	conversation.WriteString("Interview Conversation:\n")

	totalResponses := 0
	relevantResponses := 0
	offTopicCount := 0

	for _, record := range history {
		recordType := record.Metadata["type"].(string)
		if recordType == "user_answer" {
			totalResponses++
			conversation.WriteString(fmt.Sprintf("Candidate: %s\n", record.Text))

			if isRelevant, ok := record.Metadata["is_relevant"].(bool); ok {
				if isRelevant {
					relevantResponses++
				} else {
					offTopicCount++
				}
			} else {
				relevantResponses++
			}
		} else if recordType == QuestionTypeAI {
			conversation.WriteString(fmt.Sprintf("Interviewer: %s\n", record.Text))
		}
	}

	contextualRelevant := totalResponses > 0 && (float64(relevantResponses)/float64(totalResponses)) >= 0.5

	var summaryPrompt string
	if !contextualRelevant || totalResponses == 0 {
		summaryPrompt = fmt.Sprintf(
			prompts.SUMMARY_PROMPT_IRRELEVANT,
			prompts.END_INTERVIEW_PROMPT,
			conversation.String(),
			offTopicCount,
			totalResponses,
		)
	} else {
		summaryPrompt = fmt.Sprintf(
			prompts.SUMMARY_PROMPT_RELEVANT,
			prompts.END_INTERVIEW_PROMPT,
			conversation.String(),
			relevantResponses,
			totalResponses,
		)
	}

	aiSummary, err := s.generateAIResponse(ctx, summaryPrompt)
	if err != nil {
		return nil, err
	}

	summary := s.parseInterviewSummary(aiSummary)
	summary.ContextualRelevant = contextualRelevant
	summary.OffTopicCount = offTopicCount

	return summary, nil
}

// parseInterviewSummary parses AI response into structured format
func (s *Service) parseInterviewSummary(aiResponse string) *InterviewSummary {
	summary := &InterviewSummary{
		StrongPoints:       []string{},
		WeakPoints:         []string{},
		GrammaticalScore:   0,
		TechnicalScore:     0,
		PracticePoints:     []string{},
		ContextualRelevant: true,
		OffTopicCount:      0,
	}

	lines := strings.Split(aiResponse, "\n")
	currentSection := ""

	for _, line := range lines {
		line = strings.TrimSpace(line)

		lineUpper := strings.ToUpper(line)
		if strings.Contains(lineUpper, "STRONG POINTS") {
			currentSection = "strong"
			continue
		} else if strings.Contains(lineUpper, "WEAK POINTS") {
			currentSection = "weak"
			continue
		} else if strings.Contains(lineUpper, "PRACTICE POINTS") {
			currentSection = "practice"
			continue
		} else if strings.Contains(lineUpper, "GRAMMATICAL SCORE") {
			summary.GrammaticalScore = s.extractScore(line, 30)
			continue
		} else if strings.Contains(lineUpper, "TECHNICAL SCORE") {
			summary.TechnicalScore = s.extractScore(line, 25)
			continue
		}

		// Parse bullet points and regular lines
		if strings.HasPrefix(line, "- ") || strings.HasPrefix(line, "• ") || strings.HasPrefix(line, "* ") {
			point := strings.TrimPrefix(line, "- ")
			point = strings.TrimPrefix(point, "• ")
			point = strings.TrimPrefix(point, "* ")
			point = strings.TrimSpace(point)

			if point != "" && currentSection != "" {
				switch currentSection {
				case "strong":
					summary.StrongPoints = append(summary.StrongPoints, point)
				case "weak":
					summary.WeakPoints = append(summary.WeakPoints, point)
				case "practice":
					summary.PracticePoints = append(summary.PracticePoints, point)
				}
			}
		} else if line != "" && currentSection != "" && !strings.Contains(strings.ToUpper(line), "SCORE") {
			// Handle non-bullet point content that might be part of a section
			switch currentSection {
			case "strong":
				summary.StrongPoints = append(summary.StrongPoints, line)
			case "weak":
				summary.WeakPoints = append(summary.WeakPoints, line)
			case "practice":
				summary.PracticePoints = append(summary.PracticePoints, line)
			}
		}
	}

	if len(summary.StrongPoints) == 0 {
		summary.StrongPoints = []string{"Analysis not available"}
	}
	if len(summary.WeakPoints) == 0 {
		summary.WeakPoints = []string{"Analysis not available"}
	}
	if len(summary.PracticePoints) == 0 {
		summary.PracticePoints = []string{"Analysis not available"}
	}

	return summary
}

// extractScore extracts numerical score from a line, with fallback default
func (s *Service) extractScore(line string, defaultScore int) int {
	re := regexp.MustCompile(`\d+`)
	matches := re.FindAllString(line, -1)

	for _, match := range matches {
		if score, err := strconv.Atoi(match); err == nil {
			if score >= 0 && score <= 100 {
				return score
			}
		}
	}

	return defaultScore
}

// CreateTopic creates a new topic
func (s *Service) CreateTopic(ctx context.Context, userID, topic string) (string, error) {
	topicEntity := &entity.Topic{
		ID:        uuid.New().String(),
		Topic:     topic,
		CreatedBy: userID,
		UpdatedBy: userID,
	}
	err := s.repo.CreateTopic(ctx, topicEntity)
	if err != nil {
		return "", err
	}
	return topicEntity.ID, nil
}

// GetTopics gets all topics
func (s *Service) GetTopics(ctx context.Context) ([]*entity.Topic, error) {
	return s.repo.GetTopics(ctx)
}

// CreateQuestion creates a new question
func (s *Service) CreateQuestion(ctx context.Context, userID, topicID, question string) (string, error) {
	questionEntity := &entity.Question{
		ID:        uuid.New().String(),
		TopicID:   topicID,
		Question:  question,
		CreatedBy: userID,
		UpdatedBy: userID,
	}
	err := s.repo.CreateQuestion(ctx, questionEntity)
	if err != nil {
		return "", err
	}
	return questionEntity.ID, nil
}

// GetQuestions gets all questions
func (s *Service) GetQuestions(ctx context.Context) ([]*entity.Question, error) {
	return s.repo.GetQuestions(ctx)
}

// GetQuestionByID gets a question by ID
func (s *Service) GetQuestionByID(ctx context.Context, id string) (*entity.Question, error) {
	return s.repo.GetQuestionByID(ctx, id)
}
