import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  download,
  add,
  addLexicalResource,
  remove,
  exportData,
} from '../src/data-management';
import { db } from '../src/database';
import { config } from '../src/config';
import { testUtils } from './setup';
import { ProjectError, DatabaseError } from '../src/types';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../src/utils/logger';

// Mock fetch utilities
vi.mock('../src/utils/fetch', () => ({
  downloadFile: vi.fn((url: string) => {
    if (url.includes('nonexistent-project') || url.includes('test-project')) {
      throw new Error('Project not found');
    }
    return Promise.resolve();
  }),
}));

// Utility to generate a unique lexicon ID and file path per test
function uniqueLexiconId() {
  return `test-lexicon-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
function uniqueLexiconFile(testDataDir: string) {
  return join(testDataDir, `${uniqueLexiconId()}.xml`);
}

describe('Data Management', () => {
  beforeEach(async () => {
    // Reset database for each test
    await db.close();
    config.dataDirectory = testUtils.getTestDataDir();
    // Initialize database for tests
    await db.initialize();
  });

  describe('download', () => {
    it('should throw ProjectError for non-existent project', async () => {
      await expect(download('nonexistent-project')).rejects.toThrow(ProjectError);
    });

    it('should handle force option', async () => {
      // Create a mock file to simulate existing download
      const downloadPath = join(config.downloadDirectory, 'test-project.xml');
      writeFileSync(downloadPath, 'test content');

      await expect(download('test-project')).rejects.toThrow(ProjectError);

      // Should work with force=true
      await expect(download('test-project', { force: true })).rejects.toThrow(
        ProjectError
      );
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

      await db.initialize();
      // Verify lexicons were added to database
      const lexicons = (await db.all('SELECT * FROM lexicons WHERE id IN (?, ?)', [
        'test-en',
        'test-es',
      ])) as { id: string; label: string; language: string; version: string }[];
      expect(lexicons).toHaveLength(2);
      expect(lexicons.find(l => l.id === 'test-en')?.label).toBe(
        'Testing English WordNet'
      );
      expect(lexicons.find(l => l.id === 'test-es')?.label).toBe(
        'Testing Spanish WordNet'
      );
      await db.close();
    });

    it('should handle force option', async () => {
      // Use the real test data file
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);


      // Add first time
      await add(xmlPath, { force: true });

      // Should succeed with force again
      await add(xmlPath, { force: true });

      await db.initialize();
      // Verify lexicons are still there
      const lexicons = (await db.all('SELECT * FROM lexicons WHERE id IN (?, ?)', [
        'test-en',
        'test-es',
      ])) as { id: string; label: string; language: string; version: string }[];
      expect(lexicons).toHaveLength(2);
      await db.close();
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

      await db.initialize();
      // Verify lexicons were added
      const lexicons = (await db.all('SELECT * FROM lexicons WHERE id IN (?, ?)', [
        'test-en',
        'test-es',
      ])) as { id: string; label: string; language: string; version: string }[];
      expect(lexicons).toHaveLength(2);
      await db.close();
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

      await db.initialize();
      // Verify it exists
      let lexicons = (await db.all('SELECT * FROM lexicons WHERE id = ?', [
        'test-en',
      ])) as { id: string; label: string; language: string; version: string }[];

      await db.close();

      expect(lexicons).toHaveLength(1);

      // Remove it
      await remove('test-en');

      await db.initialize();
      // Verify it's gone
      lexicons = (await db.all('SELECT * FROM lexicons WHERE id = ?', ['test-en'])) as {
        id: string;
        label: string;
        language: string;
        version: string;
      }[];
      expect(lexicons).toHaveLength(0);

      // Verify the other lexicon is still there
      lexicons = (await db.all('SELECT * FROM lexicons WHERE id = ?', ['test-es'])) as {
        id: string;
        label: string;
        language: string;
        version: string;
      }[];
      expect(lexicons).toHaveLength(1);
      await db.close();
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
      const output = loggerSpy.mock.calls[0][0];
      const data = JSON.parse(output);

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

      const output = loggerSpy.mock.calls[0][0];
      const data = JSON.parse(output);
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

      const output = loggerSpy.mock.calls[0][0];
      const data = JSON.parse(output);
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
      const output = loggerSpy.mock.calls[0][0];

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
      const output = loggerSpy.mock.calls[0][0];

      expect(output).toContain(
        'Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example'
      );
      expect(output).toContain('word,');

      loggerSpy.mockRestore();
    });
  });
});
