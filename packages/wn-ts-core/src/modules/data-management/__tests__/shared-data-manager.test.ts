/**
 * Tests for SharedDataManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SharedDataManager } from '../shared-data-manager.js';
import type { DataManagerAdapter, DataManagerLogger, DataManagerProjectInfo } from '../shared-data-manager.js';

// Mock adapter
const createMockAdapter = (): DataManagerAdapter => {
  const mockQueryService = {
    database: {} as any,
    getLexicons: vi.fn().mockResolvedValue([]),
    getLexiconById: vi.fn().mockResolvedValue(null),
    deleteLexicon: vi.fn().mockResolvedValue(undefined),
    getStatistics: vi.fn().mockResolvedValue({
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0,
    }),
  };
  
  return {
    getQueryService: vi.fn().mockReturnValue(mockQueryService),
    getDatabase: vi.fn().mockReturnValue({} as any),
  downloadFile: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  loadFile: vi.fn().mockResolvedValue(''),
  saveFile: vi.fn().mockResolvedValue(undefined),
  fileExists: vi.fn().mockResolvedValue(false),
  extractArchive: vi.fn().mockResolvedValue(''),
  decompressFile: vi.fn().mockResolvedValue(undefined),
  findLMFiles: vi.fn().mockResolvedValue([]),
  parseLMF: vi.fn().mockResolvedValue({ lexicons: [], words: [], synsets: [], senses: [] }),
  parseILI: vi.fn().mockResolvedValue([]),
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    fail: vi.fn(),
  } as DataManagerLogger),
  };
};

// Test implementation of SharedDataManager
class TestDataManager extends SharedDataManager {
  protected async getProjectInfo(_projectId: string): Promise<DataManagerProjectInfo> {
    return {
      id: 'test',
      label: 'Test Project',
      language: 'en',
      version: '1.0',
      allUrls: ['https://example.com/test.xml'],
      primaryUrl: 'https://example.com/test.xml',
      fallbackUrls: [],
    };
  }

  protected async processWordNetData(_data: ArrayBuffer, projectId: string) {
    return {
      success: true,
      projectId,
      language: 'en',
      version: '1.0',
      contentType: 'lmf',
      confidence: 'high',
      xmlContent: '<xml>test</xml>',
      error: null,
    };
  }

  protected async parseILIData(_content: string) {
    return [];
  }

  protected async processFile(path: string) {
    return path;
  }

  protected async isLMF(path: string) {
    return path.endsWith('.xml');
  }

  protected async isILI(path: string) {
    return path.endsWith('.tsv');
  }

  protected async addLMF(_path: string) {
    return true;
  }

  protected async addILI(_path: string) {
    return true;
  }
}

describe('SharedDataManager', () => {
  let dataManager: TestDataManager;
  let mockAdapter: DataManagerAdapter;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    dataManager = new TestDataManager(mockAdapter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create data manager with adapter', () => {
      expect(dataManager).toBeInstanceOf(SharedDataManager);
    });
  });

  describe('utility methods', () => {
    describe('sanitizeLexiconId', () => {
      it('should handle normal lexicon IDs', () => {
        expect((dataManager as any).sanitizeLexiconId('oewn:2024')).toBe('oewn:2024');
        expect((dataManager as any).sanitizeLexiconId('omw-en:1.4')).toBe('omw-en:1.4');
      });

      it('should fix double colons', () => {
        expect((dataManager as any).sanitizeLexiconId('oewn::2024')).toBe('oewn:2024');
        expect((dataManager as any).sanitizeLexiconId('oewn:::2024')).toBe('oewn:2024');
      });

      it('should handle malformed IDs with multiple colons', () => {
        expect((dataManager as any).sanitizeLexiconId('oewn:2024:2024')).toBe('oewn:2024');
        expect((dataManager as any).sanitizeLexiconId('oewn:2024:extra:more')).toBe('oewn:2024');
      });
    });

    describe('formatPackageId', () => {
      it('should format package ID correctly', () => {
        expect((dataManager as any).formatPackageId('oewn', '2024')).toBe('oewn:2024');
        expect((dataManager as any).formatPackageId('omw-en', '1.4')).toBe('omw-en:1.4');
      });
    });

    describe('validateProjectId', () => {
      it('should validate correct project IDs', () => {
        const result = (dataManager as any).validateProjectId('oewn:2024');
        expect(result.isValid).toBe(true);
        expect(result.baseId).toBe('oewn');
        expect(result.version).toBe('2024');
      });

      it('should reject invalid project IDs', () => {
        expect((dataManager as any).validateProjectId('oewn')).toEqual({ isValid: false });
        expect((dataManager as any).validateProjectId('oewn:2024:extra')).toEqual({ isValid: false });
        expect((dataManager as any).validateProjectId('')).toEqual({ isValid: false });
      });
    });

    describe('isMalformedLexiconId', () => {
      it('should detect malformed IDs', () => {
        expect((dataManager as any).isMalformedLexiconId('oewn:2024:2024')).toBe(true);
        expect((dataManager as any).isMalformedLexiconId('oewn:oewn')).toBe(true);
        expect((dataManager as any).isMalformedLexiconId('oewn:2024:extra')).toBe(true);
      });

      it('should accept valid IDs', () => {
        expect((dataManager as any).isMalformedLexiconId('oewn:2024')).toBe(false);
        expect((dataManager as any).isMalformedLexiconId('omw-en:1.4')).toBe(false);
      });
    });
  });

  describe('hasData', () => {
    it('should return true when data exists', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockResolvedValue({
        totalWords: 100,
        totalSynsets: 50,
        totalSenses: 200,
        totalILIs: 10,
        totalLexicons: 1,
      });

      const result = await dataManager.hasData();
      expect(result).toBe(true);
    });

    it('should return false when no data exists', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockResolvedValue({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
        totalLexicons: 0,
      });

      const result = await dataManager.hasData();
      expect(result).toBe(false);
    });

    it('should return false when statistics query fails', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockRejectedValue(new Error('Query failed'));

      const result = await dataManager.hasData();
      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics from query service', async () => {
      const mockStats = {
        totalWords: 100,
        totalSynsets: 50,
        totalSenses: 200,
        totalILIs: 10,
        totalLexicons: 1,
      };
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockResolvedValue(mockStats);

      const result = await dataManager.getStatistics();
      expect(result).toEqual(mockStats);
    });

    it('should throw error when query service is not available', async () => {
      (mockAdapter.getQueryService as any).mockReturnValue(null);

      await expect(dataManager.getStatistics()).rejects.toThrow('Query service not available for statistics');
    });
  });

  describe('ensureDataLoaded', () => {
    it('should load data when none exists', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockResolvedValue({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
        totalLexicons: 0,
      });

      const downloadAndLoadSpy = vi.spyOn(dataManager, 'downloadAndLoad').mockResolvedValue();

      await dataManager.ensureDataLoaded('oewn:2024');

      expect(downloadAndLoadSpy).toHaveBeenCalledWith('oewn:2024');
    });

    it('should not load data when it already exists', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getStatistics.mockResolvedValue({
        totalWords: 100,
        totalSynsets: 50,
        totalSenses: 200,
        totalILIs: 10,
        totalLexicons: 1,
      });

      const downloadAndLoadSpy = vi.spyOn(dataManager, 'downloadAndLoad').mockResolvedValue();

      await dataManager.ensureDataLoaded('oewn:2024');

      expect(downloadAndLoadSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove lexicon successfully', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getLexiconById.mockResolvedValue({ id: 'test:1.0' });
      mockQueryService.deleteLexicon.mockResolvedValue(undefined);

      const result = await dataManager.remove('test:1.0');

      expect(mockQueryService.getLexiconById).toHaveBeenCalledWith('test:1.0');
      expect(mockQueryService.deleteLexicon).toHaveBeenCalledWith('test:1.0');
      expect(result).toBe(true);
    });

    it('should throw error when lexicon does not exist', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getLexiconById.mockResolvedValue(null);

      await expect(dataManager.remove('nonexistent:1.0')).rejects.toThrow('Lexicon nonexistent:1.0 does not exist.');
    });

    it('should handle deletion errors', async () => {
      const mockQueryService = mockAdapter.getQueryService();
      mockQueryService.getLexiconById.mockResolvedValue({ id: 'test:1.0' });
      mockQueryService.deleteLexicon.mockRejectedValue(new Error('Delete failed'));

      await expect(dataManager.remove('test:1.0')).rejects.toThrow('Delete failed');
    });
  });
});
