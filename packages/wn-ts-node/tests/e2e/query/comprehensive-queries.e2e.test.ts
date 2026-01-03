import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { logger } from 'wn-ts-core/utils';
import type { Wordnet } from '../../../src/wordnet.js';

describe('Comprehensive Query Operations', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('comprehensive-queries', [
      'cili:1.0',
      'oewn:2024', 
      'omw-fr:1.4'
    ]);
    wordnetClient = context.wordnetClient;
    cleanup = context.cleanup;
  }, 900000); // 15 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('Core Query Service Methods', () => {
    it('should support all basic query methods', async () => {
      logger.info('🔍 Testing core query methods...');
      
      // Test words query
      const words = await wordnetClient.words({ form: 'computer' });
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      
      // Test synsets query
      const synsets = await wordnetClient.synsets({ form: 'computer' });
      expect(Array.isArray(synsets)).toBe(true);
      expect(synsets.length).toBeGreaterThan(0);
      
      // Test senses query
      const senses = await wordnetClient.senses({ wordIdOrForm: 'computer' });
      expect(Array.isArray(senses)).toBe(true);
      expect(senses.length).toBeGreaterThan(0);
      
      // Test lexicons query
      const lexicons = await wordnetClient.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      expect(lexicons.length).toBeGreaterThan(0);
      
      // Test ILIs query
      const ilis = await wordnetClient.ilis();
      expect(Array.isArray(ilis)).toBe(true);
      expect(ilis.length).toBeGreaterThan(0);
      
      logger.success('All core query methods working correctly');
    });

    it('should support advanced filtering options', async () => {
      logger.info('🔍 Testing advanced filtering options...');
      
      // Test fuzzy search
      const fuzzyWords = await wordnetClient.words({ 
        form: 'comput', 
        fuzzy: true, 
        maxResults: 10 
      });
      expect(Array.isArray(fuzzyWords)).toBe(true);
      expect(fuzzyWords.some((w: any) => w.lemma.includes('computer'))).toBe(true);
      
      // Test part of speech filtering
      const nounWords = await wordnetClient.words({ 
        form: 'run', 
        pos: 'n', 
        maxResults: 5 
      });
      expect(Array.isArray(nounWords)).toBe(true);
      expect(nounWords.every((w: any) => w.pos === 'n')).toBe(true);
      
      // Test lexicon filtering
      const oewnWords = await wordnetClient.words({ 
        lexicon: 'oewn', 
        maxResults: 5 
      });
      expect(Array.isArray(oewnWords)).toBe(true);
      expect(oewnWords.every((w: any) => w.lexicon === 'oewn')).toBe(true);
      
      // Test language filtering
      const enWords = await wordnetClient.words({ 
        language: 'en', 
        maxResults: 5 
      });
      expect(Array.isArray(enWords)).toBe(true);
      expect(enWords.every((w: any) => w.language === 'en')).toBe(true);
      
      logger.success('Advanced filtering options working correctly');
    });

    it('should support ILI-based queries', async () => {
      logger.info('🔗 Testing ILI-based queries...');
      
      // Get a sample ILI
      const allILIs = await wordnetClient.ilis();
      if (allILIs.length > 0) {
        const sampleIli = allILIs[0]!.id;
        
        // Test getWordsByIliAndLanguage
        const words = await wordnetClient.getWordsByIliAndLanguage(sampleIli);
        expect(Array.isArray(words)).toBe(true);
        
        // Test with language filter
        const enWords = await wordnetClient.getWordsByIliAndLanguage(sampleIli, 'en');
        expect(Array.isArray(enWords)).toBe(true);
        expect(enWords.every((w: any) => w.language === 'en')).toBe(true);
        
        logger.success(`ILI queries working for ILI ${sampleIli}`);
      }
    });
  });

  describe('Query Service Direct Access', () => {
    it('should support direct query service methods', async () => {
      logger.info('🔧 Testing direct query service methods...');
      
      const queryService = await wordnetClient.getQueryService();
      
      // Test getWordsByIds
      const words = await wordnetClient.words({ maxResults: 3 });
      if (words.length > 0) {
        const wordIds = words.map((w: any) => w.id);
        const foundWords = await queryService.getWordsByIds(wordIds);
        expect(Array.isArray(foundWords)).toBe(true);
        expect(foundWords.length).toBe(wordIds.length);
      }
      
      // Test getSynsetsByLexicon
      const oewnSynsets = await queryService.getSynsets({ lexicon: 'oewn', maxResults: 5 });
      expect(Array.isArray(oewnSynsets)).toBe(true);
      expect(oewnSynsets.every((s: any) => s.lexicon === 'oewn')).toBe(true);
      
      // Test getSensesByWordId
      const testWords = await wordnetClient.words({ form: 'computer', maxResults: 1 });
      if (testWords.length > 0) {
        const senses = await queryService.getSensesByWordId(testWords[0]!.id);
        expect(Array.isArray(senses)).toBe(true);
        expect(senses.every((s: any) => s.word_id === testWords[0]!.id)).toBe(true);
      }
      
      logger.success('Direct query service methods working correctly');
    });

    it('should support relation queries', async () => {
      logger.info('🔗 Testing relation queries...');
      
      const queryService = await wordnetClient.getQueryService();
      
      // Find a synset with relations
      const synsets = await wordnetClient.synsets({ form: 'house', maxResults: 1 });
      if (synsets.length > 0) {
        const synset = synsets[0];
        if (synset) {
          const relations = await queryService.getRelationsBySynsetId(synset.id);
          expect(Array.isArray(relations)).toBe(true);
          expect(relations.every((r: any) => r.source_id === synset.id)).toBe(true);
          
          logger.success(`Found ${relations.length} relations for synset ${synset.id}`);
        }
      }
    });

    it('should support form queries', async () => {
      logger.info('🔄 Testing form queries...');
      
      const queryService = await wordnetClient.getQueryService();
      
      // Find a word with forms
      const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
      if (words.length > 0) {
        const word = words[0];
        if (word) {
          const forms = await queryService.getFormsByWordId(word.id);
          expect(Array.isArray(forms)).toBe(true);
          expect(forms.every((f: any) => f.word_id === word.id)).toBe(true);
          
          logger.success(`Found ${forms.length} forms for word ${word.lemma}`);
        }
      }
    });
  });

  describe('Data Retrieval by ID', () => {
    it('should support individual entity retrieval by ID', async () => {
      logger.info('🆔 Testing individual entity retrieval by ID...');
      
      const queryService = await wordnetClient.getQueryService();
      
      // Test word retrieval
      const words = await wordnetClient.words({ maxResults: 1 });
      if (words.length > 0) {
        const word = await queryService.getWordById(words[0]!.id);
        expect(word).toBeDefined();
        expect(word?.id).toBe(words[0]!.id);
      }
      
      // Test synset retrieval
      const synsets = await wordnetClient.synsets({ maxResults: 1 });
      if (synsets.length > 0) {
        const synset = await queryService.getSynsetById(synsets[0]!.id);
        expect(synset).toBeDefined();
        expect(synset?.id).toBe(synsets[0]!.id);
      }
      
      // Test sense retrieval
      const senses = await wordnetClient.senses({ wordIdOrForm: 'computer' });
      if (senses.length > 0) {
        const sense = await queryService.getSenseById(senses[0]!.id);
        expect(sense).toBeDefined();
        expect(sense?.id).toBe(senses[0]!.id);
      }
      
      // Test ILI retrieval
      const ilis = await wordnetClient.ilis();
      if (ilis.length > 0) {
        const ili = await queryService.getIliById(ilis[0]!.id);
        expect(ili).toBeDefined();
        expect(ili?.id).toBe(ilis[0]!.id);
      }
      
      // Test lexicon retrieval
      const lexicons = await wordnetClient.lexicons();
      if (lexicons.length > 0) {
        const lexicon = await queryService.getLexiconById(lexicons[0]!.id);
        expect(lexicon).toBeDefined();
        expect(lexicon?.id).toBe(lexicons[0]!.id);
      }
      
      logger.success('Individual entity retrieval by ID working correctly');
    });
  });

  describe('Statistics and Metadata', () => {
    it('should support database statistics retrieval', async () => {
      logger.info('📊 Testing database statistics retrieval...');
      
      const stats = await wordnetClient.getStatistics();
      
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('totalSynsets');
      expect(stats).toHaveProperty('totalSenses');
      expect(stats).toHaveProperty('totalILIs');
      expect(stats).toHaveProperty('totalLexicons');
      
      expect(typeof stats.totalWords).toBe('number');
      expect(typeof stats.totalSynsets).toBe('number');
      expect(typeof stats.totalSenses).toBe('number');
      expect(typeof stats.totalILIs).toBe('number');
      expect(typeof stats.totalLexicons).toBe('number');
      
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.totalSynsets).toBeGreaterThan(0);
      
      logger.success(`Database contains ${stats.totalWords} words, ${stats.totalSynsets} synsets, ${stats.totalSenses} senses`);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      logger.info('⚠️ Testing empty query handling...');
      
      const queryService = await wordnetClient.getQueryService();
      
      // Test with empty word IDs array
      const emptyWords = await queryService.getWordsByIds([]);
      expect(Array.isArray(emptyWords)).toBe(true);
      expect(emptyWords.length).toBe(0);
      
      // Test with non-existent IDs
      const nonExistentWord = await queryService.getWordById('non-existent-id');
      expect(nonExistentWord).toBeUndefined();
      
      const nonExistentSynset = await queryService.getSynsetById('non-existent-id');
      expect(nonExistentSynset).toBeUndefined();
      
      logger.success('Empty queries and non-existent IDs handled gracefully');
    });

    it('should handle malformed queries gracefully', async () => {
      logger.info('⚠️ Testing malformed query handling...');
      
      // Test with invalid parameters
      const invalidWords = await wordnetClient.words({ form: undefined });
      expect(Array.isArray(invalidWords)).toBe(true);
      
      const invalidSynsets = await wordnetClient.synsets({ pos: 'invalid-pos' as any });
      expect(Array.isArray(invalidSynsets)).toBe(true);
      
      logger.success('Malformed queries handled gracefully');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch operations efficiently', async () => {
      logger.info('⚡ Testing batch operations...');
      
      const startTime = Date.now();
      
      // Perform multiple queries in parallel
      const queries = [
        wordnetClient.words({ form: 'computer' }),
        wordnetClient.synsets({ form: 'house' }),
        wordnetClient.senses({ wordIdOrForm: 'water' }),
        wordnetClient.lexicons(),
        wordnetClient.ilis('standard')
      ];
      
      const results = await Promise.all(queries);
      const endTime = Date.now();
      
      expect(results.length).toBe(5);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      logger.success(`Batch operations completed in ${endTime - startTime}ms`);
    });

    it('should handle large result sets efficiently', async () => {
      logger.info('📊 Testing large result set handling...');
      
      const startTime = Date.now();
      
      // Query for a very common word that should return many results
      const results = await wordnetClient.words({ form: 'a' });
      
      const endTime = Date.now();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      logger.success(`Large result set (${results.length} items) processed in ${endTime - startTime}ms`);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across queries', async () => {
      logger.info('🔄 Testing data consistency...');
      
      const firstQuery = await wordnetClient.words({ form: 'information' });
      const secondQuery = await wordnetClient.words({ form: 'information' });
      
      expect(firstQuery).toEqual(secondQuery);
      expect(firstQuery.length).toBeGreaterThan(0);
      
      logger.success('Data consistency verified across multiple queries');
    });

    it('should have consistent data types', async () => {
      logger.info('🔍 Testing data type consistency...');
      
      const results = await wordnetClient.words({ form: 'test' });
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const word = results[0];
        if (word) {
          expect(typeof word.id).toBe('string');
          expect(typeof word.lemma).toBe('string');
          expect(typeof word.pos).toBe('string');
          expect(typeof word.language).toBe('string');
          expect(typeof word.lexicon).toBe('string');
        }
      }
      
      logger.success('Data type consistency verified');
    });
  });
});
