package vectordb

import (
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

// VectorRecord represents a stored vector with metadata
type VectorRecord struct {
	ID        string                 `json:"id"`
	Vector    []float32              `json:"vector"`
	Text      string                 `json:"text"`
	UserID    string                 `json:"user_id"`
	SessionID string                 `json:"session_id"`
	Metadata  map[string]interface{} `json:"metadata"`
	Timestamp time.Time              `json:"timestamp"`
}

// SearchResult represents a search result with similarity score
type SearchResult struct {
	Record     *VectorRecord `json:"record"`
	Similarity float32       `json:"similarity"`
}

// VectorStore is an in-memory vector database
type VectorStore struct {
	records map[string]*VectorRecord
	mutex   sync.RWMutex
}

// NewVectorStore creates a new in-memory vector store
func NewVectorStore() *VectorStore {
	return &VectorStore{
		records: make(map[string]*VectorRecord),
	}
}

// Store saves a vector record with metadata
func (vs *VectorStore) Store(vector []float32, text, userID, sessionID string, metadata map[string]interface{}) (string, error) {
	vs.mutex.Lock()
	defer vs.mutex.Unlock()

	id := uuid.New().String()
	record := &VectorRecord{
		ID:        id,
		Vector:    vector,
		Text:      text,
		UserID:    userID,
		SessionID: sessionID,
		Metadata:  metadata,
		Timestamp: time.Now(),
	}

	vs.records[id] = record
	return id, nil
}

// Search finds the most similar vectors for a given user and session
func (vs *VectorStore) Search(queryVector []float32, userID, sessionID string, topK int) ([]*SearchResult, error) {
	vs.mutex.RLock()
	defer vs.mutex.RUnlock()

	var candidates []*SearchResult

	// Filter records by userID and sessionID, then calculate similarity
	for _, record := range vs.records {
		if record.UserID == userID && record.SessionID == sessionID {
			similarity := cosineSimilarity(queryVector, record.Vector)
			candidates = append(candidates, &SearchResult{
				Record:     record,
				Similarity: similarity,
			})
		}
	}

	// Sort by similarity (descending)
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Similarity > candidates[j].Similarity
	})

	// Return top K results
	if topK > len(candidates) {
		topK = len(candidates)
	}

	return candidates[:topK], nil
}

// GetRecordsBySession retrieves all records for a specific user and session
func (vs *VectorStore) GetRecordsBySession(userID, sessionID string) ([]*VectorRecord, error) {
	vs.mutex.RLock()
	defer vs.mutex.RUnlock()

	var records []*VectorRecord
	for _, record := range vs.records {
		if record.UserID == userID && record.SessionID == sessionID {
			records = append(records, record)
		}
	}

	// Sort by timestamp
	sort.Slice(records, func(i, j int) bool {
		return records[i].Timestamp.Before(records[j].Timestamp)
	})

	return records, nil
}

// Delete removes a record by ID
func (vs *VectorStore) Delete(id string) error {
	vs.mutex.Lock()
	defer vs.mutex.Unlock()

	if _, exists := vs.records[id]; !exists {
		return fmt.Errorf("record with ID %s not found", id)
	}

	delete(vs.records, id)
	return nil
}

// Count returns the total number of records
func (vs *VectorStore) Count() int {
	vs.mutex.RLock()
	defer vs.mutex.RUnlock()
	return len(vs.records)
}

// cosineSimilarity calculates the cosine similarity between two vectors
func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float32
	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}
