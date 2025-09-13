package handler

import (
	"mip/usecase"
	"net/http"
)

// testHandler is a simple handler for the test endpoint
func testHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Hello, World!"))
}

// MakeHttpHandler registers the handlers for the given usecase and mux
func MakeHttpHandler(usecase usecase.Usecase, mux *http.ServeMux) {
	mux.HandleFunc("/test", testHandler)
}
