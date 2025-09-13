package handler

import (
	"encoding/json"
	"log"
	"mip/presenter"
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

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	session, err := h.usecase.StartInterview(r.Context(), userID)
	if err != nil {
		log.Printf("unable to start interview: %v", err)
		http.Error(w, "unable to start interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(session); err != nil {
		log.Printf("unable to encode session: %v", err)
		http.Error(w, "unable to encode session", http.StatusInternalServerError)
		return
	}
}

// continueInterview handles continuing an existing interview session
func (h *Handler) continueInterview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/v1/interview/")
	sessionID := path
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	var request usecase.InterviewRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	response, err := h.usecase.ContinueInterview(r.Context(), userID, sessionID, &request)
	if err != nil {
		log.Printf("unable to continue interview: %v", err)
		http.Error(w, "unable to continue interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("unable to encode response: %v", err)
		http.Error(w, "unable to encode response", http.StatusInternalServerError)
		return
	}
}

// endInterview handles ending an interview session
func (h *Handler) endInterview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/v1/interview/end/")
	sessionID := path
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	summary, err := h.usecase.EndInterview(r.Context(), userID, sessionID)
	if err != nil {
		log.Printf("unable to end interview: %v", err)
		http.Error(w, "unable to end interview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(summary); err != nil {
		log.Printf("unable to encode summary: %v", err)
		http.Error(w, "unable to encode summary", http.StatusInternalServerError)
		return
	}
}

// createOrFetchTopics handles creating a new topic or fetching all topics
func (h *Handler) createOrFetchTopics(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		topics, err := h.usecase.GetTopics(r.Context())
		if err != nil {
			http.Error(w, "unable to fetch topics", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(topics); err != nil {
			log.Printf("unable to encode topics: %v", err)
			http.Error(w, "unable to encode topics", http.StatusInternalServerError)
			return
		}
		return
	} else if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, "User ID required in X-User-ID header", http.StatusBadRequest)
		return
	}
	var request presenter.Topic
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	topicID, err := h.usecase.CreateTopic(r.Context(), userID, request.Topic)
	if err != nil {
		http.Error(w, "unable to create topic", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(topicID); err != nil {
		log.Printf("unable to encode summary: %v", err)
		http.Error(w, "unable to encode summary", http.StatusInternalServerError)
		return
	}
}

// MakeHttpHandler registers the handlers for the given usecase and mux
func MakeHttpHandler(uc usecase.Usecase, mux *http.ServeMux) {
	h := &Handler{usecase: uc}

	mux.HandleFunc("/v1/interview/start", h.interviewStart)
	mux.HandleFunc("/v1/interview/", h.continueInterview)
	mux.HandleFunc("/v1/interview/end/", h.endInterview)
	mux.HandleFunc("/v1/topics", h.createOrFetchTopics)
}
