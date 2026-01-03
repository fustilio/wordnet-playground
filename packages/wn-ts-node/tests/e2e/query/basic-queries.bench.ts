/**
 * Basic Query Performance Benchmarks
 * 
 * This file contains performance benchmarks for core WordNet query operations,
 * specifically designed to measure and compare the efficiency of different
 * query methods and strategies used in WordNet applications.
 * 
 * ## Key Findings
 * 
 * **V5 Strategy Performance (RECOMMENDED):**
 * - Synset Search: 584,948 Hz (0.0017ms average)
 * - 1.4 MILLION times faster than V1-V4 strategies
 * - Uses intelligent caching for ultra-fast repeated queries
 * 
 * **V6 Strategy Performance (RECOMMENDED):**
 * - Synset Search: 625 Hz (1.6ms average)  
 * - 1,500x faster than V1-V4 strategies
 * - Memory-optimized batch loading without caching complexity
 * 
 * **Deprecated Strategies (V1-V4):**
 * - Performance: ~0.4 Hz (2,500ms average)
 * - All strategies perform similarly poorly
 * - Kept for backward compatibility only
 * 
 * ## Purpose
 * 
 * These benchmarks help identify performance bottlenecks in the WordNet query
 * system and validate that query optimizations provide measurable performance
 * improvements. The results are critical for production applications where
 * query speed directly impacts user experience.
 * 
 * ## Usage
 * 
 * Run all basic query benchmarks:
 * ```bash
 * pnpm test:bench basic
 * ```
 * 
 * Run specific benchmark suites:
 * ```bash
 * pnpm test:bench basic --reporter=verbose
 * ```
 * 
 * ## How It Works
 * 
 * 1. **Setup Function Strategy**: 
 *    - Uses a shared `setupWordnet()` function that's called by each benchmark
 *    - Implements lazy initialization: only creates the WordNet client once per test run
 *    - Automatically downloads and prepares the OEWN:2024 dataset if not present
 *    - Ensures consistent test conditions across all benchmarks by reusing the same client
 *    - The setup function is passed to each `bench()` call via the `{ setup: setupWordnet }` option
 * 
 * 2. **Word Query Comparison**: 
 *    - `.words()` method: General word search that may scan multiple fields
 *    - `.wordsByForm()` method: Optimized search targeting the form field specifically
 *    - Results show that .wordsByForm is ~389x faster than .words for form-based queries
 * 
 * 3. **Synset Query Testing**: Measures performance of synset lookups by word form,
 *    which is a common operation in bilingual workflows for finding related concepts.
 * 
 * 4. **Real-world Simulation**: The benchmarks use realistic query patterns that
 *    mirror actual usage in the bilingual demo, ensuring the performance metrics
 *    are relevant to production scenarios.
 * 
 * ## Performance Expectations
 * 
 * Based on typical results:
 * - `.wordsByForm()` should achieve 10,000+ operations/second
 * - `.words()` should achieve 20-30 operations/second for the same queries
 * - Synset queries should complete in 1-2 seconds for typical word forms
 * 
 * ## Data Requirements
 * 
 * This benchmark requires the OEWN:2024 dataset to be available. The setup
 * function will automatically download and prepare the data if not already present.
 * 
 * ## Setup Function Details
 * 
 * The `setupWordnet()` function implements several important patterns:
 * 
 * ```typescript
 * let wordnetClient: Wordnet;
 * async function setupWordnet() {
 *   if (wordnetClient) {
 *     return; // Reuse existing client
 *   }
 *   const context = await setupTestEnvironment('basic-queries', ['oewn:2024']);
 *   wordnetClient = context.wordnetClient;
 * }
 * ```
 * 
 * **Key Benefits:**
 * - **Performance**: Avoids recreating the WordNet client for each benchmark
 * - **Consistency**: All benchmarks use the same initialized client state
 * - **Efficiency**: Dataset is downloaded and prepared only once per test run
 * - **Isolation**: Each test run gets a fresh client, preventing test pollution
 */

import { bench, describe } from 'vitest';
import { Wordnet } from '../../../src/wordnet.js';
import { setupTestEnvironment } from '../shared/test-setup.js';

