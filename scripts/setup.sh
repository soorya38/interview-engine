#!/bin/bash

# FreelanceFlow Interview Engine Setup Script
# This script helps set up the application on a new machine

set -e

echo "🚀 FreelanceFlow Interview Engine - Setup Script"
echo "================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) found"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not found in PATH"
    echo "   Please ensure PostgreSQL 14+ is installed:"
    echo "   - macOS: brew install postgresql@14"
    echo "   - Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo ""
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ PostgreSQL found"
fi

echo ""
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "⚙️  Environment Configuration"
echo "----------------------------"

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    read -p "   Do you want to reconfigure it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Skipping .env configuration"
    else
        rm .env
    fi
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    
    # Default values
    DEFAULT_DB_USER=$(whoami)
    DEFAULT_DB_PASS="Siet@123"
    DEFAULT_PORT="5173"
    
    echo ""
    echo "Please provide the following information:"
    echo ""
    
    read -p "PostgreSQL username [$DEFAULT_DB_USER]: " DB_USER
    DB_USER=${DB_USER:-$DEFAULT_DB_USER}
    
    read -sp "PostgreSQL password [$DEFAULT_DB_PASS]: " DB_PASS
    echo ""
    DB_PASS=${DB_PASS:-$DEFAULT_DB_PASS}
    
    # URL encode the password
    DB_PASS_ENCODED=$(node -e "console.log(encodeURIComponent('$DB_PASS'))")
    
    read -p "Port [$DEFAULT_PORT]: " PORT
    PORT=${PORT:-$DEFAULT_PORT}
    
    # Generate SESSION_SECRET if not exists
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    # Create .env file
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS_ENCODED}@localhost:5432/mockmate_dev

# AI Configuration
GEMINI_API_KEY=AIzaSyA1yxig9DxbwXFopmdTt4SY9CeOZAcRwjc

# Authentication
SESSION_SECRET=${SESSION_SECRET}

# Application Configuration
NODE_ENV=development
PORT=${PORT}
HOST=0.0.0.0
EOF
    
    echo "✅ .env file created"
fi

echo ""
echo "🗄️  Database Setup"
echo "-----------------"
echo "Checking database connection..."

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Try to connect to database
if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Cannot connect to database"
    echo "   Attempting to create database..."
    
    # Extract database name from URL
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    
    # Try to create database
    if createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
        echo "✅ Database '$DB_NAME' created"
    else
        echo ""
        echo "❌ Could not create database automatically"
        echo "   Please create the database manually:"
        echo ""
        echo "   psql postgres"
        echo "   CREATE DATABASE $DB_NAME;"
        echo "   CREATE USER $DB_USER WITH PASSWORD 'your_password';"
        echo "   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
        echo "   \\q"
        echo ""
        read -p "   Press enter after creating the database..."
    fi
fi

echo ""
echo "📊 Running database migrations..."
npm run db:push

echo ""
echo "================================================="
echo "✅ Setup Complete!"
echo "================================================="
echo ""
echo "🎉 Your application is ready to use!"
echo ""
echo "📝 Default Login Credentials:"
echo "   Admin: admin / admin123"
echo "   Students: [username] / Siet@123"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🌐 Access the application at:"
echo "   Local:   http://localhost:$PORT"
echo "   Network: http://[your-ip]:$PORT"
echo ""
echo "📖 For more information, see SETUP.md"
echo ""

