#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🛑 STOPPING EVERYTHING...${NC}"
echo -e "${YELLOW}⚠️  This will delete the database volume and start fresh.${NC}"

# Stop containers and remove volumes to ensure fresh DB init
docker compose down -v --remove-orphans

echo -e "${GREEN}🧹 Cleanup complete. Starting fresh setup...${NC}"

# Ensure start.sh is executable
chmod +x start.sh

# Run the start script
./start.sh
