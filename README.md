# 🎯 AI MockMate Platform

An AI-powered mock interview platform built with React, Express, PostgreSQL, and Google Gemini AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### 🔧 Setup Environment Variables

#### In Replit (Recommended)
1. Click on "Secrets" (🔒) in the left sidebar
2. Add these three secrets:
   - `DATABASE_URL` - Your PostgreSQL connection string (auto-configured if using Replit DB)
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://ai.google.dev/)
   - `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
3. The secrets will automatically be available as environment variables

#### Locally
1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your values:
```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_jwt_secret
```

3. Export them in your shell:
```bash
export DATABASE_URL='your_postgresql_connection_string'
export GEMINI_API_KEY='your_gemini_api_key'
export SESSION_SECRET='your_jwt_secret'
```

#### ✅ Verify Setup
Before running the application, verify your environment:
```bash
./verify-setup.sh
```

This will check if all required environment variables are properly set.

### 🏃 Running the Application

#### Development Mode
For local development with hot-reload:
```bash
./start.sh
```

#### Production Mode
For production deployment:
```bash
./start-production.sh
```

The production script will:
- ✅ Verify all environment variables
- 📊 Push database schema
- 📦 Seed database with default data
- 🔨 Build optimized bundles
- 🚀 Start production server

## 📚 Documentation

- **[STARTUP.md](./STARTUP.md)** - Quick start guide with step-by-step instructions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide with environment setup
- **[.env.example](./.env.example)** - Environment variable template

## 🔑 Default Credentials

After seeding, use these test accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `testuser` | `user123` |

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `./verify-setup.sh` | Verify environment variables are properly set |
| `./start.sh` | Start development server with database seeding |
| `./start-production.sh` | Deploy in production mode (full setup) |
| `npm run dev` | Start development server only |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires build) |
| `npm run db:push` | Push database schema changes |
| `tsx server/seed.ts` | Seed database with default data |

## 📦 Features

- **AI-Powered Interviews** - Google Gemini AI generates questions and evaluates answers
- **Multiple Topics** - JavaScript, React, System Design, and more
- **User Dashboard** - Track interview history and scores
- **Admin Panel** - Manage topics and questions
- **Secure Authentication** - JWT-based authentication system

## 🏗 Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (via Neon)
- **AI**: Google Gemini AI
- **Auth**: JWT + bcrypt

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ |
| `SESSION_SECRET` | JWT secret for authentication | ✅ |
| `NODE_ENV` | Environment (development/production) | Optional |
| `PORT` | Server port (default: 5000) | Optional |

## 📝 License

MIT
