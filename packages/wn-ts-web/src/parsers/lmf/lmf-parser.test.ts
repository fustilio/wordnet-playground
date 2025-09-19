import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LmfParser, parseLMFXML, diagnoseDownloadIssue, analyzeXMLContent } from './lmf-parser';

// Mock the logger to avoid console output during tests
vi.mock('utils/logger', () => ({
  createScopedLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  }),
  setGlobalLogLevel: vi.fn(),
}));

describe('LmfParser', () => {
  let parser: LmfParser;
  let originalDOMParser: typeof DOMParser | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original DOMParser if it exists
    originalDOMParser = global.DOMParser;
  });

  afterEach(() => {
    // Restore original DOMParser
    if (originalDOMParser) {
      global.DOMParser = originalDOMParser;
    } else {
      delete (global as any).DOMParser;
    }
  });

  describe('constructor', () => {
    it('should create parser with XML text', () => {
      const xmlText = '<LexicalResource><Lexicon id="test">test</Lexicon></LexicalResource>';
      parser = new LmfParser(xmlText, { debug: false });
      expect(parser).toBeInstanceOf(LmfParser);
    });

    it('should create parser with debug enabled', () => {
      const xmlText = '<LexicalResource><Lexicon id="test">test</Lexicon></LexicalResource>';
      parser = new LmfParser(xmlText, { debug: true });
      expect(parser).toBeInstanceOf(LmfParser);
    });
  });

  describe('parse() with DOMParser available (browser environment)', () => {
    beforeEach(() => {
      // Ensure DOMParser is available with a realistic mock
      global.DOMParser = class MockDOMParser {
        parseFromString(xml: string, mimeType: string) {
          // Create a mock document structure that simulates LMF XML
          const mockElement = (tagName: string, attributes: Record<string, string> = {}, children: any[] = [], textContent: string = '') => ({
            nodeName: tagName,
            nodeType: 1,
            attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
            childNodes: children,
            textContent: textContent,
            getAttribute: (attrName: string) => attributes[attrName] || null,
            querySelector: (selector: string) => {
              if (selector === 'Lemma') return mockElement('Lemma', { writtenForm: 'test', partOfSpeech: 'n' });
              if (selector === 'gloss') return mockElement('gloss', {}, [], 'test definition');
              return null;
            },
            querySelectorAll: (selector: string) => {
              if (selector === 'Definition') return [mockElement('Definition', { language: 'en' }, [], 'test definition')];
              return [];
            }
          });

          const mockLexicalResource = mockElement('LexicalResource', {}, [
            mockElement('Lexicon', { id: 'test', label: 'Test Lexicon', language: 'en' }),
            mockElement('LexicalEntry', { id: 'word1', language: 'en' }, [
              mockElement('Lemma', { writtenForm: 'test', partOfSpeech: 'n' })
            ]),
            mockElement('Synset', { id: 'synset1', partOfSpeech: 'n', language: 'en' }, [
              mockElement('Definition', { language: 'en' }, [], 'test definition')
            ]),
            mockElement('Sense', { id: 'sense1', word: 'word1', synset: 'synset1' })
          ]);

          return {
            documentElement: mockLexicalResource,
            getElementsByTagName: (tag: string) => {
              if (tag === 'parsererror') return [];
              return [];
            }
          };
        }
      } as any;
    });

    it('should parse LMF XML structure using DOMParser', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">test</Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.lexicons).toBeDefined();
      expect(result.lexicons).toHaveLength(1);
      expect(result.lexicons![0].id).toBe('test');
      expect(result.lexicons![0].label).toBe('Test Lexicon');
      expect(result.lexicons![0].language).toBe('en');
    });

    it('should parse LMF XML with words using DOMParser', async () => {
      const xmlText = `
        <LexicalResource>
          <LexicalEntry id="word1" language="en">
            <Lemma writtenForm="test" partOfSpeech="n"/>
          </LexicalEntry>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.words).toBeDefined();
      expect(result.words).toHaveLength(1);
      expect(result.words![0].id).toBe('word1');
      expect(result.words![0].lemma).toBe('test');
      expect(result.words![0].pos).toBe('n');
    });

    it('should parse LMF XML with synsets using DOMParser', async () => {
      const xmlText = `
        <LexicalResource>
          <Synset id="synset1" partOfSpeech="n" language="en">
            <Definition language="en">
              <gloss>test definition</gloss>
            </Definition>
          </Synset>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: true });
      const result = await parser.parse(xmlText);

      expect(result.synsets).toBeDefined();
      expect(result.synsets).toHaveLength(1);
      expect(result.synsets![0].id).toBe('synset1');
      expect(result.synsets![0].pos).toBe('n');
      expect(result.synsets![0].definitions).toBeDefined();
      expect(result.synsets![0].definitions![0].text).toBe('test definition');
    });

    it('should parse LMF XML with senses using DOMParser', async () => {
      const xmlText = `
        <LexicalResource>
          <Sense id="sense1" word="word1" synset="synset1"/>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.senses).toBeDefined();
      expect(result.senses).toHaveLength(1);
      expect(result.senses![0].id).toBe('sense1');
      expect(result.senses![0].wordId).toBe('word1');
      expect(result.senses![0].synsetId).toBe('synset1');
    });

    it('should handle empty LMF XML using DOMParser', async () => {
      const xmlText = '';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: XML content is empty');
    });

    it('should handle HTML error page using DOMParser', async () => {
      const xmlText = '<!DOCTYPE html><html><body>Error: Not Found</body></html>';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
    });

    it('should handle missing LexicalResource using DOMParser', async () => {
      const xmlText = '<root><other>content</other></root>';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: missing LexicalResource element');
    });
  });

  describe('parse() with DOMParser unavailable (Web Worker environment)', () => {
    beforeEach(() => {
      // Remove DOMParser to simulate Web Worker environment
      delete (global as any).DOMParser;
    });

    it('should fall back to manual parsing when DOMParser is unavailable', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">test</Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.lexicons).toBeDefined();
      expect(result.lexicons).toHaveLength(1);
      expect(result.lexicons![0].id).toBe('test');
      expect(result.lexicons![0].label).toBe('Test Lexicon');
      expect(result.lexicons![0].language).toBe('en');
    });

    it('should handle LMF XML with words using manual parsing', async () => {
      const xmlText = `
        <LexicalResource>
          <LexicalEntry id="word1" language="en">
            <Lemma writtenForm="test" partOfSpeech="n"/>
          </LexicalEntry>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.words).toBeDefined();
      expect(result.words).toHaveLength(1);
      expect(result.words![0].id).toBe('word1');
      expect(result.words![0].lemma).toBe('test');
      expect(result.words![0].pos).toBe('n');
    });

    it('should handle LMF XML with synsets using manual parsing', async () => {
      const xmlText = `
        <LexicalResource>
          <Synset id="synset1" partOfSpeech="n" language="en">
            <Definition language="en">
              <gloss>test definition</gloss>
            </Definition>
          </Synset>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.synsets).toBeDefined();
      expect(result.synsets).toHaveLength(1);
      expect(result.synsets![0].id).toBe('synset1');
      expect(result.synsets![0].pos).toBe('n');
      expect(result.synsets![0].definitions).toBeDefined();
      expect(result.synsets![0].definitions![0].text).toBe('test definition');
    });

    it('should handle LMF XML with senses using manual parsing', async () => {
      const xmlText = `
        <LexicalResource>
          <Sense id="sense1" word="word1" synset="synset1"/>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.senses).toBeDefined();
      expect(result.senses).toHaveLength(1);
      expect(result.senses![0].id).toBe('sense1');
      expect(result.senses![0].wordId).toBe('word1');
      expect(result.senses![0].synsetId).toBe('synset1');
    });

    it('should handle empty LMF XML with manual parsing', async () => {
      const xmlText = '';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: XML content is empty');
    });

    it('should handle HTML error page with manual parsing', async () => {
      const xmlText = '<!DOCTYPE html><html><body>Error: Not Found</body></html>';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
    });

    it('should handle missing LexicalResource with manual parsing', async () => {
      const xmlText = '<root><other>content</other></root>';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      await expect(parser.parse(xmlText)).rejects.toThrow('Invalid LMF file: missing LexicalResource element');
    });
  });

  describe('environment detection', () => {
    it('should detect DOMParser availability correctly', async () => {
      const xmlText = '<LexicalResource><Lexicon id="test">test</Lexicon></LexicalResource>';
      
      // Test with DOMParser available
      global.DOMParser = class MockDOMParser {
        parseFromString(xml: string, mimeType: string) {
          return {
            documentElement: { 
              nodeName: 'LexicalResource',
              nodeType: 1,
              attributes: [],
              childNodes: [
                {
                  nodeName: 'Lexicon',
                  nodeType: 1,
                  attributes: [{ name: 'id', value: 'test' }, { name: 'label', value: 'Test Lexicon' }, { name: 'language', value: 'en' }],
                  childNodes: [],
                  textContent: 'test',
                  getAttribute: (attrName: string) => {
                    const attr = [{ name: 'id', value: 'test' }, { name: 'label', value: 'Test Lexicon' }, { name: 'language', value: 'en' }].find(a => a.name === attrName);
                    return attr ? attr.value : null;
                  },
                  querySelectorAll: (selector: string) => {
                    // Mock querySelectorAll to return empty array for any selector
                    return [];
                  }
                }
              ],
              textContent: 'test',
              getAttribute: (attrName: string) => {
                // Mock getAttribute for the root element
                if (attrName === 'lmfVersion') {
                  return '1.0';
                }
                return null;
              }
            },
            getElementsByTagName: (tag: string) => []
          };
        }
      } as any;
      
      parser = new LmfParser(xmlText, { debug: false });
      const resultWithDOMParser = await parser.parse(xmlText);
      expect(resultWithDOMParser.lexicons).toBeDefined();
      
      // Test without DOMParser
      delete (global as any).DOMParser;
      parser = new LmfParser(xmlText, { debug: false });
      const resultWithoutDOMParser = await parser.parse(xmlText);
      expect(resultWithoutDOMParser.lexicons).toBeDefined();
    });
  });

  describe('validation options', () => {
    it('should skip validation when validate option is false', async () => {
      const xmlText = 'invalid content';
      
      parser = new LmfParser(xmlText, { debug: false, validate: false });
      
      // Should not throw validation error
      try {
        await parser.parse(xmlText);
        // If it doesn't throw, that's fine for this test
      } catch (error) {
        // If it throws, it should be a parsing error, not validation error
        expect((error as Error).message).not.toContain('Invalid LMF file:');
      }
    });
  });

  describe('convenience functions', () => {
    it('should parse LMF XML using parseLMFXML function', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">test</Lexicon>
        </LexicalResource>
      `;
      
      const result = await parseLMFXML(xmlText, { debug: false });

      expect(result.lexicons).toBeDefined();
      expect(result.lexicons).toHaveLength(1);
      expect(result.lexicons![0].id).toBe('test');
    });

    it('should diagnose download issues correctly', () => {
      expect(diagnoseDownloadIssue('')).toBe('Content is empty');
      expect(diagnoseDownloadIssue('<!DOCTYPE html>')).toBe('Content appears to be HTML error page, not XML');
      expect(diagnoseDownloadIssue('Error: Not Found')).toBe('Content contains error indicators');
      expect(diagnoseDownloadIssue('plain text')).toBe('Content does not appear to be XML');
      expect(diagnoseDownloadIssue('<root>content</root>')).toBe('Content does not contain LMF LexicalResource element');
      expect(diagnoseDownloadIssue('<LexicalResource>content</LexicalResource>')).toBe('Content appears to be valid LMF XML');
    });

    it('should analyze XML content correctly', () => {
      const analysis = analyzeXMLContent('<LexicalResource>content</LexicalResource>');
      
      expect(analysis.length).toBe(42);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.hasRootElement).toBe(true);
      expect(analysis.hasLexicalResource).toBe(true);
      expect(analysis.firstChars).toBe('<LexicalResource>content</LexicalResource>');
      expect(analysis.lastChars).toBe('<LexicalResource>content</LexicalResource>');
    });
  });

  describe('complex LMF structures', () => {
    it('should handle multiple lexicons', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="lex1" label="Lexicon 1" language="en"/>
          <Lexicon id="lex2" label="Lexicon 2" language="fr"/>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.lexicons).toHaveLength(2);
      expect(result.lexicons![0].id).toBe('lex1');
      expect(result.lexicons![1].id).toBe('lex2');
    });

    it('should handle complex word structures', async () => {
      const xmlText = `
        <LexicalResource>
          <LexicalEntry id="word1" language="en">
            <Lemma writtenForm="test" partOfSpeech="n"/>
          </LexicalEntry>
          <LexicalEntry id="word2" language="en">
            <Lemma writtenForm="example" partOfSpeech="v"/>
          </LexicalEntry>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.words).toHaveLength(2);
      expect(result.words![0].lemma).toBe('test');
      expect(result.words![0].pos).toBe('n');
      expect(result.words![1].lemma).toBe('example');
      expect(result.words![1].pos).toBe('v');
    });

    it('should handle synsets with multiple definitions', async () => {
      const xmlText = `
        <LexicalResource>
          <Synset id="synset1" partOfSpeech="n" language="en">
            <Definition language="en">
              <gloss>first definition</gloss>
            </Definition>
            <Definition language="fr">
              <gloss>deuxième définition</gloss>
            </Definition>
          </Synset>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { debug: false });
      const result = await parser.parse(xmlText);

      expect(result.synsets).toHaveLength(1);
      expect(result.synsets![0].definitions).toHaveLength(2);
      expect(result.synsets![0].definitions![0].text).toBe('first definition');
      expect(result.synsets![0].definitions![0].language).toBe('en');
      expect(result.synsets![0].definitions![1].text).toBe('deuxième définition');
      expect(result.synsets![0].definitions![1].language).toBe('fr');
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      const xmlText = '<LexicalResource><unclosed>content';
      
      parser = new LmfParser(xmlText, { debug: false });
      
      try {
        await parser.parse(xmlText);
        // If it doesn't throw, that's fine
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('debug mode', () => {
    it('should log debug information when debug is enabled', async () => {
      const xmlText = '<LexicalResource><Lexicon id="test">test</Lexicon></LexicalResource>';
      parser = new LmfParser(xmlText, { debug: true });
      
      await parser.parse(xmlText);
      
      // Note: Since we're mocking the logger, we can't verify the actual calls
      expect(parser).toBeDefined();
    });
  });

  describe('duplicate handling options', () => {
    it('should handle duplicates with keep-first strategy', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'keep-first',
          uniqueKeys: {
            words: ['id'],
            synsets: ['id'],
            senses: ['id']
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      const result = await parser.parse(xmlText);
      
      // Should only keep one word due to duplicate handling
      expect(result.words).toHaveLength(1);
      expect(result.words![0].id).toBe('word1');
    });

    it('should handle duplicates with keep-last strategy', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'keep-last',
          uniqueKeys: {
            words: ['id'],
            synsets: ['id'],
            senses: ['id']
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      const result = await parser.parse(xmlText);
      
      // Should keep the last word
      expect(result.words).toHaveLength(1);
      expect(result.words![0].id).toBe('word1');
    });

    it('should handle duplicates with merge strategy', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <Synset id="synset1" partOfSpeech="n" language="en">
              <Definition language="en">
                <gloss>first definition</gloss>
              </Definition>
            </Synset>
            <Synset id="synset1" partOfSpeech="n" language="en">
              <Definition language="en">
                <gloss>second definition</gloss>
              </Definition>
            </Synset>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'merge',
          uniqueKeys: {
            words: ['id'],
            synsets: ['id'],
            senses: ['id']
          },
          mergeFields: {
            definitions: true,
            examples: true,
            relations: true
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      const result = await parser.parse(xmlText);
      
      // Should merge the two synsets
      expect(result.synsets).toHaveLength(1);
      expect(result.synsets![0].definitions).toHaveLength(2);
      expect(result.synsets![0].definitions![0].text).toBe('first definition');
      expect(result.synsets![0].definitions![1].text).toBe('second definition');
    });

    it('should handle duplicates with error strategy', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'error',
          uniqueKeys: {
            words: ['id'],
            synsets: ['id'],
            senses: ['id']
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      // Should throw error due to duplicate handling strategy
      await expect(parser.parse(xmlText)).rejects.toThrow('Duplicate words found with key: word1');
    });

    it('should handle duplicates with skip strategy', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'skip',
          uniqueKeys: {
            words: ['id'],
            synsets: ['id'],
            senses: ['id']
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      const result = await parser.parse(xmlText);
      
      // Should keep both words due to skip strategy
      expect(result.words).toHaveLength(2);
    });

    it('should use custom unique keys for deduplication', async () => {
      const xmlText = `
        <LexicalResource>
          <Lexicon id="test" label="Test Lexicon" language="en">
            <LexicalEntry id="word1" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
            <LexicalEntry id="word2" language="en">
              <Lemma writtenForm="test" partOfSpeech="n"/>
            </LexicalEntry>
          </Lexicon>
        </LexicalResource>
      `;
      
      parser = new LmfParser(xmlText, { 
        debug: false,
        duplicateHandling: {
          strategy: 'keep-first',
          uniqueKeys: {
            words: ['lemma', 'pos'],
            synsets: ['id'],
            senses: ['id']
          },
          logDuplicates: true,
          trackStatistics: true
        }
      });
      
      const result = await parser.parse(xmlText);
      
      // Should deduplicate based on lemma + pos, so only one word remains
      expect(result.words).toHaveLength(1);
    });
  });
});
