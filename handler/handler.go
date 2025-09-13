package handler

import (
	"encoding/json"
	"log"
	"mip/usecase"
	"net/http"
	"strings"
)

type Handler struct {
	usecase usecase.Usecase
}

// interviewStart is a handler for the interview start endpoint
func (h *Handler) interviewStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("method not allowed")
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	// Get userID from header
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	// Start interview session
	session, err := h.usecase.StartInterview(r.Context(), userID)
	if err != nil {
		log.Printf("Failed to start interview: %v", err)
		http.Error(w, "Failed to start interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

// continueInterview handles continuing an existing interview session
func (h *Handler) continueInterview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	// Get userID from header
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	// Extract sessionID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/v1/interview/")
	sessionID := path
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	// Parse request body
	var request usecase.InterviewRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Continue interview
	response, err := h.usecase.ContinueInterview(r.Context(), userID, sessionID, &request)
	if err != nil {
		log.Printf("Failed to continue interview: %v", err)
		http.Error(w, "Failed to continue interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// endInterview handles ending an interview session
func (h *Handler) endInterview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	// Get userID from header
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	// Extract sessionID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/v1/interview/end/")
	sessionID := path
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	// End interview and get summary
	summary, err := h.usecase.EndInterview(r.Context(), userID, sessionID)
	if err != nil {
		log.Printf("Failed to end interview: %v", err)
		http.Error(w, "Failed to end interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

// MakeHttpHandler registers the handlers for the given usecase and mux
func MakeHttpHandler(uc usecase.Usecase, mux *http.ServeMux) {
	h := &Handler{usecase: uc}

	mux.HandleFunc("/v1/interview/start", h.interviewStart)
	mux.HandleFunc("/v1/interview/", h.continueInterview)
	mux.HandleFunc("/v1/interview/end/", h.endInterview)
}
