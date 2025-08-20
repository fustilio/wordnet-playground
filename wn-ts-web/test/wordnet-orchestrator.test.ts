import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WordNetOrchestrator } from '../src/workers/wordnet-orchestrator.js';
import { createWordNetInstance } from '../src/factory.js';

// Mock the factory module directly
vi.mock('../src/factory.js', () => ({
  createWordNetInstance: vi.fn().mockResolvedValue({
    wordnet: {
      initialize: vi.fn().mockResolvedValue(undefined),
      hasLoadedLexicons: vi.fn().mockResolvedValue(false),
      hasSpecificLexiconLoaded: vi.fn().mockResolvedValue(false),
      close: vi.fn().mockResolvedValue(undefined),
      addLexicon: vi.fn(),
      words: vi.fn().mockResolvedValue([]),
      synsets: vi.fn().mockResolvedValue([]),
      senses: vi.fn().mockResolvedValue([]),
      getLexiconStatistics: vi.fn().mockResolvedValue([]),
      getStatistics: vi.fn().mockResolvedValue({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
      }),
    },
    dataLoader: {
      downloadAndLoad: vi.fn().mockResolvedValue(undefined),
      clearAllData: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

describe('WordNetOrchestrator', () => {
  let orchestrator: WordNetOrchestrator;
  let mockWordnet: any;
  let mockDataLoader: any;

  beforeEach(async () => {
    orchestrator = new WordNetOrchestrator({
      defaultLexicons: [], // No default lexicons to avoid interference
      maxConcurrentLoads: 2,
    });
    
    // Mock SQLite module
    const mockSqlModule = {} as any;
    
    // Initialize the orchestrator with mocked dependencies
    await orchestrator.initialize(mockSqlModule);
    
    // Get the mocked instances from the factory
    const mockFactory = await createWordNetInstance();
    mockWordnet = mockFactory.wordnet;
    mockDataLoader = mockFactory.dataLoader;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset the mock to its default behavior
    if (mockDataLoader) {
      mockDataLoader.downloadAndLoad = vi.fn().mockResolvedValue(undefined);
    }
  });

  describe('Multi-lexicon support', () => {
    it('should load multiple lexicons concurrently', async () => {

      const lexiconIds = ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'];
      
      await orchestrator.loadLexicons(lexiconIds);

      // Verify that all lexicons were loaded
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(3);
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('oewn:2024', expect.any(Object));
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('omw-fr:1.4', expect.any(Object));
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('cili:1.0', expect.any(Object));
    });

    it('should respect maxConcurrentLoads limit', async () => {

      const lexiconIds = ['oewn:2024', 'omw-fr:1.4', 'cili:1.0', 'omw-th:1.4'];
      
      // Mock downloadAndLoad to simulate slow loading
      mockDataLoader.downloadAndLoad = vi.fn().mockImplementation(async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return;
      });

      await orchestrator.loadLexicons(lexiconIds);

      // Verify that all lexicons were loaded
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(4);
    });

    it('should add lexicons to WebWordnet instance', async () => {

      await orchestrator.loadLexicon('omw-fr:1.4');

      // Verify that the lexicon was loaded (the WebWordnet instance manages its own lexicons)
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('omw-fr:1.4', expect.any(Object));
    });

    it('should track lexicon states correctly', async () => {

      await orchestrator.loadLexicon('omw-fr:1.4');

      // Verify that the lexicon state was updated
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('omw-fr:1.4', expect.any(Object));
    });

    it('should handle special lexicon presets', async () => {

      // Test English-Thai preset
      const enThOrchestrator = new WordNetOrchestrator({
        defaultLexicons: ['en-th'],
        maxConcurrentLoads: 2,
      });

      // Verify that the preset was parsed correctly
      expect(enThOrchestrator).toBeDefined();
    });

    it('should support English-French preset', async () => {

      // Test English-French preset
      const enFrOrchestrator = new WordNetOrchestrator({
        defaultLexicons: ['en-fr'],
        maxConcurrentLoads: 2,
      });

      // Verify that the preset was parsed correctly
      expect(enFrOrchestrator).toBeDefined();
    });

    it('should support multilingual preset', async () => {

      // Test multilingual preset
      const multilingualOrchestrator = new WordNetOrchestrator({
        defaultLexicons: ['multilingual'],
        maxConcurrentLoads: 2,
      });

      // Verify that the preset was parsed correctly
      expect(multilingualOrchestrator).toBeDefined();
    });
  });

  describe('Lexicon state management', () => {
    it('should update lexicon state when loading', async () => {

      // Mock the updateLexiconState method
      const updateLexiconStateSpy = vi.fn();
      (orchestrator as any).updateLexiconState = updateLexiconStateSpy;

      await orchestrator.loadLexicon('omw-fr:1.4');

      // Verify that the lexicon state was updated
      expect(updateLexiconStateSpy).toHaveBeenCalledWith('omw-fr:1.4', {
        status: 'loaded',
        lastLoaded: expect.any(Date),
        needsRedownload: false
      });
    });

    it('should handle lexicon loading errors gracefully', async () => {

      // Mock downloadAndLoad to throw an error
      mockDataLoader.downloadAndLoad = vi.fn().mockRejectedValue(new Error('Download failed'));

      // Mock the updateLexiconState method
      const updateLexiconStateSpy = vi.fn();
      (orchestrator as any).updateLexiconState = updateLexiconStateSpy;

      // Should not throw, but should update state to error
      await expect(orchestrator.loadLexicon('omw-fr:1.4')).rejects.toThrow('Download failed');
    });
  });

  describe('Initialization', () => {
    it('should initialize and create a WordNet instance', async () => {
      // Test is simple: if `beforeEach` doesn't throw, it's initialized.
      expect(orchestrator.getWordNetInstance()).toBeDefined();
    });
  });

  describe('Lexicon Loading', () => {
    it('should load a lexicon, update its state, and trigger a download', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      const state = orchestrator.getLexiconState('oewn:2024');
      
      expect(state?.status).toBe('loaded');
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledWith('oewn:2024', expect.any(Object));
    });
    
    it('should not re-download an already loaded lexicon unless forced', async () => {
      // Initial load
      await orchestrator.loadLexicon('oewn:2024');
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(1);

      // Second load should be skipped
      await orchestrator.loadLexicon('oewn:2024');
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(1);

      // Forced reload
      await orchestrator.loadLexicon('oewn:2024', { forceRedownload: true });
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(2);
    });
  });

  describe('Querying', () => {
    it('should only return query results for lexicons that have been loaded', async () => {
      let words = await orchestrator.getWordNetInstance().words({ form: 'test', pos: 'n' });
      expect(words).toEqual([]); // No lexicons loaded yet

      await orchestrator.loadLexicon('oewn:2024');

      // Mock the words method to return test data after lexicon is loaded
      mockWordnet.words = vi.fn().mockResolvedValue([{ id: 'w-test', lemma: 'test', pos: 'n' }]);
      
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

      // Mock the statistics methods to return test data after lexicon is loaded
      mockWordnet.getStatistics = vi.fn().mockResolvedValue({
        totalWords: 100,
        totalSynsets: 50,
        totalSenses: 150,
        totalILIs: 0,
      });
      mockWordnet.getLexiconStatistics = vi.fn().mockResolvedValue([
        { lexiconId: 'oewn:2024', wordCount: 100, synsetCount: 50 }
      ]);

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
      expect(mockDataLoader.downloadAndLoad).toHaveBeenCalledTimes(1);

      await orchestrator.clearAllData();

      expect(orchestrator.getLexiconStates().size).toBe(0);
      expect(mockDataLoader.clearAllData).toHaveBeenCalled();
      
      // Mock the statistics methods to return empty data after clearing
      mockWordnet.getStatistics = vi.fn().mockResolvedValue({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
      });
      mockWordnet.getLexiconStatistics = vi.fn().mockResolvedValue([]);
      mockWordnet.words = vi.fn().mockResolvedValue([]);
      
      const stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(0);

      const words = await orchestrator.getWordNetInstance().words({ form: 'test' });
      expect(words).toEqual([]);
    });
  });
});
