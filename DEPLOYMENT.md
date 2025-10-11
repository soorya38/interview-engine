# AI MockMate - Deployment Guide

## 📋 Prerequisites

Before deploying the application, ensure you have:

1. **PostgreSQL Database** - A PostgreSQL database instance (Replit provides this automatically)
2. **Google Gemini API Key** - For AI-powered interview questions and evaluation
3. **Node.js** - Version 18 or higher

## 🔧 Environment Variables

The application requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ Yes |
| `SESSION_SECRET` | JWT secret for authentication | ✅ Yes |
| `NODE_ENV` | Environment mode (development/production) | Optional (auto-set) |
| `PORT` | Server port | Optional (defaults to 5000) |

### Setting Up Environment Variables

#### Option 1: Using .env file (Local Development)
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your values
nano .env
```

#### Option 2: Export in Shell (Current Session)
```bash
export DATABASE_URL='your_postgresql_connection_string'
export GEMINI_API_KEY='your_gemini_api_key'
export SESSION_SECRET='your_jwt_secret'
```

#### Option 3: Replit Secrets (Recommended for Replit)
1. Click on "Secrets" (🔒) in the left sidebar
2. Add each environment variable as a key-value pair
3. Replit will automatically load these as environment variables

### Getting API Keys

**Google Gemini API Key:**
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your environment variables

**Session Secret:**
Generate a strong random string:
```bash
# Using openssl
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Deployment Scripts

### Development Mode

For local development with hot-reload:

```bash
./start.sh
```

This script will:
1. Seed the database with default values
2. Start the development server (frontend + backend)
3. Enable hot-reload for code changes

### Production Mode

For production deployment:

```bash
./start-production.sh
```

This script will:
1. ✅ Verify all required environment variables are set
2. 📊 Push database schema to PostgreSQL
3. 📦 Seed database with default values
4. 🔨 Build the application (frontend + backend)
5. 🚀 Start the production server

**Note:** The production script will automatically:
- Set `NODE_ENV=production` if not already set
- Set `PORT=5000` if not already set
- Build optimized production bundles
- Serve static files instead of using Vite dev server

## 📝 Manual Deployment Steps

If you prefer to run commands manually:

### 1. Set Environment Variables
```bash
export DATABASE_URL='your_postgresql_connection_string'
export GEMINI_API_KEY='your_gemini_api_key'
export SESSION_SECRET='your_jwt_secret'
export NODE_ENV=production
export PORT=5000
```

### 2. Push Database Schema
```bash
npm run db:push
```

### 3. Seed Database
```bash
tsx server/seed.ts
```

### 4. Build Application
```bash
npm run build
```

### 5. Start Production Server
```bash
npm run start
```

## 🔄 Database Management

### Push Schema Changes
```bash
npm run db:push
```

### Re-seed Database
```bash
tsx server/seed.ts
```

This will clear all existing data and reseed with default values:
- **Admin account:** `admin` / `admin123`
- **Test user:** `testuser` / `user123`
- Sample topics, questions, and interview sessions

## 🌐 Accessing the Application

Once deployed, the application will be available at:
- **Local:** http://localhost:5000 (or your configured PORT)
- **Replit:** Your Replit webview URL
- **Production:** Your domain or hosting URL

## 🔒 Security Best Practices

1. **Never commit `.env` files** - The `.env` file is in `.gitignore`
2. **Use strong secrets** - Generate random strings for `SESSION_SECRET`
3. **Rotate API keys** - Regularly update your `GEMINI_API_KEY`
4. **Use environment-specific configs** - Different values for dev/staging/prod
5. **Monitor database access** - Review `DATABASE_URL` permissions

## 🐛 Troubleshooting

### Environment Variable Issues
If you see errors about missing environment variables:
```bash
# Verify all variables are set
echo $DATABASE_URL
echo $GEMINI_API_KEY
echo $SESSION_SECRET
```

### Database Connection Issues
```bash
# Test database connection
tsx server/db.ts
```

### Build Issues
```bash
# Clear dist folder and rebuild
rm -rf dist
npm run build
```

### Port Already in Use
```bash
# Change the port
export PORT=3000
```

## 📊 Default Seed Data

After seeding, the database contains:

**Test Accounts:**
- Admin: `admin` / `admin123`
- User: `testuser` / `user123`

**Topics:**
- JavaScript Fundamentals
- React Development
- System Design

**Sample Data:**
- 8 interview questions across all topics
- 3 completed interview sessions for testuser
- Sample scores: A (94%), B (88%), B (88%)

## 🔄 Continuous Deployment

For automated deployments:

1. Set environment variables in your hosting platform
2. Add build command: `npm run build`
3. Add start command: `npm run start`
4. Configure database migrations (if needed)

### Replit Deployments
Replit handles deployments automatically:
1. Environment variables are managed in Secrets
2. The application auto-deploys on code changes
3. Database is provisioned and managed automatically
