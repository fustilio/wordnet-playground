/**
 * Debug test to investigate advanced demo flow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Wordnet } from '../src/wordnet.js';
import { config, add, download } from '../src/index.js';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Advanced Demo Flow Debug', () => {
  let wordnet: Wordnet;

  beforeAll(async () => {
    // Set up test data directory
    const testDataDir = join(tmpdir(), 'debug-advanced-flow-test');
    config.dataDirectory = testDataDir;
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  it('should handle multilingual flow without errors', async () => {
    try {
      console.log('🔧 Creating Wordnet instance...');
      wordnet = new Wordnet('*');
      
      console.log('🔧 Checking lexicons...');
      const lexicons = await wordnet.lexicons();
      console.log('📚 Available lexicons:', lexicons.length);
      
      const hasOEWN = lexicons.some(l => l.id === 'oewn');
      if (!hasOEWN) {
        console.log('⬇️  Downloading OEWN...');
        const oewnPath = await download('oewn:2024', { force: true });
        console.log('✅ OEWN downloaded. Adding to database...');
        await add(oewnPath, { force: true });
        console.log('✅ OEWN added to database.');
      } else {
        console.log('✅ OEWN already present in database.');
      }
      
      console.log('🔧 Checking for CILI...');
      const hasCILI = lexicons.some(l => l.id === 'cili');
      if (!hasCILI) {
        console.log('⬇️  Downloading CILI...');
        const ciliPath = await download('cili:1.0', { force: true });
        console.log('✅ CILI downloaded. Adding to database...');
        await add(ciliPath, { force: true });
        console.log('✅ CILI added to database.');
      } else {
        console.log('✅ CILI already present in database.');
      }
      
      console.log('🔧 Final lexicon check...');
      const finalLexicons = await wordnet.lexicons();
      console.log('📚 Final lexicons:', finalLexicons.length);
      
      expect(finalLexicons.length).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('❌ Advanced demo flow failed:', error);
      throw error;
    }
  });
});

