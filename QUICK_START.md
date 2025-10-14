# 🚀 FreelanceFlow - Quick Start Guide

Get the application running on a new machine in minutes!

## ⚡ Quick Setup (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Run automated setup (creates .env, sets up database)
npm run setup

# 3. Start the application
npm run dev
```

**That's it!** 🎉

The application will:
- ✅ Automatically seed the database with users, questions, and tests
- ✅ Start on port 5173 (both backend and frontend)
- ✅ Be accessible from any device on your network

## 🌐 Access the Application

**From the same machine:**
```
http://localhost:5173
```

**From other devices on your network:**
```
http://[your-ip]:5173
```

To find your IP address:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## 🔐 Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Student Accounts (97 students):**
- Username: Email prefix (e.g., `ramalingamm22ece`)
- Password: `Siet@123`

### Example Student Logins:
- `ramalingamm22ece` / `Siet@123`
- `gowthamg22cys` / `Siet@123`
- `kesavans22cys` / `Siet@123`

## 📊 Pre-loaded Data

The database is automatically seeded with:
- **1 Admin** and **97 Students**
- **Java & Python** topics
- **22 Questions** (11 Java + 11 Python)
- **2 Tests** ready to use

## 🛠️ Prerequisites

Before running, ensure you have:
- ✅ Node.js 18+ (`node -v`)
- ✅ PostgreSQL 14+ (`psql --version`)

### Install PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/

## 🔧 Manual Configuration (If Automated Setup Fails)

If `npm run setup` fails, follow these steps:

### 1. Create Database

```bash
psql postgres
```

```sql
CREATE DATABASE mockmate_dev;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mockmate_dev TO your_username;
\q
```

### 2. Create .env File

Create a `.env` file in the project root:

```ini
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/mockmate_dev
GEMINI_API_KEY=AIzaSyA1yxig9DxbwXFopmdTt4SY9CeOZAcRwjc
SESSION_SECRET=Z5rBIymV4OqmtUZymnnLs1lKBhTPoArCykMortdBayk=
NODE_ENV=development
PORT=5173
HOST=0.0.0.0
```

**Important:** If password contains `@`, encode it as `%40`
- Example: `Siet@123` → `Siet%40123`

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Start Application

```bash
npm run dev
```

The database will be seeded automatically on first run!

## 📱 Features

### 🎤 Text-to-Speech
Questions are read aloud automatically during interviews using Google TTS.

### 🎙️ Speech-to-Text
Use voice input to answer questions (works on localhost or HTTPS).

### 🤖 AI Evaluation
Answers are evaluated by Google Gemini AI with detailed feedback.

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
PORT=5174 npm run dev
```

### Database Connection Error
```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE
```

**Solution:** Check your DATABASE_URL has the correct password and it's URL-encoded.

### Permission Denied
```bash
# Grant permissions
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE mockmate_dev TO your_username;"
```

## 📚 Additional Resources

- **Detailed Setup:** See `SETUP.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Manual Seed:** `npm run seed` (⚠️ Clears existing data)

## 🎯 Next Steps

1. ✅ Login as admin to explore the dashboard
2. ✅ View questions and manage tests
3. ✅ Login as a student to take a test
4. ✅ Experience the AI-powered interview

## 💡 Pro Tips

- The database is automatically seeded only if empty
- Data persists between restarts
- Use `npm run seed` to reset all data
- Access admin panel at `/admin/dashboard`

---

**Need Help?** Check the troubleshooting section in `SETUP.md`

**Ready to deploy?** See `DEPLOYMENT.md` for cloud deployment options

Enjoy using FreelanceFlow! 🚀

