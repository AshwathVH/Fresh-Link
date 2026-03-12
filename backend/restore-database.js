// Database Restore Script
// Run this to restore from a backup

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const backupDir = path.join(__dirname, 'backups');

// Get all backups
if (!fs.existsSync(backupDir)) {
  console.error('❌ No backups directory found!');
  process.exit(1);
}

const backups = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.db'))
  .map(f => ({
    name: f,
    path: path.join(backupDir, f),
    time: fs.statSync(path.join(backupDir, f)).mtime,
    size: fs.statSync(path.join(backupDir, f)).size
  }))
  .sort((a, b) => b.time - a.time);

if (backups.length === 0) {
  console.error('❌ No backups found!');
  process.exit(1);
}

console.log('📦 Available backups:\n');
backups.forEach((backup, index) => {
  console.log(`${index + 1}. ${backup.name}`);
  console.log(`   📅 Date: ${backup.time.toLocaleString()}`);
  console.log(`   📊 Size: ${(backup.size / 1024).toFixed(2)} KB\n`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter backup number to restore (or "q" to quit): ', (answer) => {
  if (answer.toLowerCase() === 'q') {
    console.log('Restore cancelled.');
    rl.close();
    process.exit(0);
  }

  const index = parseInt(answer) - 1;
  if (isNaN(index) || index < 0 || index >= backups.length) {
    console.error('❌ Invalid backup number!');
    rl.close();
    process.exit(1);
  }

  const selectedBackup = backups[index];
  
  rl.question(`⚠️  This will replace your current database. Continue? (yes/no): `, (confirm) => {
    if (confirm.toLowerCase() === 'yes') {
      try {
        // Backup current database first
        const currentBackupPath = path.join(backupDir, `dev-before-restore-${Date.now()}.db`);
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, currentBackupPath);
          console.log(`✅ Current database backed up to: ${currentBackupPath}`);
        }
        
        // Restore selected backup
        fs.copyFileSync(selectedBackup.path, dbPath);
        console.log('✅ Database restored successfully!');
        console.log(`📁 Restored from: ${selectedBackup.name}`);
      } catch (error) {
        console.error('❌ Restore failed:', error.message);
        process.exit(1);
      }
    } else {
      console.log('Restore cancelled.');
    }
    rl.close();
  });
});
