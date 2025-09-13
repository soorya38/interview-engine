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
  "initial_question": "Hello! Let's start the interview. What is your name?",
  "question_count": 1,
  "max_questions": 10
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

**Auto-End Response (when max questions reached):**
```json
{
  "response": "Thank you for completing the interview! The session has ended automatically...",
  "session_ended": true,
  "summary": {
    "strong_points": ["Good communication", "Technical knowledge"],
    "weak_points": ["Could improve examples"],
    "grammatical_score": 85,
    "technical_score": 78,
    "practice_points": ["Practice system design", "Prepare more examples"]
  }
}
```

**Features:**
- Stores user input as vector embeddings
- Retrieves relevant conversation context
- Generates context-aware AI responses
- Maintains conversation history
- **Auto-ends after 10 questions with summary**
- Tracks question count and provides final question indicator

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
  ],
  "contextual_relevant": true,
  "off_topic_count": 0
}
```

**No-Score Response (for off-topic answers):**
```json
{
  "strong_points": [
    "Limited relevant responses to assess"
  ],
  "weak_points": [
    "Provided responses that were not relevant to the questions asked",
    "Did not demonstrate understanding of interview context"
  ],
  "grammatical_score": -1,
  "technical_score": -1,
  "practice_points": [
    "Focus on understanding and directly answering the questions asked",
    "Practice active listening during interviews"
  ],
  "contextual_relevant": false,
  "off_topic_count": 2
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

## Automatic Session Management

The interview system automatically manages session lifecycle:

1. **Question Limit**: Each session is limited to 2 questions maximum
2. **Auto-End Trigger**: When the 2nd question is answered, the session automatically ends
3. **Automatic Summary**: The system generates and returns a comprehensive summary
4. **Final Question**: The AI is notified when asking the final (2nd) question
5. **Session Status**: Sessions can have status: `"active"`, `"ended"`, or `"auto_ended"`
6. **Context Validation**: Each response is validated for relevance to the question asked
7. **Smart Scoring**: Scores are only provided if responses are contextually relevant

**Note**: The `/v1/interview/end/{sessionID}` endpoint can still be called manually to end a session early.

## Context Validation System

The system validates response relevance:

- **Real-time Validation**: Each user response is checked against the previous question
- **AI-Powered Analysis**: Uses structured prompts to determine relevance
- **Scoring Logic**: 
  - If ≥50% of responses are relevant: Normal scoring (0-100)
  - If <50% of responses are relevant: No scores (-1 for both grammatical and technical)
- **Feedback**: Off-topic responses are tracked and reported in the summary

## Technical Implementation

- **Vector Embeddings**: User responses are converted to embeddings using Google's text-embedding-004 model
- **Context Retrieval**: Semantic similarity search retrieves relevant conversation history
- **AI Generation**: Google Gemini 2.0 Flash generates context-aware responses using structured prompts:
  - `START_INTERVIEW_PROMPT`: Initial interview questions and setup
  - `CONTINUE_INTERVIEW_PROMPT`: Context-aware follow-up questions
  - `END_INTERVIEW_PROMPT`: Comprehensive interview analysis and scoring
- **Session Management**: In-memory storage for active sessions with user isolation
- **Question Limiting**: Automatic session termination after 2 questions with summary
- **Auto-End Feature**: Sessions automatically end when question limit is reached
- **Context Validation**: AI validates response relevance to interview questions
- **Smart Scoring**: No scores provided for off-topic or irrelevant responses
- **Summary Generation**: AI analyzes complete conversation for comprehensive feedback
