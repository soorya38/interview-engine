#!/bin/bash
# Quick psql connection helper for this project

# Load DATABASE_URL from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env file"
    exit 1
fi

# Add SSL mode if not present
if [[ "$DATABASE_URL" != *"sslmode"* ]]; then
    if [[ "$DATABASE_URL" == *"?"* ]]; then
        CONN_STRING="${DATABASE_URL}&sslmode=require"
    else
        CONN_STRING="${DATABASE_URL}?sslmode=require"
    fi
else
    CONN_STRING="$DATABASE_URL"
fi

# If query provided as argument, execute it
if [ -n "$1" ]; then
    psql "$CONN_STRING" -c "$1"
else
    # Interactive mode
    echo "🔗 Connecting to database..."
    echo "💡 Tip: Use \\dt to list tables, \\q to quit"
    psql "$CONN_STRING"
fi
