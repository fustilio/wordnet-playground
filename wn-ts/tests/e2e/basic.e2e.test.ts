import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import { 
  config, 
  download, 
  add, 
  Wordnet, 
  words, 
  synsets, 
  projects
} from '../../src/index.js';
import { logger } from '../../src/utils/logger.js';

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

  beforeAll(async () => {
    // Setup a persistent data directory for all e2e tests
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-e2e-'));
    config.dataDirectory = e2eDataDir;
    
    // Initialize by creating a Wordnet instance - this will handle database initialization
    const tempWn = new Wordnet('*');

    const ciliDownloadProgress = new ProgressLogger('Download CILI');
    const ciliPath = await download('cili:1.0', { force: true, progress: ciliDownloadProgress.update.bind(ciliDownloadProgress) });
    ciliDownloadProgress.finish();
    
    const ciliAddProgress = new ProgressLogger('Add CILI to DB');
    await add(ciliPath, { force: true, progress: ciliAddProgress.update.bind(ciliAddProgress) });
    ciliAddProgress.finish();
    
    const oewnDownloadProgress = new ProgressLogger('Download OEWN');
    const oewnPath = await download('oewn:2024', { force: true, progress: oewnDownloadProgress.update.bind(oewnDownloadProgress) });
    oewnDownloadProgress.finish();
    
    const oewnAddProgress = new ProgressLogger('Add OEWN to DB');
    await add(oewnPath, { force: true, progress: oewnAddProgress.update.bind(oewnAddProgress) });
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
    const tempWn = new Wordnet('*');
  });

  describe('Configuration and Project Discovery', () => {
    it('should load project index and list available projects', async () => {
      // This test now runs against the data set up in beforeAll
      logger.info('📋 Loading project index...');
      const availableProjects = await projects();
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
      logger.success(`Project info verified - ${oewnInfo.resource_urls.length} URLs available`);
    });
  });
  
  describe('Data Querying', () => {
    it('should query words from the database', async () => {
      logger.info('🔍 Querying words from database...');
      // Search for common words
      const infoWords = await words('information');
      logger.data(`Found ${infoWords.length} words for 'information'`);
      const computerWords = await words('computer');
      logger.data(`Found ${computerWords.length} words for 'computer'`);
      const testWords = await words('test');
      logger.data(`Found ${testWords.length} words for 'test'`);
      
      // Should find some words
      expect(infoWords.length).toBeGreaterThan(0);
      expect(computerWords.length).toBeGreaterThan(0);
      expect(testWords.length).toBeGreaterThan(0);
      
      // Verify structure of the first word
      const word = infoWords[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('lemma');
      expect(word).toHaveProperty('partOfSpeech');
      expect(word).toHaveProperty('language');
      expect(word).toHaveProperty('lexicon');
      logger.success('Word structure verified');
      logger.success('Word queries completed');
    });
    
    it('should query synsets from the database', async () => {
      logger.info('🔍 Querying synsets from database...');
      // Search for synsets
      const infoSynsets = await synsets('information');
      logger.synset(`Found ${infoSynsets.length} synsets for 'information'`);
      const computerSynsets = await synsets('computer');
      logger.synset(`Found ${computerSynsets.length} synsets for 'computer'`);
      
      expect(infoSynsets.length).toBeGreaterThan(0);
      expect(computerSynsets.length).toBeGreaterThan(0);
      
      // Verify structure of the first synset
      const synset = infoSynsets[0];
      expect(synset).toHaveProperty('id');
      expect(synset).toHaveProperty('partOfSpeech');
      expect(synset).toHaveProperty('language');
      expect(synset).toHaveProperty('lexicon');
      expect(synset).toHaveProperty('definitions');
      expect(synset.definitions).toBeInstanceOf(Array);
      logger.success('Synset structure verified');
      logger.success('Synset queries completed');
    });
    
    it('should work with Wordnet class instance', async () => {
      logger.info('🔧 Testing Wordnet class instance...');
      const wordnet = new Wordnet('oewn:2024');
      
      // Test word search
      logger.data('Testing word search...');
      const wordResults = await wordnet.words('test');
      expect(wordResults.length).toBeGreaterThan(0);
      logger.success(`Found ${wordResults.length} words via class instance`);
      
      // Test synset search
      logger.synset('Testing synset search...');
      const synsetResults = await wordnet.synsets('test');
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
      const results = await words('thiswordprobablydoesnotexist');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
      logger.success('Invalid word query handled correctly');
    });
  });
  
  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent queries', async () => {
      logger.info('⚡ Testing concurrent queries...');
      const queries = [
        words('information'),
        words('computer'),
        words('data'),
        synsets('information'),
        synsets('computer')
      ];
      
      const results = await Promise.all(queries);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);
        logger.success(`Query ${index + 1} returned ${result.length} results`);
      });
      logger.success('Concurrent queries completed');
    }, 60000); // increase timeout for queries on large DB
    
    it('should handle large result sets', async () => {
      logger.info('📊 Testing large result set handling...');
      // Search for a very common word that should return many results
      const commonWords = await words('test');
      
      expect(commonWords).toBeInstanceOf(Array);
      // Should handle large result sets without crashing
      expect(commonWords.length).toBeGreaterThan(0);
      logger.success(`Large result set handled - ${commonWords.length} results`);
    });
  });
  
  describe('Data Integrity', () => {
    it('should maintain data consistency across queries', async () => {
      logger.info('🔄 Testing data consistency...');
      const wordResults1 = await words('information');
      const wordResults2 = await words('information');
      
      // Same query should return same results
      expect(wordResults1).toEqual(wordResults2);
      
      if (wordResults1.length > 0) {
        const word1 = wordResults1[0];
        const word2 = wordResults2[0];
        
        // Individual word objects should be identical
        expect(word1).toEqual(word2);
      }
      logger.success('Data consistency verified');
    });
    
    it('should have consistent data types', async () => {
      logger.info('🔍 Testing data type consistency...');
      const wordResults = await words('test');
      const synsetResults = await synsets('test');
      
      if (wordResults.length > 0) {
        const word = wordResults[0];
        expect(typeof word.id).toBe('string');
        expect(typeof word.lemma).toBe('string');
        expect(typeof word.partOfSpeech).toBe('string');
        expect(typeof word.language).toBe('string');
        expect(typeof word.lexicon).toBe('string');
        logger.success('Word data types verified');
      }
      
      if (synsetResults.length > 0) {
        const synset = synsetResults[0];
        expect(typeof synset.id).toBe('string');
        expect(typeof synset.partOfSpeech).toBe('string');
        expect(typeof synset.language).toBe('string');
        expect(typeof synset.lexicon).toBe('string');
        expect(Array.isArray(synset.definitions)).toBe(true);
        logger.success('Synset data types verified');
      }
      logger.success('Data type consistency verified');
    });
  });
});
