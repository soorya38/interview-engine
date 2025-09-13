#!/usr/bin/env python3
"""
Demo script for Mock Interview Platform
This script demonstrates the complete workflow:
1. Create a topic
2. Add 3 questions to the topic
3. Start an interview with the topic
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8080"
USER_ID = "demo-user-123"
TOPIC_NAME = "JavaScript Fundamentals"

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'  # No Color

def print_colored(message: str, color: str = Colors.NC):
    """Print message with color"""
    print(f"{color}{message}{Colors.NC}")

def make_request(method: str, url: str, data: Dict[Any, Any] = None, extra_headers: Dict[str, str] = None) -> Dict[Any, Any]:
    """Make HTTP request with error handling"""
    headers = {
        "X-User-ID": USER_ID,
        "Content-Type": "application/json"
    }
    
    if extra_headers:
        headers.update(extra_headers)
    
    print_colored(f"Making {method} request to: {url}", Colors.BLUE)
    if data:
        print_colored(f"Request data: {json.dumps(data, indent=2)}", Colors.YELLOW)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        if response.status_code >= 200 and response.status_code < 300:
            print_colored(f"✓ Success (HTTP {response.status_code})", Colors.GREEN)
            try:
                result = response.json()
                print_colored(f"Response: {json.dumps(result, indent=2)}", Colors.GREEN)
                return result
            except json.JSONDecodeError:
                # Handle plain text responses (like topic/question IDs)
                result = response.text.strip().strip('"')
                print_colored(f"Response: {result}", Colors.GREEN)
                return result
        else:
            print_colored(f"✗ Error (HTTP {response.status_code})", Colors.RED)
            print_colored(f"Response: {response.text}", Colors.RED)
            sys.exit(1)
            
    except requests.exceptions.RequestException as e:
        print_colored(f"✗ Request failed: {e}", Colors.RED)
        sys.exit(1)

def main():
    print_colored("=== Mock Interview Platform Demo ===", Colors.BLUE)
    print_colored(f"User ID: {USER_ID}", Colors.YELLOW)
    print_colored(f"Topic: {TOPIC_NAME}", Colors.YELLOW)
    print()

    # Step 1: Create a topic
    print_colored(f"Step 1: Creating topic '{TOPIC_NAME}'", Colors.BLUE)
    topic_data = {"topic": TOPIC_NAME}
    topic_id = make_request("POST", f"{BASE_URL}/v1/topics", topic_data)
    print_colored(f"✓ Topic created with ID: {topic_id}", Colors.GREEN)
    print()

    # Step 2: Add 3 questions to the topic
    print_colored("Step 2: Adding questions to the topic", Colors.BLUE)
    
    questions = [
        "What is the difference between var, let, and const in JavaScript?",
        "Explain the concept of closures in JavaScript with an example.",
        "What is the difference between synchronous and asynchronous JavaScript? How do promises work?"
    ]
    
    question_ids = []
    for i, question_text in enumerate(questions, 1):
        print_colored(f"Adding Question {i}...", Colors.YELLOW)
        question_data = {
            "topic_id": topic_id,
            "question": question_text
        }
        question_id = make_request("POST", f"{BASE_URL}/v1/questions", question_data)
        question_ids.append(question_id)
        print_colored(f"✓ Question {i} created with ID: {question_id}", Colors.GREEN)
    
    print()

    # Step 3: Verify questions were added
    print_colored("Step 3: Verifying questions were added", Colors.BLUE)
    all_questions = make_request("GET", f"{BASE_URL}/v1/questions")
    print_colored("✓ All questions retrieved", Colors.GREEN)
    print()

    # Step 4: Start interview with the topic
    print_colored(f"Step 4: Starting interview with topic ID: {topic_id}", Colors.BLUE)
    extra_headers = {"X-Topic-ID": str(topic_id)}
    interview_response = make_request("POST", f"{BASE_URL}/v1/interview/start", extra_headers=extra_headers)
    
    session_id = interview_response.get("session_id")
    initial_question = interview_response.get("initial_question")
    
    print_colored("✓ Interview started successfully!", Colors.GREEN)
    print_colored(f"Session ID: {session_id}", Colors.GREEN)
    print_colored("Initial Question from AI:", Colors.YELLOW)
    print_colored(initial_question, Colors.BLUE)
    print()

    # Step 5: Show how to continue the interview
    print_colored("Step 5: Example of how to continue the interview", Colors.BLUE)
    print_colored("To continue the interview, you can use:", Colors.YELLOW)
    print()
    
    continue_example = f"""
import requests

# Continue interview example
response = requests.post(
    "{BASE_URL}/v1/interview/{session_id}",
    headers={{
        "X-User-ID": "{USER_ID}",
        "Content-Type": "application/json"
    }},
    json={{"text": "Your answer here"}}
)
print(response.json())
"""
    print_colored(continue_example, Colors.BLUE)
    
    print_colored("To end the interview manually:", Colors.YELLOW)
    end_example = f"""
# End interview example
response = requests.post(
    "{BASE_URL}/v1/interview/end/{session_id}",
    headers={{"X-User-ID": "{USER_ID}"}}
)
print(response.json())
"""
    print_colored(end_example, Colors.BLUE)

    # Step 6: Show created resources summary
    print_colored("=== Summary of Created Resources ===", Colors.BLUE)
    print_colored(f"Topic ID: {topic_id}", Colors.GREEN)
    print_colored(f"Topic Name: {TOPIC_NAME}", Colors.GREEN)
    for i, qid in enumerate(question_ids, 1):
        print_colored(f"Question {i} ID: {qid}", Colors.GREEN)
    print_colored(f"Interview Session ID: {session_id}", Colors.GREEN)
    print()

    print_colored("✓ Demo completed successfully!", Colors.GREEN)
    print_colored("The interview is now ready to continue with the questions from the database.", Colors.YELLOW)

if __name__ == "__main__":
    main()
