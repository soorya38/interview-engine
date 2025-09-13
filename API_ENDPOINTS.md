# Interview API Endpoints

This document describes the HTTP endpoints for the mock interview platform.

## Authentication

All endpoints require a `X-User-ID` header containing the user identifier.

## Endpoints

### 1. Start Interview

**POST** `/v1/interview/start`

Starts a new interview session and returns a session ID.

**Headers:**
- `X-User-ID`: User identifier (required)

**Response:**
```json
{
  "session_id": "uuid-string",
  "user_id": "user-123",
  "start_time": "2025-09-13T10:30:00Z",
  "status": "active",
  "initial_question": "Hello! Let's start the interview. What is your name?"
}
```

### 2. Continue Interview

**POST** `/v1/interview/{sessionID}`

Continues an existing interview session by sending user input and receiving AI response.

**Headers:**
- `X-User-ID`: User identifier (required)

**Request Body:**
```json
{
  "text": "User's answer or message"
}
```

**Response:**
```json
{
  "response": "AI interviewer's response/question"
}
```

**Features:**
- Stores user input as vector embeddings
- Retrieves relevant conversation context
- Generates context-aware AI responses
- Maintains conversation history

### 3. End Interview

**POST** `/v1/interview/end/{sessionID}`

Ends the interview session and generates a comprehensive summary.

**Headers:**
- `X-User-ID`: User identifier (required)

**Response:**
```json
{
  "strong_points": [
    "Demonstrated good communication skills",
    "Strong technical knowledge"
  ],
  "weak_points": [
    "Could improve system design explanations",
    "Needs more specific examples"
  ],
  "grammatical_score": 85,
  "technical_score": 78,
  "practice_points": [
    "Practice explaining complex concepts simply",
    "Work on system design fundamentals",
    "Prepare more concrete examples"
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `400 Bad Request`: Missing required headers or invalid request body
- `404 Not Found`: Invalid session ID
- `405 Method Not Allowed`: Wrong HTTP method
- `500 Internal Server Error`: Server-side errors

## Example Usage

```bash
# Start interview
curl -X POST \
  -H "X-User-ID: user-123" \
  http://localhost:8080/v1/interview/start

# Continue interview
curl -X POST \
  -H "X-User-ID: user-123" \
  -H "Content-Type: application/json" \
  -d '{"text": "I have 5 years of Go experience"}' \
  http://localhost:8080/v1/interview/SESSION_ID

# End interview
curl -X POST \
  -H "X-User-ID: user-123" \
  http://localhost:8080/v1/interview/end/SESSION_ID
```

## Technical Implementation

- **Vector Embeddings**: User responses are converted to embeddings using Google's text-embedding-004 model
- **Context Retrieval**: Semantic similarity search retrieves relevant conversation history
- **AI Generation**: Google Gemini 2.0 Flash generates context-aware responses using structured prompts:
  - `START_INTERVIEW_PROMPT`: Initial interview questions and setup
  - `CONTINUE_INTERVIEW_PROMPT`: Context-aware follow-up questions
  - `END_INTERVIEW_PROMPT`: Comprehensive interview analysis and scoring
- **Session Management**: In-memory storage for active sessions with user isolation
- **Summary Generation**: AI analyzes complete conversation for comprehensive feedback
