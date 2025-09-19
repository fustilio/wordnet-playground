import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  download,
  add,
  addLexicalResource,
  remove,
  exportData,
  setDataManagementDb,
} from '../src/data-management-new';
import { KyselyWordnet } from '../src/kysely-wordnet';
import { config } from '../src/config';
import { testUtils } from './setup';
import { ProjectError } from 'wn-ts-core';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from 'wn-ts-core';

// Mock fetch utilities
vi.mock('../src/utils/fetch', () => ({
  downloadFile: vi.fn((url: string) => {
    if (url.includes('nonexistent-project') || url.includes('test-project')) {
      throw new Error('Project not found');
    }
    return Promise.resolve();
  }),
}));

describe('Data Management', () => {
  let testDb: KyselyWordnet;

  beforeEach(async () => {
    config.dataDirectory = testUtils.getTestDataDir();
    // Initialize Kysely database for tests with forceRecreate to avoid schema conflicts
    testDb = new KyselyWordnet('*', { 
      filename: config.databasePath,
      forceRecreate: true
    });
    await testDb.initialize();
    
    // Inject the test database into the data management system
    setDataManagementDb(testDb);
  });

  afterEach(async () => {
    // Close database connection after each test
    if (testDb) {
      await testDb.close();
    }
  });

  describe('download', () => {
    it('should throw ProjectError for non-existent project', async () => {
      await expect(download('nonexistent-project')).rejects.toThrow(ProjectError);
    });

    it('should handle force option', async () => {
      await expect(download('test-project', { force: true })).rejects.toThrow(ProjectError);
    });
  });

  describe('add', () => {
    it('should throw ProjectError for non-existent file', async () => {
      await expect(add('/nonexistent/file.xml')).rejects.toThrow(ProjectError);
    });

    it('should add basic lexicon to database', async () => {
      // Use the real test data file
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      await add(xmlPath, { force: true });

      // Verify lexicons were added to database using Kysely
      const queryService = testDb.getQueryService();
      const allLexicons = await queryService.getLexicons();
      const lexicons = allLexicons.filter(l => ['test-en', 'test-es'].includes(l.id));
      expect(lexicons).toHaveLength(2);
      expect(lexicons.find(l => l.id === 'test-en')?.label).toBe(
        'Testing English WordNet'
      );
      expect(lexicons.find(l => l.id === 'test-es')?.label).toBe(
        'Testing Spanish WordNet'
      );
    });

    it('should handle force option', async () => {
      // Use the real test data file
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);


      // Add first time
      await add(xmlPath, { force: true });

      // Should succeed with force again
      await add(xmlPath, { force: true });

      // Verify lexicons are still there using Kysely
      const queryService = testDb.getQueryService();
      const allLexicons = await queryService.getLexicons();
      const lexicons = allLexicons.filter(l => ['test-en', 'test-es'].includes(l.id));
      expect(lexicons).toHaveLength(2);
    });

    it('should call progress callback', async () => {
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      const progressCallback = vi.fn();
      await add(xmlPath, { progress: progressCallback, force: true });

      expect(progressCallback).toHaveBeenCalledWith(1.0);
    });
  });

  describe('addLexicalResource', () => {
    it('should be an alias for add function', async () => {
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      await addLexicalResource(xmlPath, { force: true });

      // Verify lexicons were added using Kysely
      const queryService = testDb.getQueryService();
      const allLexicons = await queryService.getLexicons();
      const lexicons = allLexicons.filter(l => ['test-en', 'test-es'].includes(l.id));
      expect(lexicons).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('should throw ProjectError for non-existent lexicon', async () => {
      await expect(remove('nonexistent-lexicon')).rejects.toThrow(ProjectError);
    });

    it('should remove lexicon and related data', async () => {
      // First add a lexicon using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      // Verify it exists using Kysely
      const queryService = testDb.getQueryService();
      let testEnLexicon = await queryService.getLexiconById('test-en');
      expect(testEnLexicon).toBeDefined();

      // Remove it
      await remove('test-en');

      // Verify it's gone
      testEnLexicon = await queryService.getLexiconById('test-en');
      expect(testEnLexicon).toBeUndefined();

      // Verify the other lexicon is still there
      const testEsLexicon = await queryService.getLexiconById('test-es');
      expect(testEsLexicon).toBeDefined();
    });
  });

  describe('exportData', () => {
    it('should throw ProjectError for unsupported format', async () => {
      await expect(exportData({ format: 'unsupported' as any })).rejects.toThrow(
        ProjectError
      );
    });

    it('should export JSON format', async () => {
      // Add a lexicon first using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      // Mock logger.info
      const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await exportData({ format: 'json' });

      expect(loggerSpy).toHaveBeenCalled();
      const calls = loggerSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const output = calls[0]?.[0];
      expect(output).toBeDefined();
      const data = JSON.parse(output!);

      expect(data).toHaveProperty('lexicons');
      expect(data).toHaveProperty('exportDate');
      expect(data).toHaveProperty('format', 'json');
      expect(data.lexicons.length).toBeGreaterThanOrEqual(2); // test-en and test-es

      loggerSpy.mockRestore();
    });

    it('should handle include filter', async () => {
      // Add a lexicon first using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await exportData({
        format: 'json',
        include: ['test-en'],
      });

      const calls = loggerSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const output = calls[0]?.[0];
      expect(output).toBeDefined();
      const data = JSON.parse(output!);
      expect(data.lexicons).toHaveLength(1);
      expect(data.lexicons[0].id).toBe('test-en');

      loggerSpy.mockRestore();
    });

    it('should handle exclude filter', async () => {
      // Add a lexicon first using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await exportData({
        format: 'json',
        exclude: ['test-en'],
      });

      const calls = loggerSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const output = calls[0]?.[0];
      expect(output).toBeDefined();
      const data = JSON.parse(output!);
      expect(data.lexicons).toHaveLength(1); // Only test-es should remain
      expect(data.lexicons[0].id).toBe('test-es');

      loggerSpy.mockRestore();
    });

    it('should export XML format', async () => {
      // Add a lexicon first using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await exportData({ format: 'xml' });

      expect(loggerSpy).toHaveBeenCalled();
      const calls = loggerSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const output = calls[0]?.[0];
      expect(output).toBeDefined();

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(output).toContain('<lexical-resources>');
      expect(output).toContain('</lexical-resources>');

      loggerSpy.mockRestore();
    });

    it('should export CSV format', async () => {
      // Add a lexicon first using real test data
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);
      await add(xmlPath, { force: true });

      const loggerSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await exportData({ format: 'csv' });

      expect(loggerSpy).toHaveBeenCalled();
      const calls = loggerSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const output = calls[0]?.[0];
      expect(output).toBeDefined();

      expect(output).toContain(
        'Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example'
      );
      expect(output).toContain('word,');

      loggerSpy.mockRestore();
    });
  });
});

describe.skip('SLOW: Real download and add of OEWN:2024 (network dependent)', () => {
  it('should download and add OEWN:2024 to the database (slow, real data)', async () => {
    const testDataDir = testUtils.getTestDataDir();
    config.dataDirectory = testDataDir;
    const filePath = await download('oewn:2024', { force: true });
    await add(filePath, { force: true });
    const testDb = new KyselyWordnet('*', { filename: config.databasePath });
    await testDb.initialize();
    const queryService = testDb.getQueryService();
    const allLexicons = await queryService.getLexicons();
    const oewnLexicons = allLexicons.filter(l => l.id.startsWith('oewn'));
    expect(oewnLexicons.length).toBeGreaterThan(0);
    await testDb.close();
  }, 300000); // 5 min timeout
});
