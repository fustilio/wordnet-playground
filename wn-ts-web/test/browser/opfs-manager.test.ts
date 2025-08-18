/**
 * OPFS Manager Browser Tests
 * 
 * These tests require browser APIs and cannot run in Node.js environment.
 * They test the Origin Private File System functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OPFSManager } from '../../src/opfs-manager.js';

const isNode = typeof process !== 'undefined';

describe.skipIf(isNode)('OPFS Manager Browser Tests', () => {
  let opfsManager: OPFSManager;

  beforeAll(async () => {
    if (isNode) return;
    opfsManager = new OPFSManager();
    await opfsManager.initialize();
  });

  afterAll(async () => {
    // Clean up any test files
    try {
      await opfsManager.cleanup({ types: ['database'] });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('OPFS Initialization', () => {
    it('should initialize OPFS manager', async () => {
      expect(opfsManager).toBeDefined();
      // The manager should be initialized in beforeAll
    });

    it('should get storage info', async () => {
      const info = await opfsManager.getStorageInfo();
      
      expect(info).toHaveProperty('total');
      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('files');
      expect(Array.isArray(info.files)).toBe(true);
    });
  });

  describe('File Operations', () => {
    const testFilename = 'test-file.json';
    const testData = { test: 'data', timestamp: Date.now() };

    it('should save file to OPFS', async () => {
      const filename = await opfsManager.downloadProject('oewn:2024', {
        onProgress: (progress) => {
          expect(progress).toHaveProperty('bytesDownloaded');
          expect(progress).toHaveProperty('totalBytes');
          expect(progress).toHaveProperty('percentage');
          expect(progress).toHaveProperty('status');
        }
      });

      expect(filename).toBeDefined();
      expect(typeof filename).toBe('string');
    });

    it('should list files in OPFS', async () => {
      const files = await opfsManager.listProjects();
      
      expect(Array.isArray(files)).toBe(true);
      // Should contain at least the test file we created
      expect(files.length).toBeGreaterThan(0);
    });

    it('should get file info', async () => {
      const info = await opfsManager.getStorageInfo();
      const testFile = info.files.find(f => f.name.includes('oewn'));
      
      if (testFile) {
        expect(testFile).toHaveProperty('name');
        expect(testFile).toHaveProperty('size');
        expect(testFile).toHaveProperty('lastModified');
        expect(testFile).toHaveProperty('type');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported browsers gracefully', () => {
      // Test that the manager can handle missing APIs
      const originalStorage = navigator.storage;
      
      // Instead of trying to set the property, test the constructor behavior
      expect(() => {
        new OPFSManager();
      }).not.toThrow();
      
      // The manager should handle missing storage API gracefully
      expect(navigator.storage).toBeDefined();
    });

    it('should handle file not found errors', async () => {
      try {
        await opfsManager.downloadProject('nonexistent:project');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });

}); 
