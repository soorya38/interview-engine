package embeddings

import (
	"context"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type EmbeddingService struct {
	client *genai.Client
}

func NewEmbeddingService(ctx context.Context, apiKey string) (*EmbeddingService, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Printf("Unable to create embedding client, err=%v", err)
		return nil, err
	}
	return &EmbeddingService{client: client}, nil
}

func (e *EmbeddingService) Close() error {
	return e.client.Close()
}

// GenerateEmbedding creates a vector embedding for the given text
func (e *EmbeddingService) GenerateEmbedding(ctx context.Context, text string) ([]float32, error) {
	model := e.client.EmbeddingModel("text-embedding-004")

	resp, err := model.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		log.Printf("Unable to generate embedding, err=%v", err)
		return nil, fmt.Errorf("Unable to generate embedding: %w", err)
	}

	if resp.Embedding == nil || len(resp.Embedding.Values) == 0 {
		return nil, fmt.Errorf("empty embedding response")
	}

	return resp.Embedding.Values, nil
}
