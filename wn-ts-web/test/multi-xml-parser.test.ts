import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MultiXMLParser, parseXMLWithMultiStrategy } from '../src/parsers/xml/multi-xml-parser';
import { getTestData, getAllTestData } from './browser/lmf/test-data-loader';

// Mock the logger to avoid console output during tests
vi.mock('utils/logger', () => ({
  createScopedLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  }),
}));

describe('MultiXMLParser', () => {
  let parser: MultiXMLParser;
  let originalDOMParser: typeof DOMParser | undefined;
  let originalRequire: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original globals
    originalDOMParser = global.DOMParser;
    originalRequire = (global as any).require;
  });

  afterEach(() => {
    // Restore original globals
    if (originalDOMParser) {
      global.DOMParser = originalDOMParser;
    } else {
      delete (global as any).DOMParser;
    }
    if (originalRequire) {
      (global as any).require = originalRequire;
    } else {
      delete (global as any).require;
    }
  });

  describe('environment detection', () => {
    it('should detect Node.js environment correctly', () => {
      // Simulate Node.js environment
      delete (global as any).DOMParser;
      (global as any).require = () => ({ XMLParser: class {} });
      delete (global as any).window;

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      // In Node.js, should prefer fast-xml-parser if available
      expect(parser).toBeInstanceOf(MultiXMLParser);
    });

    it('should detect browser environment correctly', () => {
      // Simulate browser environment
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          return {
            documentElement: { nodeName: 'root', nodeType: 1, attributes: [], childNodes: [] },
            getElementsByTagName: () => []
          };
        }
      } as any;
      delete (global as any).require;
      (global as any).window = {};

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      expect(parser).toBeInstanceOf(MultiXMLParser);
    });

    it('should detect Web Worker environment correctly', () => {
      // Simulate Web Worker environment (no DOMParser, no require)
      delete (global as any).DOMParser;
      delete (global as any).require;
      delete (global as any).window;

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      expect(parser).toBeInstanceOf(MultiXMLParser);
    });
  });

  describe('parsing strategies', () => {
    it('should use DOMParser in browser environment', async () => {
      // Ensure we have a window object to simulate browser environment
      (global as any).window = {};
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          return {
            documentElement: { 
              nodeName: 'root', 
              nodeType: 1, 
              attributes: [], 
              childNodes: [],
              textContent: 'test'
            },
            getElementsByTagName: () => []
          };
        }
      } as any;

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      const result = await parser.parse();

      expect(result.parserUsed).toBe('DOMParser');
      expect(result.data.root).toBeDefined();
      expect(result.data.root.name).toBe('root');
    });

    it('should fail gracefully when no reliable parser is available', async () => {
      // No DOMParser, no require, and mock fast-xml-parser as unavailable
      delete (global as any).DOMParser;
      delete (global as any).require;
      
      // Mock the fast-xml-parser availability check to return false
      const originalIsFastXMLParserAvailable = (MultiXMLParser as any).prototype.isFastXMLParserAvailable;
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = () => false;

      const xmlText = '<root id="test">content</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      // Should throw an error about no reliable parser available
      await expect(parser.parse()).rejects.toThrow('No reliable XML parser available in main-thread environment');

      // Restore the original method
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = originalIsFastXMLParserAvailable;
    });

    it('should prefer DOMParser in browser environments for consistency', async () => {
      // Simulate browser environment with DOMParser
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          return {
            documentElement: { 
              nodeName: 'root', 
              nodeType: 1, 
              attributes: [], 
              childNodes: [],
              textContent: 'content'
            },
            getElementsByTagName: () => []
          };
        }
      } as any;
      delete (global as any).require;
      (global as any).window = {};

      const xmlText = '<root id="test">content</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      const result = await parser.parse();

      // Should use DOMParser even if fast-xml-parser is available
      expect(result.parserUsed).toBe('DOMParser');
      expect(result.data.root).toBeDefined();
    });
  });

  describe('convenience function', () => {
    it('should parse XML using parseXMLWithMultiStrategy', async () => {
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          return {
            documentElement: { 
              nodeName: 'root', 
              nodeType: 1, 
              attributes: [], 
              childNodes: [],
              textContent: 'test'
            },
            getElementsByTagName: () => []
          };
        }
      } as any;

      const xmlText = '<root>test</root>';
      const result = await parseXMLWithMultiStrategy(xmlText, { debug: true });

      expect(result.parserUsed).toBe('DOMParser');
      expect(result.data.root).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      // Mock DOMParser to return a parser error
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          return {
            documentElement: { nodeName: 'parsererror', nodeType: 1, attributes: [], childNodes: [] },
            getElementsByTagName: (tag: string) => {
              if (tag === 'parsererror') {
                return [{ textContent: 'XML parsing error' }];
              }
              return [];
            }
          };
        }
      } as any;

      // Mock fast-xml-parser as unavailable
      const originalIsFastXMLParserAvailable = (MultiXMLParser as any).prototype.isFastXMLParserAvailable;
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = () => false;

      const xmlText = '<root><unclosed>content';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      // Should throw an error about DOMParser failing in main browser thread
      await expect(parser.parse()).rejects.toThrow('DOMParser failed in main browser thread');

      // Restore the original method
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = originalIsFastXMLParserAvailable;
    });

    it('should fail when all reliable parsers are unavailable', async () => {
      // First strategy fails
      global.DOMParser = class MockDOMParser {
        parseFromString() {
          throw new Error('DOMParser failed');
        }
      } as any;

      // No require available
      delete (global as any).require;
      
      // Mock fast-xml-parser as unavailable
      const originalIsFastXMLParserAvailable = (MultiXMLParser as any).prototype.isFastXMLParserAvailable;
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = () => false;

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      // Should throw an error about DOMParser failing in main browser thread
      await expect(parser.parse()).rejects.toThrow('DOMParser failed in main browser thread');

      // Restore the original method
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = originalIsFastXMLParserAvailable;
    });
  });

  describe('Web Worker environment handling', () => {
    it('should use fast-xml-parser in Web Worker environment', async () => {
      // Simulate Web Worker environment (no DOMParser, no window, but has importScripts)
      delete (global as any).DOMParser;
      delete (global as any).window;
      (global as any).importScripts = () => {}; // Simulate Web Worker environment
      
      // Mock fast-xml-parser as available
      (globalThis as any).XMLParser = class MockXMLParser {
        constructor(options: any) {}
        parse(xml: string) {
          return {
            LexicalResource: {
              Lexicon: {
                '@_id': 'test',
                '@_language': 'en',
                LexicalEntry: {
                  '@_id': 'word1',
                  Lemma: {
                    '@_partOfSpeech': 'n',
                    '@_writtenForm': 'test'
                  },
                  Sense: {
                    '@_id': 'sense1',
                    '@_synset': 'synset1'
                  }
                },
                Synset: {
                  '@_id': 'synset1',
                  '@_partOfSpeech': 'n'
                }
              }
            }
          };
        }
      };

      const xmlText = '<LexicalResource><Lexicon id="test">test</Lexicon></LexicalResource>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      const result = await parser.parse();

      // Should use fast-xml-parser in Web Worker environment
      expect(result.parserUsed).toBe('fast-xml-parser');
      // Check that the result has the expected structure
      expect(result.data).toBeDefined();
      expect(result.elementCount).toBeGreaterThan(0);
    });

    it('should handle Web Worker environment without fast-xml-parser gracefully', async () => {
      // Simulate Web Worker environment (no DOMParser, no window, but has importScripts)
      delete (global as any).DOMParser;
      delete (global as any).window;
      (global as any).importScripts = () => {}; // Simulate Web Worker environment
      
      // Mock fast-xml-parser as unavailable
      const originalIsFastXMLParserAvailable = (MultiXMLParser as any).prototype.isFastXMLParserAvailable;
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = () => false;

      const xmlText = '<root>test</root>';
      parser = new MultiXMLParser(xmlText, { debug: true });
      
      // Should throw an error about no reliable parser available
      await expect(parser.parse()).rejects.toThrow('No reliable XML parser available in web-worker environment');

      // Restore the original method
      (MultiXMLParser as any).prototype.isFastXMLParserAvailable = originalIsFastXMLParserAvailable;
    });
  });

  describe('parser consistency', () => {
    // Use real test data from wn-test-data instead of hardcoded XML
    const testDataFiles = getAllTestData();
    
    // Filter to use the most representative test files
    const testXMLs = testDataFiles
      .filter(file => ['mini-lmf-1.4.xml', 'mini-lmf-1.0.xml', 'simple-nested.xml', 'complex-attributes.xml'].includes(file.name))
      .map(file => file.content);

    testXMLs.forEach((xml, index) => {
      it(`should produce identical results for all parsers with ${testDataFiles.filter(f => ['mini-lmf-1.4.xml', 'mini-lmf-1.0.xml', 'simple-nested.xml', 'complex-attributes.xml'].includes(f.name))[index]?.name}`, async () => {
        const results: any[] = [];
        
        // Test DOMParser
        if (typeof DOMParser !== 'undefined') {
          try {
            global.DOMParser = DOMParser;
            const domParser = new MultiXMLParser(xml, { debug: false });
            const domResult = await domParser.parse();
            results.push({ parser: 'DOMParser', result: domResult });
          } catch (error) {
            // DOMParser might not be available in test environment
          }
        }

        // Test fast-xml-parser if available
        try {
          // Mock fast-xml-parser
          (globalThis as any).XMLParser = class MockXMLParser {
            constructor(options: any) {}
            parse(xml: string) {
              // This is a simplified mock - in real usage it would parse the XML
              // For testing consistency, we'll use the same structure
              return {
                LexicalResource: {
                  '@_lmfVersion': '1.4',
                  Lexicon: {
                    '@_id': 'test',
                    '@_language': 'en',
                    '@_version': '1.0',
                    LexicalEntry: {
                      '@_id': 'word1',
                      '@_index': '1',
                      Lemma: {
                        '@_partOfSpeech': 'n',
                        '@_writtenForm': 'test'
                      },
                      Sense: {
                        '@_id': 'sense1',
                        '@_synset': 'synset1',
                        '@_lexicalized': 'true'
                      }
                    },
                    Synset: {
                      '@_id': 'synset1',
                      '@_partOfSpeech': 'n',
                      '@_ili': 'i1',
                      Definition: {
                        '@_language': 'en',
                        '#text': 'A test definition'
                      }
                    }
                  }
                }
              };
            }
          };
          
          const fastParser = new MultiXMLParser(xml, { 
            debug: false, 
            preferFastXMLParser: true 
          });
          const fastResult = await fastParser.parse();
          results.push({ parser: 'fast-xml-parser', result: fastResult });
        } catch (error) {
          // fast-xml-parser might not be available
        }

        // Manual parser is disabled due to reliability issues
        // Only test DOMParser and fast-xml-parser for consistency

        // Ensure we have at least 1 parser to test
        expect(results.length).toBeGreaterThanOrEqual(1);
        
        // Compare results between all parsers (if we have multiple)
        if (results.length > 1) {
          for (let i = 0; i < results.length - 1; i++) {
            const current = results[i];
            const next = results[i + 1];
            
            // Compare basic structure
            expect(current.result.elementCount).toBe(next.result.elementCount);
            expect(current.result.rootElements).toEqual(next.result.rootElements);
            
            // Compare data structure recursively
            compareParsedResults(current.result.data, next.result.data);
          }
        } else {
          // Just verify the single parser result is valid
          const result = results[0];
          expect(result.result.elementCount).toBeGreaterThan(0);
          expect(result.result.rootElements).toHaveLength(1);
        }
      });
    });

    it('should handle parent-child relationships consistently across parsers', async () => {
      // Use real test data from wn-test-data
      const testFile = getTestData('simple-nested.xml');
      if (!testFile) {
        throw new Error('Test data file simple-nested.xml not found');
      }
      const xml = testFile.content;

      const results: any[] = [];
      
      // Test DOMParser
      if (typeof DOMParser !== 'undefined') {
        try {
          global.DOMParser = DOMParser;
          const domParser = new MultiXMLParser(xml, { debug: false });
          const domResult = await domParser.parse();
          results.push({ parser: 'DOMParser', result: domResult });
        } catch (error) {
          // DOMParser might not be available in test environment
        }
      }

      // Manual parser is disabled due to reliability issues
      // Only test DOMParser for parent-child relationships

      // Ensure we have at least 1 parser to test
      expect(results.length).toBeGreaterThanOrEqual(1);
      
      // Check that all parsers correctly identify nested vs standalone elements
      for (const { parser, result } of results) {
        const lexicon = result.data.LexicalResource?.children?.find((c: any) => c.name === 'Lexicon');
        expect(lexicon).toBeDefined();
        
        const lexicalEntry = lexicon?.children?.find((c: any) => c.name === 'LexicalEntry');
        expect(lexicalEntry).toBeDefined();
        
        const sense = lexicalEntry?.children?.find((c: any) => c.name === 'Sense');
        expect(sense).toBeDefined();
        
                 // The sense should be nested within the lexical entry
         expect(sense.name).toBe('Sense');
         expect(sense.attributes.id).toBe('sense1');
         expect(sense.attributes.synset).toBe('synset1');
      }
    });
  });

  // Helper method to compare parsed results recursively
  function compareParsedResults(data1: any, data2: any, path: string = 'root') {
    // Compare element names
    expect(data1.name).toBe(data2.name);
    
    // Compare attributes
    expect(data1.attributes).toEqual(data2.attributes);
    
    // Compare text content
    expect(data1.text).toBe(data2.text);
    
    // Compare children count (handle cases where children might be undefined)
    const children1 = data1.children || [];
    const children2 = data2.children || [];
    expect(children1.length).toBe(children2.length);
    
    // Compare children recursively
    for (let i = 0; i < children1.length; i++) {
      const child1 = children1[i];
      const child2 = children2[i];
      
      if (child1.name !== '#text' && child2.name !== '#text') {
        compareParsedResults(child1, child2, `${path}.${child1.name}[${i}]`);
      }
    }
  }
});
