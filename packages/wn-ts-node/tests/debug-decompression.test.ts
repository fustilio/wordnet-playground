/**
 * Debug test to investigate decompression issues
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { add, download } from '../src/index.js';
import { config } from '../src/config.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

describe('Decompression Debug', () => {
  beforeAll(async () => {
    // Set up test data directory
    const testDataDir = join(tmpdir(), 'debug-decompression-test');
    config.dataDirectory = testDataDir;
  });

  it('should decompress OEWN file correctly', async () => {
    try {
      console.log('🔧 Downloading OEWN...');
      const oewnPath = await download('oewn:2024', { force: true });
      console.log('✅ OEWN downloaded to:', oewnPath);
      
      console.log('🔧 Checking if compressed file exists...');
      expect(existsSync(oewnPath)).toBe(true);
      console.log('✅ Compressed file exists');
      
      console.log('🔧 Adding OEWN to database...');
      const result = await add(oewnPath, { force: true });
      console.log('✅ OEWN added successfully:', result);
      
      expect(result).toBe(true);
    } catch (error) {
      console.error('❌ Decompression failed:', error);
      throw error;
    }
  });
});

