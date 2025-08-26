import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateLMFContent,
  diagnoseDownloadIssue,
  analyzeXMLContent,
  createMinimalLMF,
  parseLMFXML,
  type LMFDocument,
  type LMFLoadOptions,
  type LMFParser
} from '../../src/lmf.js';

describe('LMF Core Functionality', () => {
  describe('validateLMFContent', () => {
    it('should validate valid XML content', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      expect(() => validateLMFContent(validXML)).not.toThrow();
    });

    it('should throw error for non-string content', () => {
      expect(() => validateLMFContent(null as any)).toThrow('Invalid LMF file: XML content is not a valid string');
      expect(() => validateLMFContent(undefined as any)).toThrow('Invalid LMF file: XML content is not a valid string');
      expect(() => validateLMFContent(123 as any)).toThrow('Invalid LMF file: XML content is not a valid string');
    });

    it('should throw error for empty content', () => {
      expect(() => validateLMFContent('')).toThrow('Invalid LMF file: XML content is empty');
      expect(() => validateLMFContent('   ')).toThrow('Invalid LMF file: XML content is empty');
    });

    it('should throw error for HTML error pages', () => {
      const htmlError = '<!DOCTYPE html><html><body><h1>Error 404</h1><p>Not Found</p></body></html>';
      expect(() => validateLMFContent(htmlError)).toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
    });

    it('should throw error for HTTP error responses', () => {
      const http404 = '<html><body><h1>404 Not Found</h1></body></html>';
      const http500 = '<html><body><h1>500 Internal Server Error</h1></body></html>';
      const http403 = '<html><body><h1>403 Forbidden</h1></body></html>';
      
      expect(() => validateLMFContent(http404)).toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
      expect(() => validateLMFContent(http500)).toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
      expect(() => validateLMFContent(http403)).toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
    });

    it('should throw error for non-XML content', () => {
      const plainText = 'This is just plain text, not XML';
      expect(() => validateLMFContent(plainText)).toThrow('Invalid LMF file: Content does not appear to be XML');
    });

    it('should pass validation with debug logging', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      expect(() => validateLMFContent(validXML, true)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] XML content validation passed');
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] First 200 characters:', validXML.substring(0, 200));
      
      consoleSpy.mockRestore();
    });
  });

  describe('diagnoseDownloadIssue', () => {
    it('should diagnose no content received', () => {
      expect(diagnoseDownloadIssue(null as any)).toBe('Download failed: No content received');
      expect(diagnoseDownloadIssue(undefined as any)).toBe('Download failed: No content received');
    });

    it('should diagnose empty content', () => {
      expect(diagnoseDownloadIssue('')).toBe('Download failed: Empty content received');
      expect(diagnoseDownloadIssue('   ')).toBe('Download failed: Empty content received');
    });

    it('should diagnose HTML error pages', () => {
      const htmlError = '<!DOCTYPE html><html><body><h1>Error 404</h1></body></html>';
      expect(diagnoseDownloadIssue(htmlError)).toBe('Download failed: Received HTML page instead of XML (possible 404 or server error)');
    });

    it('should diagnose specific HTTP errors', () => {
      const notFound = '<html><body><h1>Error</h1><p>not found</p></body></html>';
      const forbidden = '<html><body><h1>Access denied</h1><p>forbidden</p></body></html>';
      const serverError = '<html><body><h1>Internal server error</h1></body></html>';
      
      expect(diagnoseDownloadIssue(notFound)).toBe('Download failed: File not found (404 error)');
      expect(diagnoseDownloadIssue(forbidden)).toBe('Download failed: Access denied (403 error)');
      expect(diagnoseDownloadIssue(serverError)).toBe('Download failed: Server error (500)');
    });

    it('should diagnose non-XML content', () => {
      const plainText = 'This is just plain text';
      expect(diagnoseDownloadIssue(plainText)).toBe('Download failed: Content is not valid XML');
    });

    it('should diagnose missing LexicalResource element', () => {
      const invalidXML = '<?xml version="1.0"?><root><element>content</element></root>';
      expect(diagnoseDownloadIssue(invalidXML)).toBe('Download failed: XML does not contain LexicalResource element (not a valid LMF file)');
    });

    it('should indicate successful download', () => {
      const validXML = '<?xml version="1.0"?><LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      expect(diagnoseDownloadIssue(validXML)).toBe('Download appears successful, but parsing failed');
    });
  });

  describe('analyzeXMLContent', () => {
    it('should analyze valid LMF XML', () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
        <LexicalResource>
          <Lexicon id="test-en" language="en">
            <LexicalEntry id="test-word">
              <Lemma writtenForm="test" partOfSpeech="n"/>
              <Sense id="test-sense" synset="test-synset"/>
            </LexicalEntry>
            <Synset id="test-synset" pos="n"/>
          </Lexicon>
        </LexicalResource>`;
      
      const analysis = analyzeXMLContent(validXML);
      
      expect(analysis.isXML).toBe(true);
      expect(analysis.hasXMLDeclaration).toBe(true);
      expect(analysis.hasLexicalResource).toBe(true);
      expect(analysis.hasLexicon).toBe(true);
      expect(analysis.hasLexicalEntry).toBe(true);
      expect(analysis.hasSynset).toBe(true);
      expect(analysis.contentLength).toBeGreaterThan(0);
      expect(analysis.firstChars).toContain('<?xml');
      expect(analysis.lastChars).toContain('</LexicalResource>');
    });

    it('should analyze XML without declaration', () => {
      const xmlNoDecl = '<LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      const analysis = analyzeXMLContent(xmlNoDecl);
      
      expect(analysis.isXML).toBe(true);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.hasLexicalResource).toBe(true);
    });

    it('should analyze non-XML content', () => {
      const plainText = 'This is just plain text, not XML at all';
      const analysis = analyzeXMLContent(plainText);
      
      expect(analysis.isXML).toBe(false);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.hasLexicalResource).toBe(false);
      expect(analysis.contentLength).toBeGreaterThan(0);
    });

    it('should extract root elements correctly', () => {
      const xml = '<root><child><grandchild/></child><sibling/></root>';
      const analysis = analyzeXMLContent(xml);
      
      expect(analysis.rootElements).toContain('root');
      expect(analysis.rootElements).toContain('child');
      expect(analysis.rootElements).toContain('grandchild');
      expect(analysis.rootElements).toContain('sibling');
    });

    it('should handle empty content', () => {
      const analysis = analyzeXMLContent('');
      
      expect(analysis.isXML).toBe(false);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.contentLength).toBe(0);
      expect(analysis.firstChars).toBe('');
      expect(analysis.lastChars).toBe('');
    });
  });

  describe('createMinimalLMF', () => {
    it('should create a minimal LMF document', () => {
      const minimal = createMinimalLMF();
      
      expect(minimal.lmfVersion).toBe('1.0');
      expect(minimal.lexicons).toHaveLength(1);
      expect(minimal.synsets).toHaveLength(1);
      expect(minimal.words).toHaveLength(1);
      expect(minimal.senses).toHaveLength(1);
      
      // Check lexicon structure
      const lexicon = minimal.lexicons[0];
      expect(lexicon.id).toBe('test-en');
      expect(lexicon.label).toBe('Test English Lexicon');
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.0');
      
      // Check synset structure
      const synset = minimal.synsets[0];
      expect(synset.id).toBe('test-en-0001-n');
      expect(synset.pos).toBe('n');
      expect(synset.language).toBe('en');
      expect(synset.lexicon).toBe('test-en');
      
      // Check word structure
      const word = minimal.words[0];
      expect(word.id).toBe('test-en-example-n');
      expect(word.lemma).toBe('example');
      expect(word.pos).toBe('n');
      expect(word.language).toBe('en');
      expect(word.lexicon).toBe('test-en');
      
      // Check sense structure
      const sense = minimal.senses[0];
      expect(sense.id).toBe('test-en-example-n-0001-01');
      expect(sense.wordId).toBe('test-en-example-n');
      expect(sense.synsetId).toBe('test-en-0001-n');
    });

    it('should create consistent document structure', () => {
      const minimal1 = createMinimalLMF();
      const minimal2 = createMinimalLMF();
      
      expect(minimal1).toEqual(minimal2);
      expect(minimal1.lexicons[0].id).toBe(minimal2.lexicons[0].id);
      expect(minimal1.words[0].id).toBe(minimal2.words[0].id);
      expect(minimal1.synsets[0].id).toBe(minimal2.synsets[0].id);
      expect(minimal1.senses[0].id).toBe(minimal2.senses[0].id);
    });
  });

  describe('parseLMFXML (deprecated)', () => {
    it('should throw deprecation error', () => {
      const validXML = '<?xml version="1.0"?><LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      
      expect(() => parseLMFXML(validXML)).toThrow('parseLMFXML is deprecated. Use a specific parser implementation instead.');
    });

    it('should validate content before throwing deprecation error', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const validXML = '<?xml version="1.0"?><LexicalResource><Lexicon id="test">content</Lexicon></LexicalResource>';
      
      expect(() => parseLMFXML(validXML, { debug: true })).toThrow('parseLMFXML is deprecated. Use a specific parser implementation instead.');
      
      // Should have logged debug info before throwing
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] parseLMFXML() starting with 92 characters');
      
      consoleSpy.mockRestore();
    });

    it('should validate content and throw deprecation error for invalid content', () => {
      expect(() => parseLMFXML('')).toThrow('Invalid LMF file: XML content is empty');
    });
  });

  describe('LMFDocument interface', () => {
    it('should have correct structure', () => {
      const document: LMFDocument = {
        lmfVersion: '1.0',
        lexicons: [],
        synsets: [],
        words: [],
        senses: []
      };
      
      expect(document.lmfVersion).toBe('1.0');
      expect(Array.isArray(document.lexicons)).toBe(true);
      expect(Array.isArray(document.synsets)).toBe(true);
      expect(Array.isArray(document.words)).toBe(true);
      expect(Array.isArray(document.senses)).toBe(true);
    });
  });

  describe('LMFLoadOptions interface', () => {
    it('should have correct structure', () => {
      const options: LMFLoadOptions = {
        progress: (p: number) => console.log(`Progress: ${p}`),
        debug: true
      };
      
      expect(typeof options.progress).toBe('function');
      expect(options.debug).toBe(true);
    });

    it('should allow partial options', () => {
      const partialOptions: LMFLoadOptions = {
        debug: false
      };
      
      expect(partialOptions.debug).toBe(false);
      expect(partialOptions.progress).toBeUndefined();
    });
  });

  describe('LMFParser interface', () => {
    it('should define required properties and methods', () => {
      const mockParser: LMFParser = {
        name: 'Test Parser',
        description: 'A test parser implementation',
        parse: async (xmlContent: string, options?: LMFLoadOptions): Promise<LMFDocument> => {
          return createMinimalLMF();
        }
      };
      
      expect(mockParser.name).toBe('Test Parser');
      expect(mockParser.description).toBe('A test parser implementation');
      expect(typeof mockParser.parse).toBe('function');
      
      // Test that parse method works
      return expect(mockParser.parse('test')).resolves.toBeDefined();
    });
  });
});
