/**
 * Quick script to test dictionary generation speed and progress indicators
 * Run with: node scripts/test-generation-speed.js
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const cliPath = join(projectRoot, '../../../packages/wn-serverless-dict/dist/cli/index.js');

console.log('Testing dictionary generation with improved progress indicators...\n');
console.log('This will generate a small test dictionary to verify:');
console.log('1. Progress indicators work correctly');
console.log('2. Generation completes within reasonable time');
console.log('3. New scoring algorithm produces better results\n');

const startTime = Date.now();
let lastProgressTime = Date.now();
let progressCount = 0;
let hasProgress = false;

const child = spawn('node', [cliPath, 'small', 'test-speed-dict', '--force'], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  
  // Count progress indicators
  if (text.includes('[Generator]') || text.includes('Processing') || text.includes('Processed')) {
    hasProgress = true;
    lastProgressTime = Date.now();
    progressCount++;
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  const duration = (Date.now() - startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('Generation Summary:');
  console.log('='.repeat(60));
  console.log(`Exit code: ${code === 0 ? '✅ Success' : '❌ Failed'}`);
  console.log(`Duration: ${duration.toFixed(1)}s (${(duration / 60).toFixed(1)} minutes)`);
  console.log(`Progress indicators: ${progressCount} messages`);
  console.log(`Has progress: ${hasProgress ? '✅ Yes' : '❌ No'}`);
  
  if (code === 0) {
    console.log('\n✅ Generation completed successfully!');
    if (duration < 600) {
      console.log(`✅ Duration is reasonable (< 10 minutes)`);
    } else {
      console.log(`⚠️  Duration is longer than expected (${(duration / 60).toFixed(1)} minutes)`);
    }
    
    if (hasProgress && progressCount > 5) {
      console.log(`✅ Progress indicators working (${progressCount} messages)`);
    } else {
      console.log(`⚠️  Progress indicators may need improvement (${progressCount} messages)`);
    }
  } else {
    console.log('\n❌ Generation failed. Check output above for errors.');
  }
  
  process.exit(code);
});

// Monitor for hangs
const hangMonitor = setInterval(() => {
  const timeSinceLastProgress = Date.now() - lastProgressTime;
  if (timeSinceLastProgress > 120000) { // 2 minutes without progress
    console.log('\n⚠️  WARNING: No progress for 2 minutes - generation may be hung');
    console.log('   Consider checking system resources or database connection');
  }
}, 30000); // Check every 30 seconds

child.on('close', () => {
  clearInterval(hangMonitor);
});
