import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { config, ConfigManager } from '../src/config';
import { ConfigurationError, ProjectError } from '../src/types';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';

let testDataDir: string;

beforeEach(() => {
  testDataDir = mkdtempSync(join(tmpdir(), 'wn-ts-test-'));
  config.dataDirectory = testDataDir;
});

afterEach(() => {
  if (testDataDir && existsSync(testDataDir)) {
    try {
      unlinkSync(testDataDir);
    } catch {}
  }
});

describe('Config', () => {
  it('should have default configuration', () => {
    expect(config.dataDirectory).toBe(testDataDir);
  });

  it('should set data directory', () => {
    const testDir = join(__dirname, 'test-data');
    config.dataDirectory = testDir;
    expect(config.dataDirectory).toBe(testDir);
  });

  it('should derive database path from data directory', () => {
    const testDir = join(__dirname, 'test-data');
    config.dataDirectory = testDir;
    expect(config.databasePath).toBe(join(testDir, 'wn.db'));
  });

  it('should derive download directory from data directory', () => {
    const testDir = join(__dirname, 'test-data');
    config.dataDirectory = testDir;
    expect(config.downloadDirectory).toBe(join(testDir, 'downloads'));
  });

  it('should handle multithreading setting', () => {
    expect(config.allowMultithreading).toBe(false);
    config.allowMultithreading = true;
    expect(config.allowMultithreading).toBe(true);
  });

  it('should throw error when setting data directory to non-directory path', () => {
    const tempFile = join(__dirname, 'temp-file');
    writeFileSync(tempFile, 'test');
    
    expect(() => {
      config.dataDirectory = tempFile;
    }).toThrow(ConfigurationError);
    
    unlinkSync(tempFile);
  });
});

