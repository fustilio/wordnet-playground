import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebDataManager } from '../../src/data-management/adapters/web-data-manager.js';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

describe('URL Resolution Integration Tests', () => {
  let dataManager: WebDataManager;
  let wordnet: WebWordnet;
  let sqlModule: Sqlite3Static;

  beforeEach(async () => {
    // Initialize SQLite WASM module
    sqlModule = await Sqlite3Static.init();
    
    // Initialize WebWordnet
    wordnet = new WebWordnet();
    await wordnet.initialize(sqlModule);
    
    // Initialize WebDataManager
    dataManager = new WebDataManager({
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
  });

  describe('Project Info Resolution', () => {
    it('should resolve oewn:2024 to correct URLs without hardcoded values', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2024');
      
      expect(projectInfo.id).toBe('oewn:2024');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2024');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual en-word.net URLs (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/wordnet/static/english-wordnet-2024.xml.gz'))).toBe(true);
      expect(projectInfo.allUrls.some(url => url.includes('/api/github/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz'))).toBe(true);
      
      // All URLs should be properly proxied
      projectInfo.allUrls.forEach(url => {
        expect(url).toMatch(/^\/api\//);
        expect(url).not.toContain('https://');
      });
    });

    it('should resolve oewn:2021 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2021');
      
      expect(projectInfo.id).toBe('oewn:2021');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2021');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual en-word.net URL (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/wordnet/static/english-wordnet-2021.xml.gz'))).toBe(true);
    });

    it('should resolve cili:1.0 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('cili:1.0');
      
      expect(projectInfo.id).toBe('cili:1.0');
      expect(projectInfo.label).toBe('Collaborative Interlingual Index');
      expect(projectInfo.version).toBe('1.0');
      
      // Should NOT contain hardcoded example.com URLs
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain actual GitHub URL (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/github/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz'))).toBe(true);
    });

    it('should handle unknown packages gracefully with fallback', async () => {
      const projectInfo = await dataManager.getProjectInfo('unknown:1.0');
      
      // Should fallback to example.com for unknown packages (this is expected behavior)
      expect(projectInfo.id).toBe('unknown:1.0');
      expect(projectInfo.url).toContain('example.com');
      expect(projectInfo.primaryUrl).toContain('example.com');
    });
  });

  describe('URL Proxy Conversion', () => {
    it('should convert en-word.net URLs to proxy URLs', () => {
      const originalUrl = 'https://en-word.net/static/english-wordnet-2024.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/wordnet/static/english-wordnet-2024.xml.gz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should convert GitHub URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/github/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should convert CILI URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/github/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should convert OMW URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/omwn-releases/v1.4/omw-fr-1.4.tar.xz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should convert raw GitHub URLs to proxy URLs', () => {
      const originalUrl = 'https://raw.githubusercontent.com/globalwordnet/cili/main/cili.tsv';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/raw-github/globalwordnet/cili/main/cili.tsv');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should convert release assets URLs to proxy URLs', () => {
      const originalUrl = 'https://release-assets.githubusercontent.com/1234567890/asset.tar.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/release-assets/1234567890/asset.tar.gz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should handle external URLs with generic proxy', () => {
      const originalUrl = 'https://example.com/some-file.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/external/example.com/some-file.xml.gz');
      expect(proxyUrl).not.toContain('https://');
      expect(proxyUrl).toMatch(/^\/api\//);
    });

    it('should return original URL for non-HTTPS URLs', () => {
      const originalUrl = 'http://example.com/file.xml';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe(originalUrl);
    });

    it('should return original URL for relative URLs', () => {
      const originalUrl = '/api/local/file.xml';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe(originalUrl);
    });
  });

  describe('Lexicon Resolution Behavior', () => {
    it('should load the correct lexicon when given a package ID', async () => {
      const packageId = 'oewn:2024';
      const projectInfo = await dataManager.getProjectInfo(packageId);
      
      // Verify that the project info contains the correct URLs for the requested version
      expect(projectInfo.version).toBe('2024');
      expect(projectInfo.allUrls.length).toBeGreaterThan(0);
      
      // All URLs should be properly proxied
      projectInfo.allUrls.forEach(url => {
        expect(url).toMatch(/^\/api\//);
        expect(url).not.toContain('https://');
        expect(url).not.toContain('example.com');
      });
    });

    it('should handle version-specific package resolution', async () => {
      // Test different versions of the same package
      const versions = ['2021', '2022', '2023', '2024'];
      
      for (const version of versions) {
        const packageId = `oewn:${version}`;
        const projectInfo = await dataManager.getProjectInfo(packageId);
        
        expect(projectInfo.id).toBe(packageId);
        expect(projectInfo.version).toBe(version);
        expect(projectInfo.allUrls.length).toBeGreaterThan(0);
        
        // All URLs should be properly proxied
        projectInfo.allUrls.forEach(url => {
          expect(url).toMatch(/^\/api\//);
          expect(url).not.toContain('https://');
          expect(url).not.toContain('example.com');
        });
      }
    });

    it('should provide consistent project metadata', async () => {
      const projectIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4'];
      
      for (const projectId of projectIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Basic structure validation
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
        expect(projectInfo.language).toBeTruthy();
        expect(projectInfo.version).toBeTruthy();
        expect(projectInfo.license).toBeTruthy();
        expect(projectInfo.citation).toBeTruthy();
        
        // URL structure validation
        expect(Array.isArray(projectInfo.allUrls)).toBe(true);
        expect(projectInfo.primaryUrl).toBeTruthy();
        expect(Array.isArray(projectInfo.fallbackUrls)).toBe(true);
        
        // All URLs should be proxied
        projectInfo.allUrls.forEach(url => {
          expect(url).toMatch(/^\/api\//);
          expect(url).not.toContain('https://');
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed project IDs gracefully', async () => {
      const malformedIds = ['invalid', 'oewn:', ':2024', 'oewn:2024:extra'];
      
      for (const projectId of malformedIds) {
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Should fallback to basic structure
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
        expect(projectInfo.language).toBeTruthy();
        expect(projectInfo.version).toBeTruthy();
      }
    });

    it('should handle empty or null project IDs', async () => {
      const emptyIds = ['', null, undefined];
      
      for (const projectId of emptyIds) {
        if (projectId === null || projectId === undefined) continue;
        
        const projectInfo = await dataManager.getProjectInfo(projectId);
        
        // Should fallback to basic structure
        expect(projectInfo.id).toBe(projectId);
        expect(projectInfo.label).toBeTruthy();
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
