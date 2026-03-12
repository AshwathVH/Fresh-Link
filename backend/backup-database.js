// Database Backup Script
// Run this to create a backup of your database

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupPath = path.join(backupDir, `dev-backup-${timestamp}.db`);

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Copy database file
try {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);
    console.log('✅ Database backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📅 Timestamp: ${new Date().toLocaleString()}`);
    
    // List all backups
    const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
    console.log(`\n📦 Total backups: ${backups.length}`);
    
    // Keep only last 10 backups
    if (backups.length > 10) {
      const sorted = backups
        .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime }))
        .sort((a, b) => b.time - a.time);
      
      const toDelete = sorted.slice(10);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(backupDir, f.name));
        console.log(`🗑️  Deleted old backup: ${f.name}`);
      });
    }
  } else {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}
