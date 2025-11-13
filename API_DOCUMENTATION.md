# FreelanceFlow Interview Platform API Documentation

## Overview

This document provides the complete API specification for the FreelanceFlow mock interview platform. The API is RESTful and uses JWT authentication.

## Base URL

- **Development**: `http://localhost:5173/api`
- **Production**: `https://api.freelanceflow.com/api`

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Specification

The complete OpenAPI 3.0 specification is available in `api-spec.yaml`. You can:

1. **View in Swagger UI**: Import the YAML file into [Swagger Editor](https://editor.swagger.io/) or use Swagger UI
2. **Generate client SDKs**: Use tools like `openapi-generator` to generate client libraries
3. **API Testing**: Import into Postman, Insomnia, or similar tools

## Quick Start

### 1. Register a User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "student1",
  "password": "password123",
  "fullName": "John Doe",
  "email": "john@example.com"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "username": "student1",
    "role": "user",
    ...
  },
  "token": "jwt-token-here"
}
```

### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "password123"
}
```

### 3. Start a Test Session

```bash
POST /api/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "testId": "test-uuid"
}
```

### 4. Submit an Answer

```bash
POST /api/sessions/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "answer": "My answer to the question..."
}
```

## Endpoint Categories

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Topic Categories (Admin/Instructor)
- `GET /api/topic-categories` - List all topic categories
- `POST /api/topic-categories` - Create topic category
- `PUT /api/topic-categories/{id}` - Update topic category
- `DELETE /api/topic-categories/{id}` - Delete topic category

### Tests (Admin/Instructor)
- `GET /api/tests` - List all tests
- `POST /api/tests` - Create test
- `PUT /api/tests/{id}` - Update test
- `DELETE /api/tests/{id}` - Delete test

### Questions (Admin/Instructor)
- `GET /api/questions` - List all questions
- `POST /api/questions` - Create question
- `PUT /api/questions/{id}` - Update question
- `DELETE /api/questions/{id}` - Delete question

### Users (Admin/Instructor)
- `GET /api/users` - List all users

### Interview Sessions
- `POST /api/sessions/start` - Start new session
- `GET /api/sessions/recent` - Get recent sessions (5 most recent)
- `GET /api/sessions/history` - Get all completed sessions
- `GET /api/sessions/{id}` - Get session details
- `POST /api/sessions/answer` - Submit answer
- `GET /api/sessions/{id}/score` - Get session score
- `GET /api/sessions/{id}/turns` - Get session turns (answers)
- `POST /api/sessions/{id}/quit` - Quit session

### Statistics
- `GET /api/stats` - Get user statistics
- `GET /api/profile/stats` - Get profile statistics

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin Endpoints (Admin/Instructor Only)
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/student-sessions` - Get all student sessions
- `GET /api/admin/student-sessions/{sessionId}` - Get student session details
- `GET /api/admin/analytics` - Get platform analytics

## Response Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

## Data Models

### User Roles
- `user` - Regular student user
- `admin` - Administrator with full access
- `instructor` - Instructor with content management and analytics access

### Session Status
- `in_progress` - Session is active
- `completed` - Session finished successfully
- `abandoned` - Session was quit/abandoned

### Question Difficulty
- `easy` - Easy difficulty
- `medium` - Medium difficulty
- `hard` - Hard difficulty

### Grades
- `A` - 90-100%
- `B` - 80-89%
- `C` - 70-79%
- `D` - 60-69%
- `F` - Below 60%

## Using the API Spec

### Swagger UI

1. Go to https://editor.swagger.io/
2. Copy the contents of `api-spec.yaml`
3. Paste into the editor
4. View interactive API documentation

### Postman

1. Open Postman
2. Click Import
3. Select `api-spec.yaml`
4. All endpoints will be imported with example requests

### Generate Client SDKs

```bash
# Install openapi-generator
npm install -g @openapi-generator/cli

# Generate TypeScript client
openapi-generator generate -i api-spec.yaml -g typescript-axios -o ./generated-client

# Generate Python client
openapi-generator generate -i api-spec.yaml -g python -o ./generated-client
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are in standard UUID v4 format
- Scores are integers from 0-100
- Arrays are returned as JSON arrays
- Pagination is not currently implemented (all endpoints return all results)

