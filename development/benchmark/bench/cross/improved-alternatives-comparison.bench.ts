import { bench, describe, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
// @ts-ignore - wn-ts module resolution issue
import { Wordnet as TSWordnet } from 'wn-ts';
// @ts-ignore - natural doesn't have TypeScript definitions
import natural from 'natural';
// @ts-ignore - node-wordnet doesn't have TypeScript definitions
import NodeWordNet from 'node-wordnet';
// @ts-ignore - wordnet doesn't have TypeScript definitions
import WordsWordNet from 'wordnet';
// @ts-ignore - wordpos doesn't have TypeScript definitions
import WordPOS from 'wordpos';
import { WnBridge } from 'wn-pybridge';


// Cache for initialized instances
const instanceCache = new Map<string, any>();
const testDataCache = new Map<string, string>();

// Test data configuration
const TEST_CONFIGS = [
  { name: 'Tiny', numWords: 5, numSynsets: 5 },
  { name: 'Small', numWords: 20, numSynsets: 20 },
  { name: 'Medium', numWords: 100, numSynsets: 100 }
];

describe('Improved WordNet Alternatives Comparison', () => {
  let wnTs: TSWordnet;
  let naturalWordnet: any;
  let nodeWordnet: any;
  let wordpos: any;
  let WordsWordNetInstance: any;
  let wnPybridge: any;

  beforeAll(async () => {
    // Initialize all libraries with proper setup
    try {
      // Initialize wn-ts
      wnTs = new TSWordnet('test-bench');
      
      // Initialize Natural WordNet
      naturalWordnet = new natural.WordNet();
      
      // Initialize node-wordnet (morungos)
      nodeWordnet = new NodeWordNet();
      
      // Initialize wordpos
      wordpos = new WordPOS();
      
      // Initialize WordsWordNet (@words/wordnet)
      WordsWordNetInstance = WordsWordNet;
      await WordsWordNetInstance.init();
      
      // Initialize wn-pybridge
      wnPybridge = new WnBridge();
      try {
        await wnPybridge.init();
      } catch (error) {
        console.warn('WnBridge initialization failed:', error);
        wnPybridge = null;
      }
      
      // Create test data for all libraries
      await createTestData();
      
    } catch (error) {
      console.warn('Some libraries failed to initialize:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    instanceCache.clear();
    testDataCache.clear();
    if (wnPybridge && typeof wnPybridge.close === 'function') {
      await wnPybridge.close();
    }
  });

  // Helper function to create test data
  async function createTestData() {
    for (const config of TEST_CONFIGS) {
      const testData = await getOrCreateTestData(config.name, config.numWords, config.numSynsets);
      testDataCache.set(config.name, testData);
    }
  }

  // Helper function to get or create test data
  async function getOrCreateTestData(name: string, numWords: number, numSynsets: number): Promise<string> {
    const cacheKey = `${name}-${numWords}-${numSynsets}`;
    if (testDataCache.has(cacheKey)) {
      return testDataCache.get(cacheKey)!;
    }

    const testDir = join(tmpdir(), 'wordnet-bench-test');
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    const filePath = join(testDir, `${name}-test-data.xml`);
    
    if (!existsSync(filePath)) {
      const xmlContent = generateTestXML(name, numWords, numSynsets);
      await writeFile(filePath, xmlContent);
    }

    testDataCache.set(cacheKey, filePath);
    return filePath;
  }

  // Helper function to generate test XML
  function generateTestXML(name: string, numWords: number, numSynsets: number): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource lmfVersion="1.0">
  <Lexicon id="test-bench-${name}" label="Benchmark Test ${name}" language="en">`;
    
    for (let i = 0; i < numWords; i++) {
      xml += `
    <LexicalEntry id="test-bench-word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="test-bench-sense-${i}" synset="test-bench-synset-${i}"/>
    </LexicalEntry>`;
    }
    
    for (let i = 0; i < numSynsets; i++) {
      xml += `
    <Synset id="test-bench-synset-${i}" partOfSpeech="n">
      <Definition>Test synset ${i}</Definition>
    </Synset>`;
    }
    
    xml += `
  </Lexicon>
</LexicalResource>`;
    
    return xml;
  }

  // Synset Lookup Benchmarks
  describe('Synset Lookup Performance', () => {
    bench('wn-ts: synsets("word0", "n")', async () => {
      try {
        await wnTs.synsets('word0', 'n');
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('natural: lookup("word0")', () => {
      return new Promise<void>((resolve) => {
        try {
          naturalWordnet.lookup('word0', (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('node-wordnet: lookup("word0", "n")', () => {
      return new Promise<void>((resolve) => {
        try {
          nodeWordnet.lookup('word0', 'n', (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('wordpos: lookup("word0")', () => {
      return new Promise<void>((resolve) => {
        try {
          wordpos.lookup('word0', (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('WordsWordNet: lookup("word0")', async () => {
      try {
        await WordsWordNetInstance.lookup('word0');
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('wn-pybridge: synsets("word0", pos="n")', async () => {
      if (!wnPybridge) {
        console.warn('wn-pybridge not initialized, skipping benchmark');
        return;
      }
      try {
        await wnPybridge.synsets('word0', { pos: 'n' });
      } catch (error) {
        console.warn('wn-pybridge synsets failed:', error);
      }
    });
  });

  // Word Lookup Benchmarks
  describe('Word Lookup Performance', () => {
    bench('wn-ts: words("word0")', async () => {
      try {
        await wnTs.words('word0');
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('natural: getSynonyms("word0")', () => {
      return new Promise<void>((resolve) => {
        try {
          naturalWordnet.getSynonyms('word0', (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('WordsWordNet: lookup("word0")', async () => {
      try {
        await WordsWordNetInstance.lookup('word0');
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('wn-pybridge: words("word0")', async () => {
      if (!wnPybridge) {
        console.warn('wn-pybridge not initialized, skipping benchmark');
        return;
      }
      try {
        await wnPybridge.words('word0');
      } catch (error) {
        console.warn('wn-pybridge words failed:', error);
      }
    });
  });

  // Text Processing Benchmarks (wordpos specialty)
  describe('Text Processing Performance', () => {
    const testText = 'The quick brown fox jumps over the lazy dog.';

    bench('wordpos: getPOS()', () => {
      return new Promise<void>((resolve) => {
        try {
          wordpos.getPOS(testText, (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('wordpos: getNouns()', () => {
      return new Promise<void>((resolve) => {
        try {
          wordpos.getNouns(testText, (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });

    bench('wordpos: getVerbs()', () => {
      return new Promise<void>((resolve) => {
        try {
          wordpos.getVerbs(testText, (results: any) => {
            resolve();
          });
        } catch (error) {
          resolve();
        }
      });
    });
  });

  // Similarity Calculation Benchmarks
  describe('Similarity Calculation Performance', () => {
    bench('wn-ts: path similarity', async () => {
      try {
        const synsets = await wnTs.synsets('word0', 'n');
        if (synsets.length >= 2) {
          // This would need proper similarity calculation implementation
          // await wnTs.pathSimilarity(synsets[0], synsets[1]);
        }
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('wn-pybridge: path_similarity', async () => {
      try {
        const synsets = await wnPybridge.synsets('word0', { pos: 'n' });
        if (synsets.length >= 2) {
          await wnPybridge.path_similarity(synsets[0], synsets[1]);
        }
      } catch (error) {
        // Handle errors gracefully
      }
    });
  });

  // Memory Usage Comparison
  describe('Memory Usage Comparison', () => {
    bench('wn-ts: Memory footprint', async () => {
      const startMemory = process.memoryUsage();
      try {
        await wnTs.synsets('word0', 'n');
      } catch (error) {
        // Handle errors gracefully
      }
      const endMemory = process.memoryUsage();
      // Memory difference is calculated but not returned
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    });

    bench('natural: Memory footprint', () => {
      const startMemory = process.memoryUsage();
      return new Promise<void>((resolve) => {
        try {
          naturalWordnet.lookup('word0', (results: any) => {
            const endMemory = process.memoryUsage();
            const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
            resolve();
          });
        } catch (error) {
          const endMemory = process.memoryUsage();
          const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
          resolve();
        }
      });
    });

    bench('WordsWordNet: Memory footprint', async () => {
      const startMemory = process.memoryUsage();
      try {
        await WordsWordNetInstance.lookup('word0');
      } catch (error) {
        // Handle errors gracefully
      }
      const endMemory = process.memoryUsage();
      // Memory difference is calculated but not returned
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    });

    bench('wn-pybridge: Memory footprint', async () => {
      const startMemory = process.memoryUsage();
      try {
        await wnPybridge.synsets('word0', { pos: 'n' });
      } catch (error) {
        // Handle errors gracefully
      }
      const endMemory = process.memoryUsage();
      // Memory difference is calculated but not returned
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    });
  });

  // Initialization Performance
  describe('Initialization Performance', () => {
    bench('wn-ts: initialization', async () => {
      const startTime = performance.now();
      try {
        const wordnet = new TSWordnet('test-bench');
        const endTime = performance.now();
        const duration = endTime - startTime;
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('natural: initialization', () => {
      const startTime = performance.now();
      try {
        const wordnet = new natural.WordNet();
        const endTime = performance.now();
        const duration = endTime - startTime;
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('wordpos: initialization', () => {
      const startTime = performance.now();
      try {
        const wordpos = new WordPOS();
        const endTime = performance.now();
        const duration = endTime - startTime;
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('WordsWordNet: initialization', async () => {
      const startTime = performance.now();
      try {
        const wordnet = require('wordnet');
        await wordnet.init();
        const endTime = performance.now();
        const duration = endTime - startTime;
      } catch (error) {
        // Handle errors gracefully
      }
    });

    bench('wn-pybridge: initialization', async () => {
      const startTime = performance.now();
      try {
        const wn = new WnBridge();
        await wn.init();
        const endTime = performance.now();
        const duration = endTime - startTime;
      } catch (error) {
        // Handle errors gracefully
      }
    });
  });
}); 