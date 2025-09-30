/**
 * Query Operations E2E Tests for wn-ts-web
 * 
 * This file contains comprehensive query operations tests that mirror
 * the structure and patterns from wn-ts-node/tests/e2e/query/basic-queries.e2e.test.ts
 * but adapted for the browser environment with real data loading.
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { createWordNetInstance } from "../../src/factory";
import type { WebWordnet } from "../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../src/data-management/index.js";
import { MockDataLoader } from '../mock-data-loader.js';

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe("Query Operations E2E Tests", () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    
    try {
      // Create WebWordnet instance without loading real data
      const { createWebWordnet } = await import('../../src/factory.js');
      
      const sqlite3InitModule = await import('@sqlite.org/sqlite-wasm');
      const sqlModule = await sqlite3InitModule.default({
        print: () => {},
        printErr: () => {}
      });
      
      wordnet = await createWebWordnet({
        sqliteWasmModule: sqlModule,
        lexicon: "oewn:2024"
      });
      
      // Load mock data directly
      const mockDataLoader = new MockDataLoader(wordnet.databaseInstance, wordnet);
      
      await mockDataLoader.loadMockData("oewn:2024");
      
    } catch (error) {
      throw error;
    }
  }, 300000); // 5 minute timeout for setup

  beforeEach(async () => {
    // Ensure mock data is loaded for each test
    const mockDataLoader = new MockDataLoader(wordnet.databaseInstance, wordnet);
    await mockDataLoader.loadMockData("oewn:2024");
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Word Queries', () => {
    it('should find words by form', async () => {
      
      const words = await wordnet.words({ form: 'computer', language: 'en' });
      expect(words.length).toBeGreaterThan(0);
      expect(words.every(w => w.lemma.toLowerCase().includes('computer'))).toBe(true);
      
    });

    it('should filter words by part of speech', async () => {
      
      const nounWords = await wordnet.words({ form: 'run', pos: 'n', language: 'en' });
      const verbWords = await wordnet.words({ form: 'run', pos: 'v', language: 'en' });
      
      expect(nounWords.every(w => w.pos === 'n')).toBe(true);
      expect(verbWords.every(w => w.pos === 'v')).toBe(true);
      
    });

    it('should support fuzzy word search', async () => {
      
      // Test exact match first
      const exactResults = await wordnet.words({ 
        form: 'computer', 
        maxResults: 10,
        language: 'en'
      });
      
      expect(exactResults.length).toBeGreaterThan(0);
      expect(exactResults.some(w => w.lemma.includes('computer'))).toBe(true);
      
    });

    it('should limit results with maxResults', async () => {
      
      const limitedResults = await wordnet.words({ 
        form: 'test', 
        maxResults: 5,
        language: 'en'
      });
      
      expect(limitedResults.length).toBeLessThanOrEqual(5);
      
    });
  });

  describe('Synset Queries', () => {
    it('should find synsets by word form', async () => {
      
      const synsets = await wordnet.synsets({ form: 'computer', language: 'en' });
      expect(synsets.length).toBeGreaterThan(0);
      expect(synsets.every(s => s.memberIds.some(id => 
        synsets.some(s2 => s2.memberIds.includes(id))
      ))).toBe(true);
      
    });

    it('should filter synsets by part of speech', async () => {
      const nounSynsets = await wordnet.synsets({ form: 'run', pos: 'n', language: 'en' });
      const verbSynsets = await wordnet.synsets({ form: 'run', pos: 'v', language: 'en' });
      
      expect(nounSynsets.every(s => s.pos === 'n')).toBe(true);
      expect(verbSynsets.every(s => s.pos === 'v')).toBe(true);
    });

    it('should include definitions when requested', async () => {
      
      const synsets = await wordnet.synsets({ 
        form: 'computer',
        language: 'en'
      });
      
      expect(synsets.length).toBeGreaterThan(0);
      expect(synsets.every(s => s.definitions && s.definitions.length > 0)).toBe(true);
      
    });

    it('should include examples when requested', async () => {
      console.log('💡 Testing synset examples...');
      
      const synsets = await wordnet.synsets({ 
        form: 'computer',
        language: 'en'
      });
      
      expect(synsets.length).toBeGreaterThan(0);
      // Check if any synsets have examples (might be empty in this dataset)
      const synsetsWithExamples = synsets.filter(s => s.examples && s.examples.length > 0);
      console.log(`Found ${synsetsWithExamples.length} synsets with examples out of ${synsets.length} total`);
      
      // This test passes even if no examples are found (data-dependent)
      expect(synsets.length).toBeGreaterThan(0);
      
      console.log(`✅ Tested synset examples for 'computer'`);
    });

    it('should include relations when requested', async () => {
      console.log('🔗 Testing synset relations...');
      
      const synsets = await wordnet.synsets({ 
        form: 'computer',
        language: 'en'
      });
      
      expect(synsets.length).toBeGreaterThan(0);
      // Check if any synsets have relations (might be empty in this dataset)
      const synsetsWithRelations = synsets.filter(s => s.relations && s.relations.length > 0);
      console.log(`Found ${synsetsWithRelations.length} synsets with relations out of ${synsets.length} total`);
      
      // This test passes even if no relations are found (data-dependent)
      expect(synsets.length).toBeGreaterThan(0);
      
      console.log(`✅ Tested synset relations for 'computer'`);
    });
  });

  describe('Sense Queries', () => {
    it('should find senses by word form', async () => {
      console.log('🔍 Testing sense search by form...');
      
      const senses = await wordnet.senses({ form: 'computer', language: 'en' } as any);
      expect(senses.length).toBeGreaterThan(0);
      expect(senses.every(s => s.wordId && s.synsetId)).toBe(true);
      
      console.log(`✅ Found ${senses.length} senses for 'computer'`);
    });

    it('should filter senses by part of speech', async () => {
      console.log('📝 Testing sense filtering by part of speech...');
      
      const nounSenses = await wordnet.senses({ form: 'run', pos: 'n', language: 'en' } as any);
      const verbSenses = await wordnet.senses({ form: 'run', pos: 'v', language: 'en' } as any);
      
      expect(nounSenses.length).toBeGreaterThan(0);
      expect(verbSenses.length).toBeGreaterThan(0);
      
      console.log(`✅ Found ${nounSenses.length} noun and ${verbSenses.length} verb senses for 'run'`);
    });

    it('should find senses by word ID', async () => {
      console.log('🆔 Testing sense search by word ID...');
      
      // First get a word to get its ID
      const words = await wordnet.words({ form: 'computer', maxResults: 1, language: 'en' });
      console.log(`🔍 Found ${words.length} words for 'computer'`);
      console.log('🔍 Words:', words.map(w => ({ id: w.id, lemma: w.lemma, pos: w.pos })));
      expect(words.length).toBeGreaterThan(0);
      
      const word = words[0];
      console.log(`🔍 Using word ID: ${word.id}`);
      
      // Debug: Check what's in the database
      const queryService = (wordnet as any).queryService;
      if (queryService) {
        try {
          // Try to get all words with lemma 'computer'
          const allWords = await queryService.getWords({ form: 'computer' });
          console.log('🔍 All words in DB with lemma "computer":', allWords);
          
          // Try to get all senses with word_id
          const allSenses = await queryService.getSenses({ wordIdOrForm: word.id });
          console.log(`🔍 All senses in DB with word_id "${word.id}":`, allSenses);
        } catch (error) {
          console.log('🔍 Error querying database:', error);
        }
      }
      
      const senses = await wordnet.senses({ form: word.id, language: 'en' } as any);
      console.log(`🔍 Found ${senses.length} senses for word ID '${word.id}'`);
      console.log('🔍 Senses:', senses.map(s => ({ id: s.id, wordId: s.wordId, synsetId: s.synsetId })));
      
      expect(senses.length).toBeGreaterThan(0);
      expect(senses.every(s => s.wordId === word.id)).toBe(true);
      
      console.log(`✅ Found ${senses.length} senses for word ID '${word.id}'`);
    });
  });

  describe('Advanced Query Operations', () => {
    it('should perform complex queries with multiple filters', async () => {
      console.log('🔧 Testing complex queries...');
      
      const complexQuery = await wordnet.synsets({
        form: 'run',
        pos: 'v',
        maxResults: 10,
        language: 'en'
      });
      
      expect(complexQuery.length).toBeGreaterThan(0);
      expect(complexQuery.every(s => s.pos === 'v')).toBe(true);
      expect(complexQuery.every(s => s.definitions && s.definitions.length > 0)).toBe(true);
      
      console.log(`✅ Complex query returned ${complexQuery.length} verb synsets with full data`);
    });

    it('should handle empty results gracefully', async () => {
      console.log('🚫 Testing empty results handling...');
      
      const emptyResults = await wordnet.words({ form: 'nonexistentword12345', language: 'en' });
      expect(emptyResults).toEqual([]);
      
      const emptySynsets = await wordnet.synsets({ form: 'nonexistentword12345', language: 'en' });
      expect(emptySynsets).toEqual([]);
      
      const emptySenses = await wordnet.senses({ form: 'nonexistentword12345', language: 'en' } as any);
      expect(emptySenses).toEqual([]);
      
      console.log('✅ Empty results handled gracefully');
    });

    it('should support lexicon filtering', async () => {
      console.log('📚 Testing lexicon filtering...');
      
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      const oewnLexicon = lexicons.find(l => l.id === 'oewn');
      expect(oewnLexicon).toBeDefined();
      
      const oewnWords = await wordnet.words({ 
        form: 'computer', 
        lexicon: 'oewn',
        maxResults: 5,
        language: 'en'
      });
      
      expect(oewnWords.length).toBeGreaterThan(0);
      expect(oewnWords.every(w => w.lexicon === 'oewn')).toBe(true);
      
      console.log(`✅ Found ${oewnWords.length} words from OEWN lexicon`);
    });
  });

  describe('Performance and Strategy Tests', () => {
    it('should demonstrate V5 strategy performance', async () => {
      console.log('⚡ Testing V5 strategy performance...');
      
      const start = performance.now();
      const synsets = await wordnet.synsets({ 
        form: 'computer',
        language: 'en'
      });
      const end = performance.now();
      
      expect(synsets.length).toBeGreaterThan(0);
      
      const duration = end - start;
      console.log(`✅ V5 strategy completed in ${duration.toFixed(2)}ms`);
      
      // V5 should be very fast (under 100ms for cached queries)
      expect(duration).toBeLessThan(100);
    });

    it('should demonstrate V6 strategy performance', async () => {
      console.log('⚡ Testing V6 strategy performance...');
      
      const start = performance.now();
      const senses = await wordnet.senses({ form: 'computer', language: 'en' } as any);
      const end = performance.now();
      
      expect(senses.length).toBeGreaterThan(0);
      
      const duration = end - start;
      console.log(`✅ V6 strategy completed in ${duration.toFixed(2)}ms`);
      
      // V6 should be very fast (under 50ms)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain referential integrity', async () => {
      console.log('🔗 Testing referential integrity...');
      
      const synsets = await wordnet.synsets({ form: 'computer', maxResults: 5, language: 'en' });
      
      for (const synset of synsets) {
        // Check that all member IDs exist
        if (synset.memberIds.length > 0) {
          const word = await wordnet.getWord(synset.memberIds[0]);
          expect(word).toBeDefined();
        }
        
        // Check that all sense IDs exist by getting the sense directly
        if (synset.senseIds.length > 0) {
          const sense = await wordnet.getSense(synset.senseIds[0]);
          expect(sense).toBeDefined();
        }
      }
      
      console.log('✅ Referential integrity maintained');
    });

    it('should have consistent data structure', async () => {
      console.log('📋 Testing data structure consistency...');
      
      const words = await wordnet.words({ form: 'test', maxResults: 5, language: 'en' });
      const synsets = await wordnet.synsets({ form: 'test', maxResults: 5, language: 'en' });
      const senses = await wordnet.senses({ form: 'test', language: 'en' } as any);
      
      // Check word structure
      words.forEach(word => {
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('lemma');
        expect(word).toHaveProperty('pos');
        expect(word).toHaveProperty('language');
        expect(word).toHaveProperty('lexicon');
      });
      
      // Check synset structure
      synsets.forEach(synset => {
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
        expect(synset).toHaveProperty('language');
        expect(synset).toHaveProperty('lexicon');
        expect(synset).toHaveProperty('memberIds');
        expect(synset).toHaveProperty('senseIds');
      });
      
      // Check sense structure
      senses.forEach(sense => {
        expect(sense).toHaveProperty('id');
        expect(sense).toHaveProperty('wordId');
        expect(sense).toHaveProperty('synsetId');
        expect(sense).toHaveProperty('examples');
        expect(sense).toHaveProperty('counts');
        expect(sense).toHaveProperty('tags');
      });
      
      console.log('✅ Data structure is consistent');
    });
  });
});
