#!/bin/bash

echo "🔍 AI MockMate - Environment Setup Verification"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MISSING_VARS=0

echo "Checking required environment variables..."
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL is NOT set${NC}"
  echo "   This should be your PostgreSQL connection string"
  echo "   Example: postgresql://user:password@host:port/database"
  MISSING_VARS=1
else
  echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
fi

# Check GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${RED}❌ GEMINI_API_KEY is NOT set${NC}"
  echo "   Get your API key from: https://ai.google.dev/"
  MISSING_VARS=1
else
  echo -e "${GREEN}✅ GEMINI_API_KEY is set${NC}"
fi

# Check SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
  echo -e "${RED}❌ SESSION_SECRET is NOT set${NC}"
  echo "   Generate one with: openssl rand -base64 32"
  MISSING_VARS=1
else
  echo -e "${GREEN}✅ SESSION_SECRET is set${NC}"
fi

echo ""
echo "Other environment variables:"
echo ""

# Check NODE_ENV
if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}⚠️  NODE_ENV is not set (will default to 'development')${NC}"
else
  echo -e "${GREEN}✅ NODE_ENV is set to: $NODE_ENV${NC}"
fi

# Check PORT
if [ -z "$PORT" ]; then
  echo -e "${YELLOW}⚠️  PORT is not set (will default to 5000)${NC}"
else
  echo -e "${GREEN}✅ PORT is set to: $PORT${NC}"
fi

echo ""
echo "==============================================="

if [ $MISSING_VARS -eq 1 ]; then
  echo -e "${RED}❌ SETUP INCOMPLETE${NC}"
  echo ""
  echo "Missing environment variables detected!"
  echo ""
  echo "📝 To fix this in Replit:"
  echo "   1. Click on 'Secrets' (🔒) in the left sidebar"
  echo "   2. Add each missing variable as a key-value pair"
  echo "   3. Restart the workflow"
  echo ""
  echo "📝 To fix this locally:"
  echo "   1. Copy .env.example to .env"
  echo "   2. Fill in your values in .env"
  echo "   3. Run: source .env (or export each variable)"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ ALL REQUIRED VARIABLES ARE SET${NC}"
  echo ""
  echo "You're ready to start the application!"
  echo ""
  echo "Development mode: ./start.sh"
  echo "Production mode:  ./start-production.sh"
  echo ""
  exit 0
fi
