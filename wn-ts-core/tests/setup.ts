import { beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { config } from '../src/config';
import { db } from '../src/db/database';
import { fileURLToPath } from 'url';

let testDataDir: string;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const actualTestDataDir = join(__dirname, '../../wn-test-data/data');

beforeEach(() => {
  // Create a new temp directory for each test
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  config.dataDirectory = testDataDir;
  // downloadDirectory and cacheDirectory are now derived from dataDirectory
});

afterEach(async () => {
  // Ensure database is properly closed before cleanup
  try {
    await db.close();
  } catch (error) {
    // Ignore errors if database is already closed
  }
  
  // Add a small delay to allow file handles to be released
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Clean up test directory after each test
  if (testDataDir && existsSync(testDataDir)) {
    try {
      rmSync(testDataDir, { recursive: true, force: true });
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
