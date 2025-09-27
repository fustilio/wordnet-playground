import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { logger } from 'wn-ts-core/utils';
import type { Wordnet } from '../../src/wordnet.js';
import type { SynsetQuery, WordQuery } from 'wn-ts-core';

describe('Basic Query Operations', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('basic-queries', ['oewn:2024']);
    wordnetClient = context.wordnetClient;
    cleanup = context.cleanup;
  }, 600000); // 10 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('Word Queries', () => {
    it('should find words by form', async () => {
      logger.info('🔍 Testing word search by form...');
      
      const words = await wordnetClient.words({ form: 'computer' });
      expect(words.length).toBeGreaterThan(0);
      expect(words.every(w => w.lemma.toLowerCase().includes('computer'))).toBe(true);
      
      logger.success(`Found ${words.length} words for 'computer'`);
    });

    it('should filter words by part of speech', async () => {
      logger.info('📝 Testing word filtering by part of speech...');
      
      const nounWords = await wordnetClient.words({ form: 'run', pos: 'n' });
      const verbWords = await wordnetClient.words({ form: 'run', pos: 'v' });
      
      expect(nounWords.every(w => w.pos === 'n')).toBe(true);
      expect(verbWords.every(w => w.pos === 'v')).toBe(true);
      
      logger.success(`Found ${nounWords.length} noun and ${verbWords.length} verb forms of 'run'`);
    });

    it('should support fuzzy word search', async () => {
      logger.info('🔍 Testing fuzzy word search...');
      
      const fuzzyResults = await wordnetClient.words({ 
        form: 'comput', 
        fuzzy: true, 
        maxResults: 10 
      });
      
      expect(fuzzyResults.length).toBeGreaterThan(0);
      expect(fuzzyResults.some(w => w.lemma.includes('computer'))).toBe(true);
      
      logger.success(`Fuzzy search for 'comput' found ${fuzzyResults.length} results`);
    });

    it('should find words by ID', async () => {
      logger.info('🆔 Testing word lookup by ID...');
      
      const allWords = await wordnetClient.words({ maxResults: 1 });
      if (allWords.length > 0) {
        const firstWord = allWords[0];
        if (firstWord) {
          const [word] = await wordnetClient.getWord(firstWord.id);
          expect(word).toBeDefined();
          expect(word?.id).toBe(firstWord.id);
          
          logger.success(`Successfully looked up word by ID: ${word?.lemma}`);
        }
      }
    });
  });

  describe('Synset Queries', () => {
    it('should find synsets by word form', async () => {
      logger.info('🔍 Testing synset search by word form...');
      
      const synsets = await wordnetClient.synsets({ form: 'computer' });
      expect(synsets.length).toBeGreaterThan(0);
      
      logger.success(`Found ${synsets.length} synsets for 'computer'`);
    });

    it('should filter synsets by part of speech', async () => {
      logger.info('📝 Testing synset filtering by part of speech...');
      
      const nounSynsets = await wordnetClient.synsets({ form: 'light', pos: 'n' });
      const adjSynsets = await wordnetClient.synsets({ form: 'light', pos: 'a' });
      
      expect(nounSynsets.every(s => s.pos === 'n')).toBe(true);
      expect(adjSynsets.every(s => s.pos === 'a')).toBe(true);
      
      logger.success(`Found ${nounSynsets.length} noun and ${adjSynsets.length} adjective synsets for 'light'`);
    });

    it('should find synsets by ID', async () => {
      logger.info('🆔 Testing synset lookup by ID...');
      
      const allSynsets = await wordnetClient.synsets({ maxResults: 1 });
      if (allSynsets.length > 0) {
        const firstSynset = allSynsets[0];
        if (firstSynset) {
          const synset = await wordnetClient.getSynset(firstSynset.id);
          expect(synset).toBeDefined();
          expect(synset?.id).toBe(firstSynset.id);
          
          logger.success(`Successfully looked up synset by ID: ${synset?.id}`);
        }
      }
    });

    it('should include definitions in synset data', async () => {
      logger.info('📖 Testing synset definitions...');
      
      const synsets = await wordnetClient.synsets({ form: 'information' });
      expect(synsets.length).toBeGreaterThan(0);
      
      const synset = synsets[0];
      if (synset) {
        expect(synset.definitions).toBeDefined();
        expect(Array.isArray(synset.definitions)).toBe(true);
        
        if (synset.definitions && synset.definitions.length > 0) {
          expect(synset.definitions[0]).toHaveProperty('text');
          expect(synset.definitions[0]).toHaveProperty('language');
          
          logger.success(`Found ${synset.definitions.length} definitions for synset ${synset.id}`);
        }
      }
    });
  });

  describe('Sense Queries', () => {
    it('should find senses by word form', async () => {
      logger.info('🔍 Testing sense search by word form...');
      
      const senses = await wordnetClient.senses({ wordIdOrForm: 'computer' });
      expect(senses.length).toBeGreaterThan(0);
      
      logger.success(`Found ${senses.length} senses for 'computer'`);
    });

    it('should find senses by word ID', async () => {
      logger.info('🔍 Testing sense search by word ID...');
      
      const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
      if (words.length > 0) {
        const word = words[0];
        if (word) {
          const senses = await wordnetClient.senses({ wordIdOrForm: word.id });
          expect(senses.every(s => s.wordId === word.id)).toBe(true);
          
          logger.success(`Found ${senses.length} senses for word ${word.lemma}`);
        }
      }
    });
  });

  describe('Lexicon Queries', () => {
    it('should list available lexicons', async () => {
      logger.info('📚 Testing lexicon listing...');
      
      const lexicons = await wordnetClient.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      const oewnLexicon = lexicons.find(l => l.id === 'oewn');
      expect(oewnLexicon).toBeDefined();
      expect(oewnLexicon?.language).toBe('en');
      
      logger.success(`Found ${lexicons.length} lexicons including OEWN`);
    });

    it('should filter words by lexicon', async () => {
      logger.info('📚 Testing word filtering by lexicon...');
      
      const oewnWords = await wordnetClient.words({ lexicon: 'oewn', maxResults: 10 });
      expect(oewnWords.every(w => w.lexicon === 'oewn')).toBe(true);
      
      logger.success(`Found ${oewnWords.length} OEWN words`);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent words gracefully', async () => {
      logger.info('❌ Testing non-existent word handling...');
      
      const results = await wordnetClient.words({ form: 'thiswordprobablydoesnotexist' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
      
      logger.success('Non-existent word handled correctly');
    });

    it('should handle invalid synset IDs gracefully', async () => {
      logger.info('❌ Testing invalid synset ID handling...');
      
      const synset = await wordnetClient.getSynset('invalid-synset-id');
      expect(synset).toBeUndefined();
      
      logger.success('Invalid synset ID handled correctly');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent queries efficiently', async () => {
      logger.info('⚡ Testing concurrent queries...');
      
      const queries = [
        wordnetClient.words({ form: 'computer' }),
        wordnetClient.synsets({ form: 'house' }),
        wordnetClient.senses({ wordIdOrForm: 'water' }),
        wordnetClient.lexicons(),
      ];

      const results = await Promise.all(queries);
      expect(results.length).toBe(4);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
      
      logger.success('Concurrent queries completed successfully');
    });
  });

  describe('Strategy Accuracy Verification', () => {
    // Helper function to normalize synset data for comparison
    function normalizeSynset(synset: any) {
      return {
        id: synset.id,
        pos: synset.pos,
        language: synset.language,
        lexicon: synset.lexicon,
        ili: synset.ili,
        definitions: synset.definitions?.sort((a: any, b: any) => a.id.localeCompare(b.id)) || [],
        examples: synset.examples?.sort((a: any, b: any) => a.id.localeCompare(b.id)) || [],
        relations: synset.relations?.sort((a: any, b: any) => a.id.localeCompare(b.id)) || [],
        memberIds: synset.memberIds?.sort() || [],
        senseIds: synset.senseIds?.sort() || []
      };
    }

    // Helper function to normalize word data for comparison
    function normalizeWord(word: any) {
      return {
        id: word.id,
        lemma: word.lemma,
        pos: word.pos,
        language: word.language,
        lexicon: word.lexicon,
        forms: word.forms?.sort((a: any, b: any) => a.writtenForm.localeCompare(b.writtenForm)) || [],
        pronunciations: word.pronunciations?.sort((a: any, b: any) => a.value.localeCompare(b.value)) || [],
        tags: word.tags?.sort() || [],
        counts: word.counts?.sort((a: any, b: any) => a.value - b.value) || []
      };
    }

    describe('Synset Search by Form Accuracy', () => {
      const testCases = [
        { form: 'computer', description: 'common noun' },
        { form: 'run', pos: 'v', description: 'verb with POS filter' },
        { form: 'beautiful', pos: 'a', description: 'adjective with POS filter' },
        { form: 'quickly', pos: 'r', description: 'adverb with POS filter' },
        { form: 'information', description: 'noun with multiple definitions' },
        { form: 'test', maxResults: 5, description: 'with maxResults limit' },
        { form: 'comput', fuzzy: true, description: 'fuzzy search' }
      ] satisfies (SynsetQuery & {description: string})[];

      for (const testCase of testCases) {
        it(`should return identical results for: ${testCase.description}`, async () => {
          const queryService = await wordnetClient.getQueryService();
          
          // Get results from all strategies
          const [v1Results, v2Results, v3Results, v4Results, v5Results, v6Results, fastResults] = await Promise.all([
            queryService.getSynsetsV1(testCase),
            queryService.getSynsetsV2(testCase),
            queryService.getSynsetsV3(testCase),
            queryService.getSynsetsV4(testCase),
            queryService.getSynsetsV5(testCase),
            queryService.getSynsetsV6(testCase),
            queryService.getSynsetsFast(testCase)
          ]);

          // Normalize all results for comparison
          const normalizedV1 = v1Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV2 = v2Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV3 = v3Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV4 = v4Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV5 = v5Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV6 = v6Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedFast = fastResults.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));

          // Verify all strategies return the same number of results
          expect(normalizedV1.length).toBe(normalizedV2.length);
          expect(normalizedV1.length).toBe(normalizedV3.length);
          expect(normalizedV1.length).toBe(normalizedV4.length);
          expect(normalizedV1.length).toBe(normalizedV5.length);
          expect(normalizedV1.length).toBe(normalizedV6.length);
          expect(normalizedV1.length).toBe(normalizedFast.length);

          // Verify all strategies return identical data
          expect(normalizedV1).toEqual(normalizedV2);
          expect(normalizedV1).toEqual(normalizedV3);
          expect(normalizedV1).toEqual(normalizedV4);
          expect(normalizedV1).toEqual(normalizedV5);
          expect(normalizedV1).toEqual(normalizedV6);
          expect(normalizedV1).toEqual(normalizedFast);
        });
      }
    });

    describe('Synset with Definitions Accuracy', () => {
      const testCases = [
        { form: 'information', description: 'noun with multiple definitions' },
        { form: 'computer', description: 'common noun' },
        { form: 'run', pos: 'v', description: 'verb with POS filter' },
        { form: 'beautiful', pos: 'a', description: 'adjective with POS filter' }
      ] satisfies (SynsetQuery & {description: string})[];

      for (const testCase of testCases) {
        it(`should return identical results for: ${testCase.description}`, async () => {
          const queryService = await wordnetClient.getQueryService();
          
          // Get results from all strategies
          const [v1Results, v2Results, v3Results, v4Results, v5Results, v6Results, fastResults] = await Promise.all([
            queryService.getSynsetsV1(testCase),
            queryService.getSynsetsV2(testCase),
            queryService.getSynsetsV3(testCase),
            queryService.getSynsetsV4(testCase),
            queryService.getSynsetsV5(testCase),
            queryService.getSynsetsV6(testCase),
            queryService.getSynsetsFast(testCase)
          ]);

          // Normalize all results for comparison
          const normalizedV1 = v1Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV2 = v2Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV3 = v3Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV4 = v4Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV5 = v5Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedV6 = v6Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedFast = fastResults.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));

          // Verify all strategies return the same number of results
          expect(normalizedV1.length).toBe(normalizedV2.length);
          expect(normalizedV1.length).toBe(normalizedV3.length);
          expect(normalizedV1.length).toBe(normalizedV4.length);
          expect(normalizedV1.length).toBe(normalizedV5.length);
          expect(normalizedV1.length).toBe(normalizedV6.length);
          expect(normalizedV1.length).toBe(normalizedFast.length);

          // Verify all strategies return identical data
          expect(normalizedV1).toEqual(normalizedV2);
          expect(normalizedV1).toEqual(normalizedV3);
          expect(normalizedV1).toEqual(normalizedV4);
          expect(normalizedV1).toEqual(normalizedV5);
          expect(normalizedV1).toEqual(normalizedV6);
          expect(normalizedV1).toEqual(normalizedFast);
        });
      }
    });

    describe('Word Search by Form Accuracy', () => {
      const testCases = [
        { form: 'computer', description: 'common noun' },
        { form: 'run', pos: 'v', description: 'verb with POS filter' },
        { form: 'beautiful', pos: 'a', description: 'adjective with POS filter' },
        { form: 'test', maxResults: 10, description: 'with maxResults limit' },
        { form: 'comput', fuzzy: true, description: 'fuzzy search' }
      ] satisfies (WordQuery & {description: string})[];

      for (const testCase of testCases) {
        it(`should return identical results for: ${testCase.description}`, async () => {
          const queryService = await wordnetClient.getQueryService();
          
          // Get results from all strategies
          const [v1Results, fastResults, fuzzyResults] = await Promise.all([
            wordnetClient.words(testCase),
            queryService.getWordsByFormFast(testCase.form, testCase),
            queryService.getWordsByFormFuzzyFast(testCase.form, testCase)
          ]);

          // Normalize all results for comparison
          const normalizedV1 = v1Results.map(normalizeWord).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedFast = fastResults.map(normalizeWord).sort((a, b) => a.id.localeCompare(b.id));
          const normalizedFuzzy = fuzzyResults.map(normalizeWord).sort((a, b) => a.id.localeCompare(b.id));

          // For fuzzy search, we expect different results, so only compare V1 vs Fast
          if (testCase.fuzzy) {
            expect(normalizedV1).toEqual(normalizedFuzzy);
          } else {
            expect(normalizedV1).toEqual(normalizedFast);
          }
        });
      }
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle empty results consistently', async () => {
        const queryService = await wordnetClient.getQueryService();
        const nonExistentForm = 'nonexistentword12345';
        
        const [v1Results, v2Results, v3Results, v4Results, v5Results, v6Results, fastResults] = await Promise.all([
          queryService.getSynsetsV1({ form: nonExistentForm }),
          queryService.getSynsetsV2({ form: nonExistentForm }),
          queryService.getSynsetsV3({ form: nonExistentForm }),
          queryService.getSynsetsV4({ form: nonExistentForm }),
          queryService.getSynsetsV5({ form: nonExistentForm }),
          queryService.getSynsetsV6({ form: nonExistentForm }),
          queryService.getSynsetsFast({ form: nonExistentForm })
        ]);

        // All strategies should return empty arrays
        expect(v1Results).toEqual([]);
        expect(v2Results).toEqual([]);
        expect(v3Results).toEqual([]);
        expect(v4Results).toEqual([]);
        expect(v5Results).toEqual([]);
        expect(v6Results).toEqual([]);
        expect(fastResults).toEqual([]);
      });

      it('should handle maxResults limit consistently', async () => {
        const queryService = await wordnetClient.getQueryService();
        const maxResults = 3;
        
        const [v1Results, v2Results, v3Results, v4Results, v5Results, v6Results, fastResults] = await Promise.all([
          queryService.getSynsetsV1({ form: 'test', maxResults }),
          queryService.getSynsetsV2({ form: 'test', maxResults }),
          queryService.getSynsetsV3({ form: 'test', maxResults }),
          queryService.getSynsetsV4({ form: 'test', maxResults }),
          queryService.getSynsetsV5({ form: 'test', maxResults }),
          queryService.getSynsetsV6({ form: 'test', maxResults }),
          queryService.getSynsetsFast({ form: 'test', maxResults })
        ]);

        // All strategies should return at most maxResults
        expect(v1Results.length).toBeLessThanOrEqual(maxResults);
        expect(v2Results.length).toBeLessThanOrEqual(maxResults);
        expect(v3Results.length).toBeLessThanOrEqual(maxResults);
        expect(v4Results.length).toBeLessThanOrEqual(maxResults);
        expect(v5Results.length).toBeLessThanOrEqual(maxResults);
        expect(v6Results.length).toBeLessThanOrEqual(maxResults);
        expect(fastResults.length).toBeLessThanOrEqual(maxResults);

        // All strategies should return the same results
        const normalizedV1 = v1Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedV2 = v2Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedV3 = v3Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedV4 = v4Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedV5 = v5Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedV6 = v6Results.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));
        const normalizedFast = fastResults.map(normalizeSynset).sort((a, b) => a.id.localeCompare(b.id));

        expect(normalizedV1).toEqual(normalizedV2);
        expect(normalizedV1).toEqual(normalizedV3);
        expect(normalizedV1).toEqual(normalizedV4);
        expect(normalizedV1).toEqual(normalizedV5);
        expect(normalizedV1).toEqual(normalizedV6);
        expect(normalizedV1).toEqual(normalizedFast);
      });
    });

    describe('Data Structure Validation', () => {
      it('should return properly structured synset objects', async () => {
        const queryService = await wordnetClient.getQueryService();
        const results = await queryService.getSynsetsV1({ form: 'computer' });
        
        expect(results.length).toBeGreaterThan(0);
        
        const synset = results[0];

        if (!synset) {
            expect(synset).toBeDefined();
            return;
        }
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
        expect(synset).toHaveProperty('language');
        expect(synset).toHaveProperty('lexicon');
        expect(synset).toHaveProperty('definitions');
        expect(synset).toHaveProperty('examples');
        expect(synset).toHaveProperty('relations');
        expect(synset).toHaveProperty('memberIds');
        expect(synset).toHaveProperty('senseIds');
        
        expect(Array.isArray(synset.definitions)).toBe(true);
        expect(Array.isArray(synset.examples)).toBe(true);
        expect(Array.isArray(synset.relations)).toBe(true);
        expect(Array.isArray(synset.memberIds)).toBe(true);
        expect(Array.isArray(synset.senseIds)).toBe(true);
      })

      it('should return properly structured word objects', async () => {
        const queryService = await wordnetClient.getQueryService();
        const results = await queryService.getWordsByFormFast('computer');
        
        expect(results.length).toBeGreaterThan(0);
        
        const word = results[0];
        if (!word) {
            expect(word).toBeDefined();
            return;
        }
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('lemma');
        expect(word).toHaveProperty('pos');
        expect(word).toHaveProperty('language');
        expect(word).toHaveProperty('lexicon');
        expect(word).toHaveProperty('forms');
        expect(word).toHaveProperty('pronunciations');
        expect(word).toHaveProperty('tags');
        expect(word).toHaveProperty('counts');
        
        expect(Array.isArray(word.forms)).toBe(true);
        expect(Array.isArray(word.pronunciations)).toBe(true);
        expect(Array.isArray(word.tags)).toBe(true);
        expect(Array.isArray(word.counts)).toBe(true);
      });
    });
  });
});
