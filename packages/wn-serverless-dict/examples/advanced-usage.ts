/**
 * Advanced usage examples for wn-serverless-dict
 * Demonstrates plugins, batch processing, caching, and storage adapters
 */

import { Wordnet } from 'wn-ts-node';
import {
  generateDictionary,
  globalRegistry,
  StatisticsPlugin,
  FilterPlugin,
  CachePlugin,
  StorageManager,
  JsonStorageAdapter,
  ESModuleStorageAdapter,
  MemoryStorageAdapter,
  createDictionary,
  type GeneratorOptions
} from '../src/index.js';

/**
 * Example 1: Using plugins for enhanced generation
 */
async function exampleWithPlugins() {
  console.log('\n=== Example 1: Using Plugins ===\n');

  // Register plugins
  const statsPlugin = new StatisticsPlugin();
  const filterPlugin = new FilterPlugin({
    minWordLength: 3,
    maxWordLength: 20,
    posWhitelist: ['n', 'v', 'a'], // Only nouns, verbs, adjectives
    excludePatterns: [/^\d+$/] // Exclude pure numbers
  });

  await globalRegistry.register(statsPlugin, { priority: 1 });
  await globalRegistry.register(filterPlugin, { priority: 2 });

  // Generate dictionary with plugins
  const wordnet = new Wordnet('*');
  const options: GeneratorOptions = {
    languages: ['en', 'fr'],
    pos: ['n', 'v', 'a'],
    limit: 500,
    batch: {
      chunkSize: 100,
      onProgress: (info) => {
        console.log(`  Progress: ${info.progress}% - ${info.step}`);
      }
    }
  };

  const dictionary = await generateDictionary(wordnet, options);

  // Get statistics from plugin
  const stats = statsPlugin.getStatistics();
  console.log('\nGeneration Statistics:');
  console.log(`  Total synsets: ${stats?.totalSynsets}`);
  console.log(`  Total words: ${stats?.totalWords}`);
  console.log(`  Avg words/synset: ${stats?.avgWordsPerSynset.toFixed(2)}`);
  console.log(`  Generation time: ${stats?.generationTime}ms`);
  console.log(`  Filtered entries: ${filterPlugin.getFilteredCount()}`);

  // Cleanup
  await globalRegistry.clear();
}

/**
 * Example 2: Using storage adapters with fallback
 */
async function exampleWithStorageAdapters() {
  console.log('\n=== Example 2: Storage Adapters ===\n');

  // Create storage manager with multiple adapters
  const storageManager = new StorageManager({
    primary: new JsonStorageAdapter({ compress: true, pretty: false }),
    fallbacks: [
      new ESModuleStorageAdapter(),
      new MemoryStorageAdapter()
    ],
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000
  });

  // Generate a small dictionary
  const wordnet = new Wordnet('*');
  const dictionary = await generateDictionary(wordnet, {
    languages: ['en'],
    pos: ['n'],
    limit: 100
  });

  // Save with automatic fallback
  try {
    await storageManager.save(dictionary, './output/dict.json.gz');
    console.log('Dictionary saved successfully');

    // Check if it exists
    const exists = await storageManager.exists('./output/dict.json.gz');
    console.log(`Dictionary exists: ${exists}`);

    // Get metadata
    const metadata = await storageManager.getMetadata('./output/dict.json.gz');
    console.log(`Size: ${(metadata.size / 1024).toFixed(2)} KB`);
    console.log(`Compressed: ${metadata.compressed}`);

    // Load it back
    const loadedDict = await storageManager.load('./output/dict.json.gz');
    console.log(`Loaded dictionary with ${loadedDict.m.c} synsets`);
  } catch (error) {
    console.error('Storage operation failed:', error);
  }
}

/**
 * Example 3: Using runtime caching for better performance
 */
