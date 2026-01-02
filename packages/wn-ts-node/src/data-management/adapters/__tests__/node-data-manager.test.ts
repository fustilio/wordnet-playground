/**
 * Tests for NodeDataManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NodeDataManager } from '../node-data-manager.js';
import type { NodeDataManagerConfig } from '../node-data-manager.js';

// Mock Node.js modules
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/')),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid'),
}));

// Mock project module
vi.mock('../../../project.ts', () => ({
  getProjectVersionUrls: vi.fn(),
  getProjectVersionError: vi.fn(),
}));

// Mock wn-ts-core insertRecords function
vi.mock('wn-ts-core', async () => {
  const actual = await vi.importActual('wn-ts-core');
  return {
    ...actual,
    insertRecords: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../utils/download.js', () => ({
  downloadFile: vi.fn(),
}));

vi.mock('../../../utils/archive.js', () => ({
  extractTarArchive: vi.fn(),
  decompressXz: vi.fn(),
  decompressGz: vi.fn(),
  findLMFiles: vi.fn(),
}));

vi.mock('../../../lmf.js', () => ({
  loadLMF: vi.fn(),
  isLMF: vi.fn(),
}));

vi.mock('../../../ili.js', () => ({
  loadILI: vi.fn(),
  isILI: vi.fn(),
}));

vi.mock('../../project.js', () => ({
  getProjectVersionUrls: vi.fn(),
  getProjectVersionError: vi.fn(),
}));

describe('NodeDataManager', () => {
  let dataManager: NodeDataManager;
  let mockConfig: NodeDataManagerConfig;

  beforeEach(async () => {
    mockConfig = {
      database: {
        getQueryService: vi.fn().mockReturnValue({
          database: {
            selectFrom: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  execute: vi.fn().mockResolvedValue([]),
                }),
                execute: vi.fn().mockResolvedValue([]),
              }),
            }),
            deleteFrom: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            insertInto: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                onConflict: vi.fn().mockReturnValue({
                  doNothing: vi.fn().mockReturnValue({
                    execute: vi.fn().mockResolvedValue(undefined),
                  }),
                }),
                compile: vi.fn().mockReturnValue({
                  sql: 'INSERT INTO test_table VALUES (?)',
                  parameters: ['test-value']
                }),
                execute: vi.fn().mockResolvedValue(undefined),
              }),
            }),
          } as any,
          getLexicons: vi.fn().mockResolvedValue([]),
        }),
      },
      wordnet: {
        getQueryService: vi.fn().mockReturnValue({
          database: {
            selectFrom: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  execute: vi.fn().mockResolvedValue([]),
                }),
                execute: vi.fn().mockResolvedValue([]),
              }),
            }),
            deleteFrom: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            insertInto: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                onConflict: vi.fn().mockReturnValue({
                  doNothing: vi.fn().mockReturnValue({
                    execute: vi.fn().mockResolvedValue(undefined),
                  }),
                }),
                compile: vi.fn().mockReturnValue({
                  sql: 'INSERT INTO test_table VALUES (?)',
                  parameters: ['test-value']
                }),
                execute: vi.fn().mockResolvedValue(undefined),
              }),
            }),
          } as any,
          getLexicons: vi.fn().mockResolvedValue([]),
        }),
      },
      downloadDirectory: '/tmp',
    };
    dataManager = new NodeDataManager(mockConfig);
    vi.clearAllMocks();
    
    // Mock readFileSync to return a sample XML content
    const { readFileSync } = await import('fs');
    vi.mocked(readFileSync).mockReturnValue('<?xml version="1.0" encoding="UTF-8"?><LexicalResource><Lexicon id="test" label="Test Lexicon" language="en" version="1.0"></Lexicon></LexicalResource>');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create data manager with valid config', () => {
      expect(dataManager).toBeInstanceOf(NodeDataManager);
    });
  });

  describe('getProjectInfo', () => {
    it('should get project information correctly', async () => {
      const { getProjectVersionUrls, getProjectVersionError } = await import('../../../project.js');
      vi.mocked(getProjectVersionUrls).mockReturnValue(['https://example.com/test.xml']);
      vi.mocked(getProjectVersionError).mockReturnValue(undefined);

      const result = await (dataManager as any).getProjectInfo('test:1.0');

      expect(result).toEqual({
        id: 'test:1.0',
        label: 'test 1.0',
        language: 'en',
        version: '1.0',
        license: 'MIT',
        url: '',
        allUrls: [],
        primaryUrl: '',
        fallbackUrls: [],
      });
    });

    it('should handle invalid project ID format gracefully', async () => {
      const result = await (dataManager as any).getProjectInfo('invalid');
      
      expect(result).toEqual({
        id: 'invalid',
        label: 'invalid',
        language: 'en',
        version: '1.0',
        license: 'MIT',
        url: '',
        allUrls: [],
        primaryUrl: '',
        fallbackUrls: [],
      });
    });
  });

  describe('parseILI', () => {
    it('should parse ILI content correctly', async () => {
      const { loadILI } = await import('../../../ili.js');
      (loadILI as any).mockResolvedValue([
        { id: 'ili-1', definition: 'Definition 1', status: 'active' },
        { id: 'ili-2', definition: 'Definition 2', status: 'active' },
      ]);

      const result = await dataManager.parseILI('test content');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'ili-1',
        definition: 'Definition 1',
        status: 'active',
      });
    });
  });

  describe('processFile', () => {
    it('should process compressed files', async () => {
      const { decompressGz } = await import('../../../utils/archive.js');
      const { existsSync, statSync } = await import('fs');
      (decompressGz as any).mockResolvedValue(undefined);
      (existsSync as any).mockReturnValue(true);
      (statSync as any).mockReturnValue({ size: 1024 });

      const result = await (dataManager as any).processFile('/path/to/file.gz');

      expect(decompressGz).toHaveBeenCalledWith('/path/to/file.gz', '/path/to/file');
      expect(result).toBe('/path/to/file');
    });

    it('should process archive files', async () => {
      const { extractTarArchive, findLMFiles } = await import('../../../utils/archive.js');
      (extractTarArchive as any).mockResolvedValue('/extracted/dir');
      (findLMFiles as any).mockResolvedValue(['/extracted/dir/file.xml']);

      const result = await (dataManager as any).processFile('/path/to/file.tar');

      expect(extractTarArchive).toHaveBeenCalledWith('/path/to/file.tar');
      expect(findLMFiles).toHaveBeenCalledWith('/extracted/dir');
      expect(result).toBe('/extracted/dir/file.xml');
    });

    it('should return path as-is for regular files', async () => {
      const result = await (dataManager as any).processFile('/path/to/file.xml');
      expect(result).toBe('/path/to/file.xml');
    });
  });

  describe('isLMF', () => {
    it('should delegate to isLMF function', async () => {
      const { isLMF } = await import('../../../lmf.js');
      (isLMF as any).mockResolvedValue(true);

      const result = await (dataManager as any).isLMF('/path/to/file.xml');

      expect(isLMF).toHaveBeenCalledWith('/path/to/file.xml');
      expect(result).toBe(true);
    });
  });

  describe('isILI', () => {
    it('should delegate to isILI function', async () => {
      const { isILI } = await import('../../../ili.js');
      (isILI as any).mockResolvedValue(true);

      const result = await (dataManager as any).isILI('/path/to/file.tsv');

      expect(isILI).toHaveBeenCalledWith('/path/to/file.tsv');
      expect(result).toBe(true);
    });
  });

  describe('addLMF', () => {
    it('should load LMF file successfully', async () => {
      const { loadLMF } = await import('../../../lmf.js');
      (loadLMF as any).mockResolvedValue({
        lexicons: [{ id: 'test' }],
        words: [],
        synsets: [],
        senses: [],
      });

      const result = await (dataManager as any).addLMF('/path/to/file.xml', {});

      expect(result).toBe(true);
      expect(loadLMF).toHaveBeenCalled();
    });

    it('should handle dry run mode', async () => {
      const result = await (dataManager as any).addLMF('/path/to/file.xml', { dryRun: true });

      expect(result).toBe(true);
    });
  });

  describe('addILI', () => {
    it('should load ILI file successfully', async () => {
      const { loadILI } = await import('../../../ili.js');
      (loadILI as any).mockResolvedValue([
        { id: 'ili-1', definition: 'Definition 1', status: 'active' },
      ]);

      const result = await (dataManager as any).addILI('/path/to/file.tsv', {});

      expect(result).toBe(true);
      expect(loadILI).toHaveBeenCalled();
    });

    it('should handle dry run mode', async () => {
      const result = await (dataManager as any).addILI('/path/to/file.tsv', { dryRun: true });

      expect(result).toBe(true);
    });
  });
});