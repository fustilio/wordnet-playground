/**
 * Basic tests for KyselyWordnet class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KyselyWordnet } from '../../src/kysely-wordnet.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlinkSync } from 'fs';

describe('KyselyWordnet', () => {
  let tempDbPath: string;
  let wordnet: KyselyWordnet;

  beforeEach(() => {
    // Create a temporary database file
    tempDbPath = join(tmpdir(), `test-kysely-${Date.now()}.db`);
    wordnet = new KyselyWordnet('*', { filename: tempDbPath });
  });

  afterEach(async () => {
    try {
      await wordnet.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
    
    // Clean up temporary database file
    try {
      unlinkSync(tempDbPath);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  it('should be instantiable', () => {
    expect(wordnet).toBeInstanceOf(KyselyWordnet);
  });

  it('should initialize successfully', async () => {
    await expect(wordnet.initialize()).resolves.not.toThrow();
  });

  it('should create database tables after initialization', async () => {
    await wordnet.initialize();
    
    // Check that tables were created by trying to get statistics
    const stats = await wordnet.getStatistics();
    expect(stats).toEqual({
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0,
    });
  });

  it('should handle empty database gracefully', async () => {
    await wordnet.initialize();
    
    // Test various query methods on empty database
    const words = await wordnet.words();
    expect(words).toEqual([]);
    
    const synsets = await wordnet.synsets();
    expect(synsets).toEqual([]);
    
    const lexicons = await wordnet.lexicons();
    expect(lexicons).toEqual([]);
  });
});
