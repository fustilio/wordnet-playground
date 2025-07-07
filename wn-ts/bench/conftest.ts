import { describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Synset, Word, Sense } from '../src/types';

export interface MockData {
  synsets: Synset[];
  words: Word[];
  senses: Sense[];
}

export interface TestContext {
  dataDir: string;
  mockData: MockData;
  cleanup: () => Promise<void>;
}

/**
 * Generate mock synsets for benchmarking
 */
export function makeMockSynsets(pos: string, count: number): Synset[] {
  const synsets: Synset[] = [];
  
  for (let i = 1; i <= count; i++) {
    const synset: Synset = {
      id: `${i}-${pos}`,
      partOfSpeech: pos as any,
      ili: undefined,
      definitions: [],
      examples: [],
      relations: [],
      language: 'zxx',
      lexicon: 'mock',
      members: [],
      senses: [],
    };
    synsets.push(synset);
  }

  // Add relations for nouns and verbs
  if (pos === 'n' || pos === 'v') {
    let targetIndex = 1;
    const cycle = [2]; // how many targets to relate
    let cycleIndex = 0;
    
    for (let currentIndex = 0; currentIndex < synsets.length; currentIndex++) {
      if (targetIndex <= currentIndex) {
        targetIndex = currentIndex + 1;
      }
      
      const source = synsets[currentIndex];
      const targetCount = cycle[cycleIndex % cycle.length];
      
      for (let k = targetIndex; k < targetIndex + targetCount; k++) {
        if (k >= synsets.length) break;
        
        const target = synsets[k];
        
        // Add hyponym relation from source to target
        source.relations.push({
          id: `rel-${source.id}-${target.id}-hypo`,
          type: 'hyponym',
          target: target.id,
        });
        
        // Add hypernym relation from target to source
        target.relations.push({
          id: `rel-${target.id}-${source.id}-hyper`,
          type: 'hypernym',
          target: source.id,
        });
      }
      
      targetIndex = targetIndex + targetCount;
      cycleIndex++;
    }
  }

  return synsets;
}

/**
 * Generate mock words for benchmarking
 */
export function* generateWords(): Generator<string> {
  const consonants = 'kgtdpbfvszrlmnhw';
  const vowels = 'aeiou';
  
  for (const c1 of consonants) {
    for (const v1 of vowels) {
      for (const c2 of consonants) {
        for (const v2 of vowels) {
          yield `${c1}${v1}${c2}${v2}`;
        }
      }
    }
  }
}

/**
 * Generate mock lexical entries
 */
export function makeMockEntries(synsets: Synset[]): { words: Word[], senses: Sense[] } {
  const words = generateWords();
  const wordsArray: Word[] = [];
  const sensesArray: Sense[] = [];
  const entriesMap = new Map<string, Word>();
  
  let memberCount = 1;
  const prevSynsets: Synset[] = [];
  
  for (const synset of synsets) {
    const synsetId = synset.id;
    const pos = synset.partOfSpeech;
    
    for (let i = 0; i < memberCount; i++) {
      const wordStr = words.next().value;
      const senses: Sense[] = [
        {
          id: `${wordStr}-${synsetId}`,
          word: `${wordStr}-${pos}`,
          synset: synsetId,
          counts: [],
          examples: [],
          tags: [],
        }
      ];
      
      // Add some polysemy
      if (prevSynsets.length > 0) {
        const prevSynset = prevSynsets.pop()!;
        senses.push({
          id: `${wordStr}-${prevSynset.id}`,
          word: `${wordStr}-${pos}`,
          synset: prevSynset.id,
          counts: [],
          examples: [],
          tags: [],
        });
      }
      
      const entryId = `${wordStr}-${pos}`;
      if (!entriesMap.has(entryId)) {
        const word: Word = {
          id: entryId,
          lemma: wordStr,
          partOfSpeech: pos,
          language: 'zxx',
          lexicon: 'mock',
          forms: [],
          tags: [],
          pronunciations: [],
          counts: [],
        };
        
        wordsArray.push(word);
        entriesMap.set(entryId, word);
      }
      
      sensesArray.push(...senses);
    }
    
    prevSynsets.push(synset);
    memberCount = (memberCount % 3) + 1; // Cycle through 1, 2, 3
  }
  
  return {
    words: wordsArray,
    senses: sensesArray,
  };
}

/**
 * Create mock data for benchmarking
 */
export function createMockData(): MockData {
  const synsets = [
    ...makeMockSynsets('n', 20000),
    ...makeMockSynsets('v', 10000),
    ...makeMockSynsets('a', 2000),
    ...makeMockSynsets('r', 1000),
  ];
  
  const { words, senses } = makeMockEntries(synsets);
  
  return {
    synsets,
    words,
    senses,
  };
}

/**
 * Setup test context with temporary directory and mock data
 */
export async function setupTestContext(): Promise<TestContext> {
  const dataDir = await mkdtemp(join(tmpdir(), 'wn-ts-bench-'));
  const mockData = createMockData();
  
  const cleanup = async () => {
    try {
      await rm(dataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  };
  
  return {
    dataDir,
    mockData,
    cleanup,
  };
}

/**
 * Global test context for benchmarks
 */
let globalTestContext: TestContext | null = null;

export async function getTestContext(): Promise<TestContext> {
  if (!globalTestContext) {
    globalTestContext = await setupTestContext();
  }
  return globalTestContext;
}

export async function cleanupTestContext(): Promise<void> {
  if (globalTestContext) {
    await globalTestContext.cleanup();
    globalTestContext = null;
  }
} 