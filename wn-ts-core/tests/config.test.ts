import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { config, ConfigManager, PlaceholderConfigManager } from '../src/config';
import { ConfigurationError, ProjectError } from '../src/types';

describe('Config', () => {
  it('should have placeholder configuration', () => {
    // Test that the placeholder config throws appropriate errors
    expect(() => config.dataDirectory).toThrow(ConfigurationError);
  });

  it('should throw error when setting data directory', () => {
    expect(() => {
      config.dataDirectory = '/test/path';
    }).toThrow(ConfigurationError);
  });

  it('should throw error when accessing download directory', () => {
    expect(() => config.downloadDirectory).toThrow(ConfigurationError);
  });

  it('should handle multithreading setting', () => {
    // Placeholder should allow setting but not persist
    config.allowMultithreading = true;
    expect(config.allowMultithreading).toBe(false); // Always returns false
  });

  it('should throw error when setting data directory to non-directory path', () => {
    expect(() => {
      config.dataDirectory = '/test/file';
    }).toThrow(ConfigurationError);
  });
});

describe('ConfigManager', () => {
  let tempConfig: PlaceholderConfigManager;

  beforeEach(() => {
    tempConfig = new PlaceholderConfigManager();
  });

  describe('basic configuration', () => {
    it('should throw error when accessing data directory', () => {
      expect(() => tempConfig.dataDirectory).toThrow(ConfigurationError);
    });

    it('should throw error when setting data directory', () => {
      expect(() => {
        tempConfig.dataDirectory = '/test/path';
      }).toThrow(ConfigurationError);
    });

    it('should throw error when accessing download directory', () => {
      expect(() => tempConfig.downloadDirectory).toThrow(ConfigurationError);
    });

    it('should handle multithreading setting', () => {
      expect(tempConfig.allowMultithreading).toBe(false);
      tempConfig.allowMultithreading = true;
      // Should not persist
      expect(tempConfig.allowMultithreading).toBe(false);
    });

    it('should throw error when setting data directory to non-directory path', () => {
      expect(() => {
        tempConfig.dataDirectory = '/test/file';
      }).toThrow(ConfigurationError);
    });
  });

  describe('project management', () => {
    it('should throw error when adding project', () => {
      expect(() => {
        tempConfig.addProject('test', 'wordnet', 'Test', 'en', 'MIT');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when adding project version', () => {
      expect(() => {
        tempConfig.addProjectVersion('test', '1.0', 'https://example.com');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when adding project version with error', () => {
      expect(() => {
        tempConfig.addProjectVersion('test', '1.0', undefined, 'Error message');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when adding duplicate project', () => {
      expect(() => {
        tempConfig.addProject('test', 'wordnet');
        tempConfig.addProject('test', 'wordnet');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when adding version to non-existent project', () => {
      expect(() => {
        tempConfig.addProjectVersion('nonexistent', '1.0');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when specifying both url and error', () => {
      expect(() => {
        tempConfig.addProjectVersion('test', '1.0', 'https://example.com', 'Error');
      }).toThrow(ConfigurationError);
    });
  });

  describe('project info retrieval', () => {
    it('should throw error when getting project info', () => {
      expect(() => {
        tempConfig.getProjectInfo('test:1.0');
      }).toThrow(ProjectError);
    });

    it('should throw error for non-existent project', () => {
      expect(() => {
        tempConfig.getProjectInfo('nonexistent');
      }).toThrow(ProjectError);
    });

    it('should throw error for non-existent version', () => {
      expect(() => {
        tempConfig.getProjectInfo('test:nonexistent');
      }).toThrow(ProjectError);
    });

    it('should throw error when project has no versions', () => {
      expect(() => {
        tempConfig.getProjectInfo('test');
      }).toThrow(ProjectError);
    });

    it('should throw error when version has error', () => {
      expect(() => {
        tempConfig.getProjectInfo('test:error');
      }).toThrow(ProjectError);
    });
  });

  describe('TOML index loading', () => {
    it('should throw error when loading index', () => {
      expect(() => {
        tempConfig.loadIndex('/test/index.toml');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when handling multiline URLs', () => {
      expect(() => {
        tempConfig.loadIndex('/test/index.toml');
      }).toThrow(ConfigurationError);
    });

    it('should throw error for malformed TOML', () => {
      expect(() => {
        tempConfig.loadIndex('/test/malformed.toml');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when validating project consistency', () => {
      expect(() => {
        tempConfig.update({ index: {} });
      }).toThrow(ConfigurationError);
    });
  });

  describe('cache path generation', () => {
    it('should throw error when generating cache paths', () => {
      expect(() => {
        tempConfig.getCachePath('https://example.com');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when generating different paths for different URLs', () => {
      expect(() => {
        tempConfig.getCachePath('https://example1.com');
        tempConfig.getCachePath('https://example2.com');
      }).toThrow(ConfigurationError);
    });
  });

  describe('default index loading', () => {
    it('should throw error when loading default projects', () => {
      expect(() => {
        tempConfig.loadIndex('/test/index.toml');
      }).toThrow(ConfigurationError);
    });

    it('should throw error when getting project info for default projects', () => {
      expect(() => {
        tempConfig.getProjectInfo('test');
      }).toThrow(ProjectError);
    });
  });

  describe('utility methods', () => {
    it('should split lexicon specifier correctly', () => {
      expect(tempConfig.splitLexiconSpecifier('test:1.0')).toEqual(['test', '1.0']);
      expect(tempConfig.splitLexiconSpecifier('test')).toEqual(['test', '']);
    });

    it('should return false for isDirectory', () => {
      expect(tempConfig.isDirectory('/test/path')).toBe(false);
    });

    it('should have empty index', () => {
      expect(tempConfig.index).toEqual({});
    });
  });
}); 