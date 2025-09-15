import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseWordNetIndex, 
  categorizeWordNetUrls, 
  getWordNetUrls,
  type WordNetIndexEntry 
} from '../src/utils/wordnet-analyzer.js';

describe('WordNet Analyzer', () => {
  let sampleTomlContent: string;
  let sampleEntries: WordNetIndexEntry[];

  beforeEach(() => {
    sampleTomlContent = `[cili]
  type = "ili"
  label = "Collaborative Interlingual Index"
  license = "https://creativecommons.org/licenses/by/4.0/"
  [cili.versions."1.0"]
    url = "https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz"

[oewn]
  label = "Open English WordNet"
  language = "en"
  license = "https://creativecommons.org/licenses/by/4.0/"
  [oewn.versions.2024]
    url = "https://en-word.net/static/english-wordnet-2024.xml.gz"
  [oewn.versions.2023]
    url = "https://en-word.net/static/english-wordnet-2023.xml.gz"

[omw]
  label = "Open Multilingual Wordnet"
  language = "mul"
  license = "Please consult the LICENSE files included with the individual wordnets."
  [omw.versions."1.4"]
    url = "https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz"

[omw-en]
  label = "OMW English Wordnet based on WordNet 3.0"
  language = "en"
  license = "https://wordnet.princeton.edu/license-and-commercial-use"
  [omw-en.versions."1.4"]
    url = "https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz"

[omw-es]
  label = "Multilingual Central Repository (Spanish)"
  language = "es"
  license = "https://creativecommons.org/licenses/by/3.0/"
  [omw-es.versions."1.4"]
    url = "https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz"

[pwn]
  [pwn.versions."3.0"]
    error = "'pwn:3.0' is no longer indexed; use 'omw-en:1.4' instead"`;

    sampleEntries = parseWordNetIndex(sampleTomlContent);
  });

  describe('parseWordNetIndex', () => {
    it('should parse TOML content correctly', () => {
      expect(sampleEntries).toHaveLength(6);
      
      // Check cili entry
      const cili = sampleEntries.find(e => e.id === 'cili');
      expect(cili).toBeDefined();
      expect(cili?.label).toBe('Collaborative Interlingual Index');
      expect(cili?.language).toBe(''); // cili has type="ili" not language
      expect(cili?.versions['1.0'].url).toBe('https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
      
      // Check oewn entry
      const oewn = sampleEntries.find(e => e.id === 'oewn');
      expect(oewn).toBeDefined();
      expect(oewn?.label).toBe('Open English WordNet');
      expect(oewn?.language).toBe('en');
      expect(oewn?.versions['2024'].url).toBe('https://en-word.net/static/english-wordnet-2024.xml.gz');
      expect(oewn?.versions['2023'].url).toBe('https://en-word.net/static/english-wordnet-2023.xml.gz');
      
      // Check omw entry
      const omw = sampleEntries.find(e => e.id === 'omw');
      expect(omw).toBeDefined();
      expect(omw?.label).toBe('Open Multilingual Wordnet');
      expect(omw?.language).toBe('mul');
      expect(omw?.versions['1.4'].url).toBe('https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz');
      
      // Check omw-en entry
      const omwEn = sampleEntries.find(e => e.id === 'omw-en');
      expect(omwEn).toBeDefined();
      expect(omwEn?.label).toBe('OMW English Wordnet based on WordNet 3.0');
      expect(omwEn?.language).toBe('en');
      expect(omwEn?.versions['1.4'].url).toBe('https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz');
      
      // Check omw-es entry
      const omwEs = sampleEntries.find(e => e.id === 'omw-es');
      expect(omwEs).toBeDefined();
      expect(omwEs?.label).toBe('Multilingual Central Repository (Spanish)');
      expect(omwEs?.language).toBe('es');
      expect(omwEs?.versions['1.4'].url).toBe('https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz');
      
      // Check pwn entry (with error)
      const pwn = sampleEntries.find(e => e.id === 'pwn');
      expect(pwn).toBeDefined();
      expect(pwn?.versions['3.0'].error).toBe("'pwn:3.0' is no longer indexed; use 'omw-en:1.4' instead");
    });

    it('should handle empty TOML content', () => {
      const entries = parseWordNetIndex('');
      expect(entries).toHaveLength(0);
    });

    it('should handle TOML with only comments', () => {
      const entries = parseWordNetIndex('# This is a comment\n# Another comment');
      expect(entries).toHaveLength(0);
    });
  });

  describe('getWordNetUrls', () => {
    it('should extract all valid URLs from entries', () => {
      const urls = getWordNetUrls(sampleEntries);
      
      expect(urls).toHaveLength(6);
      expect(urls).toContain('https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
      expect(urls).toContain('https://en-word.net/static/english-wordnet-2024.xml.gz');
      expect(urls).toContain('https://en-word.net/static/english-wordnet-2023.xml.gz');
      expect(urls).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz');
      expect(urls).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz');
      expect(urls).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz');
    });

    it('should exclude URLs with errors', () => {
      const urls = getWordNetUrls(sampleEntries);
      
      // Should not include pwn:3.0 URL since it has an error
      expect(urls).not.toContain(expect.stringMatching(/pwn.*3\.0/));
    });

    it('should handle entries with no valid URLs', () => {
      const entries: WordNetIndexEntry[] = [
        {
          id: 'test',
          label: 'Test',
          language: 'en',
          license: 'MIT',
          versions: {
            '1.0': { error: 'Not available' }
          }
        }
      ];
      
      const urls = getWordNetUrls(entries);
      expect(urls).toHaveLength(0);
    });
  });

  describe('categorizeWordNetUrls', () => {
    it('should categorize URLs correctly', () => {
      const categories = categorizeWordNetUrls(sampleEntries);
      
      // Single XML files
      expect(categories.singleXml).toHaveLength(2); // oewn 2024, oewn 2023
      expect(categories.singleXml).toContain('https://en-word.net/static/english-wordnet-2024.xml.gz');
      expect(categories.singleXml).toContain('https://en-word.net/static/english-wordnet-2023.xml.gz');
      
      // Multi-language archives
      expect(categories.multiLanguage).toHaveLength(1); // omw
      expect(categories.multiLanguage).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz');
      
      // Language-specific archives
      expect(categories.languageSpecific).toHaveLength(2); // omw-en, omw-es
      expect(categories.languageSpecific).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-en-1.4.tar.xz');
      expect(categories.languageSpecific).toContain('https://github.com/omwn/omw-data/releases/download/v1.4/omw-es-1.4.tar.xz');
      
      // Unknown (cili is not XML)
      expect(categories.unknown).toHaveLength(1); // cili
      expect(categories.unknown).toContain('https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz');
    });

    it('should handle empty entries', () => {
      const categories = categorizeWordNetUrls([]);
      
      expect(categories.singleXml).toHaveLength(0);
      expect(categories.multiLanguage).toHaveLength(0);
      expect(categories.languageSpecific).toHaveLength(0);
      expect(categories.unknown).toHaveLength(0);
    });
  });

  describe('WordNet URL patterns', () => {
    it('should identify single XML patterns correctly', () => {
      const singleXmlEntries: WordNetIndexEntry[] = [
        { id: 'oewn', label: 'OEWN', language: 'en', license: 'MIT', versions: { '2024': { url: 'test.xml.gz' } } }
      ];
      
      const categories = categorizeWordNetUrls(singleXmlEntries);
      expect(categories.singleXml).toHaveLength(1);
      expect(categories.multiLanguage).toHaveLength(0);
      expect(categories.languageSpecific).toHaveLength(0);
    });

    it('should identify multi-language patterns correctly', () => {
      const multiLangEntries: WordNetIndexEntry[] = [
        { id: 'omw', label: 'OMW', language: 'mul', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } }
      ];
      
      const categories = categorizeWordNetUrls(multiLangEntries);
      expect(categories.singleXml).toHaveLength(0);
      expect(categories.multiLanguage).toHaveLength(1);
      expect(categories.languageSpecific).toHaveLength(0);
    });

    it('should identify language-specific patterns correctly', () => {
      const langSpecificEntries: WordNetIndexEntry[] = [
        { id: 'omw-en', label: 'OMW EN', language: 'en', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } },
        { id: 'omw-en31', label: 'OMW EN31', language: 'en', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } },
        { id: 'omw-es', label: 'OMW ES', language: 'es', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } },
        { id: 'omw-fr', label: 'OMW FR', language: 'fr', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } },
        { id: 'omw-de', label: 'OMW DE', language: 'de', license: 'MIT', versions: { '1.4': { url: 'test.tar.xz' } } }
      ];
      
      const categories = categorizeWordNetUrls(langSpecificEntries);
      expect(categories.singleXml).toHaveLength(0);
      expect(categories.multiLanguage).toHaveLength(0);
      expect(categories.languageSpecific).toHaveLength(5);
    });
  });
});
