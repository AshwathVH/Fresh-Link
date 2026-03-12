# Database Management - Fresh Link

## Database Protection

Your database is stored at: `backend/prisma/dev.db`

**⚠️ IMPORTANT:** This file contains all your users, products, and orders data. Never delete it!

## Backup & Restore Commands

### Create a Backup
```powershell
cd backend
npm run db:backup
```
This creates a timestamped backup in `backend/backups/` directory.
- Automatically keeps last 10 backups
- Older backups are deleted automatically

### Restore from Backup
```powershell
cd backend
npm run db:restore
```
Follow the interactive prompts to choose which backup to restore.

### View Database (GUI)
```powershell
cd backend
npm run db:studio
```
Opens Prisma Studio in your browser to view/edit data visually.

## Backup Schedule

**Recommended:** Create backups:
- Before making major changes
- Daily (if actively developing)
- Before running database migrations
- Before updating Prisma schema

## Quick Backup Command
```powershell
cd c:\Ashwath\Project\Fresh-Link\backend ; cmd /c "npm run db:backup"
```

## Database Location
- File: `c:\Ashwath\Project\Fresh-Link\backend\prisma\dev.db`
- Backups: `c:\Ashwath\Project\Fresh-Link\backend\backups\`

## Git Ignore
Make sure `.gitignore` includes:
```
*.db
backups/
```

## Emergency Recovery
If database gets corrupted:
1. Stop the server
2. Run: `npm run db:restore`
3. Select most recent backup
4. Restart server

## Manual Backup
Simply copy `backend/prisma/dev.db` to a safe location.
