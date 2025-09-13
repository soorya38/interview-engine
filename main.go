// main.go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"mip/handler"
	"mip/infrastructure/gemini"
	"mip/repository"
	"mip/repository/embeddings"
	"mip/repository/vectordb"
	"mip/usecase"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	ctx := context.Background()
	logger := log.New(os.Stdout, "", log.LstdFlags)

	// =========================================================================
	// MySQL Configuration
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, name)

	var err error
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Error opening DB:", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatal("Error connecting to DB:", err)
	}
	log.Println("Connected to MySQL")

	// =========================================================================
	// Configuration
	// It's best practice to configure the server via environment variables.
	port = os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not specified
	}
	serverAddr := ":" + port
	apiKey := "AIzaSyA1yxig9DxbwXFopmdTt4SY9CeOZAcRwjc"
	modelName := "gemini-2.0-flash-001"

	// =========================================================================
	// HTTP Server Setup

	geminiClient, err := gemini.NewGeminiClient(ctx, apiKey)
	if err != nil {
		log.Fatalf("Unable to create Gemini client: %v", err)
	}
	defer geminiClient.Client.Close()

	// Initialize services
	embeddingService, err := embeddings.NewEmbeddingService(ctx, apiKey)
	if err != nil {
		log.Fatalf("Unable to create embedding service: %v", err)
	}
	defer embeddingService.Close()

	vectorStore := vectordb.NewVectorStore()
	contextManager := repository.NewContextManager(embeddingService, vectorStore)

	repo := repository.NewRepository(db)
	ser := usecase.NewService(embeddingService, vectorStore, geminiClient, contextManager, modelName, repo)
	if err != nil {
		logger.Printf("Unable to create service: %v", err)
	}

	// Create a new ServeMux to register handlers.
	mux := http.NewServeMux()

	// Register your handlers.
	mux.HandleFunc("/", homeHandler)
	mux.HandleFunc("/health", healthCheckHandler)
	
	// Register API handlers
	handler.MakeHttpHandler(ser, mux)

	// Define the HTTP server with timeouts for production robustness.
	// Timeouts prevent slow clients from hogging resources.
	server := &http.Server{
		Addr:         serverAddr,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,   // Max time to read the entire request, including the body.
		WriteTimeout: 10 * time.Second,  // Max time to write the response.
		IdleTimeout:  120 * time.Second, // Max time for a connection to remain idle.
	}

	// =========================================================================
	// Start Server & Handle Graceful Shutdown

	// Create a channel to receive errors from the server goroutine.
	serverErrors := make(chan error, 1)

	// Start the server in a separate goroutine.
	go func() {
		logger.Printf("Server starting on %s", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()

	// Create a channel to listen for OS signals (e.g., Ctrl+C).
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	// Block until a server error or a shutdown signal is received.
	select {
	case err := <-serverErrors:
		// Don't log http.ErrServerClosed as it's an expected error on shutdown.
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("Server error: %v", err)
		}

	case sig := <-shutdown:
		logger.Printf("Shutdown signal received: %v. Starting graceful shutdown...", sig)

		// Create a context with a timeout for the shutdown process.
		// This gives active connections time to finish their work.
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()

		// Attempt to gracefully shut down the server.
		if err := server.Shutdown(ctx); err != nil {
			logger.Printf("Graceful shutdown Unable: %v. Forcing exit.", err)
			// Close the server immediately if Shutdown fails.
			if closeErr := server.Close(); closeErr != nil {
				logger.Printf("Unable to close server: %v", closeErr)
			}
		} else {
			logger.Println("Server gracefully stopped.")
		}
	}
}

// homeHandler is a simple handler for the root path.
func homeHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET requests to this endpoint.
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
	// For security, prevent path traversal attacks.
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprintf(w, "Welcome to the Go Production Server! 🚀")
}

// healthCheckHandler reports the status of the server.
// This is crucial for load balancers and container orchestrators (like Kubernetes).
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// In a real app, you might check DB connections or other dependencies here.
	fmt.Fprintln(w, `{"status": "ok"}`)
}
