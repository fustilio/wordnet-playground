import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WordNetOrchestrator } from '../src/workers/wordnet-orchestrator.js';
import { createWordNetInstance } from '../src/factory.js';

// Hoist and create stateful mocks for functional testing
const { mockWordnet, mockDataLoader } = vi.hoisted(() => {
  const state = {
    loadedLexicons: new Set<string>(),
    downloadCount: 0,
    statistics: { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0 },
    words: new Map<string, any[]>(),
  };

  const updateStats = () => {
    const wordCount = state.loadedLexicons.size * 100;
    state.statistics = {
      totalWords: wordCount,
      totalSynsets: state.loadedLexicons.size * 50,
      totalSenses: state.loadedLexicons.size * 150,
      totalILIs: 0,
    };
  };

  return {
    mockWordnet: {
      initialize: vi.fn().mockResolvedValue(undefined),
      hasLoadedLexicons: vi.fn().mockImplementation(async () => state.loadedLexicons.size > 0),
      close: vi.fn().mockResolvedValue(undefined),
      words: vi.fn().mockImplementation(async (query?: any) => {
        const results: any[] = [];
        const form = query?.form;
        const pos = query?.pos;
        
        state.words.forEach((wordList, lexiconId) => {
          if (state.loadedLexicons.has(lexiconId)) {
            let filtered = wordList;
            if (form) {
              filtered = filtered.filter(w => w.lemma === form);
            }
            if (pos) {
              filtered = filtered.filter(w => w.pos === pos);
            }
            results.push(...filtered);
          }
        });
        return results;
      }),
      synsets: vi.fn().mockResolvedValue([]),
      senses: vi.fn().mockResolvedValue([]),
      getLexiconStatistics: vi.fn().mockImplementation(async () => {
        return Array.from(state.loadedLexicons).map(id => ({ lexiconId: id, wordCount: 100, synsetCount: 50 }));
      }),
      getStatistics: vi.fn().mockImplementation(async () => state.statistics),
    },
    mockDataLoader: {
      downloadAndLoad: vi.fn().mockImplementation(async (lexiconId: string) => {
        state.downloadCount++;
        state.loadedLexicons.add(lexiconId);
        state.words.set(lexiconId, [{ id: `w-${lexiconId}-test`, lemma: 'test', pos: 'n' }]);
        updateStats();
      }),
      clearAllData: vi.fn().mockImplementation(async () => {
        state.loadedLexicons.clear();
        state.words.clear();
        state.downloadCount = 0;
        updateStats();
      }),
      _state: state, // Expose state for test inspection
    },
  };
});

// Mock factory to return our stateful mocks
vi.mock('../src/factory.js', () => ({
  createWordNetInstance: vi.fn().mockResolvedValue({
    wordnet: mockWordnet,
    dataLoader: mockDataLoader,
  }),
}));

describe('WordNetOrchestrator Functional Tests', () => {
  let orchestrator: WordNetOrchestrator;
  const mockSqlModule = {} as any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock state before each test
    await mockDataLoader.clearAllData();
    orchestrator = new WordNetOrchestrator();
    await orchestrator.initialize(mockSqlModule);
  });

  afterEach(async () => {
    await orchestrator.close();
  });

  describe('Initialization', () => {
    it('should initialize and create a WordNet instance', async () => {
      // Test is simple: if `beforeEach` doesn't throw, it's initialized.
      expect(orchestrator.getWordNetInstance()).toBe(mockWordnet);
    });
  });

  describe('Lexicon Loading', () => {
    it('should load a lexicon, update its state, and trigger a download', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      const state = orchestrator.getLexiconState('oewn:2024');
      
      expect(state?.status).toBe('loaded');
      expect(mockDataLoader._state.downloadCount).toBe(1);
    });
    
    it('should not re-download an already loaded lexicon unless forced', async () => {
      // Initial load
      await orchestrator.loadLexicon('oewn:2024');
      expect(mockDataLoader._state.downloadCount).toBe(1);

      // Second load should be skipped
      await orchestrator.loadLexicon('oewn:2024');
      expect(mockDataLoader._state.downloadCount).toBe(1);

      // Forced reload
      await orchestrator.loadLexicon('oewn:2024', { forceRedownload: true });
      expect(mockDataLoader._state.downloadCount).toBe(2);
    });
  });

  describe('Querying', () => {
    it('should only return query results for lexicons that have been loaded', async () => {
      let words = await orchestrator.getWordNetInstance().words({ form: 'test', pos: 'n' });
      expect(words).toEqual([]); // No lexicons loaded yet

      await orchestrator.loadLexicon('oewn:2024');

      words = await orchestrator.getWordNetInstance().words({ form: 'test', pos: 'n' });
      expect(words).toHaveLength(1);
      expect(words[0].lemma).toBe('test');
    });
  });
  
  describe('Statistics', () => {
    it('should return statistics reflecting the state of loaded lexicons', async () => {
      let stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(0);
      expect(stats.totalLexicons).toBe(0);
      
      await orchestrator.loadLexicon('oewn:2024');

      stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(100);
      expect(stats.totalLexicons).toBe(1);
      expect(stats.lexiconBreakdown['oewn:2024']).toBeDefined();
      expect(stats.lexiconBreakdown['oewn:2024'].wordCount).toBe(100);
    });
  });

  describe('Data Management', () => {
    it('should clear all loaded data and reset internal state', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      expect(orchestrator.getLexiconStates().size).toBe(1);
      expect(mockDataLoader._state.downloadCount).toBe(1);

      await orchestrator.clearAllData();

      expect(orchestrator.getLexiconStates().size).toBe(0);
      expect(mockDataLoader._state.downloadCount).toBe(0);
      
      const stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(0);

      const words = await orchestrator.getWordNetInstance().words({ form: 'test' });
      expect(words).toEqual([]);
    });
  });
});
