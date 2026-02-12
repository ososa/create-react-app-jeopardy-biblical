# 📦 Database Backup Guide

## Quick Start

### Weekly Backup (Recommended)

Run this command every Sunday:

```bash
./scripts/backup_database.sh
```

This will show you instructions on how to backup your database.

## How to Backup Your Database

### Step 1: Get Your Database Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Database**
4. **Copy** the **Connection string** (URI format)
5. Click "Use connection pooling" and select **Session mode**

### Step 2: Run the Backup Command

Replace `YOUR_CONNECTION_STRING` with the string you copied:

```bash
# Backup everything (recommended)
pg_dump "YOUR_CONNECTION_STRING" > backups/backup_$(date +%Y%m%d).sql
```

**Example:**
```bash
pg_dump "postgresql://postgres.xyz:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres" > backups/backup_20260212.sql
```

### Step 3: Save to GitHub

```bash
git add backups/
git commit -m "Database backup - $(date +%Y-%m-%d)"
git push
```

## Backup Strategy

### 🔄 Weekly (Every Sunday)
- Run backup command
- Commit to GitHub

### ☁️ Monthly (First Sunday)
- Copy the SQL file to Google Drive
- Keep last 6 months

### 🗑️ Cleanup (Optional)
Keep only last 4 backups in GitHub:
```bash
cd backups/
ls -t backup_*.sql | tail -n +5 | xargs rm
```

## Restore from Backup

### From Supabase Dashboard (Last 7 days)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your Project → Settings → Database
3. Click "Point in time recovery"
4. Select the date/time to restore

### From SQL Backup
```bash
psql "YOUR_CONNECTION_STRING" < backups/backup_20260212.sql
```

## Security Notes

⚠️ **Never commit files with passwords!**
- `.env` is already in `.gitignore`
- SQL backups don't contain passwords
- Connection strings should be kept secret

## Troubleshooting

### "pg_dump: command not found"

Install PostgreSQL tools:

**Mac:**
```bash
brew install postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/)

### Connection Issues

Make sure you:
1. Use **Session mode** (not Transaction mode)
2. Include the password in the connection string
3. Have network access to Supabase

## Need Help?

Check the [Supabase Docs](https://supabase.com/docs/guides/platform/backups)
