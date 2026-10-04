const path = require('path');
const fs = require('fs');

// Simple native .env loader
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const { runIngestionTask, initCronScheduler } = require('../src/lib/scheduler');

console.log('=== NRK News24 Automated Ingestion Service ===');
console.log('Starting automated news collector daemon...');

// Run immediate first cycle
runIngestionTask().then(() => {
  console.log('Initial collection cycle completed. Starting background cron scheduler...');
  initCronScheduler();
}).catch((err) => {
  console.error('Error during initial ingestion cycle:', err);
  initCronScheduler();
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('Shutting down NRK News24 automated ingestion service.');
  process.exit(0);
});
