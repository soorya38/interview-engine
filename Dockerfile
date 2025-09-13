# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

# Set working directory inside container
WORKDIR /app
    
# Copy go.mod and go.sum first (better caching)
COPY go.mod go.sum ./
RUN go mod download
    
# Copy the rest of the source
COPY . .
    
# Build the Go binary
RUN go build -o server .
    
# ---- Run Stage ----
FROM alpine:latest
    
WORKDIR /app
    
# Copy binary from builder
COPY --from=builder /app/server .
    
# Expose port
EXPOSE 8080
    
# Run the binary
CMD ["./server"]
    