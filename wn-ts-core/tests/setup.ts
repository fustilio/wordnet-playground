import { beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

let testDataDir: string;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const actualTestDataDir = join(__dirname, '../../wn-test-data/data');

beforeEach(() => {
  // Create a new temp directory for each test
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  // Note: We can't set config.dataDirectory anymore since it's abstract
  // Tests that need configuration should use the concrete implementations from wn-ts-node
});

afterEach(async () => {
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
