#!/bin/bash

echo "🔄 Stopping containers..."
docker-compose down

echo "🧹 Cleaning up Docker cache..."
docker system prune -f

echo "🔨 Building and starting containers..."
docker-compose up --build -d

echo "✅ Development environment restarted!"
echo "📋 Checking logs..."
sleep 2
docker logs go-app --tail=10
