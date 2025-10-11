# AI MockMate - Quick Start Guide

## 🚀 Starting the Application

### Development Mode

#### Option 1: One-Command Startup (Recommended)

Run the startup script that seeds the database and starts the development server:

```bash
./start.sh
```

This script will:
1. Clear any existing data
2. Seed the database with default values (users, topics, questions, sample sessions)
3. Start the development server (frontend + backend with hot-reload)

#### Option 2: Manual Steps

If you prefer to run commands separately:

```bash
# 1. Seed the database
tsx server/seed.ts

# 2. Start the development server
npm run dev
```

### Production Mode

#### One-Command Production Startup

For production deployment, use the production startup script:

```bash
./start-production.sh
```

This script will:
1. ✅ Verify all required environment variables are set
2. 📊 Push database schema to PostgreSQL
3. 📦 Seed database with default values
4. 🔨 Build the application (optimized production bundles)
5. 🚀 Start the production server

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini AI API key
- `SESSION_SECRET` - JWT secret for authentication

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📊 Default Data

After seeding, the following data will be available:

### Test Accounts
- **Admin**: `admin` / `admin123`
- **Test User**: `testuser` / `user123`

### Topics
- JavaScript Fundamentals
- React Development
- System Design

### Sample Data
- 8 interview questions across all topics
- 3 completed interview sessions for testuser
- Sample scores: A (94%), B (88%), B (88%)

## 🔧 Database Commands

```bash
# Push schema changes to database
npm run db:push

# Seed database with default values
tsx server/seed.ts
```

## 📝 Environment Variables

Ensure the following environment variables are set:

- `DATABASE_URL` - PostgreSQL connection string (auto-configured in Replit)
- `GEMINI_API_KEY` - Google Gemini AI API key
- `SESSION_SECRET` - JWT secret for authentication

## 🌐 Access the Application

Once started, the application will be available at:
- **Local**: http://localhost:5000
- **Replit**: Your Replit webview URL

## 🎯 Next Steps

1. Log in with one of the test accounts
2. Explore the dashboard to see sample statistics
3. View the profile page with sample interview history
4. Start a new mock interview session
5. Edit your profile to customize your information

## 🔄 Resetting the Database

To reset the database with fresh seed data, simply run:

```bash
tsx server/seed.ts
```

This will clear all existing data and reseed with default values.
