/**
 * Comprehensive Query Performance Benchmarks
 * 
 * This file contains performance benchmarks for ALL WordNet query operations,
 * covering every query type tested in the e2e test suite. It provides a
 * complete performance overview of the WordNet query system.
 * 
 * ## Coverage
 * 
 * This benchmark suite covers:
 * - Basic Query Operations (words, synsets, senses, lexicons)
 * - Definition Queries (getDefinitions, definition access methods)
 * - Thesaurus Operations (synonyms, antonyms, hierarchies, semantic similarity)
 * - Translation Queries (cross-lingual lookups, ILI-based translation)
 * - Comprehensive Query Service Methods (direct service access)
 * - Performance and Scalability (concurrent queries, large result sets)
 * 
 * ## Purpose
 * 
 * These benchmarks provide a complete performance baseline for all WordNet
 * query operations, helping identify bottlenecks and validate performance
 * improvements across the entire query system.
 * 
 * ## Usage
 * 
 * Run all comprehensive query benchmarks:
 * ```bash
 * pnpm test:bench comprehensive
 * ```
 * 
 * Run specific benchmark categories:
 * ```bash
 * pnpm test:bench comprehensive --reporter=verbose
 * ```
 * 
 * ## Performance Expectations
 * 
 * Based on typical results:
 * - Basic queries: 1,000-10,000+ operations/second
 * - Definition queries: 500-5,000+ operations/second
 * - Thesaurus operations: 100-1,000+ operations/second
 * - Translation queries: 50-500+ operations/second
 * - Concurrent operations: Should scale linearly with parallelization
 * 
 * ## Data Requirements
 * 
 * This benchmark requires multiple datasets:
 * - OEWN:2024 (English)
 * - OMW-FR:1.4 (French)
 * - CILI:1.0 (Interlingual Index)
 * 
 * The setup function will automatically download and prepare all required data.
 */

import { bench, describe } from 'vitest';
import { Wordnet } from '../../src/wordnet';
import { setupTestEnvironment } from '../shared/test-setup';

let wordnetClient: Wordnet;
async function setupWordnet() {
  if (wordnetClient) {
    return;
  }

  const context = await setupTestEnvironment('comprehensive-queries', [
    'cili:1.0',
    'oewn:2024', 
    'omw-fr:1.4'
  ]);
  wordnetClient = context.wordnetClient;
  return;
}

