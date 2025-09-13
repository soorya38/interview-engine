#!/bin/bash

# Demo script for Mock Interview Platform
# This script demonstrates the complete workflow:
# 1. Create a topic
# 2. Add 3 questions to the topic
# 3. Start an interview with the topic

set -e  # Exit on any error

# Configuration
BASE_URL="http://localhost:8080"
USER_ID="demo-user-123"
TOPIC_NAME="JavaScript Fundamentals"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mock Interview Platform Demo ===${NC}"
echo -e "${YELLOW}User ID: $USER_ID${NC}"
echo -e "${YELLOW}Topic: $TOPIC_NAME${NC}"
echo ""

# Function to make HTTP requests with error handling
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local headers=$4
    
    echo -e "${BLUE}Making $method request to: $url${NC}"
    if [ -n "$data" ]; then
        echo -e "${YELLOW}Request data: $data${NC}"
    fi
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "X-User-ID: $USER_ID" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "X-User-ID: $USER_ID" \
            $headers \
            "$url")
    fi
    
    # Split response and status code
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success (HTTP $status_code)${NC}"
        echo -e "${GREEN}Response: $body${NC}"
        echo ""
        echo "$body"
    else
        echo -e "${RED}✗ Error (HTTP $status_code)${NC}"
        echo -e "${RED}Response: $body${NC}"
        exit 1
    fi
}

# Step 1: Create a topic
echo -e "${BLUE}Step 1: Creating topic '$TOPIC_NAME'${NC}"
topic_data='{"topic":"'$TOPIC_NAME'"}'
topic_response=$(make_request "POST" "$BASE_URL/v1/topics" "$topic_data")
TOPIC_ID=$(echo "$topic_response" | tr -d '"')
echo -e "${GREEN}✓ Topic created with ID: $TOPIC_ID${NC}"
echo ""

# Step 2: Add 3 questions to the topic
echo -e "${BLUE}Step 2: Adding questions to the topic${NC}"

# Question 1
echo -e "${YELLOW}Adding Question 1...${NC}"
question1_data='{"topic_id":"'$TOPIC_ID'","question":"What is the difference between var, let, and const in JavaScript?"}'
question1_response=$(make_request "POST" "$BASE_URL/v1/questions" "$question1_data")
QUESTION1_ID=$(echo "$question1_response" | tr -d '"')
echo -e "${GREEN}✓ Question 1 created with ID: $QUESTION1_ID${NC}"

# Question 2
echo -e "${YELLOW}Adding Question 2...${NC}"
question2_data='{"topic_id":"'$TOPIC_ID'","question":"Explain the concept of closures in JavaScript with an example."}'
question2_response=$(make_request "POST" "$BASE_URL/v1/questions" "$question2_data")
QUESTION2_ID=$(echo "$question2_response" | tr -d '"')
echo -e "${GREEN}✓ Question 2 created with ID: $QUESTION2_ID${NC}"

# Question 3
echo -e "${YELLOW}Adding Question 3...${NC}"
question3_data='{"topic_id":"'$TOPIC_ID'","question":"What is the difference between synchronous and asynchronous JavaScript? How do promises work?"}'
question3_response=$(make_request "POST" "$BASE_URL/v1/questions" "$question3_data")
QUESTION3_ID=$(echo "$question3_response" | tr -d '"')
echo -e "${GREEN}✓ Question 3 created with ID: $QUESTION3_ID${NC}"
echo ""

# Step 3: Verify questions were added
echo -e "${BLUE}Step 3: Verifying questions were added${NC}"
questions_response=$(make_request "GET" "$BASE_URL/v1/questions")
echo -e "${GREEN}✓ All questions retrieved${NC}"
echo ""

# Step 4: Start interview with the topic
echo -e "${BLUE}Step 4: Starting interview with topic ID: $TOPIC_ID${NC}"
interview_response=$(make_request "POST" "$BASE_URL/v1/interview/start" "" "-H \"X-Topic-ID: $TOPIC_ID\"")
SESSION_ID=$(echo "$interview_response" | jq -r '.session_id')
INITIAL_QUESTION=$(echo "$interview_response" | jq -r '.initial_question')

echo -e "${GREEN}✓ Interview started successfully!${NC}"
echo -e "${GREEN}Session ID: $SESSION_ID${NC}"
echo -e "${YELLOW}Initial Question from AI:${NC}"
echo -e "${BLUE}$INITIAL_QUESTION${NC}"
echo ""

# Step 5: Show how to continue the interview
echo -e "${BLUE}Step 5: Example of how to continue the interview${NC}"
echo -e "${YELLOW}To continue the interview, use:${NC}"
echo ""
echo -e "${BLUE}curl -X POST \\${NC}"
echo -e "${BLUE}  -H \"X-User-ID: $USER_ID\" \\${NC}"
echo -e "${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${BLUE}  -d '{\"text\": \"Your answer here\"}' \\${NC}"
echo -e "${BLUE}  \"$BASE_URL/v1/interview/$SESSION_ID\"${NC}"
echo ""

echo -e "${YELLOW}To end the interview manually, use:${NC}"
echo ""
echo -e "${BLUE}curl -X POST \\${NC}"
echo -e "${BLUE}  -H \"X-User-ID: $USER_ID\" \\${NC}"
echo -e "${BLUE}  \"$BASE_URL/v1/interview/end/$SESSION_ID\"${NC}"
echo ""

# Step 6: Show created resources summary
echo -e "${BLUE}=== Summary of Created Resources ===${NC}"
echo -e "${GREEN}Topic ID: $TOPIC_ID${NC}"
echo -e "${GREEN}Topic Name: $TOPIC_NAME${NC}"
echo -e "${GREEN}Question 1 ID: $QUESTION1_ID${NC}"
echo -e "${GREEN}Question 2 ID: $QUESTION2_ID${NC}"
echo -e "${GREEN}Question 3 ID: $QUESTION3_ID${NC}"
echo -e "${GREEN}Interview Session ID: $SESSION_ID${NC}"
echo ""

echo -e "${GREEN}✓ Demo completed successfully!${NC}"
echo -e "${YELLOW}The interview is now ready to continue with the questions from the database.${NC}"
