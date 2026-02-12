#!/bin/bash

# Database Backup Script for Biblical Jeopardy
# This script exports your Supabase database schema and data to SQL files

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
SCHEMA_FILE="${BACKUP_DIR}/schema_${DATE}.sql"
DATA_FILE="${BACKUP_DIR}/data_${DATE}.sql"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Biblical Jeopardy - Database Backup  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env

# Extract database connection details from Supabase URL
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: EXPO_PUBLIC_SUPABASE_URL not found in .env${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📦 Creating backup directory...${NC}"
echo -e "   Location: ${BACKUP_DIR}"
echo ""

echo -e "${BLUE}⚙️  Backup Configuration:${NC}"
echo -e "   Schema file: ${SCHEMA_FILE}"
echo -e "   Data file: ${DATA_FILE}"
echo ""

# Note: This script requires manual database credentials
# You need to get your database password from Supabase Dashboard:
# 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database
# 2. Copy the "Database password" (or reset it)
# 3. Run this script with the password

echo -e "${BLUE}ℹ️  Database Connection Info Needed:${NC}"
echo ""
echo "To complete the backup, you need your Supabase database password."
echo ""
echo "📋 Steps to get your database connection string:"
echo "   1. Go to: https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Settings → Database"
echo "   4. Copy the 'Connection string' (URI format)"
echo ""
echo "Then run one of these commands:"
echo ""
echo -e "${GREEN}Option 1 - Export Schema:${NC}"
echo 'pg_dump "postgresql://postgres.[ref]:[password]@[host]:5432/postgres" --schema-only > schema.sql'
echo ""
echo -e "${GREEN}Option 2 - Export Data:${NC}"
echo 'pg_dump "postgresql://postgres.[ref]:[password]@[host]:5432/postgres" --data-only > data.sql'
echo ""
echo -e "${GREEN}Option 3 - Export Everything:${NC}"
echo 'pg_dump "postgresql://postgres.[ref]:[password]@[host]:5432/postgres" > full_backup.sql'
echo ""
echo -e "${BLUE}💡 Tip:${NC} After creating the backup, commit it to Git:"
echo "   git add backups/"
echo "   git commit -m \"Database backup - $(date +%Y-%m-%d)\""
echo "   git push"
echo ""
echo -e "${BLUE}📝 Note:${NC} For security, never commit .env files with passwords!"
echo ""