describe('Comprehensive Query Performance Benchmarks', () => {
  
  describe('Word Query Performance Comparison', () => {
    describe('Basic Word Search Methods', () => {
      bench('words() - general search', async () => {
        await wordnetClient.words({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('wordsByForm() - optimized form search', async () => {
        await wordnetClient.wordsByForm('computer', { lexicon: 'oewn:2024' });
      }, { setup: setupWordnet });
    });

    describe('Word Search with POS Filters', () => {
      bench('noun search', async () => {
        await wordnetClient.words({ form: 'run', pos: 'n' });
      }, { setup: setupWordnet });

      bench('verb search', async () => {
        await wordnetClient.words({ form: 'run', pos: 'v' });
      }, { setup: setupWordnet });

      bench('adjective search', async () => {
        await wordnetClient.words({ form: 'beautiful', pos: 'a' });
      }, { setup: setupWordnet });

      bench('adverb search', async () => {
        await wordnetClient.words({ form: 'quickly', pos: 'r' });
      }, { setup: setupWordnet });
    });

    describe('Word Search with Different Filters', () => {
      bench('no filters', async () => {
        await wordnetClient.words({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('with lexicon filter', async () => {
        await wordnetClient.words({ form: 'computer', lexicon: 'oewn' });
      }, { setup: setupWordnet });

      bench('with language filter', async () => {
        await wordnetClient.words({ form: 'computer', language: 'en' });
      }, { setup: setupWordnet });

      bench('with maxResults limit', async () => {
        await wordnetClient.words({ form: 'computer', maxResults: 5 });
      }, { setup: setupWordnet });
    });

    describe('Word Search Types', () => {
      bench('exact search', async () => {
        await wordnetClient.words({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('fuzzy search', async () => {
        await wordnetClient.words({ 
          form: 'comput', 
          fuzzy: true, 
          maxResults: 10 
        });
      }, { setup: setupWordnet });
    });

    describe('Word Lookup Methods', () => {
      bench('search then get by ID', async () => {
        const allWords = await wordnetClient.words({ maxResults: 1 });
        if (allWords.length > 0) {
          const firstWord = allWords[0];
          if (firstWord) {
            await wordnetClient.getWord(firstWord.id);
          }
        }
      }, { setup: setupWordnet });

      bench('direct getWord by ID', async () => {
        // Use a known word ID for consistent testing
        await wordnetClient.getWord('w-00000001-n');
      }, { setup: setupWordnet });
    });
  });

  describe('Synset Query Performance Comparison', () => {
    describe('Synset Search with POS Filters', () => {
      bench('noun synsets', async () => {
        await wordnetClient.synsets({ form: 'light', pos: 'n' });
      }, { setup: setupWordnet });

      bench('verb synsets', async () => {
        await wordnetClient.synsets({ form: 'run', pos: 'v' });
      }, { setup: setupWordnet });

      bench('adjective synsets', async () => {
        await wordnetClient.synsets({ form: 'light', pos: 'a' });
      }, { setup: setupWordnet });

      bench('adverb synsets', async () => {
        await wordnetClient.synsets({ form: 'quickly', pos: 'r' });
      }, { setup: setupWordnet });
    });

    describe('Synset Search with Different Filters', () => {
      bench('no filters', async () => {
        await wordnetClient.synsets({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('with lexicon filter', async () => {
        await wordnetClient.synsets({ form: 'computer', lexicon: 'oewn' });
      }, { setup: setupWordnet });

      bench('with language filter', async () => {
        await wordnetClient.synsets({ form: 'computer', language: 'en' });
      }, { setup: setupWordnet });

      bench('with maxResults limit', async () => {
        await wordnetClient.synsets({ form: 'computer', maxResults: 3 });
      }, { setup: setupWordnet });
    });

    describe('Synset Lookup Methods', () => {
      bench('search then get by ID', async () => {
        const allSynsets = await wordnetClient.synsets({ maxResults: 1 });
        if (allSynsets.length > 0) {
          const firstSynset = allSynsets[0];
          if (firstSynset) {
            await wordnetClient.getSynset(firstSynset.id);
          }
        }
      }, { setup: setupWordnet });

      bench('direct getSynset by ID', async () => {
        // Use a known synset ID for consistent testing
        await wordnetClient.getSynset('s-00000001-n');
      }, { setup: setupWordnet });
    });

    describe('Synset with Definitions Access', () => {
      bench('definitions via synset object', async () => {
        const synsets = await wordnetClient.synsets({ form: 'information' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            // Access definitions to ensure they're loaded
            synset.definitions;
          }
        }
      }, { setup: setupWordnet });

      bench('definitions via getDefinitions method', async () => {
        const synsets = await wordnetClient.synsets({ form: 'information' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            await wordnetClient.getDefinitions(synset.id);
          }
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Sense Query Performance Comparison', () => {
    describe('Sense Search Methods', () => {
      bench('search by word form', async () => {
        await wordnetClient.senses({ wordIdOrForm: 'computer' });
      }, { setup: setupWordnet });

      bench('search by word ID', async () => {
        const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
        if (words.length > 0) {
          const word = words[0];
          if (word) {
            await wordnetClient.senses({ wordIdOrForm: word.id });
          }
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Metadata Query Performance Comparison', () => {
    describe('Lexicon Queries', () => {
      bench('list all lexicons', async () => {
        await wordnetClient.lexicons();
      }, { setup: setupWordnet });
    });

    describe('ILI Queries', () => {
      bench('list all ILIs', async () => {
        await wordnetClient.ilis();
      }, { setup: setupWordnet });

      bench('list ILIs with type filter', async () => {
        await wordnetClient.ilis('standard');
      }, { setup: setupWordnet });
    });

    describe('Cross-Lingual Lookups', () => {
      bench('get words by ILI and English', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli, 'en');
        }
      }, { setup: setupWordnet });

      bench('get words by ILI and French', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli, 'fr');
        }
      }, { setup: setupWordnet });

      bench('get words by ILI without language filter', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli);
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Definition Query Performance Comparison', () => {
    describe('Definition Access Methods', () => {
      bench('via synset object property', async () => {
        const synsets = await wordnetClient.synsets({ form: 'water' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            // Access definitions property
            synset.definitions;
          }
        }
      }, { setup: setupWordnet });

      bench('via getDefinitions method', async () => {
        const synsets = await wordnetClient.synsets({ form: 'water' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            await wordnetClient.getDefinitions(synset.id);
          }
        }
      }, { setup: setupWordnet });

      bench('via query service', async () => {
        const synsets = await wordnetClient.synsets({ form: 'house' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            const queryService = await wordnetClient.getQueryService();
            await queryService.getDefinitionsBySynsetId(synset.id);
          }
        }
      }, { setup: setupWordnet });
    });

    describe('Definition Queries by POS', () => {
      bench('noun definitions', async () => {
        const synsets = await wordnetClient.synsets({ form: 'computer', pos: 'n' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            await wordnetClient.getDefinitions(synset.id);
          }
        }
      }, { setup: setupWordnet });

      bench('verb definitions', async () => {
        const synsets = await wordnetClient.synsets({ form: 'run', pos: 'v' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            await wordnetClient.getDefinitions(synset.id);
          }
        }
      }, { setup: setupWordnet });

      bench('adjective definitions', async () => {
        const synsets = await wordnetClient.synsets({ form: 'happy', pos: 'a' });
        if (synsets.length > 0) {
          const synset = synsets[0];
          if (synset) {
            await wordnetClient.getDefinitions(synset.id);
          }
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Thesaurus Query Performance Comparison', () => {
    describe('Synonym Discovery by POS', () => {
      bench('noun synonyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'happy', pos: 'a' });
        for (const synset of synsets) {
          const synsetWords = await wordnetClient.getSynsetWords(synset.id);
          // Filter out the original word to get synonyms
          synsetWords.filter(w => w.lemma !== 'happy');
        }
      }, { setup: setupWordnet });

      bench('verb synonyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'run', pos: 'v' });
        for (const synset of synsets) {
          const synsetWords = await wordnetClient.getSynsetWords(synset.id);
          synsetWords.filter(w => w.lemma !== 'run');
        }
      }, { setup: setupWordnet });

      bench('adjective synonyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'beautiful', pos: 'a' });
        for (const synset of synsets) {
          const synsetWords = await wordnetClient.getSynsetWords(synset.id);
          synsetWords.filter(w => w.lemma !== 'beautiful');
        }
      }, { setup: setupWordnet });
    });

    describe('Semantic Relationship Discovery', () => {
      bench('hypernyms and hyponyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'animal', pos: 'n' });
        for (const synset of synsets) {
          const relations = synset.relations || [];
          for (const relation of relations) {
            if (relation.type === 'hypernym' || relation.type === 'hyponym') {
              const targetSynset = await wordnetClient.getSynsetById(relation.target);
              if (targetSynset) {
                await wordnetClient.getSynsetWords(targetSynset.id);
              }
            }
          }
        }
      }, { setup: setupWordnet });

      bench('coordinate terms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'car', pos: 'n' });
        for (const synset of synsets) {
          const relations = synset.relations || [];
          for (const relation of relations) {
            if (relation.type === 'coordinate') {
              const targetSynset = await wordnetClient.getSynsetById(relation.target);
              if (targetSynset) {
                await wordnetClient.getSynsetWords(targetSynset.id);
              }
            }
          }
        }
      }, { setup: setupWordnet });

      bench('antonyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'happy', pos: 'a' });
        for (const synset of synsets) {
          const relations = synset.relations || [];
          for (const relation of relations) {
            if (relation.type === 'antonym' || relation.type === 'opposite') {
              const targetSynset = await wordnetClient.getSynsetById(relation.target);
              if (targetSynset) {
                await wordnetClient.getSynsetWords(targetSynset.id);
              }
            }
          }
        }
      }, { setup: setupWordnet });

      bench('meronyms', async () => {
        const synsets = await wordnetClient.synsets({ form: 'car', pos: 'n' });
        for (const synset of synsets) {
          const relations = synset.relations || [];
          for (const relation of relations) {
            if (relation.type === 'meronym' || relation.type === 'part_meronym' || relation.type === 'member_meronym') {
              const targetSynset = await wordnetClient.getSynsetById(relation.target);
              if (targetSynset) {
                await wordnetClient.getSynsetWords(targetSynset.id);
              }
            }
          }
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Cross-Lingual Query Performance Comparison', () => {
    describe('Language-Specific Word Searches', () => {
      bench('English words', async () => {
        await wordnetClient.words({ form: 'computer', language: 'en' });
      }, { setup: setupWordnet });

      bench('French words', async () => {
        await wordnetClient.words({ form: 'ordinateur', language: 'fr' });
      }, { setup: setupWordnet });
    });

    describe('Language-Specific Synset Searches', () => {
      bench('English synsets', async () => {
        await wordnetClient.synsets({ form: 'computer', language: 'en' });
      }, { setup: setupWordnet });

      bench('French synsets', async () => {
        await wordnetClient.synsets({ form: 'ordinateur', language: 'fr' });
      }, { setup: setupWordnet });
    });

    describe('ILI-Based Translation Methods', () => {
      bench('ILI to English words', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli, 'en');
        }
      }, { setup: setupWordnet });

      bench('ILI to French words', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli, 'fr');
        }
      }, { setup: setupWordnet });

      bench('ILI to all languages', async () => {
        const allILIs = await wordnetClient.ilis();
        if (allILIs.length > 0) {
          const sampleIli = allILIs[0]!.id;
          await wordnetClient.getWordsByIliAndLanguage(sampleIli);
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Query Service Performance Comparison', () => {
    describe('Direct Service Access Methods', () => {
      bench('getWordsByIds', async () => {
        const queryService = await wordnetClient.getQueryService();
        const words = await wordnetClient.words({ maxResults: 3 });
        if (words.length > 0) {
          const wordIds = words.map(w => w.id);
          await queryService.getWordsByIds(wordIds);
        }
      }, { setup: setupWordnet });

      bench('getSynsets by lexicon', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsets({ lexicon: 'oewn', maxResults: 5 });
      }, { setup: setupWordnet });

      bench('getSensesByWordId', async () => {
        const queryService = await wordnetClient.getQueryService();
        const testWords = await wordnetClient.words({ form: 'computer', maxResults: 1 });
        if (testWords.length > 0) {
          await queryService.getSensesByWordId(testWords[0]!.id);
        }
      }, { setup: setupWordnet });
    });

    describe('Individual Entity Retrieval', () => {
      bench('getWordById', async () => {
        const queryService = await wordnetClient.getQueryService();
        const words = await wordnetClient.words({ maxResults: 1 });
        if (words.length > 0) {
          await queryService.getWordById(words[0]!.id);
        }
      }, { setup: setupWordnet });

      bench('getSynsetById', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await wordnetClient.synsets({ maxResults: 1 });
        if (synsets.length > 0) {
          await queryService.getSynsetById(synsets[0]!.id);
        }
      }, { setup: setupWordnet });

      bench('getSenseById', async () => {
        const queryService = await wordnetClient.getQueryService();
        const senses = await wordnetClient.senses({ wordIdOrForm: 'computer' });
        if (senses.length > 0) {
          await queryService.getSenseById(senses[0]!.id);
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Concurrent Query Performance Comparison', () => {
    describe('Mixed Query Types', () => {
      bench('sequential queries', async () => {
        await wordnetClient.words({ form: 'computer' });
        await wordnetClient.synsets({ form: 'house' });
        await wordnetClient.senses({ wordIdOrForm: 'water' });
        await wordnetClient.lexicons();
      }, { setup: setupWordnet });

      bench('concurrent queries', async () => {
        const queries = [
          wordnetClient.words({ form: 'computer' }),
          wordnetClient.synsets({ form: 'house' }),
          wordnetClient.senses({ wordIdOrForm: 'water' }),
          wordnetClient.lexicons(),
        ];
        await Promise.all(queries);
      }, { setup: setupWordnet });
    });

    describe('Definition Query Concurrency', () => {
      bench('sequential definition queries', async () => {
        const synsets = await wordnetClient.synsets({ form: 'test' });
        if (synsets.length > 0) {
          await wordnetClient.getDefinitions(synsets[0]!.id);
          await wordnetClient.getDefinitions(synsets[0]!.id);
          await wordnetClient.getDefinitions(synsets[0]!.id);
        }
      }, { setup: setupWordnet });

      bench('concurrent definition queries', async () => {
        const synsets = await wordnetClient.synsets({ form: 'test' });
        if (synsets.length > 0) {
          const queries = Array(3).fill(null).map(() => 
            wordnetClient.getDefinitions(synsets[0]!.id)
          );
          await Promise.all(queries);
        }
      }, { setup: setupWordnet });
    });
  });
});
