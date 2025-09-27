import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodeDataManager } from '../../src/data-management/adapters/node-data-manager.js';
import { Wordnet } from '../../src/wordnet.js';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

describe('Project Resolution Integration Tests (Node)', () => {
  let dataManager: NodeDataManager;
  let wordnet: Wordnet;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-node-test-'));
    
    // Initialize Wordnet
    wordnet = new Wordnet('*', { dataDirectory: tempDir });
    
    // Initialize NodeDataManager
    dataManager = new NodeDataManager({
      wordnet,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        start: () => {},
        end: () => {},
        step: () => {},
        success: () => {},
      }
    });
  });

  afterEach(async () => {
    if (wordnet) {
      wordnet.close();
    }
    
    // Clean up temporary directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Project Info Resolution', () => {
    it('should resolve oewn:2024 to correct URLs without hardcoded values', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2024');
      
      expect(projectInfo.id).toBe('oewn:2024');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2024');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual en-word.net URLs
      expect(projectInfo.allUrls.some(url => url.includes('en-word.net/static/english-wordnet-2024.xml.gz'))).toBe(true);
      expect(projectInfo.allUrls.some(url => url.includes('github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz'))).toBe(true);
      
      // All URLs should be valid HTTPS URLs
      projectInfo.allUrls.forEach(url => {
        expect(url).toMatch(/^https:\/\//);
        expect(url).not.toContain('example.com');
      });
    });

    it('should resolve oewn:2021 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2021');
      
      expect(projectInfo.id).toBe('oewn:2021');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2021');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual en-word.net URL
      expect(projectInfo.allUrls.some(url => url.includes('en-word.net/static/english-wordnet-2021.xml.gz'))).toBe(true);
    });

    it('should resolve cili:1.0 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('cili:1.0');
      
      expect(projectInfo.id).toBe('cili:1.0');
      expect(projectInfo.label).toBe('Collaborative Interlingual Index');
      expect(projectInfo.version).toBe('1.0');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual GitHub URL
      expect(projectInfo.allUrls.some(url => url.includes('github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz'))).toBe(true);
    });

    it('should resolve omw-fr:1.4 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('omw-fr:1.4');
      
      expect(projectInfo.id).toBe('omw-fr:1.4');
      expect(projectInfo.label).toBe('Open Multilingual Wordnet - French');
      expect(projectInfo.language).toBe('fr');
      expect(projectInfo.version).toBe('1.4');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual GitHub URL
      expect(projectInfo.allUrls.some(url => url.includes('github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz'))).toBe(true);
    });

    it('should handle unknown packages gracefully with fallback', async () => {
      const projectInfo = await dataManager.getProjectInfo('unknown:1.0');
      
      // Should fallback to basic structure for unknown packages
      expect(projectInfo.id).toBe('unknown:1.0');
      expect(projectInfo.label).toBe('unknown 1.0');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('1.0');
      expect(projectInfo.allUrls).toEqual([]);
      expect(projectInfo.primaryUrl).toBe('');
    });
  });

  describe('Project ID Validation', () => {
    it('should validate project ID format correctly', async () => {
      const validIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4'];
      const invalidIds = ['invalid', 'oewn:', ':2024', 'oewn:2024:extra'];
      
      for (const projectId of validIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
      }
      
      for (const projectId of invalidIds) {
        // Should handle gracefully with fallback
        const projectInfo = await dataManager.getProjectInfo(projectId);
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
      }
    });
  });

  describe('URL Structure Validation', () => {
    it('should provide valid HTTPS URLs for all projects', async () => {
      const projectIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4', 'omw-th:1.4'];
      
      for (const projectId of projectIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // All URLs should be valid HTTPS URLs
        projectInfo.allUrls.forEach(url => {
          expect(url).toMatch(/^https:\/\//);
          expect(url).not.toContain('example.com');
          expect(url).not.toContain('localhost');
          expect(url).not.toContain('127.0.0.1');
        });
        
        // Primary URL should be valid
        if (projectInfo.primaryUrl) {
          expect(projectInfo.primaryUrl).toMatch(/^https:\/\//);
          expect(projectInfo.primaryUrl).not.toContain('example.com');
        }
      }
    });

    it('should provide consistent URL structure across versions', async () => {
      const versions = ['2021', '2022', '2023', '2024'];
      
      for (const version of versions) {
        const projectId = `oewn:${version}`;
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // All URLs should be valid HTTPS URLs
        projectInfo.allUrls.forEach(url => {
          expect(url).toMatch(/^https:\/\//);
          expect(url).not.toContain('example.com');
        });
        
        // Should contain en-word.net URL
        expect(projectInfo.allUrls.some(url => url.includes('en-word.net'))).toBe(true);
      }
    });
  });

  describe('Project Metadata Consistency', () => {
    it('should provide consistent metadata for all projects', async () => {
      const projectIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4', 'omw-th:1.4'];
      
      for (const projectId of projectIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Basic structure validation
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
        expect(projectInfo.language).toBeTruthy();
        expect(projectInfo.version).toBeTruthy();
        
        // URL structure validation
        expect(Array.isArray(projectInfo.allUrls)).toBe(true);
        expect(Array.isArray(projectInfo.fallbackUrls)).toBe(true);
        
        // All URLs should be valid
        projectInfo.allUrls.forEach(url => {
          expect(url).toMatch(/^https:\/\//);
          expect(url).not.toContain('example.com');
        });
      }
    });

    it('should handle different project types correctly', async () => {
      const wordnetProject = await dataManager.getProjectInfo('oewn:2024');
      const iliProject = await dataManager.getProjectInfo('cili:1.0');
      const multilingualProject = await dataManager.getProjectInfo('omw-fr:1.4');
      
      // WordNet project should have English language
      expect(wordnetProject.language).toBe('en');
      expect(wordnetProject.label).toContain('English');
      
      // ILI project should have unknown language
      expect(iliProject.language).toBe('unknown');
      expect(iliProject.label).toContain('Interlingual');
      
      // Multilingual project should have French language
      expect(multilingualProject.language).toBe('fr');
      expect(multilingualProject.label).toContain('French');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle malformed project IDs gracefully', async () => {
      const malformedIds = ['', 'invalid', 'oewn:', ':2024', 'oewn:2024:extra'];
      
      for (const projectId of malformedIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Should provide fallback structure
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
        expect(projectInfo.language).toBeTruthy();
        expect(projectInfo.version).toBeTruthy();
      }
    });

    it('should handle non-existent project versions gracefully', async () => {
      const nonExistentIds = ['oewn:9999', 'cili:2.0', 'omw-fr:2.0'];
      
      for (const projectId of nonExistentIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Should provide fallback structure
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
        expect(projectInfo.language).toBeTruthy();
        expect(projectInfo.version).toBeTruthy();
      }
    });
  });

  describe('Performance and Consistency', () => {
    it('should resolve project info consistently across multiple calls', async () => {
      const projectId = 'oewn:2024';
      const results = [];
      
      // Call multiple times
      for (let i = 0; i < 5; i++) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        results.push(projectInfo);
      }
      
      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });

    it('should handle concurrent project info requests', async () => {
      const projectIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4'];
      
      // Make concurrent requests
      const promises = projectIds.map(id => dataManager.getProjectInfo(id));
      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results.length).toBe(projectIds.length);
      results.forEach((result, index) => {
        expect(result.id).toBe(projectIds[index]);
        expect(result.allUrls.length).toBeGreaterThan(0);
      });
    });
  });
});
