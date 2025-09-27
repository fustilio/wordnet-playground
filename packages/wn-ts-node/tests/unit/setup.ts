import { beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { config } from '../../src/config';
import { fileURLToPath } from 'url';

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
  
  // Clean up test directory after each test
  if (testDataDir && existsSync(testDataDir)) {
    try {
      // On Windows, try multiple times with increasing delays
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          rmSync(testDataDir, { recursive: true, force: true });
          break; // Success, exit the loop
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            // Wait longer between attempts
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          } else {
            // Final attempt failed, just warn
            console.warn('Failed to clean up test directory after multiple attempts:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  }
});

// Test utilities
export const testUtils = {
  getTestDataDir: () => testDataDir,
  getActualTestDataDir: () => actualTestDataDir,
  createTempDir: () => mkdtempSync(join(tmpdir(), 'wn-ts-temp-')),
}; 
