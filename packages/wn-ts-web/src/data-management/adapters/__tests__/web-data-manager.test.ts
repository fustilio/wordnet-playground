/**
 * Tests for WebDataManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebDataManager } from '../web-data-manager.js';
import type { WebDataManagerConfig } from '../web-data-manager.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WebDataManager', () => {
  let dataManager: WebDataManager;
  let mockConfig: WebDataManagerConfig;

  beforeEach(() => {
    mockConfig = {
      database: {
        getQueryService: vi.fn().mockReturnValue({
          database: {} as any,
          getLexicons: vi.fn().mockResolvedValue([]),
        }),
      },
      wordnet: {
        getQueryService: vi.fn().mockReturnValue({
          database: {} as any,
          getLexicons: vi.fn().mockResolvedValue([]),
        }),
      },
    };
    dataManager = new WebDataManager(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create data manager with valid config', () => {
      expect(dataManager).toBeInstanceOf(WebDataManager);
    });
  });

  describe('parseILI', () => {
    it('should parse ILI content correctly', async () => {
      const iliContent = 'ili-1\tDefinition 1\tactive\nili-2\tDefinition 2\tactive\n';
      
      const result = await dataManager.parseILI(iliContent);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'ili-1',
        definition: 'Definition 1',
        status: 'active',
      });
      expect(result[1]).toEqual({
        id: 'ili-2',
        definition: 'Definition 2',
        status: 'active',
      });
    });
  });

  describe('ensureDependenciesLoaded', () => {
    it('should skip dependency loading for non-dependent lexicons', async () => {
      // Mock the private method
      const isDependentLexiconSpy = vi.spyOn(dataManager as any, 'isDependentLexicon')
        .mockReturnValue(false);

      await (dataManager as any).ensureDependenciesLoaded('oewn:2024');

      expect(isDependentLexiconSpy).toHaveBeenCalledWith('oewn:2024');
    });

    it('should load English WordNet dependency for dependent lexicons', async () => {
      // Mock the private methods
      const isDependentLexiconSpy = vi.spyOn(dataManager as any, 'isDependentLexicon')
        .mockReturnValue(true);
      const getLoadedDependenciesSpy = vi.spyOn(dataManager as any, 'getLoadedDependencies')
        .mockResolvedValue(new Set());

      // Mock the downloadAndLoad method
      const downloadAndLoadSpy = vi.spyOn(dataManager, 'downloadAndLoad')
        .mockResolvedValue();

      await (dataManager as any).ensureDependenciesLoaded('omw-fr:1.4');

      expect(isDependentLexiconSpy).toHaveBeenCalledWith('omw-fr:1.4');
      expect(getLoadedDependenciesSpy).toHaveBeenCalled();
      expect(downloadAndLoadSpy).toHaveBeenCalledWith('oewn:2024');
    });

    it('should skip loading if English WordNet is already loaded', async () => {
      // Mock the private methods
      const isDependentLexiconSpy = vi.spyOn(dataManager as any, 'isDependentLexicon')
        .mockReturnValue(true);
      const getLoadedDependenciesSpy = vi.spyOn(dataManager as any, 'getLoadedDependencies')
        .mockResolvedValue(new Set(['oewn:2024']));

      // Mock the downloadAndLoad method
      const downloadAndLoadSpy = vi.spyOn(dataManager, 'downloadAndLoad')
        .mockResolvedValue();

      await (dataManager as any).ensureDependenciesLoaded('omw-fr:1.4');

      expect(isDependentLexiconSpy).toHaveBeenCalledWith('omw-fr:1.4');
      expect(getLoadedDependenciesSpy).toHaveBeenCalled();
      expect(downloadAndLoadSpy).not.toHaveBeenCalled();
    });

    it('should handle dependency loading errors gracefully', async () => {
      // Mock the private methods
      const isDependentLexiconSpy = vi.spyOn(dataManager as any, 'isDependentLexicon')
        .mockReturnValue(true);
      const getLoadedDependenciesSpy = vi.spyOn(dataManager as any, 'getLoadedDependencies')
        .mockResolvedValue(new Set());

      // Mock the downloadAndLoad method to throw an error
      const downloadAndLoadSpy = vi.spyOn(dataManager, 'downloadAndLoad')
        .mockRejectedValue(new Error('Download failed'));

      // Should not throw, but log the error
      await expect((dataManager as any).ensureDependenciesLoaded('omw-fr:1.4')).resolves.not.toThrow();

      expect(downloadAndLoadSpy).toHaveBeenCalledWith('oewn:2024');
    });
  });

  describe('isDependentLexicon', () => {
    it('should identify dependent lexicons correctly', () => {
      const isDependentLexicon = (dataManager as any).isDependentLexicon;

      expect(isDependentLexicon('omw-fr:1.4')).toBe(true);
      expect(isDependentLexicon('omw-de:1.4')).toBe(true);
      expect(isDependentLexicon('omw-ja:1.4')).toBe(true);
      expect(isDependentLexicon('omw-zh:1.4')).toBe(true);
      expect(isDependentLexicon('omw-es:1.4')).toBe(true);
      expect(isDependentLexicon('omw-it:1.4')).toBe(true);
      expect(isDependentLexicon('omw-pt:1.4')).toBe(true);
      expect(isDependentLexicon('omw-ru:1.4')).toBe(true);
    });

    it('should identify non-dependent lexicons correctly', () => {
      const isDependentLexicon = (dataManager as any).isDependentLexicon;

      expect(isDependentLexicon('oewn:2024')).toBe(false);
      expect(isDependentLexicon('omw-en:1.4')).toBe(false);
      expect(isDependentLexicon('unknown:1.0')).toBe(false);
    });
  });

  describe('getLoadedDependencies', () => {
    it('should return set of loaded lexicon IDs', async () => {
      const mockLexicons = [
        { id: 'oewn:2024' },
        { id: 'omw-fr:1.4' },
      ];
      const mockGetQueryService = vi.fn().mockReturnValue({
        getLexicons: vi.fn().mockResolvedValue(mockLexicons),
      });
      mockConfig.wordnet.getQueryService = mockGetQueryService;

      const result = await (dataManager as any).getLoadedDependencies();

      expect(result).toEqual(new Set(['oewn:2024', 'omw-fr:1.4']));
    });

    it('should return empty set if query service is not available', async () => {
      const mockGetQueryService = vi.fn().mockReturnValue(null);
      mockConfig.wordnet.getQueryService = mockGetQueryService;

      const result = await (dataManager as any).getLoadedDependencies();

      expect(result).toEqual(new Set());
    });

    it('should return empty set if query fails', async () => {
      const mockGetQueryService = vi.fn().mockReturnValue({
        getLexicons: vi.fn().mockRejectedValue(new Error('Query failed')),
      });
      mockConfig.wordnet.getQueryService = mockGetQueryService;

      const result = await (dataManager as any).getLoadedDependencies();

      expect(result).toEqual(new Set());
    });
  });

  describe('toProxyUrl', () => {
    it('should proxy en-word.net URLs', () => {
      const result = dataManager.toProxyUrl('https://en-word.net/static/english-wordnet-2024.xml.gz');
      expect(result).toBe('/api/wordnet/static/english-wordnet-2024.xml.gz');
    });

    it('should proxy GitHub URLs', () => {
      const result = dataManager.toProxyUrl('https://github.com/user/repo/file.txt');
      expect(result).toBe('/api/github/user/repo/file.txt');
    });

    it('should not proxy relative URLs', () => {
      const result = dataManager.toProxyUrl('/api/local/file.txt');
      expect(result).toBe('/api/local/file.txt');
    });
  });
});
