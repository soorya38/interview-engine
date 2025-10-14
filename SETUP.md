# FreelanceFlow Interview Engine - Setup Guide

Complete setup guide for deploying on a new machine.

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

## 🚀 Quick Setup (Automated)

```bash
# 1. Clone or copy the project
git clone <your-repo-url>
cd FreelanceFlow-1\ 2

# 2. Run setup script
npm run setup

# 3. Start the application
npm run dev
```

The application will be accessible at:
- Local: http://localhost:5173
- Network: http://[your-ip]:5173

## 📝 Manual Setup

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Run these commands:
CREATE DATABASE mockmate_dev;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mockmate_dev TO your_username;
\q
```

### Step 3: Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```ini
# Update this with your PostgreSQL credentials
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/mockmate_dev

# These can remain as is
GEMINI_API_KEY=AIzaSyA1yxig9DxbwXFopmdTt4SY9CeOZAcRwjc
SESSION_SECRET=Z5rBIymV4OqmtUZymnnLs1lKBhTPoArCykMortdBayk=
NODE_ENV=development
PORT=5173
HOST=0.0.0.0
```

**Important:** If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`

Example: `Siet@123` becomes `Siet%40123`

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Run Database Migrations

```bash
npm run db:push
```

### Step 6: Start the Application

```bash
npm run dev
```

The server will:
1. Automatically seed the database with initial data (if empty)
2. Start on port 5173
3. Be accessible from any network interface (0.0.0.0)

## 🔐 Default Credentials

After first run, the following accounts are automatically created:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Student Accounts:**
- Username: [email prefix] (e.g., `ramalingamm22ece`)
- Password: `Siet@123`

Example student logins:
- `ramalingamm22ece` / `Siet@123`
- `gowthamg22cys` / `Siet@123`
- `kesavans22cys` / `Siet@123`

## 📊 Seeded Data

The application automatically creates:
- 1 Admin user
- 97 Student users
- 2 Topic categories (Java, Python)
- 11 Java questions
- 11 Python questions
- 2 Tests (Java and Python fundamentals)

## 🌐 Making It Publicly Accessible

### Option 1: Local Network Access

The server binds to `0.0.0.0` by default, making it accessible to devices on your local network.

Find your IP address:
```bash
# macOS/Linux
ifconfig | grep inet

# Windows
ipconfig
```

Then access from other devices: `http://[your-ip]:5173`

### Option 2: Port Forwarding

If you want to access from outside your network:
1. Forward port 5173 in your router settings
2. Access using your public IP: `http://[public-ip]:5173`

### Option 3: Deploy to Cloud

Deploy to services like:
- Render.com (Free tier available)
- Railway.app (Free tier available)
- DigitalOcean
- AWS/Azure/GCP

See `DEPLOYMENT.md` for cloud deployment instructions.

## 🔧 Troubleshooting

### Database Connection Error

**Error:** `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**Solution:** Your DATABASE_URL is missing a password or has incorrect encoding.
- Ensure password is URL-encoded
- Example: `postgresql://user:Siet%40123@localhost:5432/mockmate_dev`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
PORT=5174 npm run dev
```

### Database Not Found

**Error:** `database "mockmate_dev" does not exist`

**Solution:**
```bash
psql postgres -c "CREATE DATABASE mockmate_dev;"
```

### Permission Denied

**Error:** `FATAL: role "your_username" does not exist`

**Solution:**
```bash
psql postgres -c "CREATE USER your_username WITH PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE mockmate_dev TO your_username;"
```

## 📱 Features

### Text-to-Speech
Questions are automatically read aloud using Google TTS during interviews.

### Speech-to-Text
Voice input is available for answering questions (requires HTTPS or localhost).

### AI Evaluation
Answers are evaluated using Google Gemini AI with detailed feedback.

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Push database schema changes
npm run db:push

# Manual seed (clears existing data)
npx tsx -r dotenv/config server/seed.ts
```

## 📄 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | - | Yes |
| GEMINI_API_KEY | Google Gemini API key | - | Yes |
| SESSION_SECRET | JWT secret key | - | Yes |
| NODE_ENV | Environment (development/production) | development | No |
| PORT | Server port | 5173 | No |
| HOST | Server host | 0.0.0.0 | No |

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs in terminal
3. Ensure all prerequisites are installed
4. Verify database connection

## 🎯 Next Steps

After setup:
1. Login as admin (`admin` / `admin123`)
2. Explore the admin dashboard
3. View questions and tests
4. Login as a student to take a test
5. Experience the AI-powered interview flow

Enjoy using FreelanceFlow Interview Engine! 🚀

