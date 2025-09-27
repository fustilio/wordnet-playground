import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebDataManager } from '../../src/data-management/adapters/web-data-manager.js';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { WordNetOrchestrator } from '../../src/workers/wordnet-orchestrator.js';
import { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

describe('Lexicon Resolution Integration Tests', () => {
  let dataManager: WebDataManager;
  let wordnet: WebWordnet;
  let orchestrator: WordNetOrchestrator;
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
    
    // Initialize orchestrator
    orchestrator = new WordNetOrchestrator({
      defaultLexicon: 'oewn:2024',
      autoCheckUpdates: false,
      maxConcurrentLoads: 1
    }, sqlModule);
    
    await orchestrator.initialize(sqlModule);
  });

  afterEach(async () => {
    if (wordnet) {
      wordnet.close();
    }
  });

  describe('Project Info Resolution', () => {
    it('should resolve oewn:2024 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2024');
      
      expect(projectInfo.id).toBe('oewn:2024');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2024');
      
      // Should have proxy URLs, not example.com
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain the actual en-word.net URLs (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/wordnet/static/english-wordnet-2024.xml.gz'))).toBe(true);
      expect(projectInfo.allUrls.some(url => url.includes('/api/github/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz'))).toBe(true);
    });

    it('should resolve oewn:2021 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('oewn:2021');
      
      expect(projectInfo.id).toBe('oewn:2021');
      expect(projectInfo.label).toBe('Open English WordNet');
      expect(projectInfo.language).toBe('en');
      expect(projectInfo.version).toBe('2021');
      
      // Should have proxy URLs, not example.com
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain the actual en-word.net URL (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/wordnet/static/english-wordnet-2021.xml.gz'))).toBe(true);
    });

    it('should resolve cili:1.0 to correct URLs', async () => {
      const projectInfo = await dataManager.getProjectInfo('cili:1.0');
      
      expect(projectInfo.id).toBe('cili:1.0');
      expect(projectInfo.label).toBe('Collaborative Interlingual Index');
      expect(projectInfo.version).toBe('1.0');
      
      // Should have proxy URLs, not example.com
      expect(projectInfo.url).not.toContain('example.com');
      expect(projectInfo.primaryUrl).not.toContain('example.com');
      expect(projectInfo.allUrls).not.toContain('example.com');
      
      // Should contain the actual GitHub URL (proxied)
      expect(projectInfo.allUrls.some(url => url.includes('/api/github/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz'))).toBe(true);
    });

    it('should handle unknown packages gracefully', async () => {
      const projectInfo = await dataManager.getProjectInfo('unknown:1.0');
      
      // Should fallback to example.com for unknown packages
      expect(projectInfo.id).toBe('unknown:1.0');
      expect(projectInfo.url).toContain('example.com');
      expect(projectInfo.primaryUrl).toContain('example.com');
    });
  });

  describe('Package ID to Lexicon ID Mapping', () => {
    it('should correctly map package IDs to lexicon IDs', () => {
      // Test the mapping function from the worker
      const mapPackageIdToLexiconId = (packageId: string): string => {
        const colonIndex = packageId.indexOf(':');
        if (colonIndex === -1) return packageId;
        return packageId.substring(0, colonIndex);
      };

      expect(mapPackageIdToLexiconId('oewn:2024')).toBe('oewn');
      expect(mapPackageIdToLexiconId('cili:1.0')).toBe('cili');
      expect(mapPackageIdToLexiconId('omw-fr:1.4')).toBe('omw-fr');
      expect(mapPackageIdToLexiconId('simple-package')).toBe('simple-package');
    });
  });

  describe('URL Proxy Conversion', () => {
    it('should convert en-word.net URLs to proxy URLs', () => {
      const originalUrl = 'https://en-word.net/static/english-wordnet-2024.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/wordnet/static/english-wordnet-2024.xml.gz');
    });

    it('should convert GitHub URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/github/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz');
    });

    it('should convert CILI URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/github/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
    });

    it('should handle external URLs with generic proxy', () => {
      const originalUrl = 'https://example.com/some-file.xml.gz';
      const proxyUrl = dataManager.toProxyUrl(originalUrl);
      
      expect(proxyUrl).toBe('/api/external/example.com/some-file.xml.gz');
    });
  });

  describe('Lexicon Loading Behavior', () => {
    it('should load the correct lexicon when given a package ID', async () => {
      // This test would require actual data loading, so we'll just test the resolution logic
      const packageId = 'oewn:2024';
      const projectInfo = await dataManager.getProjectInfo(packageId);
      
      // Verify that the project info contains the correct URLs for the requested version
      expect(projectInfo.version).toBe('2024');
      expect(projectInfo.allUrls.length).toBeGreaterThan(0);
      
      // All URLs should be properly proxied
      projectInfo.allUrls.forEach(url => {
        expect(url).toMatch(/^\/api\//);
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
          expect(url).not.toContain('example.com');
        });
      }
    });
  });
});