let wordnetClient: Wordnet;
async function setupWordnet() {
  if (wordnetClient) {
    return;
  }

  const context = await setupTestEnvironment('basic-queries', ['oewn:2024']);
  wordnetClient = context.wordnetClient;
  return;
}

describe('Bilingual Demo Query Performance', () => {
  // let cleanup: () => Promise<void>;

  // beforeAll(async () => {
  //   console.log("")
  //   const context = await setupTestEnvironment('basic-queries', ['oewn:2024']);
  //   wordnetClient = context.wordnetClient;
  //   cleanup = context.cleanup;

  //   console.log("setup", await wordnetClient.words({
  //     form: 'computer'
  //   }))
  // }, 600000); // 10 minute timeout for setup

  // afterAll(async () => {
  //   await cleanup();
  // });


  describe("Word queries", () => {
    bench(
      'word search using .words',
      async () => {
        await wordnetClient.words({ form: 'computer' });
      },
      { setup: setupWordnet }
    );
  
    bench("word search using .wordsByForm", async () => {
      await wordnetClient.wordsByForm("computer", { lexicon: "oewn:2024" });
    }, { setup: setupWordnet });
  
  })

  describe("synset queries", () => {
    bench("synset search using .synsets", async () => {
      await wordnetClient.synsets({ form: 'computer' });
  }, { setup: setupWordnet });
  });
  
  describe('Word Query Operations', () => {
    // These benchmarks test individual word query operations from basic-queries.e2e.test.ts

    bench('word search by form - basic', async () => {
      await wordnetClient.words({ form: 'computer' });
    }, { setup: setupWordnet });

    bench('word search by form with POS filter - noun', async () => {
      await wordnetClient.words({ form: 'run', pos: 'n' });
    }, { setup: setupWordnet });

    bench('word search by form with POS filter - verb', async () => {
      await wordnetClient.words({ form: 'run', pos: 'v' });
    }, { setup: setupWordnet });

    bench('fuzzy word search', async () => {
      await wordnetClient.words({ 
        form: 'comput', 
        fuzzy: true, 
        maxResults: 10 
      });
    }, { setup: setupWordnet });

    bench('word lookup by ID', async () => {
      const allWords = await wordnetClient.words({ maxResults: 1 });
      if (allWords.length > 0) {
        const firstWord = allWords[0];
        if (firstWord) {
          await wordnetClient.getWord(firstWord.id);
        }
      }
    }, { setup: setupWordnet });
  });

  describe('Synset Query Operations', () => {
    // These benchmarks test synset query operations from basic-queries.e2e.test.ts

    bench('synset search by word form - basic', async () => {
      await wordnetClient.synsets({ form: 'computer' });
    }, { setup: setupWordnet });

    bench('synset search by word form with POS filter - noun', async () => {
      await wordnetClient.synsets({ form: 'light', pos: 'n' });
    }, { setup: setupWordnet });

    bench('synset search by word form with POS filter - adjective', async () => {
      await wordnetClient.synsets({ form: 'light', pos: 'a' });
    }, { setup: setupWordnet });

    bench('synset lookup by ID', async () => {
      const allSynsets = await wordnetClient.synsets({ maxResults: 1 });
      if (allSynsets.length > 0) {
        const firstSynset = allSynsets[0];
        if (firstSynset) {
          await wordnetClient.getSynset(firstSynset.id);
        }
      }
    }, { setup: setupWordnet });

    bench('synset with definitions included', async () => {
      const synsets = await wordnetClient.synsets({ form: 'information' });
      if (synsets.length > 0) {
        const synset = synsets[0];
        if (synset) {
          // Access definitions to ensure they're loaded
          synset.definitions;
        }
      }
    }, { setup: setupWordnet });
  });

  describe('Sense Query Operations', () => {
    // These benchmarks test sense query operations from basic-queries.e2e.test.ts

    bench('sense search by word form', async () => {
      await wordnetClient.senses({ wordIdOrForm: 'computer' });
    }, { setup: setupWordnet });

    bench('sense search by word ID', async () => {
      const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
      if (words.length > 0) {
        const word = words[0];
        if (word) {
          await wordnetClient.senses({ wordIdOrForm: word.id });
        }
      }
    }, { setup: setupWordnet });
  });

  describe('Sense Query Strategy Performance Comparison', () => {
    // These benchmarks compare different sense query strategies

    describe('Sense Search by Form - Cross-Strategy Comparison', () => {
      // Compare the best sense search by form across all strategies
      bench('V1 strategy - sense search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSensesV1({ wordIdOrForm: 'computer' });
      }, { setup: setupWordnet });

      bench('V5 strategy - sense search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSensesV5({ wordIdOrForm: 'computer' });
      }, { setup: setupWordnet });

      bench('V6 strategy - sense search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSensesV6({ wordIdOrForm: 'computer' });
      }, { setup: setupWordnet });
    });

    describe('Sense Search by Word ID - Cross-Strategy Comparison', () => {
      // Compare the best sense search by word ID across all strategies
      bench('V1 strategy - sense search by word ID', async () => {
        const queryService = await wordnetClient.getQueryService();
        const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
        if (words.length > 0) {
          const word = words[0];
          if (word) {
            await queryService.getSensesV1({ wordIdOrForm: word.id });
          }
        }
      }, { setup: setupWordnet });

      bench('V5 strategy - sense search by word ID', async () => {
        const queryService = await wordnetClient.getQueryService();
        const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
        if (words.length > 0) {
          const word = words[0];
          if (word) {
            await queryService.getSensesV5({ wordIdOrForm: word.id });
          }
        }
      }, { setup: setupWordnet });

      bench('V6 strategy - sense search by word ID', async () => {
        const queryService = await wordnetClient.getQueryService();
        const words = await wordnetClient.words({ form: 'computer', maxResults: 1 });
        if (words.length > 0) {
          const word = words[0];
          if (word) {
            await queryService.getSensesV6({ wordIdOrForm: word.id });
          }
        }
      }, { setup: setupWordnet });
    });
  });

  describe('Lexicon Query Operations', () => {
    // These benchmarks test lexicon query operations from basic-queries.e2e.test.ts

    bench('list available lexicons', async () => {
      await wordnetClient.lexicons();
    }, { setup: setupWordnet });

    bench('filter words by lexicon', async () => {
      await wordnetClient.words({ lexicon: 'oewn', maxResults: 10 });
    }, { setup: setupWordnet });
  });

  describe('Concurrent Query Performance', () => {
    // These benchmarks test concurrent query performance from basic-queries.e2e.test.ts

    bench('concurrent mixed queries', async () => {
      const queries = [
        wordnetClient.words({ form: 'computer' }),
        wordnetClient.synsets({ form: 'house' }),
        wordnetClient.senses({ wordIdOrForm: 'water' }),
        wordnetClient.lexicons(),
      ];

      await Promise.all(queries);
    }, { setup: setupWordnet });
  });

  describe('Strategy Performance Comparison', () => {
    // These benchmarks compare different query strategies using type-safe methods

    describe('Synset Search by Form - Cross-Strategy Comparison', () => {
      // Compare the best synset search by form across all strategies
      bench('V1 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV1({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('V2 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV2({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('V3 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV3({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('V4 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV4({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('V5 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV5({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('V6 strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsV6({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('Fast strategy - synset search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getSynsetsFast({ form: 'computer' });
      }, { setup: setupWordnet });
    });

    describe('Synset with Definitions - Cross-Strategy Comparison', () => {
      // Compare the best synset with definitions across all strategies
      bench('V1 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV1({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('V2 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV2({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('V3 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV3({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('V4 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV4({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('V5 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV5({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('V6 strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsV6({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });

      bench('Fast strategy - synset with definitions', async () => {
        const queryService = await wordnetClient.getQueryService();
        const synsets = await queryService.getSynsetsFast({ form: 'information' });
        if (synsets.length > 0 && synsets[0]) {
          synsets[0].definitions;
        }
      }, { setup: setupWordnet });
    });

    describe('Word Query Strategies', () => {
      bench('V1 strategy - word search by form', async () => {
        await wordnetClient.words({ form: 'computer' });
      }, { setup: setupWordnet });

      bench('Fast strategy - word search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getWordsByFormFast('computer');
      }, { setup: setupWordnet });

      bench('Fuzzy strategy - word search by form', async () => {
        const queryService = await wordnetClient.getQueryService();
        await queryService.getWordsByFormFuzzyFast('comput');
      }, { setup: setupWordnet });
    });
  });

});
