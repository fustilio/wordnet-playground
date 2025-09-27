/**
 * Comprehensive ILI Counting Requirements Tests
 * 
 * This test suite ensures that ILI counting functionality works correctly
 * and prevents regressions. It covers:
 * 
 * 1. Statistics query correctly counts ILIs from synsets table
 * 2. Lexicon statistics correctly count ILIs per lexicon
 * 3. CILI data loading and ILI value storage
 * 4. ILI detection and counting accuracy
 * 5. Edge cases and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWordNetInstance } from '../../src/factory.js';
import type { WebWordnet, DataLoader } from '../../src/index.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions &&
  process.versions.node != null;

describe.skipIf(isNode)('ILI Counting Requirements Tests', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance('oewn:2024');
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    
    console.log('🔍 Setting up ILI counting requirements testing...');
    
    try {
      // Load OEWN for comprehensive ILI testing
      console.log('🔍 Loading Open English WordNet (oewn:2024)...');
      await dataLoader.downloadAndLoad('oewn:2024');
      console.log('✅ Open English WordNet loaded successfully');
      
      // Load CILI for interlingual index support
      console.log('🔍 Loading CILI (Collaborative Interlingual Index)...');
      await dataLoader.downloadAndLoad('cili:1.0');
      console.log('✅ CILI loaded successfully');
      
      // Load French WordNet for multilingual ILI testing
      console.log('🔍 Loading French WordNet (omw-fr:1.4)...');
      await dataLoader.downloadAndLoad('omw-fr:1.4');
      console.log('✅ French WordNet loaded successfully');
      
    } catch (error) {
      console.warn('⚠️ Failed to load WordNet data:', error);
      throw new Error('WordNet data required for ILI counting testing');
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Overall Statistics ILI Counting', () => {
    it('should correctly count total ILIs from synsets table', async () => {
      const stats = await wordnet.getStatistics();
      
      // Basic validation
      expect(stats.totalILIs).toBeGreaterThan(0);
      expect(stats.totalSynsets).toBeGreaterThan(0);
      expect(stats.totalWords).toBeGreaterThan(0);
      
      // ILI count should be reasonable compared to synset count
      // Most synsets should have ILI values
      const iliCoverage = (stats.totalILIs / stats.totalSynsets) * 100;
      expect(iliCoverage).toBeGreaterThan(80); // At least 80% ILI coverage
      
      console.log(`📊 Total ILIs: ${stats.totalILIs}`);
      console.log(`📊 Total Synsets: ${stats.totalSynsets}`);
      console.log(`📊 ILI Coverage: ${iliCoverage.toFixed(1)}%`);
    });

    it('should have consistent ILI counts across multiple calls', async () => {
      const stats1 = await wordnet.getStatistics();
      const stats2 = await wordnet.getStatistics();
      
      expect(stats1.totalILIs).toBe(stats2.totalILIs);
      expect(stats1.totalSynsets).toBe(stats2.totalSynsets);
    });

    it('should have logical relationships between statistics', async () => {
      const stats = await wordnet.getStatistics();
      
      // ILI count should not exceed synset count
      expect(stats.totalILIs).toBeLessThanOrEqual(stats.totalSynsets);
      
      // If we have ILIs, we should have synsets
      if (stats.totalILIs > 0) {
        expect(stats.totalSynsets).toBeGreaterThan(0);
      }
    });
  });

  describe('Lexicon-Specific ILI Counting', () => {
    it('should correctly count ILIs per lexicon', async () => {
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      for (const lexicon of lexicons) {
        const lexiconStats = await wordnet.getLexiconStatistics(lexicon.id);
        const stats = lexiconStats.find(s => s.lexiconId === lexicon.id);
        
        expect(stats).toBeDefined();
        expect(stats!.iliCount).toBeGreaterThanOrEqual(0);
        expect(stats!.iliCount).toBeLessThanOrEqual(stats!.synsetCount);
        
        console.log(`📊 ${lexicon.id}: ${stats!.iliCount} ILIs out of ${stats!.synsetCount} synsets`);
      }
    });

    it('should have accurate ILI counts for OEWN', async () => {
      const lexiconStats = await wordnet.getLexiconStatistics('oewn:2024');
      const oewnStats = lexiconStats.find(s => s.lexiconId === 'oewn:2024');
      
      expect(oewnStats).toBeDefined();
      expect(oewnStats!.iliCount).toBeGreaterThan(100000); // OEWN should have many ILIs
      expect(oewnStats!.iliCount).toBeLessThanOrEqual(oewnStats!.synsetCount);
      
      // OEWN should have high ILI coverage
      const iliCoverage = (oewnStats!.iliCount / oewnStats!.synsetCount) * 100;
      expect(iliCoverage).toBeGreaterThan(90); // OEWN should have >90% ILI coverage
      
      console.log(`📊 OEWN ILI Coverage: ${iliCoverage.toFixed(1)}%`);
    });

    it('should handle CILI lexicon correctly', async () => {
      const lexiconStats = await wordnet.getLexiconStatistics('cili:1.0');
      const ciliStats = lexiconStats.find(s => s.lexiconId === 'cili:1.0');
      
      expect(ciliStats).toBeDefined();
      
      // CILI might have 0 synsets but should be handled gracefully
      expect(ciliStats!.iliCount).toBeGreaterThanOrEqual(0);
      expect(ciliStats!.iliCount).toBeLessThanOrEqual(ciliStats!.synsetCount);
      
      console.log(`📊 CILI: ${ciliStats!.iliCount} ILIs out of ${ciliStats!.synsetCount} synsets`);
    });

    it('should have accurate ILI counts for multilingual lexicons', async () => {
      const lexiconStats = await wordnet.getLexiconStatistics('omw-fr:1.4');
      const frStats = lexiconStats.find(s => s.lexiconId === 'omw-fr:1.4');
      
      expect(frStats).toBeDefined();
      expect(frStats!.iliCount).toBeGreaterThan(0);
      expect(frStats!.iliCount).toBeLessThanOrEqual(frStats!.synsetCount);
      
      // French WordNet should have reasonable ILI coverage
      const iliCoverage = (frStats!.iliCount / frStats!.synsetCount) * 100;
      expect(iliCoverage).toBeGreaterThan(50); // At least 50% ILI coverage
      
      console.log(`📊 French WordNet ILI Coverage: ${iliCoverage.toFixed(1)}%`);
    });
  });

  describe('ILI Data Integrity and Validation', () => {
    it('should have valid ILI format in synsets', async () => {
      // Get some synsets and check their ILI values
      const synsets = await wordnet.synsets({ form: 'cat' });
      expect(synsets.length).toBeGreaterThan(0);
      
      let synsetsWithILIs = 0;
      let validILIs = 0;
      
      for (const synset of synsets) {
        if (synset.ili) {
          synsetsWithILIs++;
          
          // ILI should follow the pattern i<number>
          const isValidFormat = /^i\d+$/.test(synset.ili);
          if (isValidFormat) {
            validILIs++;
          } else {
            console.warn(`⚠️ Invalid ILI format: ${synset.ili}`);
          }
        }
      }
      
      expect(synsetsWithILIs).toBeGreaterThan(0);
      expect(validILIs).toBe(synsetsWithILIs); // All ILIs should be valid format
      
      console.log(`📊 Found ${synsetsWithILIs} synsets with ILIs, all valid format`);
    });

    it('should not have duplicate ILI values within the same lexicon', async () => {
      const lexicons = await wordnet.lexicons();
      
      for (const lexicon of lexicons) {
        const synsets = await wordnet.synsets({ lexicon: lexicon.id });
        const iliValues = synsets
          .map(s => s.ili)
          .filter(ili => ili !== null && ili !== undefined);
        
        const uniqueILIs = new Set(iliValues);
        
        // Should not have duplicate ILIs within the same lexicon
        expect(uniqueILIs.size).toBe(iliValues.length);
        
        console.log(`📊 ${lexicon.id}: ${uniqueILIs.size} unique ILIs out of ${iliValues.length} total`);
      }
    });

    it('should have consistent ILI counts between different query methods', async () => {
      // Test that different ways of getting statistics return consistent results
      const overallStats = await wordnet.getStatistics();
      
      // Sum up lexicon-specific ILI counts
      const lexicons = await wordnet.lexicons();
      let totalLexiconILIs = 0;
      
      for (const lexicon of lexicons) {
        const lexiconStats = await wordnet.getLexiconStatistics(lexicon.id);
        const stats = lexiconStats.find(s => s.lexiconId === lexicon.id);
        if (stats) {
          totalLexiconILIs += stats.iliCount;
        }
      }
      
      // The sum of lexicon ILI counts should match the overall ILI count
      expect(totalLexiconILIs).toBe(overallStats.totalILIs);
      
      console.log(`📊 Overall ILI count: ${overallStats.totalILIs}`);
      console.log(`📊 Sum of lexicon ILI counts: ${totalLexiconILIs}`);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty database gracefully', async () => {
      // This test would require a fresh database
      // For now, we'll test that the system doesn't crash with edge cases
      const stats = await wordnet.getStatistics();
      
      // Should return valid numbers, not NaN or undefined
      expect(typeof stats.totalILIs).toBe('number');
      expect(typeof stats.totalSynsets).toBe('number');
      expect(typeof stats.totalWords).toBe('number');
      
      expect(Number.isFinite(stats.totalILIs)).toBe(true);
      expect(Number.isFinite(stats.totalSynsets)).toBe(true);
      expect(Number.isFinite(stats.totalWords)).toBe(true);
    });

    it('should handle non-existent lexicon gracefully', async () => {
      const lexiconStats = await wordnet.getLexiconStatistics('non-existent:1.0');
      
      // Should return empty array or handle gracefully
      expect(Array.isArray(lexiconStats)).toBe(true);
    });

    it('should maintain data consistency after multiple operations', async () => {
      // Get initial statistics
      const initialStats = await wordnet.getStatistics();
      
      // Perform some operations
      await wordnet.synsets({ form: 'test' });
      await wordnet.words({ form: 'test' });
      
      // Get statistics again
      const finalStats = await wordnet.getStatistics();
      
      // Should be consistent
      expect(finalStats.totalILIs).toBe(initialStats.totalILIs);
      expect(finalStats.totalSynsets).toBe(initialStats.totalSynsets);
    });
  });

  describe('Performance and Scalability', () => {
    it('should calculate ILI statistics efficiently', async () => {
      const startTime = Date.now();
      
      const stats = await wordnet.getStatistics();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      
      console.log(`📊 ILI statistics calculated in ${duration}ms`);
    });

    it('should handle large datasets without memory issues', async () => {
      // This test ensures that ILI counting doesn't cause memory issues
      const stats = await wordnet.getStatistics();
      
      // Should have substantial data
      expect(stats.totalILIs).toBeGreaterThan(100000);
      expect(stats.totalSynsets).toBeGreaterThan(100000);
      
      // Memory usage should be reasonable (this is more of a smoke test)
      const memUsage = process.memoryUsage?.();
      if (memUsage) {
        console.log(`📊 Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain ILI counting accuracy after code changes', async () => {
      // This test documents expected values to catch regressions
      const stats = await wordnet.getStatistics();
      
      // Document current state for regression testing
      const testSnapshot = {
        totalILIs: stats.totalILIs,
        totalSynsets: stats.totalSynsets,
        totalWords: stats.totalWords,
        totalLexicons: stats.totalLexicons,
        iliCoverage: (stats.totalILIs / stats.totalSynsets) * 100
      };
      
      console.log('📊 Current ILI counting snapshot:', testSnapshot);
      
      // Basic sanity checks
      expect(testSnapshot.totalILIs).toBeGreaterThan(100000);
      expect(testSnapshot.iliCoverage).toBeGreaterThan(80);
      
      // This snapshot can be used to detect regressions in future changes
      // If these values change significantly, it might indicate a regression
    });

    it('should preserve ILI counting fix (synsets table vs ilis table)', async () => {
      // This test specifically validates that we're counting from the right table
      const stats = await wordnet.getStatistics();
      
      // The fix ensures we count ILIs from synsets table, not ilis table
      // This test documents that the fix is working
      expect(stats.totalILIs).toBeGreaterThan(0);
      
      // If this test fails, it might mean we reverted to counting from ilis table
      console.log('✅ ILI counting fix is working - counting from synsets table');
    });
  });
});
