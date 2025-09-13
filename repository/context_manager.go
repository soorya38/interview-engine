package repository

import (
	"context"
	"fmt"
	"mip/repository/embeddings"
	"mip/repository/vectordb"
	"strings"
	"time"
)

// ConversationalTurn represents a single interaction in the conversation
type ConversationalTurn struct {
	Type      string                 `json:"type"`     // "user_answer", "ai_question", etc.
	Content   string                 `json:"content"`  // The actual text content
	Metadata  map[string]interface{} `json:"metadata"` // Additional context
	Timestamp time.Time              `json:"timestamp"`
}

// ContextManager handles the conversational context workflow
type ContextManager struct {
	embeddingService *embeddings.EmbeddingService
	vectorStore      *vectordb.VectorStore
}

// NewContextManager creates a new context manager
func NewContextManager(embeddingService *embeddings.EmbeddingService, vectorStore *vectordb.VectorStore) *ContextManager {
	return &ContextManager{
		embeddingService: embeddingService,
		vectorStore:      vectorStore,
	}
}

// StoreContext converts a conversational turn into a vector embedding and stores it
func (cm *ContextManager) StoreContext(ctx context.Context, userID, sessionID string, turn ConversationalTurn) (string, error) {
	// Generate embedding for the conversational turn
	embedding, err := cm.embeddingService.GenerateEmbedding(ctx, turn.Content)
	if err != nil {
		return "", fmt.Errorf("Unable to generate embedding: %w", err)
	}

	// Prepare metadata
	metadata := make(map[string]interface{})
	metadata["type"] = turn.Type
	metadata["timestamp"] = turn.Timestamp

	// Copy additional metadata
	for k, v := range turn.Metadata {
		metadata[k] = v
	}

	// Store in vector database
	recordID, err := cm.vectorStore.Store(embedding, turn.Content, userID, sessionID, metadata)
	if err != nil {
		return "", fmt.Errorf("Unable to store context: %w", err)
	}

	return recordID, nil
}

// RetrieveContext retrieves the most relevant historical interactions for a query
func (cm *ContextManager) RetrieveContext(ctx context.Context, userID, sessionID, query string, topK int) ([]*vectordb.SearchResult, error) {
	// Generate embedding for the query
	queryEmbedding, err := cm.embeddingService.GenerateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("Unable to generate query embedding: %w", err)
	}

	// Search for similar contexts
	results, err := cm.vectorStore.Search(queryEmbedding, userID, sessionID, topK)
	if err != nil {
		return nil, fmt.Errorf("Unable to search contexts: %w", err)
	}

	return results, nil
}

// ConstructPrompt creates a context-aware prompt by combining retrieved context with the new query
func (cm *ContextManager) ConstructPrompt(systemMessage, newQuery string, retrievedContexts []*vectordb.SearchResult) string {
	var promptBuilder strings.Builder

	// Add system message
	if systemMessage != "" {
		promptBuilder.WriteString("System: ")
		promptBuilder.WriteString(systemMessage)
		promptBuilder.WriteString("\n\n")
	}

	// Add retrieved context if available
	if len(retrievedContexts) > 0 {
		promptBuilder.WriteString("Previous conversation context:\n")
		for i, result := range retrievedContexts {
			promptBuilder.WriteString(fmt.Sprintf("%d. [Similarity: %.3f] %s\n",
				i+1, result.Similarity, result.Record.Text))
		}
		promptBuilder.WriteString("\n")
	}

	// Add the new query
	promptBuilder.WriteString("Current query: ")
	promptBuilder.WriteString(newQuery)

	return promptBuilder.String()
}

// ProcessInteraction handles the complete workflow: store previous context, retrieve relevant context, and construct prompt
func (cm *ContextManager) ProcessInteraction(ctx context.Context, userID, sessionID string,
	previousTurn *ConversationalTurn, currentQuery, systemMessage string, contextTopK int) (string, error) {

	// Step 1: Store the previous conversational turn if provided
	if previousTurn != nil {
		_, err := cm.StoreContext(ctx, userID, sessionID, *previousTurn)
		if err != nil {
			return "", fmt.Errorf("Unable to store previous context: %w", err)
		}
	}

	// Step 2: Retrieve relevant context for the current query
	retrievedContexts, err := cm.RetrieveContext(ctx, userID, sessionID, currentQuery, contextTopK)
	if err != nil {
		return "", fmt.Errorf("Unable to retrieve context: %w", err)
	}

	// Step 3: Construct the final prompt
	finalPrompt := cm.ConstructPrompt(systemMessage, currentQuery, retrievedContexts)

	return finalPrompt, nil
}

// GetConversationHistory retrieves all stored interactions for a user session
func (cm *ContextManager) GetConversationHistory(userID, sessionID string) ([]*vectordb.VectorRecord, error) {
	return cm.vectorStore.GetRecordsBySession(userID, sessionID)
}
