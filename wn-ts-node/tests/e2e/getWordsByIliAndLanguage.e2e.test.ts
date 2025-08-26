import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join, basename, dirname } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import {
  config,
  download,
  add,
  Wordnet,
  words,
  synsets,
  senses,
  projects,
  ili,
  ilis,
} from '../../src/index.js';
import { decompressXz } from '../../src/utils/archive.js';
import { logger, type PartOfSpeech } from 'wn-ts-core';

class ProgressLogger {
  private startTime: number;
  private stage: string;
  private lastLoggedPercent: number;
  constructor(stage: string) {
    this.stage = stage;
    this.startTime = Date.now();
    this.lastLoggedPercent = -1;
    logger.info(`\n[${this.stage}] Starting...`);
  }
  update(progress: number) {
    const percent = Math.floor(progress * 100);
    // Only log every 5% to reduce verbosity
    if (percent >= this.lastLoggedPercent + 5) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      process.stdout.write(`\r[${this.stage}] ${percent}% complete (${elapsed}s)`);
      this.lastLoggedPercent = percent;
    }
  }
  finish() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    process.stdout.write(`\r[${this.stage}] 100% complete (${elapsed}s)\n`);
  }
}

describe('getWordsByIliAndLanguage E2E Tests', () => {
  let e2eDataDir: string;
  let wordnetClient: Wordnet;

  beforeAll(async () => {
    // Setup a persistent data directory for all e2e tests
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-ili-e2e-'));
    config.dataDirectory = e2eDataDir;

    // Initialize by creating a Wordnet instance - this will handle database initialization
    new Wordnet('*');

    // CILI is required for ILI definitions
    const ciliDownloadProgress = new ProgressLogger('Download CILI');
    const ciliPath = await download('cili:1.0', {
      force: true,
      progress: ciliDownloadProgress.update.bind(ciliDownloadProgress),
    });
    ciliDownloadProgress.finish();

    // Decompress the CILI .tsv.xz file before adding
    const decompressedCiliPath = join(dirname(ciliPath), basename(ciliPath, '.xz'));
    logger.info(`Decompressing ${ciliPath} to ${decompressedCiliPath}...`);
    await decompressXz(ciliPath, decompressedCiliPath);
    logger.success('Decompression complete.');

    const ciliAddProgress = new ProgressLogger('Add CILI to DB');
    await add(decompressedCiliPath, {
      force: true,
      progress: ciliAddProgress.update.bind(ciliAddProgress),
    });
    ciliAddProgress.finish();

    // Download and add OEWN (English) for ILI testing
    const oewnDownloadProgress = new ProgressLogger('Download OEWN');
    const oewnPath = await download('oewn:2024', {
      force: true,
      progress: oewnDownloadProgress.update.bind(oewnDownloadProgress),
    });
    oewnDownloadProgress.finish();

    const oewnAddProgress = new ProgressLogger('Add OEWN to DB');
    await add(oewnPath, {
      force: true,
      progress: oewnAddProgress.update.bind(oewnAddProgress),
    });
    oewnAddProgress.finish();

    const frDownloadProgress = new ProgressLogger('Download OMW-FR');
    const frArchivePath = await download('omw-fr:1.4', {
      force: true,
      progress: frDownloadProgress.update.bind(frDownloadProgress),
    });
    frDownloadProgress.finish();

    const frAddProgress = new ProgressLogger('Add OMW-FR to DB');
    await add(frArchivePath, {
      force: true,
      progress: frAddProgress.update.bind(frAddProgress),
    });
    frAddProgress.finish();

    logger.success('ILI e2e setup complete.');
  }, 900000); // 15 minute timeout for setup

  afterAll(async () => {
    // Shared teardown
    if (e2eDataDir && existsSync(e2eDataDir)) {
      try {
        // Add a small delay to allow file handles to be released
        await new Promise(resolve => setTimeout(resolve, 100));
        rmSync(e2eDataDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean up e2e test directory:', error);
        // Don't fail the test suite due to cleanup issues
      }
    }
  });

  beforeEach(async () => {
    // Reset config and reinitialize database
    config.dataDirectory = e2eDataDir;

    // Initialize by creating a Wordnet instance - this will handle database initialization
    new Wordnet('*');

    // Create a client for the tests
    wordnetClient = new Wordnet('*');
  });

  describe('Database State Verification', () => {
    it('should have loaded data from all test samples', async () => {
      logger.info('📊 Verifying database state...');

      // Check that projects are available
      const availableProjects = await projects();
      logger.success(`Found ${availableProjects.length} projects`);

      expect(availableProjects.length).toBeGreaterThan(0);

      // Check for specific projects
      const projectIds = availableProjects.map(p => p.id);
      // Note: OMW-FR is not loaded due to format issues
      // CILI is an ILI data source, not a full lexicon, so it may not appear in projects()
      // expect(projectIds).toContain('cili');
      expect(projectIds).toContain('oewn');
      expect(projectIds).toContain('omw-fr');

      logger.success('All required projects loaded');
    });

    it('should have ILI data available', async () => {
      logger.info('🔗 Checking ILI data availability...');

      const allILIs = await ilis();
      logger.success(`Found ${allILIs.length} ILI entries`);

      expect(allILIs.length).toBeGreaterThan(0);

      // Log some sample ILIs for debugging
      const sampleILIs = allILIs.slice(0, 5);
      logger.info(
        'Sample ILIs:',
        sampleILIs.map(ili => ({ id: ili.id, status: ili.status }))
      );
    });

    it('should have English data available for ILI testing', async () => {
      logger.info('🔤 Checking English data availability for ILI testing...');

      // Test that we can find English words
      const enWords = await words('computer', undefined, { lexicon: 'oewn' });

      logger.success(`Found ${enWords.length} English words for 'computer'`);

      expect(enWords.length).toBeGreaterThan(0);

      // Verify language codes
      expect(enWords.every(w => w.language === 'en')).toBe(true);

      // Check that we have some synsets with ILIs
      const enSynsets = await synsets({ form: 'computer', lexicon: 'oewn' });
      const synsetsWithIli = enSynsets.filter(s => s.ili);

      logger.success(
        `Found ${synsetsWithIli.length} English synsets with ILIs for 'computer'`
      );
      expect(synsetsWithIli.length).toBeGreaterThan(0);
    });
  });

  describe.skip('ILI Mapping Analysis', () => {
    it('should analyze ILI coverage across languages', async () => {
      logger.info('📊 Analyzing ILI coverage across languages...');

      // Get some sample synsets with ILIs from English
      const enSynsets = await synsets({ form: 'computer', lexicon: 'oewn' });

      logger.info(`Analyzing ${enSynsets.length} English synsets for ILI coverage`);

      let synsetsWithIli = 0;
      let synsetsWithoutIli = 0;
      const sampleIlis: string[] = [];

      for (const synset of enSynsets) {
        if (synset.ili) {
          synsetsWithIli++;
          if (sampleIlis.length < 5) {
            sampleIlis.push(synset.ili);
          }
        } else {
          synsetsWithoutIli++;
        }
      }

      logger.info(
        `ILI coverage: ${synsetsWithIli} with ILI, ${synsetsWithoutIli} without ILI`
      );
      logger.info('Sample ILIs:', sampleIlis);

      expect(synsetsWithIli).toBeGreaterThan(0);
      logger.success('ILI coverage analysis complete');
    });

    it('should find synsets that share the same ILI', async () => {
      logger.info('🔍 Finding synsets that share the same ILI...');

      // Get a sample ILI from an English synset for 'computer' to ensure it's a valid, used ILI
      const enSynsets = await synsets({ form: 'computer', pos: 'n', lexicon: 'oewn' });
      const computerSynset = enSynsets.find(s => s.ili);
      expect(
        computerSynset,
        'Could not find an English synset for "computer" with an ILI'
      ).toBeDefined();
      const sampleIli = computerSynset!.ili!;
      logger.info(`Testing with a known ILI from 'computer' synset: ${sampleIli}`);

      // Find all synsets with this ILI
      const synsetsWithIli = await synsets({ ili: sampleIli });
      logger.success(`Found ${synsetsWithIli.length} synsets with ILI ${sampleIli}`);

      // Group by language
      const byLanguage: Record<string, any[]> = {};
      for (const synset of synsetsWithIli) {
        if (synset && synset.language) {
          if (!byLanguage[synset.language]) {
            byLanguage[synset.language] = [];
          }
          byLanguage[synset.language]!.push(synset);
        }
      }

      logger.info(
        'Synsets by language:',
        Object.entries(byLanguage).map(
          ([lang, synsets]) => `${lang}: ${synsets.length}`
        )
      );

      // We expect to find at least the original English synset
      expect(synsetsWithIli.length).toBeGreaterThan(0);
    });
  });

  describe('getWordsByIliAndLanguage Functionality', () => {
    it('should find words for a given ILI without language filter', async () => {
      logger.info('🔍 Testing getWordsByIliAndLanguage without language filter...');

      const allILIs = await ilis();
      const sampleIli = allILIs[0]?.id;

      if (!sampleIli) {
        logger.warn('No ILIs available for testing');
        return;
      }

      logger.info(
        `Testing getWordsByIliAndLanguage for ILI: ${sampleIli} (no language filter)`
      );

      // Use the Wordnet instance to call getWordsByIliAndLanguage
      const words = await wordnetClient.getWordsByIliAndLanguage(sampleIli);
      logger.success(`Found ${words.length} words for ILI ${sampleIli}`);

      if (words.length > 0) {
        logger.info(
          'Sample words:',
          words.slice(0, 3).map(w => ({
            id: w.id,
            lemma: w.lemma,
            language: w.language,
            lexicon: w.lexicon,
          }))
        );
      }

      expect(Array.isArray(words)).toBe(true);
    });

    it('should find words for a given ILI with English language filter', async () => {
      logger.info('🔍 Testing getWordsByIliAndLanguage with English filter...');

      const allILIs = await ilis();
      const sampleIli = allILIs[0]?.id;

      if (!sampleIli) {
        logger.warn('No ILIs available for testing');
        return;
      }

      logger.info(
        `Testing getWordsByIliAndLanguage for ILI: ${sampleIli} with English filter`
      );

      const englishWords = await wordnetClient.getWordsByIliAndLanguage(
        sampleIli,
        'en'
      );
      logger.success(`Found ${englishWords.length} English words for ILI ${sampleIli}`);

      if (englishWords.length > 0) {
        logger.info(
          'Sample English words:',
          englishWords.slice(0, 3).map(w => ({
            id: w.id,
            lemma: w.lemma,
            language: w.language,
            lexicon: w.lexicon,
          }))
        );

        // Verify all words are English
        for (const word of englishWords) {
          expect(word.language).toBe('en');
        }
      }

      expect(Array.isArray(englishWords)).toBe(true);
    });

    it('should find words for a given ILI with English language filter', async () => {
      logger.info(
        '🔍 Testing getWordsByIliAndLanguage with English filter (duplicate test for coverage)...'
      );

      const allILIs = await ilis();
      const sampleIli = allILIs[0]?.id;

      if (!sampleIli) {
        logger.warn('No ILIs available for testing');
        return;
      }

      logger.info(
        `Testing getWordsByIliAndLanguage for ILI: ${sampleIli} with English filter (duplicate)`
      );

      const englishWords = await wordnetClient.getWordsByIliAndLanguage(
        sampleIli,
        'en'
      );
      logger.success(`Found ${englishWords.length} English words for ILI ${sampleIli}`);

      if (englishWords.length > 0) {
        logger.info(
          'Sample English words:',
          englishWords.slice(0, 3).map(w => ({
            id: w.id,
            lemma: w.lemma,
            language: w.language,
            lexicon: w.lexicon,
          }))
        );

        // Verify all words are English
        for (const word of englishWords) {
          expect(word.language).toBe('en');
        }
      }

      expect(Array.isArray(englishWords)).toBe(true);
    });

    it('should handle non-existent ILI gracefully', async () => {
      logger.info('❌ Testing getWordsByIliAndLanguage with non-existent ILI...');

      const nonExistentIli = 'i999999999';
      logger.info(
        `Testing getWordsByIliAndLanguage for non-existent ILI: ${nonExistentIli}`
      );

      const words = await wordnetClient.getWordsByIliAndLanguage(nonExistentIli);
      logger.success(`Found ${words.length} words for non-existent ILI`);

      expect(words).toEqual([]);
    });

    it('should handle empty string language parameter', async () => {
      logger.info('🔍 Testing getWordsByIliAndLanguage with empty string language...');

      const allILIs = await ilis();
      const sampleIli = allILIs[0]?.id;

      if (!sampleIli) {
        logger.warn('No ILIs available for testing');
        return;
      }

      logger.info(
        `Testing getWordsByIliAndLanguage for ILI: ${sampleIli} with empty string language`
      );

      const words = await wordnetClient.getWordsByIliAndLanguage(sampleIli, '');
      logger.success(
        `Found ${words.length} words for ILI ${sampleIli} with empty language filter`
      );

      // Empty string should be treated as no language filter
      const wordsWithoutFilter =
        await wordnetClient.getWordsByIliAndLanguage(sampleIli);
      expect(words.length).toBe(wordsWithoutFilter.length);
    });
  });

  describe.skip('ILI Coverage Analysis', () => {
    it('should analyze ILI coverage in English', async () => {
      logger.info('🔤 Analyzing ILI coverage in English...');

      const allILIs = await ilis();
      const sampleILIs = allILIs.slice(0, 10); // Test first 10 ILIs

      logger.info(`Analyzing ILI coverage for ${sampleILIs.length} ILIs in English`);

      let iliCoverageBreakdown: Record<string, { en: number }> = {};

      for (const ili of sampleILIs) {
        const englishWords = await wordnetClient.getWordsByIliAndLanguage(ili.id, 'en');

        iliCoverageBreakdown[ili.id] = {
          en: englishWords.length,
        };
      }

      logger.info('ILI coverage breakdown:', iliCoverageBreakdown);
      logger.success(`English ILI coverage analyzed for ${sampleILIs.length} ILIs`);

      // This test will help identify if the issue is with the method or the data
      expect(sampleILIs.length).toBeGreaterThan(0);
    });

    it('should analyze English ILI coverage patterns', async () => {
      logger.info('🔍 Analyzing English ILI coverage patterns...');

      const allILIs = await ilis();
      const sampleILIs = allILIs.slice(0, 5); // Test first 5 ILIs

      for (const ili of sampleILIs) {
        const englishWords = await wordnetClient.getWordsByIliAndLanguage(ili.id, 'en');

        logger.info(`ILI ${ili.id}:`);
        logger.info(`  English words: ${englishWords.length}`);

        if (englishWords.length > 0) {
          logger.info(`  ✅ ILI ${ili.id} has ${englishWords.length} English words`);

          // Let's examine the English synsets to understand the structure
          const englishSynsets = await synsets({ lexicon: 'oewn' });
          logger.info(`    English synsets with this ILI: ${englishSynsets.length}`);

          if (englishSynsets.length > 0) {
            const sampleSynset = englishSynsets[0];
            if (sampleSynset) {
              logger.info(`    Sample English synset:`, {
                id: sampleSynset.id,
                ili: sampleSynset.ili,
                lexicon: sampleSynset.lexicon,
              });
            }
          }
        } else {
          logger.warn(`  ⚠️  ILI ${ili.id} has no English words`);
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple ILI queries efficiently', async () => {
      logger.info('⚡ Testing performance with multiple ILI queries...');

      const allILIs = await ilis();
      const testILIs = allILIs.slice(0, 20); // Test first 20 ILIs

      logger.info(`Testing performance with ${testILIs.length} ILI queries`);

      const startTime = Date.now();

      const results = await Promise.all(
        testILIs.map(ili => wordnetClient.getWordsByIliAndLanguage(ili.id))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      logger.success(`Completed ${testILIs.length} ILI queries in ${totalTime}ms`);
      logger.info(`Average time per query: ${totalTime / testILIs.length}ms`);

      const totalWords = results.reduce((sum, words) => sum + words.length, 0);
      logger.info(`Total words found: ${totalWords}`);

      expect(results.length).toBe(testILIs.length);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Real-World Use Cases (English Only)', () => {
    it('should support computer-related ILI lookup', async () => {
      logger.info('💻 Testing computer-related ILI lookup...');

      // Find computer-related senses in English
      const enComputerSenses = await senses('computer', undefined, { lexicon: 'oewn' });

      if (enComputerSenses.length > 0) {
        // Get a synset from English
        const enSense = enComputerSenses[0];
        if (enSense && enSense.synsetId) {
          const synset = await wordnetClient.getSynsetById(enSense.synsetId);

          if (synset && synset.ili) {
            logger.info(`English synset ${synset.id} has ILI: ${synset.ili}`);

            // Try to find French words with the same ILI
            const frenchWords = await wordnetClient.getWordsByIliAndLanguage(
              synset.ili,
              'fr'
            );
            logger.success(
              `Found ${frenchWords.length} French words for computer concept (ILI: ${synset.ili})`
            );

            if (frenchWords.length > 0) {
              logger.info(
                'French computer words:',
                frenchWords.map(w => w.lemma)
              );
            }
          }
        }
      }

      expect(enComputerSenses.length).toBeGreaterThan(0);
    });

    it('should support house-related ILI lookup', async () => {
      logger.info('🏠 Testing house-related ILI lookup...');

      // Find house-related senses in English
      const enHouseSenses = await senses('house', undefined, { lexicon: 'oewn' });

      if (enHouseSenses.length > 0) {
        // Get a synset from English
        const enSense = enHouseSenses[0];
        if (enSense && enSense.synsetId) {
          const synset = await wordnetClient.getSynsetById(enSense.synsetId);

          if (synset && synset.ili) {
            logger.info(`English synset ${synset.id} has ILI: ${synset.ili}`);

            // Try to find French words with the same ILI
            const frenchWords = await wordnetClient.getWordsByIliAndLanguage(
              synset.ili,
              'fr'
            );
            logger.success(
              `Found ${frenchWords.length} French words for house concept (ILI: ${synset.ili})`
            );

            if (frenchWords.length > 0) {
              logger.info(
                'French house words:',
                frenchWords.map(w => w.lemma)
              );
            }
          }
        }
      }

      expect(enHouseSenses.length).toBeGreaterThan(0);
    });
  });

  describe('Additional ILI Query Methods', () => {
    it('should support getWordsByIliAndLexiconPrefix', async () => {
      logger.info('📚 Testing getWordsByIliAndLexiconPrefix...');
      
      const allILIs = await wordnetClient.ilis();
      if (allILIs.length > 0) {
        const ili = allILIs[0]!.id;
        
        // Access the query service for this method
        const queryService = (wordnetClient as any).kyselyWordnet.getQueryService();
        const oewnWords = await queryService.getWordsByIliAndLexiconPrefix(ili, 'oewn');
        
        expect(Array.isArray(oewnWords)).toBe(true);
        expect(oewnWords.every(w => w.lexicon.startsWith('oewn'))).toBe(true);
        
        logger.success(`Found ${oewnWords.length} words for ILI ${ili} with OEWN lexicon prefix using getWordsByIliAndLexiconPrefix`);
      }
    });

    it('should support getWordsBySynsetAndLanguage', async () => {
      logger.info('🌍 Testing getWordsBySynsetAndLanguage...');
      
      // Find a synset first
      const synsets = await wordnetClient.synsets({ form: 'house', maxResults: 1 });
      if (synsets.length > 0) {
        const synset = synsets[0]!;
        
        // Access the query service for this method
        const queryService = (wordnetClient as any).kyselyWordnet.getQueryService();
        const englishWords = await queryService.getWordsBySynsetAndLanguage(synset.id, 'en');
        
        expect(Array.isArray(englishWords)).toBe(true);
        expect(englishWords.every(w => w.language === 'en')).toBe(true);
        
        logger.success(`Found ${englishWords.length} English words for synset ${synset.id} using getWordsBySynsetAndLanguage`);
      }
    });
  });

  describe('manual tests', () => {
    it('demo translation', async () => {
      async function translateFromEnglishToFrench(english: string, pos?: PartOfSpeech) {
        const englishSynsets = await wordnetClient.synsets(english, pos);
        const allIlis = englishSynsets.map(s => s.ili);

        const allMatchingFrenchWords = await Promise.all(
          allIlis.map(ili => wordnetClient.getWordsByIliAndLanguage(ili!, 'fr'))
        );

        // only unique words
        return allMatchingFrenchWords
          .flat()
          .filter(
            (word, index, self) => index === self.findIndex(t => t.id === word.id)
          )
          .map(w => ({
            id: w.id,
            lemma: w.lemma,
            pos: w.pos,
          }));
      }

      const translatedWater = await translateFromEnglishToFrench('water', 'n');
      console.log('manual', 'translated water', translatedWater);

      expect(translatedWater.length).toBeGreaterThan(0);
      expect(translatedWater.some(w => w.lemma === 'eau')).toBe(true);

      const translatedComputer = await translateFromEnglishToFrench('computer', 'n');
      console.log('manual', 'translated computer', translatedComputer);
      expect(translatedComputer.length).toBeGreaterThan(0);
      expect(translatedComputer.some(w => w.lemma === 'ordinateur')).toBe(true);
    });

  });
});