describe('ConfigManager', () => {
  let tempConfig: ConfigManager;
  let tempIndexPath: string;

  beforeEach(() => {
    tempConfig = new ConfigManager();
    tempIndexPath = join(__dirname, 'temp-index.toml');
  });

  afterEach(() => {
    try {
      unlinkSync(tempIndexPath);
    } catch {
      // File doesn't exist, ignore
    }
  });

  describe('basic configuration', () => {
    it('should initialize with default data directory', () => {
      const homeDir = homedir();
      const expectedDir = join(homeDir, '.wn_ts_data');
      expect(tempConfig.dataDirectory).toBe(expectedDir);
    });

    it('should set data directory', () => {
      const newDir = join(__dirname, 'test-data');
      tempConfig.dataDirectory = newDir;
      expect(tempConfig.dataDirectory).toBe(newDir);
    });

    it('should derive database path from data directory', () => {
      const testDir = join(__dirname, 'test-data');
      tempConfig.dataDirectory = testDir;
      expect(tempConfig.databasePath).toBe(join(testDir, 'wn.db'));
    });

    it('should derive download directory from data directory', () => {
      const testDir = join(__dirname, 'test-data');
      tempConfig.dataDirectory = testDir;
      expect(tempConfig.downloadDirectory).toBe(join(testDir, 'downloads'));
    });

    it('should handle multithreading setting', () => {
      expect(tempConfig.allowMultithreading).toBe(false);
      tempConfig.allowMultithreading = true;
      expect(tempConfig.allowMultithreading).toBe(true);
    });

    it('should throw error when setting data directory to non-directory path', () => {
      const tempFile = join(__dirname, 'temp-file');
      writeFileSync(tempFile, 'test');
      
      expect(() => {
        tempConfig.dataDirectory = tempFile;
      }).toThrow(ConfigurationError);
      
      unlinkSync(tempFile);
    });
  });

  describe('project management', () => {
    it('should add a project', () => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en', 'MIT');
      
      const index = tempConfig.index;
      expect(index.test).toBeDefined();
      expect(index.test.type).toBe('wordnet');
      expect(index.test.label).toBe('Test WordNet');
      expect(index.test.language).toBe('en');
      expect(index.test.license).toBe('MIT');
    });

    it('should add project version', () => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en');
      tempConfig.addProjectVersion('test', '1.0', 'https://example.com/test.xml.gz');
      
      const project = tempConfig.index.test;
      expect(project.versions['1.0']).toBeDefined();
      expect(project.versions['1.0'].resource_urls).toEqual(['https://example.com/test.xml.gz']);
    });

    it('should add project version with error', () => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en');
      tempConfig.addProjectVersion('test', '1.0', undefined, 'This version is deprecated');
      
      const project = tempConfig.index.test;
      expect(project.versions['1.0'].error).toBe('This version is deprecated');
    });

    it('should throw error when adding duplicate project', () => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en');
      
      expect(() => {
        tempConfig.addProject('test', 'wordnet', 'Another Test', 'en');
      }).toThrow('Project already added: test');
    });

    it('should throw error when adding version to non-existent project', () => {
      expect(() => {
        tempConfig.addProjectVersion('nonexistent', '1.0', 'https://example.com/test.xml.gz');
      }).toThrow('Project not found: nonexistent');
    });

    it('should throw error when specifying both url and error', () => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en');
      
      expect(() => {
        tempConfig.addProjectVersion('test', '1.0', 'https://example.com/test.xml.gz', 'error message');
      }).toThrow(ConfigurationError);
    });
  });

  describe('project info retrieval', () => {
    beforeEach(() => {
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en', 'MIT');
      tempConfig.addProjectVersion('test', '1.0', 'https://example.com/test.xml.gz');
    });

    it('should get project info with version', () => {
      const info = tempConfig.getProjectInfo('test:1.0');
      
      expect(info.id).toBe('test');
      expect(info.version).toBe('1.0');
      expect(info.type).toBe('wordnet');
      expect(info.label).toBe('Test WordNet');
      expect(info.language).toBe('en');
      expect(info.license).toBe('MIT');
      expect(info.resource_urls).toEqual(['https://example.com/test.xml.gz']);
    });

    it('should get project info without version (uses first available)', () => {
      const info = tempConfig.getProjectInfo('test');
      
      expect(info.id).toBe('test');
      expect(info.version).toBe('1.0');
    });

    it('should get project info with wildcard version', () => {
      const info = tempConfig.getProjectInfo('test:*');
      
      expect(info.id).toBe('test');
      expect(info.version).toBe('1.0');
    });

    it('should throw error for non-existent project', () => {
      expect(() => {
        tempConfig.getProjectInfo('nonexistent:1.0');
      }).toThrow(ProjectError);
    });

    it('should throw error for non-existent version', () => {
      expect(() => {
        tempConfig.getProjectInfo('test:2.0');
      }).toThrow(ProjectError);
    });

    it('should throw error when project has no versions', () => {
      tempConfig.addProject('empty', 'wordnet', 'Empty WordNet', 'en');
      
      expect(() => {
        tempConfig.getProjectInfo('empty');
      }).toThrow(ProjectError);
    });

    it('should throw error when version has error', () => {
      tempConfig.addProjectVersion('test', '2.0', undefined, 'This version is deprecated');
      
      expect(() => {
        tempConfig.getProjectInfo('test:2.0');
      }).toThrow(ProjectError);
    });
  });

  describe('TOML index loading', () => {
    it('should load valid TOML index', () => {
      const tomlContent = `
[test]
  label = "Test WordNet"
  language = "en"
  license = "MIT"
  [test.versions."1.0"]
    url = "https://example.com/test.xml.gz"
      `;
      
      writeFileSync(tempIndexPath, tomlContent);
      tempConfig.loadIndex(tempIndexPath);
      
      const index = tempConfig.index;
      expect(index.test).toBeDefined();
      expect(index.test.label).toBe('Test WordNet');
      expect(index.test.versions['1.0'].resource_urls).toEqual(['https://example.com/test.xml.gz']);
    });

    it('should handle multiline URLs', () => {
      const tomlContent = `
[test]
  label = "Test WordNet"
  language = "en"
  [test.versions."1.0"]
    url = """
      https://example.com/test1.xml.gz
      https://example.com/test2.xml.gz
    """
      `;
      
      writeFileSync(tempIndexPath, tomlContent);
      tempConfig.loadIndex(tempIndexPath);
      
      const project = tempConfig.index.test;
      expect(project.versions['1.0'].resource_urls).toEqual([
        'https://example.com/test1.xml.gz',
        'https://example.com/test2.xml.gz'
      ]);
    });

    it('should throw error for malformed TOML', () => {
      const invalidToml = '[test\n  label = "Test"';
      writeFileSync(tempIndexPath, invalidToml);
      
      expect(() => {
        tempConfig.loadIndex(tempIndexPath);
      }).toThrow(ConfigurationError);
    });

    it('should validate project consistency when updating', () => {
      // Add initial project
      tempConfig.addProject('test', 'wordnet', 'Test WordNet', 'en', 'MIT');
      
      // Try to update with conflicting label
      const tomlContent = `
[test]
  label = "Different Label"
  language = "en"
  [test.versions."1.0"]
    url = "https://example.com/test.xml.gz"
      `;
      
      writeFileSync(tempIndexPath, tomlContent);
      
      expect(() => {
        tempConfig.loadIndex(tempIndexPath);
      }).toThrow(ConfigurationError);
    });
  });

  describe('cache path generation', () => {
    it('should generate consistent cache paths', () => {
      const url = 'https://example.com/test.xml.gz';
      const path1 = tempConfig.getCachePath(url);
      const path2 = tempConfig.getCachePath(url);
      
      expect(path1).toBe(path2);
      expect(path1.replace(/\\/g, '/')).toMatch(/\.wn_ts_data\/downloads\/[a-f0-9]+$/);
    });

    it('should generate different paths for different URLs', () => {
      const url1 = 'https://example.com/test1.xml.gz';
      const url2 = 'https://example.com/test2.xml.gz';
      const path1 = tempConfig.getCachePath(url1);
      const path2 = tempConfig.getCachePath(url2);
      
      expect(path1).not.toBe(path2);
    });
  });

  describe('default index loading', () => {
    it('should load default projects from index.toml', () => {
      const index = config.index;
      
      // Check that some expected projects are loaded
      expect(index.oewn).toBeDefined();
      expect(index.omw).toBeDefined();
      expect(index.cili).toBeDefined();
      
      // Check project structure
      expect(index.oewn.label).toBe('Open English WordNet');
      expect(index.oewn.language).toBe('en');
      expect(index.oewn.versions).toBeDefined();
    });

    it('should get project info for default projects', () => {
      const info = config.getProjectInfo('oewn:2024');
      
      expect(info.id).toBe('oewn');
      expect(info.version).toBe('2024');
      expect(info.label).toBe('Open English WordNet');
      expect(info.language).toBe('en');
      expect(info.resource_urls.length).toBeGreaterThan(0);
    });
  });
}); 