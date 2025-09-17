import { bench, describe, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { add, remove } from '../src/data-management-new';
import { Wordnet } from '../src/wordnet';
import { getTestContext, cleanupTestContext } from 'wn-ts-core';
import type { TestContext } from 'wn-ts-core';

let testContext: TestContext;
let englishWordnet: Wordnet;
let frenchWordnet: Wordnet;
let thaiWordnet: Wordnet;

// Test data paths - using real sample data
const CORE_TEST_DATA_DIR = join(__dirname, '..', '..', 'wn-ts-core', 'test-data', 'xsd-samples');

describe('Realistic Bilingual Demo Performance', () => {
  beforeAll(async () => {
    testContext = await getTestContext();
    
    // Load realistic multilingual test data
    console.log('Loading multilingual test data...');
    
    // Load English WordNet (OEWN 2024)
    const enFilePath = join(CORE_TEST_DATA_DIR, 'oewn-2024', 'sample.xml');
    await add(enFilePath, { force: true });
    englishWordnet = new Wordnet('oewn');
    
    // Load French WordNet (OMW-FR 1.4)
    const frFilePath = join(CORE_TEST_DATA_DIR, 'omw-fr-1.4', 'sample.xml');
    await add(frFilePath, { force: true });
    frenchWordnet = new Wordnet('omw-fr');
    
    // Load Thai WordNet (OMW-TH 1.4)
    const thFilePath = join(CORE_TEST_DATA_DIR, 'omw-th-1.4', 'sample.xml');
    await add(thFilePath, { force: true });
    thaiWordnet = new Wordnet('omw-th');
    
    // Load CILI index
    const ciliFilePath = join(CORE_TEST_DATA_DIR, 'cili-1.0', 'sample.xml');
    await add(ciliFilePath, { force: true });
    
    console.log('Multilingual test data loaded successfully');
  });

  afterAll(async () => {
    // Clean up all loaded lexicons
    await remove('oewn');
    await remove('omw-fr');
    await remove('omw-th');
    await remove('cili');
    await cleanupTestContext();
  });

  describe('Individual Query Performance', () => {
    // Test individual query operations with realistic data
    
    bench('searchWordsInLexicon - English (OEWN)', async () => {
      await englishWordnet.words({ form: 'sample' });
    });

    bench('searchWordsInLexicon - French (OMW-FR)', async () => {
      await frenchWordnet.words({ form: 'sample' });
    });

    bench('searchWordsInLexicon - Thai (OMW-TH)', async () => {
      await thaiWordnet.words({ form: 'sample' });
    });

    bench('getSensesByWordIdOrForm - English', async () => {
      const words = await englishWordnet.words({ form: 'sample' });
      if (words.length > 0) {
        return await englishWordnet.senses({ word: words[0].id });
      }
    });

    bench('getSynsetById - English', async () => {
      const synsets = await englishWordnet.synsets({ form: 'sample' });
      if (synsets.length > 0) {
        return await englishWordnet.synset(synsets[0].id);
      }
    });

    bench('getDefinitionsBySynsetId - English', async () => {
      const synsets = await englishWordnet.synsets({ form: 'sample' });
      if (synsets.length > 0) {
        return await englishWordnet.definitions({ synset: synsets[0].id });
      }
    });

    bench('getIliForSynset - Extract ILI from synset', async () => {
      const synsets = await englishWordnet.synsets({ form: 'sample' });
      if (synsets.length > 0) {
        const synset = await englishWordnet.synset(synsets[0].id);
        if (synset && synset.ili) {
          return synset.ili;
        }
        // Fallback: extract ILI from synset ID
        return synsets[0].id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
      }
    });

    bench('getWordsByIliAndLanguage - Cross-lingual lookup', async () => {
      // Get ILI from English synset
      const enSynsets = await englishWordnet.synsets({ form: 'sample' });
      if (enSynsets.length === 0) return [];
      
      const enSynset = await englishWordnet.synset(enSynsets[0].id);
      const ili = enSynset?.ili || enSynsets[0].id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
      
      // Find words with same ILI in French
      const frWords = await frenchWordnet.words({ form: 'sample' });
      return frWords.filter(word => {
        // In real scenario, this would query by ILI
        // For now, we'll simulate by returning all French words
        return true;
      });
    });
  });

  describe('Bilingual Query Workflows', () => {
    // Test complete bilingual query workflows with realistic data
    
    bench('English to French bilingual query', async () => {
      const term = 'sample';
      const fromLang = 'en';
      const toLang = 'fr';
      
      const queryStartTime = Date.now();
      
      // Step 1: Find source words in English
      const srcWords = await englishWordnet.words({ form: term });
      if (srcWords.length === 0) return [];
      
      const results = [];
      
      // Process each source word
      for (const word of srcWords) {
        // Step 2: Get senses for each word
        const senses = await englishWordnet.senses({ word: word.id });
        
        for (const sense of senses) {
          // Step 3: Get synset
          const synset = await englishWordnet.synset(sense.synset);
          if (!synset) continue;
          
          // Step 4: Extract ILI
          const ili = synset.ili || synset.id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
          
          // Step 5: Find target language words with same ILI
          const targetWords = await frenchWordnet.words({ form: term }); // Simulated
          
          // Step 6: Get definitions
          const srcDefs = await englishWordnet.definitions({ synset: synset.id });
          const targetDefs = await frenchWordnet.definitions({ synset: synset.id }); // Simulated
          
          // Step 7: Add results
          for (const targetWord of targetWords) {
            results.push({
              source: word.lemma,
              target: targetWord.lemma,
              synsetId: synset.id,
              ili: ili,
              defFrom: srcDefs[0]?.text,
              defTo: targetDefs[0]?.text
            });
          }
        }
      }
      
      const queryTime = Date.now() - queryStartTime;
      
      return {
        term,
        pair: { from: fromLang, to: toLang },
        resultCount: results.length,
        queryTimeMs: queryTime,
        results: results.slice(0, 10)
      };
    });

    bench('English to Thai bilingual query', async () => {
      const term = 'sample';
      const fromLang = 'en';
      const toLang = 'th';
      
      const queryStartTime = Date.now();
      
      // Similar workflow as English to French
      const srcWords = await englishWordnet.words({ form: term });
      if (srcWords.length === 0) return [];
      
      const results = [];
      
      for (const word of srcWords) {
        const senses = await englishWordnet.senses({ word: word.id });
        
        for (const sense of senses) {
          const synset = await englishWordnet.synset(sense.synset);
          if (!synset) continue;
          
          const ili = synset.ili || synset.id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
          
          // Find Thai words with same ILI
          const targetWords = await thaiWordnet.words({ form: term }); // Simulated
          
          const srcDefs = await englishWordnet.definitions({ synset: synset.id });
          const targetDefs = await thaiWordnet.definitions({ synset: synset.id }); // Simulated
          
          for (const targetWord of targetWords) {
            results.push({
              source: word.lemma,
              target: targetWord.lemma,
              synsetId: synset.id,
              ili: ili,
              defFrom: srcDefs[0]?.text,
              defTo: targetDefs[0]?.text
            });
          }
        }
      }
      
      const queryTime = Date.now() - queryStartTime;
      
      return {
        term,
        pair: { from: fromLang, to: toLang },
        resultCount: results.length,
        queryTimeMs: queryTime,
        results: results.slice(0, 10)
      };
    });

    bench('Multi-language query with error handling', async () => {
      const terms = ['sample', 'test', 'example'];
      const allResults = [];
      
      for (const term of terms) {
        try {
          const queryStartTime = Date.now();
          
          // Find source words in English
          const srcWords = await englishWordnet.words({ form: term });
          if (srcWords.length === 0) continue;
          
          const termResults = [];
          
          for (const word of srcWords) {
            try {
              const senses = await englishWordnet.senses({ word: word.id });
              
              for (const sense of senses) {
                try {
                  const synset = await englishWordnet.synset(sense.synset);
                  if (!synset) continue;
                  
                  const ili = synset.ili || synset.id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
                  
                  // Try to find words in both French and Thai
                  const frWords = await frenchWordnet.words({ form: term });
                  const thWords = await thaiWordnet.words({ form: term });
                  
                  const srcDefs = await englishWordnet.definitions({ synset: synset.id });
                  
                  // Add French results
                  for (const frWord of frWords) {
                    termResults.push({
                      source: word.lemma,
                      target: frWord.lemma,
                      targetLang: 'fr',
                      synsetId: synset.id,
                      ili: ili,
                      defFrom: srcDefs[0]?.text
                    });
                  }
                  
                  // Add Thai results
                  for (const thWord of thWords) {
                    termResults.push({
                      source: word.lemma,
                      target: thWord.lemma,
                      targetLang: 'th',
                      synsetId: synset.id,
                      ili: ili,
                      defFrom: srcDefs[0]?.text
                    });
                  }
                } catch (e) {
                  // Sense processing failed, continue
                  continue;
                }
              }
            } catch (e) {
              // Word processing failed, continue
              continue;
            }
          }
          
          const queryTime = Date.now() - queryStartTime;
          
          allResults.push({
            term,
            resultCount: termResults.length,
            queryTimeMs: queryTime,
            results: termResults.slice(0, 5)
          });
        } catch (e) {
          // Term processing failed, continue
          continue;
        }
      }
      
      return allResults;
    });
  });

  describe('Performance Analysis', () => {
    // Analyze performance characteristics with realistic data
    
    bench('Query performance by word complexity', async () => {
      const testWords = [
        'sample',      // Simple word
        'information', // Medium complexity
        'responsibility', // High complexity
      ];
      
      const results = [];
      
      for (const word of testWords) {
        const startTime = Date.now();
        
        // Test word lookup
        const words = await englishWordnet.words({ form: word });
        const wordTime = Date.now() - startTime;
        
        if (words.length > 0) {
          const senseStartTime = Date.now();
          const senses = await englishWordnet.senses({ word: words[0].id });
          const senseTime = Date.now() - senseStartTime;
          
          const synsetStartTime = Date.now();
          const synsets = await englishWordnet.synsets({ form: word });
          const synsetTime = Date.now() - synsetStartTime;
          
          results.push({
            word,
            wordLength: word.length,
            wordCount: words.length,
            senseCount: senses.length,
            synsetCount: synsets.length,
            wordQueryTime: wordTime,
            senseQueryTime: senseTime,
            synsetQueryTime: synsetTime,
            totalTime: wordTime + senseTime + synsetTime
          });
        }
      }
      
      return results;
    });

    bench('Memory usage during multilingual queries', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple multilingual queries
      const terms = ['sample', 'test', 'example'];
      const results = [];
      
      for (const term of terms) {
        // English query
        const enWords = await englishWordnet.words({ form: term });
        
        // French query
        const frWords = await frenchWordnet.words({ form: term });
        
        // Thai query
        const thWords = await thaiWordnet.words({ form: term });
        
        results.push({
          term,
          enCount: enWords.length,
          frCount: frWords.length,
          thCount: thWords.length
        });
      }
      
      const finalMemory = process.memoryUsage();
      
      return {
        initialMemory,
        finalMemory,
        memoryDelta: {
          rss: finalMemory.rss - initialMemory.rss,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external
        },
        queriesProcessed: terms.length,
        results
      };
    });

    bench('Concurrent multilingual queries', async () => {
      const terms = ['sample', 'test', 'example'];
      
      const startTime = Date.now();
      
      // Run queries concurrently
      const promises = terms.map(async (term) => {
        const [enWords, frWords, thWords] = await Promise.all([
          englishWordnet.words({ form: term }),
          frenchWordnet.words({ form: term }),
          thaiWordnet.words({ form: term })
        ]);
        
        return {
          term,
          enCount: enWords.length,
          frCount: frWords.length,
          thCount: thWords.length
        };
      });
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      return {
        totalTime,
        queriesProcessed: terms.length,
        avgTimePerQuery: totalTime / terms.length,
        results
      };
    });
  });

  describe('Real-world Bilingual Demo Simulation', () => {
    // Simulate the actual bilingual demo with realistic data
    
    bench('Full bilingual demo workflow - water search', async () => {
      // This simulates the exact workflow from the bilingual demo
      const term = 'sample'; // Using 'sample' since it's in our test data
      const pair = { from: 'en', to: 'fr' };
      
      const queryStartTime = Date.now();
      
      // Step 1: Find source words in English
      const srcWords = await englishWordnet.words({ form: term });
      
      if (srcWords.length === 0) return [];
      
      const out = [];
      
      for (const w of srcWords) {
        const wordStartTime = Date.now();
        
        // Step 2: Get senses for each word
        const senses = await englishWordnet.senses({ word: w.id });
        const wordTime = Date.now() - wordStartTime;
        
        for (const s of senses) {
          // Step 3: Get synset
          const synset = await englishWordnet.synset(s.synset);
          if (!synset) continue;
          
          // Step 4: Extract ILI
          const ili = synset.ili || synset.id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
          
          // Step 5: Find target language words with same ILI
          const targetWords = await frenchWordnet.words({ form: term }); // Simulated
          
          if (targetWords.length === 0) continue;
          
          // Step 6: Get definitions
          let defFrom: string | undefined;
          let defTo: string | undefined;
          
          try {
            const defs = await englishWordnet.definitions({ synset: synset.id });
            defFrom = defs[0]?.text;
          } catch (e) {
            // Handle definition lookup failure
          }
          
          try {
            const targetSenses = await frenchWordnet.senses({ word: targetWords[0].id });
            if (targetSenses.length > 0) {
              const targetDefs = await frenchWordnet.definitions({ synset: targetSenses[0].synset });
              defTo = targetDefs[0]?.text;
            }
          } catch (e) {
            // Handle target definition lookup failure
          }
          
          // Step 7: Add results
          for (const tw of targetWords) {
            out.push({
              source: w.lemma,
              target: tw.lemma,
              synsetId: synset.id,
              ili: ili,
              defFrom,
              defTo
            });
          }
        }
      }
      
      const queryTime = Date.now() - queryStartTime;
      
      return {
        term,
        pair,
        resultCount: out.length,
        totalSourceWords: srcWords.length,
        queryTimeMs: queryTime,
        avgTimePerWord: Math.round(queryTime / srcWords.length),
        results: out.slice(0, 10)
      };
    });

    bench('Bilingual demo with comprehensive error handling', async () => {
      const term = 'sample';
      const pair = { from: 'en', to: 'th' };
      
      try {
        const queryStartTime = Date.now();
        
        // Find source words with error handling
        const srcWords = await englishWordnet.words({ form: term });
        
        if (srcWords.length === 0) {
          return { error: 'No source words found', resultCount: 0 };
        }
        
        const out = [];
        
        for (const w of srcWords) {
          try {
            const senses = await englishWordnet.senses({ word: w.id });
            
            for (const s of senses) {
              try {
                const synset = await englishWordnet.synset(s.synset);
                if (!synset) continue;
                
                const ili = synset.ili || synset.id.replace(/^[^-]+-/, 'i').replace(/-[a-z]$/, '');
                
                // Find target words with error handling
                const targetWords = await thaiWordnet.words({ form: term });
                
                if (targetWords.length === 0) continue;
                
                // Get definitions with error handling
                let defFrom: string | undefined;
                let defTo: string | undefined;
                
                try {
                  const defs = await englishWordnet.definitions({ synset: synset.id });
                  defFrom = defs[0]?.text;
                } catch (e) {
                  // Definition lookup failed, continue
                }
                
                try {
                  const targetSenses = await thaiWordnet.senses({ word: targetWords[0].id });
                  if (targetSenses.length > 0) {
                    const targetDefs = await thaiWordnet.definitions({ synset: targetSenses[0].synset });
                    defTo = targetDefs[0]?.text;
                  }
                } catch (e) {
                  // Target definition lookup failed, continue
                }
                
                // Add results
                for (const tw of targetWords) {
                  out.push({
                    source: w.lemma,
                    target: tw.lemma,
                    synsetId: synset.id,
                    ili: ili,
                    defFrom,
                    defTo
                  });
                }
              } catch (e) {
                // Sense processing failed, continue with next sense
                continue;
              }
            }
          } catch (e) {
            // Word processing failed, continue with next word
            continue;
          }
        }
        
        const queryTime = Date.now() - queryStartTime;
        
        return {
          term,
          pair,
          resultCount: out.length,
          totalSourceWords: srcWords.length,
          queryTimeMs: queryTime,
          avgTimePerWord: Math.round(queryTime / srcWords.length),
          results: out.slice(0, 10)
        };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : String(e),
          resultCount: 0
        };
      }
    });
  });
});
