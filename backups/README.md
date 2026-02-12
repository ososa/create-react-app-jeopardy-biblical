# Database Backups

This directory contains SQL backups of your Supabase database.

See [BACKUP_GUIDE.md](../BACKUP_GUIDE.md) for instructions.

## Files

- `schema_*.sql` - Database schema only
- `data_*.sql` - Data only  
- `backup_*.sql` - Complete backups (recommended)

## Retention Policy

- Keep last 4 weekly backups in Git
- Archive older backups to Google Drive

