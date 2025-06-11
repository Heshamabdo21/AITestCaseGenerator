# Database Setup Instructions

## Quick Setup Options

### Option 1: Neon (Recommended - Free)
1. Go to https://neon.tech
2. Sign up for free account
3. Create new project
4. Copy connection string from dashboard
5. Update DATABASE_URL secret in Replit

### Option 2: Supabase (Free)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Update DATABASE_URL secret in Replit

### Option 3: Railway (Free tier)
1. Go to https://railway.app
2. Create new PostgreSQL database
3. Copy connection string from variables
4. Update DATABASE_URL secret in Replit

## Connection String Format
```
postgresql://username:password@hostname:5432/database_name
```

## What happens after DATABASE_URL is provided:
- Database tables will be automatically created
- All API endpoints will start working
- Data persistence will be enabled
- Application will be fully functional