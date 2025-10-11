#!/bin/bash

echo "🚀 Starting AI MockMate Platform (Production Mode)"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
  echo "✅ Environment variables loaded from .env file"
else
  echo "⚠️  No .env file found, using system environment variables"
fi
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if an environment variable is set
check_env_var() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}❌ Error: $1 is not set${NC}"
    return 1
  else
    echo -e "${GREEN}✅ $1 is set${NC}"
    return 0
  fi
}

# Check required environment variables
echo "🔍 Checking environment variables..."
echo ""

ENV_CHECK_FAILED=0

if ! check_env_var "DATABASE_URL"; then
  echo "   Set it with: export DATABASE_URL='your_postgresql_connection_string'"
  ENV_CHECK_FAILED=1
fi

if ! check_env_var "GEMINI_API_KEY"; then
  echo "   Set it with: export GEMINI_API_KEY='your_gemini_api_key'"
  ENV_CHECK_FAILED=1
fi

if ! check_env_var "SESSION_SECRET"; then
  echo "   Set it with: export SESSION_SECRET='your_jwt_secret'"
  ENV_CHECK_FAILED=1
fi

# Set NODE_ENV to production if not set
if [ -z "$NODE_ENV" ]; then
  echo -e "${YELLOW}⚠️  NODE_ENV not set, setting to 'production'${NC}"
  export NODE_ENV=production
else
  echo -e "${GREEN}✅ NODE_ENV is set to '$NODE_ENV'${NC}"
fi

# Set PORT to 5000 if not set
if [ -z "$PORT" ]; then
  echo -e "${YELLOW}⚠️  PORT not set, setting to '5000'${NC}"
  export PORT=5000
else
  echo -e "${GREEN}✅ PORT is set to '$PORT'${NC}"
fi

echo ""

if [ $ENV_CHECK_FAILED -eq 1 ]; then
  echo -e "${RED}❌ Required environment variables are missing. Please set them and try again.${NC}"
  exit 1
fi

# Push database schema
echo "📊 Pushing database schema..."
npm run db:push

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database schema push failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Database schema pushed successfully${NC}"
echo ""

# Seed the database
echo "📦 Seeding database with default values..."
npx tsx server/seed.ts

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database seeding failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Database seeded successfully${NC}"
echo ""

# Build the application
echo "🔨 Building application for production..."
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo ""

# Start the production server
echo "🚀 Starting production server on port $PORT..."
echo ""
npm run start
