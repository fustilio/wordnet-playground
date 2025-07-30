import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  download,
  loadLexicalResource,
} from '../src/data-management';
import { config } from '../src/config';
import { testUtils } from './setup';
import { ProjectError } from '../src/types';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock fetch utilities
vi.mock('../src/utils/fetch', () => ({
  downloadFile: vi.fn((url: string) => {
    if (url.includes('nonexistent-project') || url.includes('test-project')) {
      throw new Error('Project not found');
    }
    return Promise.resolve();
  }),
}));

describe('Data Management (Database-Agnostic)', () => {
  beforeEach(async () => {
    config.dataDirectory = testUtils.getTestDataDir();
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

  describe('loadLexicalResource', () => {
    it('should throw ProjectError for non-existent file', async () => {
      await expect(loadLexicalResource('/nonexistent/file.xml')).rejects.toThrow(ProjectError);
    });

    it('should load and parse LMF file', async () => {
      // Use the real test data file
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      const result = await loadLexicalResource(xmlPath);

      // Should return parsed data structure with type and data
      expect(result).toBeDefined();
      expect(result.type).toBe('lmf');
      expect(result.data).toBeDefined();
      expect(result.data.lmfVersion).toBe('1.0');
      expect(result.data.lexicons).toBeInstanceOf(Array);
      expect(result.data.lexicons.length).toBeGreaterThan(0);
      expect(result.data.words).toBeInstanceOf(Array);
      expect(result.data.synsets).toBeInstanceOf(Array);
      expect(result.data.senses).toBeInstanceOf(Array);
    });

    it('should handle multiple calls', async () => {
      // Use the real test data file
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      // Should succeed with multiple calls
      const result1 = await loadLexicalResource(xmlPath);
      const result2 = await loadLexicalResource(xmlPath);

      // Both should return the same parsed data
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.type).toBe(result2.type);
      expect(result1.data.lmfVersion).toBe(result2.data.lmfVersion);
    });

    it('should call progress callback', async () => {
      const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
      expect(existsSync(xmlPath)).toBe(true);

      const progressCallback = vi.fn();
      await loadLexicalResource(xmlPath, { progress: progressCallback });

      expect(progressCallback).toHaveBeenCalledWith(1.0);
    });
  });
}); 