async function exampleWithCaching() {
  console.log('\n=== Example 3: Runtime Caching ===\n');

  // Generate dictionary
  const wordnet = new Wordnet('*');
  const dictData = await generateDictionary(wordnet, {
    languages: ['en'],
    pos: ['n', 'v'],
    limit: 200
  });

  // Create dictionary instance with caching enabled
  const dict = createDictionary(dictData, {
    enableCache: true,
    enableMultiLevelCache: true,
    cacheOptions: {
      maxSize: 500,
      ttl: 300000 // 5 minutes
    }
  });

  // Warm up cache with common words
  dict.warmCache([
    { word: 'computer', lang: 'en' },
    { word: 'person', lang: 'en' },
    { word: 'water', lang: 'en' },
    { word: 'time', lang: 'en' }
  ]);

  // Perform lookups (first call: cache miss, subsequent: cache hit)
  console.time('First lookup');
  const result1 = dict.lookup('computer', 'en');
  console.timeEnd('First lookup');
  console.log(`Found ${result1.count} synsets for "computer"`);

  console.time('Cached lookup');
  const result2 = dict.lookup('computer', 'en');
  console.timeEnd('Cached lookup');

  // Get cache statistics
  const stats = dict.getStats();
  console.log('\nCache Statistics:');
  console.log(`  Cache hits: ${stats.cache?.hits || 0}`);
  console.log(`  Cache misses: ${stats.cache?.misses || 0}`);
  console.log(`  Cache size: ${stats.cache?.size || 0}`);
  console.log(`  Hit rate: ${stats.cache?.hitRate?.toFixed(2) || 0}%`);
}

/**
 * Example 4: Combining all features
 */
async function exampleAllFeatures() {
  console.log('\n=== Example 4: All Features Combined ===\n');

  // 1. Register plugins
  const statsPlugin = new StatisticsPlugin();
  const cachePlugin = new CachePlugin({
    enableL1: true,
    enableL2: true,
    l1MaxSize: 1000,
    warmWords: [
      { word: 'computer', lang: 'en' },
      { word: 'person', lang: 'en' }
    ]
  });

  await globalRegistry.register(statsPlugin);
  await globalRegistry.register(cachePlugin);

  // 2. Generate with batch processing
  const wordnet = new Wordnet('*');
  const dictionary = await generateDictionary(wordnet, {
    languages: ['en', 'th'],
    pos: ['n', 'v'],
    limit: 500,
    batch: {
      chunkSize: 50,
      onProgress: (info) => {
        const bar = '█'.repeat(Math.floor(info.progress / 5)) +
                     '░'.repeat(20 - Math.floor(info.progress / 5));
        console.log(`  [${bar}] ${info.progress}%`);
      }
    }
  });

  // 3. Save with storage manager
  const storage = new StorageManager({
    primary: new JsonStorageAdapter({ compress: true }),
    fallbacks: [new MemoryStorageAdapter()]
  });

  await storage.save(dictionary, './output/en-th-advanced.json.gz');

  // 4. Get statistics
  const stats = statsPlugin.getStatistics();
  console.log('\nFinal Statistics:');
  console.log(`  Synsets: ${stats?.totalSynsets}`);
  console.log(`  Words: ${stats?.totalWords}`);
  console.log(`  Generation time: ${stats?.generationTime}ms`);
  console.log(`  Memory: ${stats?.estimatedMemoryKB.toFixed(1)} KB`);

  // Cleanup
  await globalRegistry.clear();
}

/**
 * Example 5: Custom plugin
 */
async function exampleCustomPlugin() {
  console.log('\n=== Example 5: Custom Plugin ===\n');

  // Define a custom plugin that adds tags to entries
  const customPlugin = {
    meta: {
      name: 'tag-adder',
      version: '1.0.0',
      description: 'Adds custom tags to dictionary entries'
    },
    hooks: {
      afterBuild: async (data: any) => {
        console.log('[CustomPlugin] Adding tags to dictionary metadata');
        data.m.tags = ['custom', 'tagged', 'v1.0'];
        data.m.customField = 'Custom data from plugin';
        return data;
      }
    }
  };

  await globalRegistry.register(customPlugin);

  const wordnet = new Wordnet('*');
  const dictionary = await generateDictionary(wordnet, {
    languages: ['en'],
    pos: ['n'],
    limit: 50
  });

  console.log('Custom tags added:', (dictionary.m as any).tags);
  console.log('Custom field:', (dictionary.m as any).customField);

  await globalRegistry.clear();
}

// Run examples
async function runExamples() {
  try {
    // Uncomment the examples you want to run:
    // await exampleWithPlugins();
    // await exampleWithStorageAdapters();
    // await exampleWithCaching();
    // await exampleAllFeatures();
    // await exampleCustomPlugin();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use in other files
export {
  exampleWithPlugins,
  exampleWithStorageAdapters,
  exampleWithCaching,
  exampleAllFeatures,
  exampleCustomPlugin
};

// Run if executed directly
if (require.main === module) {
  runExamples();
}
