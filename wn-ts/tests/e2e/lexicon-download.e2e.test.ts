import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import { config, download, add, remove, lexicons } from 'wn-ts';

let testDataDir: string;

describe('SLOW E2E: Download and add real OEWN data', () => {
  beforeAll(() => {
    testDataDir = mkdtempSync(join(tmpdir(), 'wn-e2e-'));
    config.dataDirectory = testDataDir;
  }, 60000);

  afterAll(async () => {
    await new Promise(res => setTimeout(res, 2000)); // 2 seconds
    if (existsSync(testDataDir)) {
      try {
        rmSync(testDataDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore Windows file lock errors
      }
    }
  }, 60000);

  beforeEach(() => {
    config.dataDirectory = testDataDir;
  });

  it('should download, add, verify, and remove OEWN:2024 twice', async () => {
    // First cycle
    const filePath1 = await download('oewn:2024', { force: true });
    expect(existsSync(filePath1)).toBe(true);
    await add(filePath1, { force: true });
    let lexList = await lexicons();
    expect(lexList.some(l => l.id.startsWith('oewn'))).toBe(true);
    await remove('oewn');
    let lexListAfter = await lexicons();
    expect(lexListAfter.some(l => l.id.startsWith('oewn'))).toBe(false);

    // Second cycle (should handle existing data gracefully)
    const filePath2 = await download('oewn:2024', { force: true });
    expect(existsSync(filePath2)).toBe(true);
    await add(filePath2, { force: true });
    lexList = await lexicons();
    expect(lexList.some(l => l.id.startsWith('oewn'))).toBe(true);
    await remove('oewn');
    lexListAfter = await lexicons();
    expect(lexListAfter.some(l => l.id.startsWith('oewn'))).toBe(false);
  }, 300000); // 5 min timeout
});
