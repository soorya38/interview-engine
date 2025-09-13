package gemini

import (
	"context"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type Gemini struct {
	Client *genai.Client
}

func NewGeminiClient(ctx context.Context, apiKey string) (*Gemini, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Printf("Unable to create Gemini client, err=%v", err)
		return nil, err
	}
	return &Gemini{Client: client}, nil
}

// LLMCall makes a call to the Gemini, based on the provided model and text
func (g *Gemini) LLMCall(ctx context.Context, modelName, text string) (string, error) {
	model := g.Client.GenerativeModel(modelName)
	prompt := genai.Text(text)

	resp, err := model.GenerateContent(ctx, prompt)
	if err != nil {
		log.Printf("Unable to make call to model=%v, err=%v", modelName, err)
		return "", err
	}
	printResponse(resp)
	return "", nil
}

// printResponse iterates through the parts of the response and prints the text.
func printResponse(resp *genai.GenerateContentResponse) {
	for _, cand := range resp.Candidates {
		if cand.Content != nil {
			for _, part := range cand.Content.Parts {
				fmt.Println(part)
			}
		}
	}
}
