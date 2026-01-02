/**
 * Debug test to investigate advanced demo database initialization
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Wordnet } from '../src/wordnet.js';
import { config } from '../src/config.js';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Advanced Demo Database Debug', () => {
  let wordnet: Wordnet;

  beforeAll(async () => {
    // Set up test data directory
    const testDataDir = join(tmpdir(), 'debug-advanced-db-test');
    config.dataDirectory = testDataDir;
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  it('should initialize database without errors', async () => {
    try {
      console.log('🔧 Creating Wordnet instance...');
      wordnet = new Wordnet('*');
      
      console.log('🔧 Testing database by querying lexicons...');
      // The database will be initialized automatically when we call lexicons()
      const lexicons = await wordnet.lexicons();
      console.log('✅ Database initialized successfully');
      console.log('📚 Available lexicons:', lexicons.length);
      
      expect(lexicons.length).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  });
});
