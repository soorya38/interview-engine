package usecase

import (
	"mip/infrastructure/gemini"
	"mip/repository"
	"mip/repository/embeddings"
	"mip/repository/vectordb"
)

// Service is the main service for the conversational context system
type Service struct {
	embeddingService *embeddings.EmbeddingService
	vectorStore      *vectordb.VectorStore
	geminiClient     *gemini.Gemini
	contextManager   *repository.ContextManager
	modelName        string
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
	}
}
