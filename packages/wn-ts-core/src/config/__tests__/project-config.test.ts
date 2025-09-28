import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PROJECTS,
  DEFAULT_PROXY_CONFIG,
  FALLBACK_URLS,
  getProjectConfig,
  getProjectVersionConfig,
  getProjectUrls,
  getFallbackUrls,
  getAllProjectUrls,
  projectExists,
  getAllProjectIds,
  validateProjectId,
  getProxyUrl,
  needsProxy
} from '../project-config.js';

describe('Project Configuration System', () => {
  describe('DEFAULT_PROJECTS', () => {
    it('should contain all expected projects', () => {
      expect(DEFAULT_PROJECTS).toHaveProperty('oewn');
      expect(DEFAULT_PROJECTS).toHaveProperty('ewn');
      expect(DEFAULT_PROJECTS).toHaveProperty('cili');
      expect(DEFAULT_PROJECTS).toHaveProperty('omw-fr');
      expect(DEFAULT_PROJECTS).toHaveProperty('omw-th');
    });

    it('should have valid project structures', () => {
      for (const [id, project] of Object.entries(DEFAULT_PROJECTS)) {
        expect(project.id).toBe(id);
        expect(project.label).toBeTruthy();
        expect(project.language).toBeTruthy();
        expect(project.license).toBeTruthy();
        expect(project.versions).toBeDefined();
        expect(Object.keys(project.versions).length).toBeGreaterThan(0);
      }
    });

    it('should have valid version structures', () => {
      for (const project of Object.values(DEFAULT_PROJECTS)) {
        for (const [, versionConfig] of Object.entries(project.versions)) {
          expect(versionConfig.url).toBeTruthy();
          if (typeof versionConfig.url === 'string') {
            expect(versionConfig.url).toMatch(/^https?:\/\//);
          } else {
            expect(Array.isArray(versionConfig.url)).toBe(true);
            expect(versionConfig.url.length).toBeGreaterThan(0);
            for (const url of versionConfig.url) {
              expect(url).toMatch(/^https?:\/\//);
            }
          }
        }
      }
    });
  });

  describe('DEFAULT_PROXY_CONFIG', () => {
    it('should have valid proxy configuration', () => {
      expect(DEFAULT_PROXY_CONFIG.enabled).toBe(true);
      expect(DEFAULT_PROXY_CONFIG.baseUrl).toBeTruthy();
      expect(DEFAULT_PROXY_CONFIG.endpoints).toBeDefined();
      expect(Object.keys(DEFAULT_PROXY_CONFIG.endpoints).length).toBeGreaterThan(0);
    });

    it('should have valid endpoint configurations', () => {
      for (const [, endpoint] of Object.entries(DEFAULT_PROXY_CONFIG.endpoints)) {
        expect(endpoint.target).toBeTruthy();
        expect(endpoint.target).toMatch(/^https?:\/\//);
        expect(typeof endpoint.rewrite).toBe('function');
      }
    });
  });

  describe('FALLBACK_URLS', () => {
    it('should have fallback URLs for major projects', () => {
      expect(FALLBACK_URLS).toHaveProperty('oewn:2024');
      expect(FALLBACK_URLS).toHaveProperty('oewn:2023');
      expect(FALLBACK_URLS).toHaveProperty('oewn:2022');
      expect(FALLBACK_URLS).toHaveProperty('cili:1.0');
    });

    it('should have valid fallback URLs', () => {
      for (const urls of Object.values(FALLBACK_URLS)) {
        expect(Array.isArray(urls)).toBe(true);
        expect(urls.length).toBeGreaterThan(0);
        for (const url of urls) {
          expect(url).toMatch(/^https?:\/\//);
        }
      }
    });
  });

  describe('getProjectConfig', () => {
    it('should return project config for valid project IDs', () => {
      const config = getProjectConfig('oewn:2024');
      expect(config).toBeDefined();
      expect(config?.id).toBe('oewn');
      expect(config?.label).toBe('Open English WordNet');
    });

    it('should return undefined for invalid project IDs', () => {
      expect(getProjectConfig('invalid:1.0')).toBeUndefined();
      expect(getProjectConfig('')).toBeUndefined();
    });
  });

  describe('getProjectVersionConfig', () => {
    it('should return version config for valid project versions', () => {
      const config = getProjectVersionConfig('oewn:2024');
      expect(config).toBeDefined();
      expect(config?.url).toBeDefined();
    });

    it('should return undefined for invalid project versions', () => {
      expect(getProjectVersionConfig('oewn:9999')).toBeUndefined();
      expect(getProjectVersionConfig('invalid:1.0')).toBeUndefined();
    });
  });

  describe('getProjectUrls', () => {
    it('should return URLs for valid project versions', () => {
      const urls = getProjectUrls('oewn:2024');
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url).toMatch(/^https?:\/\//);
      }
    });

    it('should return empty array for invalid project versions', () => {
      expect(getProjectUrls('invalid:1.0')).toEqual([]);
      expect(getProjectUrls('oewn:9999')).toEqual([]);
    });

    it('should handle both string and array URL formats', () => {
      const singleUrl = getProjectUrls('oewn:2021');
      const multipleUrls = getProjectUrls('oewn:2024');
      
      expect(Array.isArray(singleUrl)).toBe(true);
      expect(Array.isArray(multipleUrls)).toBe(true);
      expect(singleUrl.length).toBeGreaterThan(0);
      expect(multipleUrls.length).toBeGreaterThan(0);
    });
  });

  describe('getFallbackUrls', () => {
    it('should return fallback URLs for projects that have them', () => {
      const urls = getFallbackUrls('oewn:2024');
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url).toMatch(/^https?:\/\//);
      }
    });

    it('should return empty array for projects without fallback URLs', () => {
      expect(getFallbackUrls('oewn:2021')).toEqual([]);
      expect(getFallbackUrls('invalid:1.0')).toEqual([]);
    });
  });

  describe('getAllProjectUrls', () => {
    it('should return primary and fallback URLs combined', () => {
      const urls = getAllProjectUrls('oewn:2024');
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
      
      // Should contain both primary and fallback URLs
      const primaryUrls = getProjectUrls('oewn:2024');
      const fallbackUrls = getFallbackUrls('oewn:2024');
      expect(urls.length).toBe(primaryUrls.length + fallbackUrls.length);
    });

    it('should return only primary URLs when no fallbacks exist', () => {
      const urls = getAllProjectUrls('oewn:2021');
      const primaryUrls = getProjectUrls('oewn:2021');
      expect(urls).toEqual(primaryUrls);
    });
  });

  describe('projectExists', () => {
    it('should return true for existing projects', () => {
      expect(projectExists('oewn:2024')).toBe(true);
      expect(projectExists('cili:1.0')).toBe(true);
      expect(projectExists('omw-fr:1.4')).toBe(true);
    });

    it('should return false for non-existing projects', () => {
      expect(projectExists('invalid:1.0')).toBe(false);
      expect(projectExists('oewn:9999')).toBe(false);
      expect(projectExists('')).toBe(false);
    });
  });

  describe('getAllProjectIds', () => {
    it('should return all available project IDs', () => {
      const projectIds = getAllProjectIds();
      expect(Array.isArray(projectIds)).toBe(true);
      expect(projectIds.length).toBeGreaterThan(0);
      
      // Should contain expected projects
      expect(projectIds).toContain('oewn:2024');
      expect(projectIds).toContain('oewn:2023');
      expect(projectIds).toContain('cili:1.0');
      expect(projectIds).toContain('omw-fr:1.4');
    });

    it('should have valid project ID format', () => {
      const projectIds = getAllProjectIds();
      for (const projectId of projectIds) {
        expect(validateProjectId(projectId)).toBe(true);
      }
    });
  });

  describe('validateProjectId', () => {
    it('should return true for valid project IDs', () => {
      expect(validateProjectId('oewn:2024')).toBe(true);
      expect(validateProjectId('cili:1.0')).toBe(true);
      expect(validateProjectId('omw-fr:1.4')).toBe(true);
    });

    it('should return false for invalid project IDs', () => {
      expect(validateProjectId('oewn')).toBe(false);
      expect(validateProjectId(':2024')).toBe(false);
      expect(validateProjectId('oewn:')).toBe(false);
      expect(validateProjectId('')).toBe(false);
      expect(validateProjectId('oewn:2024:extra')).toBe(false);
    });
  });

  describe('getProxyUrl', () => {
    it('should convert en-word.net URLs to proxy URLs', () => {
      const originalUrl = 'https://en-word.net/static/english-wordnet-2024.xml.gz';
      const proxyUrl = getProxyUrl(originalUrl);
      expect(proxyUrl).toBe('/api/wordnet/static/english-wordnet-2024.xml.gz');
    });

    it('should convert GitHub URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz';
      const proxyUrl = getProxyUrl(originalUrl);
      expect(proxyUrl).toBe('/api/github/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz');
    });

    it('should convert CILI URLs to proxy URLs', () => {
      const originalUrl = 'https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz';
      const proxyUrl = getProxyUrl(originalUrl);
      expect(proxyUrl).toBe('/api/github/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
    });

    it('should convert external URLs to generic proxy', () => {
      const originalUrl = 'https://example.com/some-file.xml.gz';
      const proxyUrl = getProxyUrl(originalUrl);
      expect(proxyUrl).toBe('/api/external/example.com/some-file.xml.gz');
    });

    it('should return original URL when proxy is disabled', () => {
      const originalUrl = 'https://en-word.net/static/english-wordnet-2024.xml.gz';
      const disabledProxyConfig = { ...DEFAULT_PROXY_CONFIG, enabled: false };
      const proxyUrl = getProxyUrl(originalUrl, disabledProxyConfig);
      expect(proxyUrl).toBe(originalUrl);
    });

    it('should return original URL for non-HTTPS URLs', () => {
      const originalUrl = 'http://example.com/file.xml';
      const proxyUrl = getProxyUrl(originalUrl);
      expect(proxyUrl).toBe(originalUrl);
    });
  });

  describe('needsProxy', () => {
    it('should return true for URLs that need proxying', () => {
      expect(needsProxy('https://en-word.net/static/file.xml.gz')).toBe(true);
      expect(needsProxy('https://github.com/user/repo/releases/download/v1.0/file.tar.gz')).toBe(true);
      expect(needsProxy('https://example.com/file.xml')).toBe(true);
    });

    it('should return false for URLs that do not need proxying', () => {
      expect(needsProxy('http://example.com/file.xml')).toBe(false);
      expect(needsProxy('/api/local/file.xml')).toBe(false);
      expect(needsProxy('file:///local/path/file.xml')).toBe(false);
    });

    it('should return false when proxy is disabled', () => {
      const disabledProxyConfig = { ...DEFAULT_PROXY_CONFIG, enabled: false };
      expect(needsProxy('https://en-word.net/static/file.xml.gz', disabledProxyConfig)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should provide complete project information for oewn:2024', () => {
      const projectId = 'oewn:2024';
      
      expect(projectExists(projectId)).toBe(true);
      expect(validateProjectId(projectId)).toBe(true);
      
      const config = getProjectConfig(projectId);
      expect(config).toBeDefined();
      expect(config?.label).toBe('Open English WordNet');
      
      const urls = getAllProjectUrls(projectId);
      expect(urls.length).toBeGreaterThan(0);
      
      const proxyUrls = urls.map(url => getProxyUrl(url));
      expect(proxyUrls.length).toBe(urls.length);
      expect(proxyUrls.every(url => url.startsWith('/api/'))).toBe(true);
    });

    it('should handle all project versions consistently', () => {
      const projectIds = getAllProjectIds();
      
      for (const projectId of projectIds) {
        expect(validateProjectId(projectId)).toBe(true);
        expect(projectExists(projectId)).toBe(true);
        
        const config = getProjectConfig(projectId);
        expect(config).toBeDefined();
        
        const urls = getAllProjectUrls(projectId);
        expect(Array.isArray(urls)).toBe(true);
        expect(urls.length).toBeGreaterThan(0);
        
        for (const url of urls) {
          expect(url).toMatch(/^https?:\/\//);
        }
      }
    });
  });
});
