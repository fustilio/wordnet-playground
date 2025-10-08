import { beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { config } from '../../src/config';
import { fileURLToPath } from 'url';

// Robust cleanup function for Windows file system issues
async function cleanupDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) return;
  
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      // Force close any open handles and remove recursively
      rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
      break; // Success, exit the loop
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        // Wait longer between attempts (exponential backoff)
        const delay = 1000 * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.warn(`Cleanup attempt ${attempts} failed, retrying in ${delay}ms:`, error);
      } else {
        console.warn(`Failed to clean up directory after ${maxAttempts} attempts:`, error);
      }
    }
  }
}

let testDataDir: string;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const actualTestDataDir = join(__dirname, '../../../../packages/wn-test-data/data');

beforeEach(() => {
  // Create a new temp directory for each test
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  config.dataDirectory = testDataDir;
  // downloadDirectory and cacheDirectory are now derived from dataDirectory
});

afterEach(async () => {
  // Add a longer delay to allow file handles to be released on Windows
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clean up test directory after each test with robust retry logic
  if (testDataDir && existsSync(testDataDir)) {
    await cleanupDirectory(testDataDir);
  }
});

// Test utilities
export const testUtils = {
  getTestDataDir: () => testDataDir,
  getActualTestDataDir: () => actualTestDataDir,
  createTempDir: () => mkdtempSync(join(tmpdir(), 'wn-ts-temp-')),
}; 
