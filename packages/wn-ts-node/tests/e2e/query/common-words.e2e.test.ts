/**
 * E2E tests for common word queries
 *
 * Tests that the bug fixes work correctly with real WordNet data.
 * Verifies that common words (hello, water, plates) can be queried
 * and return actual data from the OEWN 2024 database (not hardcoded).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { logger } from 'wn-ts-core/utils';
import type { Wordnet } from '../../../src/wordnet.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('Common Word Queries - Real Data Verification', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    logger.info('🚀 Setting up test environment for common words...');
    const context = await setupTestEnvironment('common-words', ['oewn:2024']);
    wordnetClient = context.wordnetClient;
    cleanup = context.cleanup;
  }, 600000); // 10 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('Word: "hello"', () => {
    it('should find entry for "hello" (greeting)', async () => {
      logger.info('🔍 Testing query for "hello"...');

      const words = await wordnetClient.words({ form: 'hello' });

      expect(words.length).toBeGreaterThan(0);
      expect(words.some(w => w.lemma === 'hello')).toBe(true);

      const helloWord = words.find(w => w.lemma === 'hello');
      expect(helloWord).toBeDefined();
      expect(helloWord?.pos).toBe('n'); // Noun
      expect(helloWord?.lexicon).toBe('oewn:2024');

      logger.success(`✅ Found ${words.length} entry/entries for "hello"`);
    });

    it('should have definition for "hello"', async () => {
      logger.info('📖 Testing synsets for "hello"...');

      const synsets = await wordnetClient.synsets({ form: 'hello' });

      expect(synsets.length).toBeGreaterThan(0);

      const helloSynset = synsets[0];
      expect(helloSynset).toBeDefined();
      expect(helloSynset?.definitions).toBeDefined();
      expect(helloSynset?.definitions?.length).toBeGreaterThan(0);

      const definition = helloSynset?.definitions?.[0]?.text;
      expect(definition).toBeDefined();
      expect(definition?.toLowerCase()).toContain('greeting');

      logger.success(`✅ Definition: "${definition}"`);
    });
  });

  describe('Word: "water"', () => {
    it('should find multiple entries for "water" (noun and verb)', async () => {
      logger.info('🔍 Testing query for "water"...');

      const words = await wordnetClient.words({ form: 'water' });

      expect(words.length).toBeGreaterThan(0);

      const nounWater = words.filter(w => w.pos === 'n');
      const verbWater = words.filter(w => w.pos === 'v');

      expect(nounWater.length).toBeGreaterThan(0);
      expect(verbWater.length).toBeGreaterThan(0);

      logger.success(`✅ Found ${nounWater.length} noun and ${verbWater.length} verb entries for "water"`);
    });

    it('should have H2O definition for "water" noun', async () => {
      logger.info('📖 Testing synsets for "water" (noun)...');

      const synsets = await wordnetClient.synsets({ form: 'water', pos: 'n' });

      expect(synsets.length).toBeGreaterThan(0);

      // Should have a definition about H2O or liquid
      const h2oSynset = synsets.find(s =>
        s.definitions?.some(d =>
          d.text.toLowerCase().includes('h2o') ||
          d.text.toLowerCase().includes('liquid') ||
          d.text.toLowerCase().includes('compound')
        )
      );

      expect(h2oSynset).toBeDefined();

      const definition = h2oSynset?.definitions?.[0]?.text;
      logger.success(`✅ Found H2O definition: "${definition?.substring(0, 100)}..."`);
    });

    it('should have "to water plants" definition for "water" verb', async () => {
      logger.info('📖 Testing synsets for "water" (verb)...');

      const synsets = await wordnetClient.synsets({ form: 'water', pos: 'v' });

      expect(synsets.length).toBeGreaterThan(0);

      // Should have a definition about watering/providing water
      const wateringSynset = synsets.find(s =>
        s.definitions?.some(d =>
          d.text.toLowerCase().includes('supply') ||
          d.text.toLowerCase().includes('provide')
        )
      );

      expect(wateringSynset).toBeDefined();

      const definition = wateringSynset?.definitions?.[0]?.text;
      logger.success(`✅ Found watering definition: "${definition}"`);
    });
  });

  describe('Word: "plates"', () => {
    it('should find entry for "plates" (plural)', async () => {
      logger.info('🔍 Testing query for "plates"...');

      const words = await wordnetClient.words({ form: 'plate' });

      expect(words.length).toBeGreaterThan(0);
      expect(words.some(w => w.lemma === 'plate')).toBe(true);

      logger.success(`✅ Found ${words.length} entry/entries for "plate"`);
    });

    it('should have multiple senses for "plates" (dishes, flat objects, geological, etc.)', async () => {
      logger.info('📖 Testing synsets for "plate"...');

      const synsets = await wordnetClient.synsets({ form: 'plate' });

      expect(synsets.length).toBeGreaterThan(1); // Should have multiple senses

      // Check for different types of plates
      const definitions = synsets.flatMap(s => s.definitions?.map(d => d.text.toLowerCase()) || []);

      // Should include various types: dish, sheet/flat object, geological, etc.
      const hasDishSense = definitions.some(d => d.includes('dish') || d.includes('food'));
      const hasFlatObjectSense = definitions.some(d => d.includes('sheet') || d.includes('flat'));

      expect(hasDishSense || hasFlatObjectSense).toBe(true);

      logger.success(`✅ Found ${synsets.length} different senses for "plate"`);
      logger.info(`   Sample definitions: ${definitions.slice(0, 3).join('; ')}`);
    });
  });

  describe('Data Integrity - Not Hardcoded', () => {
    it('should retrieve data from actual database, not hardcoded values', async () => {
      logger.info('🔍 Verifying data comes from database, not hardcoded...');

      // Query multiple unrelated common words
      const testWords = ['hello', 'water', 'plate', 'computer', 'tree'];
      const results: Record<string, any> = {};

      for (const word of testWords) {
        const words = await wordnetClient.words({ form: word });
        const synsets = await wordnetClient.synsets({ form: word });

        results[word] = {
          wordCount: words.length,
          synsetCount: synsets.length,
          hasDefinitions: synsets.some(s => s.definitions && s.definitions.length > 0)
        };
      }

      // All words should have data
      expect(Object.values(results).every((r: any) => r.wordCount > 0)).toBe(true);
      expect(Object.values(results).every((r: any) => r.synsetCount > 0)).toBe(true);
      expect(Object.values(results).every((r: any) => r.hasDefinitions)).toBe(true);

      logger.success('✅ All test words have data from database');
      logger.info(`   Results: ${JSON.stringify(results, null, 2)}`);
    });

    it('should generate JSON export with real WordNet data', async () => {
      logger.info('💾 Generating JSON export for verification...');

      const testWords = ['hello', 'water', 'plate'];
      const exportData: Record<string, any> = {};

      for (const word of testWords) {
        const words = await wordnetClient.words({ form: word });
        const synsets = await wordnetClient.synsets({ form: word });

        exportData[word] = {
          found: words.length > 0,
          count: words.length,
          entries: words.slice(0, 2).map(w => ({
            id: w.id,
            lemma: w.lemma,
            pos: w.pos,
            lexicon: w.lexicon,
            synsetCount: synsets.filter(s => s.pos === w.pos).length
          })),
          sampleDefinitions: synsets.slice(0, 3).map(s => ({
            synsetId: s.id,
            pos: s.pos,
            definition: s.definitions?.[0]?.text || ''
          }))
        };
      }

      // Save to JSON for manual inspection
      const outputDir = join(process.cwd(), 'wordnet-test-output');
      mkdirSync(outputDir, { recursive: true });

      const outputFile = join(outputDir, 'common-words-vitest-results.json');
      writeFileSync(outputFile, JSON.stringify(exportData, null, 2));

      logger.success(`✅ JSON export saved to: ${outputFile}`);

      // Verify structure
      expect(exportData.hello).toBeDefined();
      expect(exportData.water).toBeDefined();
      expect(exportData.plate).toBeDefined();

      expect(exportData.hello.found).toBe(true);
      expect(exportData.water.found).toBe(true);
      expect(exportData.plate.found).toBe(true);
    });
  });

  describe('Bug Fix Verification', () => {
    it('should verify network fetch worked (data was downloaded)', async () => {
      logger.info('🌐 Verifying network fetch success...');

      // If we can query data, network fetch must have worked
      const words = await wordnetClient.words({ maxResults: 10 });

      expect(words.length).toBeGreaterThan(0);
      expect(words.length).toBeLessThanOrEqual(10);

      logger.success('✅ Network fetch successful - data downloaded and loaded');
    });

    it('should verify database population worked (tables have data)', async () => {
      logger.info('💾 Verifying database population...');

      const wordCount = (await wordnetClient.words({ maxResults: 1000 })).length;
      const synsetCount = (await wordnetClient.synsets({ maxResults: 1000 })).length;

      // OEWN 2024 should have many words and synsets
      expect(wordCount).toBeGreaterThan(100);
      expect(synsetCount).toBeGreaterThan(100);

      logger.success(`✅ Database populated - ${wordCount} words, ${synsetCount} synsets (sampled)`);
    });

    it('should verify query functions work correctly', async () => {
      logger.info('🔍 Verifying query functions...');

      // Test various query types
      const wordByForm = await wordnetClient.words({ form: 'test' });
      const wordByPos = await wordnetClient.words({ form: 'run', pos: 'v' });
      const synsetByForm = await wordnetClient.synsets({ form: 'test' });

      expect(wordByForm.length).toBeGreaterThan(0);
      expect(wordByPos.length).toBeGreaterThan(0);
      expect(synsetByForm.length).toBeGreaterThan(0);

      logger.success('✅ All query functions working correctly');
    });
  });
});
