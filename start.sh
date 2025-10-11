#!/bin/bash

echo "🚀 Starting AI MockMate Platform..."
echo ""

# Seed the database
echo "📦 Seeding database with default values..."
tsx server/seed.ts

# Check if seeding was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database seeded successfully!"
  echo ""
  echo "🔥 Starting development server..."
  echo ""
  
  # Start the application (frontend + backend)
  npm run dev
else
  echo ""
  echo "❌ Database seeding failed. Please check the error above."
  exit 1
fi
