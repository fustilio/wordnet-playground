import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import { 
  words, 
  synsets, 
  projects 
} from 'wn-ts-core';
import { add, Wordnet, config, download } from '../../src/index.js';
import { logger } from 'wn-ts-core/utils';

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

describe('End-to-End Integration Tests', () => {
  let e2eDataDir: string;
  let wordnetClient: Wordnet;

  beforeAll(async () => {
    // Setup a persistent data directory for all e2e tests
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-e2e-'));
    config.dataDirectory = e2eDataDir;

    // Initialize by creating a Wordnet instance - this will handle database initialization
    new Wordnet('*');

    const ciliDownloadProgress = new ProgressLogger('Download CILI');
    const ciliPath = await download('cili:1.0', {
      force: true,
      progress: ciliDownloadProgress.update.bind(ciliDownloadProgress),
    });
    ciliDownloadProgress.finish();

    const ciliAddProgress = new ProgressLogger('Add CILI to DB');
    await add(ciliPath, {
      force: true,
      progress: ciliAddProgress.update.bind(ciliAddProgress),
    });
    ciliAddProgress.finish();

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

    logger.success('e2e setup complete.');
  }, 600000); // 10 minute timeout for setup

  afterAll(async () => {
    // Shared teardown
    if (e2eDataDir && existsSync(e2eDataDir)) {
      rmSync(e2eDataDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // The global setup in `setup.ts` may create another temp directory.
    // We must reset config.dataDirectory to our persistent e2e directory.
    config.dataDirectory = e2eDataDir;

    // Initialize by creating a Wordnet instance - this will handle database initialization
    new Wordnet('*');
    
    // Create a client for the tests
    wordnetClient = new Wordnet('oewn:2024');
  });

  describe('Configuration and Project Discovery', () => {
    it('should load project index and list available projects', async () => {
      // This test now runs against the data set up in beforeAll
      logger.info('📋 Loading project index...');
      const availableProjects = await projects(wordnetClient);
      logger.success(`Found ${availableProjects.length} projects`);

      expect(availableProjects).toBeInstanceOf(Array);
      expect(availableProjects.length).toBeGreaterThan(0);

      // Check for specific known projects
      const projectIds = availableProjects.map(p => p.id);
      logger.info('🔍 Checking for known projects...');
      expect(projectIds).toContain('oewn');
      expect(projectIds).toContain('cili');
      logger.success('Known projects found');

      // Verify project structure
      const oewnProject = availableProjects.find(p => p.id === 'oewn');
      expect(oewnProject).toBeDefined();
      expect(oewnProject?.label).toBe('Open English WordNet');
      logger.success('Project structure verified');
    });

    it('should get project info for specific versions', () => {
      logger.info('📊 Getting project info for oewn:2024...');
      const oewnInfo = config.getProjectInfo('oewn:2024');

      expect(oewnInfo.id).toBe('oewn');
      expect(oewnInfo.version).toBe('2024');
      expect(oewnInfo.label).toBe('Open English WordNet');
      expect(oewnInfo.language).toBe('en');
      expect(oewnInfo.resource_urls).toBeInstanceOf(Array);
      expect(oewnInfo.resource_urls.length).toBeGreaterThan(0);
      logger.success(
        `Project info verified - ${oewnInfo.resource_urls.length} URLs available`
      );
    });
  });

  describe('Data Querying', () => {
    it('should query words from the database', async () => {
      logger.info('🔍 Querying words from database...');
      // Search for common words
      const infoWords = await words(wordnetClient, 'information');
      logger.data(`Found ${infoWords.length} words for 'information'`);
      const computerWords = await words(wordnetClient, 'computer');
      logger.data(`Found ${computerWords.length} words for 'computer'`);
      const testWords = await words(wordnetClient, 'test');
      logger.data(`Found ${testWords.length} words for 'test'`);

      // Should find some words
      expect(infoWords.length).toBeGreaterThan(0);
      expect(computerWords.length).toBeGreaterThan(0);
      expect(testWords.length).toBeGreaterThan(0);

      // Verify structure of the first word
      const word = infoWords[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('lemma');
      expect(word).toHaveProperty('pos');
      expect(word).toHaveProperty('language');
      expect(word).toHaveProperty('lexicon');
      logger.success('Word structure verified');
      logger.success('Word queries completed');
    });

    it('should query synsets from the database', async () => {
      logger.info('🔍 Querying synsets from database...');
      // Search for synsets
      const infoSynsets = await synsets(wordnetClient, 'information');
      logger.synset(`Found ${infoSynsets.length} synsets for 'information'`);
      const computerSynsets = await synsets(wordnetClient, 'computer');
      logger.synset(`Found ${computerSynsets.length} synsets for 'computer'`);

      expect(infoSynsets.length).toBeGreaterThan(0);
      expect(computerSynsets.length).toBeGreaterThan(0);

      // Verify structure of the first synset
      const synset = infoSynsets[0];
      expect(synset).toBeDefined();
      if (synset) {
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
        expect(synset).toHaveProperty('language');
        expect(synset).toHaveProperty('lexicon');
        expect(synset).toHaveProperty('definitions');
        expect(synset.definitions).toBeInstanceOf(Array);
      }
      logger.success('Synset structure verified');
      logger.success('Synset queries completed');
    });

    it('should work with Wordnet class instance', async () => {
      logger.info('🔧 Testing Wordnet class instance...');
      // const wordnet = new Wordnet('oewn:2024'); // This line is removed as wordnetClient is now global

      // Test word search
      logger.data('Testing word search...');
      const wordResults = await wordnetClient.words({ form: 'test' });
      expect(wordResults.length).toBeGreaterThan(0);
      logger.success(`Found ${wordResults.length} words via class instance`);

      // Test synset search
      logger.synset('Testing synset search...');
      const synsetResults = await wordnetClient.synsets({ form: 'test' });
      expect(synsetResults.length).toBeGreaterThan(0);
      logger.success(`Found ${synsetResults.length} synsets via class instance`);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project IDs gracefully', () => {
      logger.info('❌ Testing invalid project ID handling...');
      expect(() => config.getProjectInfo('nonexistent:1.0')).toThrow();
      logger.success('Invalid project ID handled correctly');
    });

    it('should handle invalid file paths gracefully', async () => {
      logger.info('❌ Testing invalid file path handling...');
      await expect(add('/nonexistent/file.xml', { force: true })).rejects.toThrow();
      logger.success('Invalid file path handled correctly');
    });

    it('should handle invalid word queries gracefully', async () => {
      logger.info('❌ Testing invalid word query handling...');
      const results = await words(wordnetClient, 'thiswordprobablydoesnotexist');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
      logger.success('Invalid word query handled correctly');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent queries', async () => {
      logger.info('⚡ Testing concurrent queries...');
      const queries = [
        words(wordnetClient, 'information'),
        words(wordnetClient, 'computer'),
        words(wordnetClient, 'data'),
        words(wordnetClient, 'system'),
        words(wordnetClient, 'network'),
      ];

      const results = await Promise.all(queries);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Array);
      });
      logger.success('Concurrent queries completed successfully');
    });

    it('should handle large result sets', async () => {
      logger.info('📊 Testing large result set handling...');
      const results = await words(wordnetClient, 'a');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      logger.success(`Large result set handled: ${results.length} results`);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across queries', async () => {
      logger.info('🔄 Testing data consistency...');
      const firstQuery = await words(wordnetClient, 'information');
      const secondQuery = await words(wordnetClient, 'information');
      
      expect(firstQuery).toEqual(secondQuery);
      expect(firstQuery.length).toBeGreaterThan(0);
      logger.success('Data consistency verified');
    });

    it('should have consistent data types', async () => {
      logger.info('🔍 Testing data type consistency...');
      const results = await words(wordnetClient, 'test');
      expect(results).toBeInstanceOf(Array);
      
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
