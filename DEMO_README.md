# Mock Interview Platform Demo Scripts

This directory contains demo scripts that demonstrate the complete workflow of the Mock Interview Platform.

## What the Demo Does

The demo scripts perform the following steps:

1. **Create a Topic**: Creates a new topic called "JavaScript Fundamentals"
2. **Add Questions**: Adds 3 JavaScript-related questions to the topic:
   - What is the difference between var, let, and const in JavaScript?
   - Explain the concept of closures in JavaScript with an example.
   - What is the difference between synchronous and asynchronous JavaScript? How do promises work?
3. **Start Interview**: Starts an interview session using the created topic
4. **Show Next Steps**: Provides examples of how to continue and end the interview

## Prerequisites

1. **Start the Server**: Make sure the Mock Interview Platform server is running:
   ```bash
   go run main.go
   ```
   The server should be accessible at `http://localhost:8080`

2. **Database**: Ensure your database is set up and the server can connect to it.

## Running the Demo

### Option 1: Bash Script

```bash
./demo_interview.sh
```

### Option 2: Python Script

```bash
# Install requests if not already installed
pip install requests

# Run the script
python3 demo_interview.py
```

## Expected Output

The scripts will show colored output indicating:
- ✓ Successful operations in green
- Step descriptions in blue
- Request/response data in yellow
- Errors in red (if any)

Example output:
```
=== Mock Interview Platform Demo ===
User ID: demo-user-123
Topic: JavaScript Fundamentals

Step 1: Creating topic 'JavaScript Fundamentals'
✓ Topic created with ID: 12345678-1234-1234-1234-123456789012

Step 2: Adding questions to the topic
Adding Question 1...
✓ Question 1 created with ID: 87654321-4321-4321-4321-210987654321

...

Step 4: Starting interview with topic ID: 12345678-1234-1234-1234-123456789012
✓ Interview started successfully!
Session ID: abcdef12-3456-7890-abcd-ef1234567890
Initial Question from AI:
Hello! Welcome to your JavaScript Fundamentals interview. Let's begin with our first question: What is the difference between var, let, and const in JavaScript?
```

## After Running the Demo

Once the demo completes successfully, you'll have:

- A topic created in the database
- 3 questions associated with that topic
- An active interview session ready to continue

## Continuing the Interview

Use the provided examples to continue the interview:

### Using curl:
```bash
curl -X POST \
  -H "X-User-ID: demo-user-123" \
  -H "Content-Type: application/json" \
  -d '{"text": "var has function scope, let and const have block scope..."}' \
  "http://localhost:8080/v1/interview/YOUR_SESSION_ID"
```

### Using Python:
```python
import requests

response = requests.post(
    "http://localhost:8080/v1/interview/YOUR_SESSION_ID",
    headers={
        "X-User-ID": "demo-user-123",
        "Content-Type": "application/json"
    },
    json={"text": "var has function scope, let and const have block scope..."}
)
print(response.json())
```

## Ending the Interview

To manually end the interview and get a summary:

```bash
curl -X POST \
  -H "X-User-ID: demo-user-123" \
  "http://localhost:8080/v1/interview/end/YOUR_SESSION_ID"
```

## Troubleshooting

1. **Connection Refused**: Make sure the server is running on port 8080
2. **Database Errors**: Ensure your database is running and properly configured
3. **Permission Denied**: Make sure the scripts are executable (`chmod +x script_name`)
4. **Python Dependencies**: Install requests library (`pip install requests`)

## Customization

You can modify the scripts to:
- Change the topic name
- Add different questions
- Use a different user ID
- Test with different scenarios

Simply edit the configuration variables at the top of either script file.
