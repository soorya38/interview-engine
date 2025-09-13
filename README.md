# Conversational Context System

A Go implementation of a conversational context management system using vector embeddings for semantic similarity search. This system enables AI applications to maintain context-aware conversations by storing and retrieving relevant historical interactions.

## Features

- **Vector Embeddings**: Uses Google's Gemini API to generate text embeddings
- **In-Memory Vector Database**: Fast semantic similarity search with metadata filtering
- **Context Management**: Store and retrieve conversational turns with user/session isolation
- **Prompt Construction**: Automatically builds context-aware prompts for language models
- **Metadata Support**: Rich metadata tagging for conversation turns

## Architecture

### Components

1. **Embedding Service** (`infrastructure/embeddings/`)
   - Generates vector embeddings using Gemini's text-embedding-004 model
   - Handles API communication and error management

2. **Vector Store** (`infrastructure/vectordb/`)
   - In-memory vector database with cosine similarity search
   - Metadata filtering by userID and sessionID
   - Thread-safe operations with read/write locks

3. **Context Manager** (`services/`)
   - Orchestrates the complete workflow
   - Handles storing, retrieving, and prompt construction
   - Provides high-level API for conversational context

## Workflow

### 1. Store Context
After a user answers a question, the conversational turn is:
- Converted into a vector embedding
- Stored in the vector database with metadata (userID, sessionID, timestamp, etc.)

### 2. Retrieve Context
When generating a follow-up question:
- Create an embedding for the current query
- Search the vector database for semantically similar historical interactions
- Filter results by userID and sessionID
- Return top-K most relevant contexts

### 3. Construct Prompt
Combine retrieved context with the new query:
- Add system message
- Include relevant historical context
- Append the current query
- Generate final context-aware prompt

## Usage

### Basic Setup

```go
import (
    "context"
    "mip/infrastructure/embeddings"
    "mip/infrastructure/vectordb"
    "mip/services"
)

// Initialize services
ctx := context.Background()
apiKey := "YOUR_GEMINI_API_KEY"

embeddingService, err := embeddings.NewEmbeddingService(ctx, apiKey)
if err != nil {
    log.Fatal(err)
}
defer embeddingService.Close()

vectorStore := vectordb.NewVectorStore()
contextManager := services.NewContextManager(embeddingService, vectorStore)
```

### Store User Context

```go
userAnswer := services.ConversationalTurn{
    Type:    "user_answer",
    Content: "I have 5 years of Go experience building microservices...",
    Metadata: map[string]interface{}{
        "question_topic": "experience",
        "question_id":    "q1",
    },
    Timestamp: time.Now(),
}

recordID, err := contextManager.StoreContext(ctx, userID, sessionID, userAnswer)
```

### Retrieve Relevant Context

```go
query := "Tell me about your microservices experience"
contexts, err := contextManager.RetrieveContext(ctx, userID, sessionID, query, 3)

for _, result := range contexts {
    fmt.Printf("Similarity: %.3f - %s\n", result.Similarity, result.Record.Text)
}
```

### Generate Context-Aware Prompt

```go
systemMessage := "You are a technical interviewer..."
newQuery := "How do you handle service communication?"

prompt := contextManager.ConstructPrompt(systemMessage, newQuery, contexts)
```

### Complete Workflow

```go
// Store previous answer and generate next prompt in one call
finalPrompt, err := contextManager.ProcessInteraction(
    ctx,
    userID,
    sessionID,
    &previousAnswer, // Store this turn
    nextQuery,       // Generate prompt for this
    systemMessage,
    3, // Top 3 contexts
)
```

## Data Structures

### ConversationalTurn
```go
type ConversationalTurn struct {
    Type      string                 // "user_answer", "ai_question", etc.
    Content   string                 // The actual text content
    Metadata  map[string]interface{} // Additional context
    Timestamp time.Time              // When this occurred
}
```

### VectorRecord
```go
type VectorRecord struct {
    ID        string                 // Unique identifier
    Vector    []float32              // Embedding vector
    Text      string                 // Original text
    UserID    string                 // User identifier
    SessionID string                 // Session identifier
    Metadata  map[string]interface{} // Additional metadata
    Timestamp time.Time              // Storage timestamp
}
```

### SearchResult
```go
type SearchResult struct {
    Record     *VectorRecord // The stored record
    Similarity float32       // Cosine similarity score
}
```

## API Reference

### EmbeddingService
- `NewEmbeddingService(ctx, apiKey)` - Create new embedding service
- `GenerateEmbedding(ctx, text)` - Generate vector embedding for text
- `Close()` - Close the service connection

### VectorStore
- `NewVectorStore()` - Create new in-memory vector store
- `Store(vector, text, userID, sessionID, metadata)` - Store a vector record
- `Search(queryVector, userID, sessionID, topK)` - Search for similar vectors
- `GetRecordsBySession(userID, sessionID)` - Get all records for a session
- `Delete(id)` - Delete a record by ID
- `Count()` - Get total number of records

### ContextManager
- `NewContextManager(embeddingService, vectorStore)` - Create context manager
- `StoreContext(ctx, userID, sessionID, turn)` - Store a conversational turn
- `RetrieveContext(ctx, userID, sessionID, query, topK)` - Retrieve relevant context
- `ConstructPrompt(systemMessage, query, contexts)` - Build context-aware prompt
- `ProcessInteraction(...)` - Complete workflow in one call
- `GetConversationHistory(userID, sessionID)` - Get full conversation history

## Dependencies

- `github.com/google/generative-ai-go` - Gemini API client
- `google.golang.org/api` - Google API support
- `github.com/google/uuid` - UUID generation

## Running the Examples

1. Set your Gemini API key:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

2. Run the main demo:
```bash
go run main.go
```

3. Run the detailed examples:
```bash
go run examples/usage_example.go
```

## Performance Considerations

- **Memory Usage**: The in-memory vector store scales with the number of stored interactions
- **Search Speed**: Cosine similarity search is O(n) where n is the number of vectors
- **Embedding Generation**: API calls to Gemini add latency; consider batching for production use
- **Concurrency**: Vector store operations are thread-safe with read/write locks

## Production Recommendations

1. **Persistent Storage**: Replace in-memory store with a persistent vector database (e.g., Pinecone, Weaviate, or Qdrant)
2. **Caching**: Cache embeddings to reduce API calls
3. **Batch Processing**: Generate embeddings in batches for better throughput
4. **Error Handling**: Implement retry logic and circuit breakers for API calls
5. **Monitoring**: Add metrics for embedding generation time and search performance
6. **Scaling**: Consider distributed vector databases for large-scale deployments

## License

This project is provided as-is for educational and development purposes.
