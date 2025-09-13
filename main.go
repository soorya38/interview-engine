package main

import (
	"context"
	"fmt"
	"mip/infrastructure/gemini"
)

func main() {
	ctx := context.Background()
	apiKey := "AIzaSyA1yxig9DxbwXFopmdTt4SY9CeOZAcRwjc"

	geminiClient, err := gemini.NewGeminiClient(ctx, apiKey)
	if err != nil {
		return
	}
	defer geminiClient.Client.Close()

	resp, err := geminiClient.LLMCall(
		ctx,
		"gemini-1.5-flash",
		"Give grammer score for the following text from 1 to 10(number only): I is soorya",
	)
	if err != nil {
		return
	}
	fmt.Println(resp)
}
