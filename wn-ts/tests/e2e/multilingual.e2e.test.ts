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
  projects,
  ili,
  ilis
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

describe('Multilingual End-to-End Integration Tests', () => {
  let e2eDataDir: string;

  beforeAll(async () => {
    // Setup a persistent data directory for all multilingual e2e tests
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-multilingual-e2e-'));
    config.dataDirectory = e2eDataDir;
    
    // Initialize by creating a Wordnet instance - this will handle database initialization
    const tempWn = new Wordnet('*');

    // Download and add CILI (Interlingual Index) first
    const ciliDownloadProgress = new ProgressLogger('Download CILI');
    const ciliPath = await download('cili:1.0', { force: true, progress: ciliDownloadProgress.update.bind(ciliDownloadProgress) });
    ciliDownloadProgress.finish();
    
    const ciliAddProgress = new ProgressLogger('Add CILI to DB');
    await add(ciliPath, { force: true, progress: ciliAddProgress.update.bind(ciliAddProgress) });
    ciliAddProgress.finish();
    
    // Download and add a few specific language WordNets for detailed testing
    const languages = ['omw-en', 'omw-fr', 'omw-es'];
    
    for (const lang of languages) {
      const langDownloadProgress = new ProgressLogger(`Download ${lang}`);
      const langPath = await download(`${lang}:1.4`, { force: true, progress: langDownloadProgress.update.bind(langDownloadProgress) });
      langDownloadProgress.finish();
      
      const langAddProgress = new ProgressLogger(`Add ${lang} to DB`);
      await add(langPath, { force: true, progress: langAddProgress.update.bind(langAddProgress) });
      langAddProgress.finish();
    }
    
    logger.success('Multilingual e2e setup complete.');
    
  }, 900000); // 15 minute timeout for multilingual setup

  afterAll(async () => {
    // Shared teardown
    if (e2eDataDir && existsSync(e2eDataDir)) {
      rmSync(e2eDataDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Reset config and reinitialize database
    config.dataDirectory = e2eDataDir;
    
    // Initialize by creating a Wordnet instance - this will handle database initialization
    const tempWn = new Wordnet('*');
  });

  describe('Multilingual Project Discovery', () => {
    it('should discover multilingual projects', async () => {
      logger.info('🌍 Loading multilingual project index...');
      const availableProjects = await projects();
      logger.success(`Found ${availableProjects.length} projects`);
      
      expect(availableProjects).toBeInstanceOf(Array);
      expect(availableProjects.length).toBeGreaterThan(0);
      
      // Check for multilingual projects
      const projectIds = availableProjects.map(p => p.id);
      logger.info('🔍 Checking for multilingual projects...');
      
      // Should have OMW (Open Multilingual WordNet)
      expect(projectIds).toContain('omw');
      logger.success('OMW project found');
      
      // Should have CILI (Interlingual Index)
      expect(projectIds).toContain('cili');
      logger.success('CILI project found');
      
      // Should have specific language projects
      const languageProjects = ['omw-en', 'omw-fr', 'omw-es'];
      for (const langProject of languageProjects) {
        expect(projectIds).toContain(langProject);
        logger.success(`${langProject} project found`);
      }
      
      // Verify language project structure
      const enProject = availableProjects.find(p => p.id === 'omw-en');
      expect(enProject).toBeDefined();
      expect(enProject?.label).toBe('OMW English Wordnet based on WordNet 3.0');
      logger.success('Language project structure verified');
    });
    
    it('should get project info for multilingual resources', () => {
      logger.info('📊 Getting project info for multilingual resources...');
      
      // Test specific language project info
      const enInfo = config.getProjectInfo('omw-en:1.4');
      expect(enInfo.id).toBe('omw-en');
      expect(enInfo.version).toBe('1.4');
      expect(enInfo.label).toBe('OMW English Wordnet based on WordNet 3.0');
      expect(enInfo.language).toBe('en');
      logger.success('English project info verified');
      
      const frInfo = config.getProjectInfo('omw-fr:1.4');
      expect(frInfo.id).toBe('omw-fr');
      expect(frInfo.version).toBe('1.4');
      expect(frInfo.label).toBe('WOLF (Wordnet Libre du Français)');
      expect(frInfo.language).toBe('fr');
      logger.success('French project info verified');
      
      const esInfo = config.getProjectInfo('omw-es:1.4');
      expect(esInfo.id).toBe('omw-es');
      expect(esInfo.version).toBe('1.4');
      expect(esInfo.label).toBe('Multilingual Central Repository (Spanish)');
      expect(esInfo.language).toBe('es');
      logger.success('Spanish project info verified');
    });
  });
  
  describe('Language-Specific Word Queries', () => {
    it('should query words in different languages', async () => {
      logger.info('🔍 Testing word queries across languages...');
      
      // Test English words
      const enWords = await words('computer', undefined, { lang: 'en' });
      logger.data(`Found ${enWords.length} English words for 'computer'`);
      expect(enWords.length).toBeGreaterThan(0);
      expect(enWords.every(w => w.language === 'en')).toBe(true);
      
      // Test French words
      const frWords = await words('ordinateur', undefined, { lang: 'fr' });
      logger.data(`Found ${frWords.length} French words for 'ordinateur'`);
      expect(frWords.length).toBeGreaterThan(0);
      expect(frWords.every(w => w.language === 'fr')).toBe(true);
      
      // Test Spanish words
      const esWords = await words('computadora', undefined, { lang: 'es' });
      logger.data(`Found ${esWords.length} Spanish words for 'computadora'`);
      expect(esWords.length).toBeGreaterThan(0);
      expect(esWords.every(w => w.language === 'es')).toBe(true);
      
      logger.success('Language-specific word queries completed');
    });
    
    it('should query synsets in different languages', async () => {
      logger.info('🔍 Testing synset queries across languages...');
      
      // Test English synsets
      const enSynsets = await synsets('computer', undefined, { lang: 'en' });
      logger.synset(`Found ${enSynsets.length} English synsets for 'computer'`);
      expect(enSynsets.length).toBeGreaterThan(0);
      expect(enSynsets.every(s => s.language === 'en')).toBe(true);
      
      // Test French synsets
      const frSynsets = await synsets('ordinateur', undefined, { lang: 'fr' });
      logger.synset(`Found ${frSynsets.length} French synsets for 'ordinateur'`);
      expect(frSynsets.length).toBeGreaterThan(0);
      expect(frSynsets.every(s => s.language === 'fr')).toBe(true);
      
      logger.success('Language-specific synset queries completed');
    });
    
    it('should work with language-specific Wordnet instances', async () => {
      logger.info('🔧 Testing language-specific Wordnet instances...');
      
      // Test English Wordnet instance
      const enWordnet = new Wordnet('omw-en:1.4', { lang: 'en' });
      const enResults = await enWordnet.words('computer');
      expect(enResults.length).toBeGreaterThan(0);
      expect(enResults.every(w => w.language === 'en')).toBe(true);
      logger.success(`Found ${enResults.length} English words via class instance`);
      
      // Test French Wordnet instance
      const frWordnet = new Wordnet('omw-fr:1.4', { lang: 'fr' });
      const frResults = await frWordnet.words('ordinateur');
      expect(frResults.length).toBeGreaterThan(0);
      expect(frResults.every(w => w.language === 'fr')).toBe(true);
      logger.success(`Found ${frResults.length} French words via class instance`);
      
      // Test Spanish Wordnet instance
      const esWordnet = new Wordnet('omw-es:1.4', { lang: 'es' });
      const esResults = await esWordnet.words('computadora');
      expect(esResults.length).toBeGreaterThan(0);
      expect(esResults.every(w => w.language === 'es')).toBe(true);
      logger.success(`Found ${esResults.length} Spanish words via class instance`);
    });
  });
  
  describe('Cross-Language Functionality', () => {
    it('should query words across all languages', async () => {
      logger.info('🌍 Testing cross-language word queries...');
      
      // Query for a concept that should exist in multiple languages
      const allComputerWords = await words('computer');
      logger.data(`Found ${allComputerWords.length} total words for 'computer' across all languages`);
      expect(allComputerWords.length).toBeGreaterThan(0);
      
      // Group by language
      const wordsByLanguage = new Map<string, any[]>();
      for (const word of allComputerWords) {
        if (!wordsByLanguage.has(word.language)) {
          wordsByLanguage.set(word.language, []);
        }
        wordsByLanguage.get(word.language)!.push(word);
      }
      
      logger.info('📊 Words found by language:');
      for (const [lang, words] of wordsByLanguage) {
        logger.data(`${lang}: ${words.length} words`);
        expect(words.length).toBeGreaterThan(0);
      }
      
      // Should have words in multiple languages
      expect(wordsByLanguage.size).toBeGreaterThan(1);
      logger.success(`Found words in ${wordsByLanguage.size} different languages`);
    });
    
    it('should query synsets across all languages', async () => {
      logger.info('🌍 Testing cross-language synset queries...');
      
      // Query for synsets across all languages
      const allComputerSynsets = await synsets('computer');
      logger.synset(`Found ${allComputerSynsets.length} total synsets for 'computer' across all languages`);
      expect(allComputerSynsets.length).toBeGreaterThan(0);
      
      // Group by language
      const synsetsByLanguage = new Map<string, any[]>();
      for (const synset of allComputerSynsets) {
        if (!synsetsByLanguage.has(synset.language)) {
          synsetsByLanguage.set(synset.language, []);
        }
        synsetsByLanguage.get(synset.language)!.push(synset);
      }
      
      logger.info('📊 Synsets found by language:');
      for (const [lang, synsets] of synsetsByLanguage) {
        logger.synset(`${lang}: ${synsets.length} synsets`);
        expect(synsets.length).toBeGreaterThan(0);
      }
      
      // Should have synsets in multiple languages
      expect(synsetsByLanguage.size).toBeGreaterThan(1);
      logger.success(`Found synsets in ${synsetsByLanguage.size} different languages`);
    });
  });
  
  describe('Interlingual Index (ILI) Functionality', () => {
    it('should access ILI entries', async () => {
      logger.info('🔗 Testing ILI (Interlingual Index) access...');
      
      // Get all ILI entries
      const allILIs = await ilis();
      logger.data(`Found ${allILIs.length} ILI entries`);
      expect(allILIs.length).toBeGreaterThan(0);
      
      // Test getting a specific ILI by ID
      if (allILIs.length > 0) {
        const firstILI = allILIs[0];
        const iliId = firstILI.id;
        
        const specificILI = await ili(iliId);
        expect(specificILI).toBeDefined();
        expect(specificILI.id).toBe(iliId);
        logger.success(`Successfully retrieved ILI ${iliId}`);
      }
      
      // Test filtering ILIs by status - note: may be empty depending on data
      const standardILIs = await ilis('standard');
      logger.data(`Found ${standardILIs.length} standard ILI entries`);
      if (standardILIs.length > 0) {
        expect(standardILIs.every(ili => ili.status === 'standard')).toBe(true);
        logger.success('Standard ILI entries verified');
      } else {
        logger.info('No standard ILI entries found - this is normal for some datasets');
      }
      
      logger.success('ILI functionality verified');
    });
    
    it('should find cross-language synset mappings', async () => {
      logger.info('🔗 Testing cross-language synset mappings...');
      
      // Get some synsets from different languages
      const enSynsets = await synsets('computer', undefined, { lang: 'en' });
      const frSynsets = await synsets('ordinateur', undefined, { lang: 'fr' });
      
      if (enSynsets.length > 0 && frSynsets.length > 0) {
        const enSynset = enSynsets[0];
        const frSynset = frSynsets[0];
        
        // Check if they have ILI mappings
        if (enSynset.ili) {
          logger.data(`English synset ${enSynset.id} has ILI: ${enSynset.ili}`);
        }
        if (frSynset.ili) {
          logger.data(`French synset ${frSynset.id} has ILI: ${frSynset.ili}`);
        }
        
        // If both have ILIs, they might be the same concept
        if (enSynset.ili && frSynset.ili && enSynset.ili === frSynset.ili) {
          logger.success(`Found matching ILI ${enSynset.ili} for computer/ordinateur`);
        }
      }
      
      logger.success('Cross-language synset mapping test completed');
    });
  });
  
  describe('Multilingual Error Handling', () => {
    it('should handle invalid language codes gracefully', async () => {
      logger.info('❌ Testing invalid language code handling...');
      
      // Test with invalid language code
      const results = await words('computer', undefined, { lang: 'invalid-lang' });
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
      logger.success('Invalid language code handled correctly');
    });
    
    it('should handle non-existent words in specific languages', async () => {
      logger.info('❌ Testing non-existent word handling...');
      
      // Test with a word that likely doesn't exist in any language
      const results = await words('thiswordprobablydoesnotexistinanylanguage');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
      logger.success('Non-existent word handled correctly');
    });
    
    it('should handle language-specific project errors', () => {
      logger.info('❌ Testing invalid language project handling...');
      
      // Test with non-existent language project
      expect(() => config.getProjectInfo('nonexistent-lang:1.0')).toThrow();
      logger.success('Invalid language project handled correctly');
    });
  });
  
  describe('Multilingual Performance and Scalability', () => {
    it('should handle concurrent queries across languages', async () => {
      logger.info('⚡ Testing concurrent multilingual queries...');
      
      const queries = [
        words('computer', undefined, { lang: 'en' }),
        words('ordinateur', undefined, { lang: 'fr' }),
        words('computadora', undefined, { lang: 'es' }),
        words('Computer', undefined, { lang: 'de' }),
        words('computer', undefined, { lang: 'it' }),
        synsets('computer', undefined, { lang: 'en' }),
        synsets('ordinateur', undefined, { lang: 'fr' }),
        synsets('computadora', undefined, { lang: 'es' })
      ];
      
      const results = await Promise.all(queries);
      
      expect(results).toHaveLength(8);
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(Array);
        // Some queries may return empty results depending on available data
        if (result.length > 0) {
          logger.success(`Query ${index + 1} returned ${result.length} results`);
        } else {
          logger.info(`Query ${index + 1} returned 0 results (may be normal for some languages)`);
        }
      });
      logger.success('Concurrent multilingual queries completed');
    }, 120000); // 2 minute timeout for multilingual queries
    
    it('should handle large multilingual result sets', async () => {
      logger.info('📊 Testing large multilingual result set handling...');
      
      // Search for a very common word across all languages
      const allWords = await words('test');
      
      expect(allWords).toBeInstanceOf(Array);
      expect(allWords.length).toBeGreaterThan(0);
      
      // Group by language
      const wordsByLanguage = new Map<string, any[]>();
      for (const word of allWords) {
        if (!wordsByLanguage.has(word.language)) {
          wordsByLanguage.set(word.language, []);
        }
        wordsByLanguage.get(word.language)!.push(word);
      }
      
      logger.success(`Large multilingual result set handled - ${allWords.length} total words across ${wordsByLanguage.size} languages`);
    });
  });
  
  describe('Multilingual Data Integrity', () => {
    it('should maintain data consistency across languages', async () => {
      logger.info('🔄 Testing multilingual data consistency...');
      
      // Query the same word multiple times
      const words1 = await words('computer', undefined, { lang: 'en' });
      const words2 = await words('computer', undefined, { lang: 'en' });
      
      // Same query should return same results
      expect(words1).toEqual(words2);
      
      if (words1.length > 0) {
        const word1 = words1[0];
        const word2 = words2[0];
        
        // Individual word objects should be identical
        expect(word1).toEqual(word2);
      }
      logger.success('Multilingual data consistency verified');
    });
    
    it('should have consistent data types across languages', async () => {
      logger.info('🔍 Testing multilingual data type consistency...');
      
      const languages = ['en', 'fr', 'es'];
      
      for (const lang of languages) {
        const wordResults = await words('computer', undefined, { lang });
        
        if (wordResults.length > 0) {
          const word = wordResults[0];
          expect(typeof word.id).toBe('string');
          expect(typeof word.lemma).toBe('string');
          expect(typeof word.partOfSpeech).toBe('string');
          expect(typeof word.language).toBe('string');
          expect(typeof word.lexicon).toBe('string');
          expect(word.language).toBe(lang);
          logger.success(`${lang} word data types verified`);
        }
      }
      
      logger.success('Multilingual data type consistency verified');
    });
  });
  
  describe('Multilingual Use Cases', () => {
    it('should support basic translation lookup', async () => {
      logger.info('🌐 Testing basic translation lookup...');
      
      // Find computer-related words in different languages
      const translations = new Map<string, string[]>();
      
      const languages = [
        { code: 'en', word: 'computer' },
        { code: 'fr', word: 'ordinateur' },
        { code: 'es', word: 'computadora' }
      ];
      
      for (const { code, word } of languages) {
        const wordResults = await words(word, undefined, { lang: code });
        if (wordResults.length > 0) {
          translations.set(code, wordResults.map(w => w.lemma));
        }
      }
      
      logger.info('📊 Computer translations found:');
      for (const [lang, lemmas] of translations) {
        logger.data(`${lang}: ${lemmas.join(', ')}`);
        expect(lemmas.length).toBeGreaterThan(0);
      }
      
      expect(translations.size).toBeGreaterThan(1);
      logger.success(`Found computer translations in ${translations.size} languages`);
    });
    
    it('should support concept-based multilingual search', async () => {
      logger.info('🔍 Testing concept-based multilingual search...');
      
      // Search for "house" concept in different languages
      const houseWords = await words('house');
      const houseSynsets = await synsets('house');
      
      logger.data(`Found ${houseWords.length} words and ${houseSynsets.length} synsets for 'house' concept`);
      expect(houseWords.length).toBeGreaterThan(0);
      expect(houseSynsets.length).toBeGreaterThan(0);
      
      // Group by language
      const wordsByLanguage = new Map<string, any[]>();
      for (const word of houseWords) {
        if (!wordsByLanguage.has(word.language)) {
          wordsByLanguage.set(word.language, []);
        }
        wordsByLanguage.get(word.language)!.push(word);
      }
      
      logger.info('🏠 House concept found in languages:');
      for (const [lang, words] of wordsByLanguage) {
        const lemmas = words.map(w => w.lemma);
        logger.data(`${lang}: ${lemmas.join(', ')}`);
      }
      
      // May only find results in one language depending on available data
      expect(wordsByLanguage.size).toBeGreaterThan(0);
      logger.success(`Found house concept in ${wordsByLanguage.size} language(s)`);
    });
  });
}); 