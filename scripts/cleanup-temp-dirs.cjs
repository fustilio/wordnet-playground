#!/usr/bin/env node

/**
 * Cleanup script for temporary test directories
 * This script removes all wn-ts-* temp directories that may have been left behind
 * due to Windows file system permission issues during test cleanup.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const TEMP_DIR = os.tmpdir();
const PATTERNS = [
  'wn-ts-test-*',
  'wn-ts-node-test-*',
  'wn-ts-thesaurus-e2e-*',
  'wn-ts-translations-e2e-*',
  'wn-ts-translation-utils-e2e-*',
  'wn-ts-advanced-apps-e2e-*',
  'temp-validation-data'
];

function cleanupDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
      return true;
    }
  } catch (error) {
    console.warn(`Failed to clean up ${dirPath}: ${error.message}`);
    return false;
  }
  return true;
}

function findTempDirs() {
  const tempDirs = [];
  
  try {
    const entries = fs.readdirSync(TEMP_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirName = entry.name;
        
        // Check if directory matches any of our patterns
        for (const pattern of PATTERNS) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          if (regex.test(dirName)) {
            tempDirs.push(path.join(TEMP_DIR, dirName));
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading temp directory: ${error.message}`);
  }
  
  return tempDirs;
}

function main() {
  console.log('🧹 Starting cleanup of temporary test directories...');
  console.log(`📁 Scanning: ${TEMP_DIR}`);
  
  const tempDirs = findTempDirs();
  
  if (tempDirs.length === 0) {
    console.log('✅ No temporary test directories found to clean up.');
    return;
  }
  
  console.log(`🔍 Found ${tempDirs.length} temporary directories to clean up:`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const dir of tempDirs) {
    const dirName = path.basename(dir);
    process.stdout.write(`  🗑️  ${dirName}... `);
    
    if (cleanupDirectory(dir)) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      failCount++;
    }
  }
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`  ✅ Successfully cleaned: ${successCount}`);
  console.log(`  ❌ Failed to clean: ${failCount}`);
  console.log(`  📁 Total processed: ${tempDirs.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some directories could not be cleaned up. This is normal on Windows due to file system locks.');
    console.log('   These directories will be cleaned up automatically when the system restarts or when the locks are released.');
  }
  
  console.log('\n🎉 Cleanup completed!');
}

if (require.main === module) {
  main();
}

module.exports = { cleanupDirectory, findTempDirs };
