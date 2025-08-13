import { describe, it, expect, vi } from 'vitest';
import { parseLMFXML, diagnoseDownloadIssue, analyzeXMLContent } from 'wn-ts-core';

describe('LMF (Lexical Markup Framework) Parser', () => {
  describe('parseLMFXML', () => {
    it('should parse valid LMF XML content', () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns:dc="https://globalwordnet.github.io/schemas/dc/">
  <Lexicon id="test-lexicon" label="Test Lexicon" language="en" version="1.0">
    <LexicalEntry id="test-entry">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" partOfSpeech="n">
      <Definition>
        <gloss>Test definition</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(validXML, { debug: false });
      
      expect(result).toBeDefined();
      expect(result.lmfVersion).toBe('1.0');
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      expect(result.lexicons[0].id).toBe('test-lexicon');
      expect(result.words[0].lemma).toBe('test');
      expect(result.synsets[0].id).toBe('test-synset');
    });

    it('should handle LMF with custom version', () => {
      const customVersionXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource lmfVersion="1.3" xmlns:dc="https://globalwordnet.github.io/schemas/dc/">
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(customVersionXML);
      expect(result.lmfVersion).toBe('1.3');
    });

    it('should handle multiple lexicons', () => {
      const multiLexiconXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="lex1" label="Lexicon 1" language="en" version="1.0">
    <LexicalEntry id="entry1">
      <Lemma writtenForm="word1" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
  <Lexicon id="lex2" label="Lexicon 2" language="fr" version="1.0">
    <LexicalEntry id="entry2">
      <Lemma writtenForm="mot" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(multiLexiconXML);
      expect(result.lexicons).toHaveLength(2);
      expect(result.lexicons[0].id).toBe('lex1');
      expect(result.lexicons[1].id).toBe('lex2');
      expect(result.lexicons[0].language).toBe('en');
      expect(result.lexicons[1].language).toBe('fr');
    });

    it('should handle multiple lexical entries per lexicon', () => {
      const multiEntryXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry1">
      <Lemma writtenForm="word1" partOfSpeech="n"/>
    </LexicalEntry>
    <LexicalEntry id="entry2">
      <Lemma writtenForm="word2" partOfSpeech="v"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(multiEntryXML);
      expect(result.words).toHaveLength(2);
      expect(result.words[0].lemma).toBe('word1');
      expect(result.words[1].lemma).toBe('word2');
      expect(result.words[0].pos).toBe('n');
      expect(result.words[1].pos).toBe('v');
    });

    it('should handle forms and senses', () => {
      const formsAndSensesXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="run" partOfSpeech="v"/>
      <Form writtenForm="running" tag="present_participle"/>
      <Form writtenForm="ran" tag="past_tense"/>
      <Sense id="sense1" synset="synset1"/>
      <Sense id="sense2" synset="synset2"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(formsAndSensesXML);
      expect(result.words[0].forms).toHaveLength(2);
      expect(result.words[0].forms[0].writtenForm).toBe('running');
      expect(result.words[0].forms[1].writtenForm).toBe('ran');
      expect(result.senses).toHaveLength(2);
      expect(result.senses[0].id).toBe('sense1');
      expect(result.senses[1].id).toBe('sense2');
    });

    it('should handle synsets with definitions', () => {
      const synsetWithDefXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <Synset id="synset1" partOfSpeech="n">
      <Definition>
        <gloss>Test definition</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(synsetWithDefXML);
      expect(result.synsets[0].definitions).toHaveLength(1);
      expect(result.synsets[0].definitions[0].text).toBe('Test definition');
    });

    it('should handle synset relations', () => {
      const synsetRelationsXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <Synset id="synset1" partOfSpeech="n">
      <SynsetRelation relType="hypernym" target="synset2"/>
      <SynsetRelation relType="hyponym" target="synset3"/>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(synsetRelationsXML);
      expect(result.synsets[0].relations).toHaveLength(2);
      expect(result.synsets[0].relations[0].type).toBe('hypernym');
      expect(result.synsets[0].relations[0].target).toBe('synset2');
      expect(result.synsets[0].relations[1].type).toBe('hyponym');
      expect(result.synsets[0].relations[1].target).toBe('synset3');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty content', () => {
      expect(() => parseLMFXML('')).toThrow('Invalid LMF file: XML content is empty');
    });

    it('should throw error for non-string content', () => {
      expect(() => parseLMFXML(null as any)).toThrow('Invalid LMF file: XML content is not a valid string');
    });

    it('should throw error for non-XML content', () => {
      expect(() => parseLMFXML('This is not XML')).toThrow('Invalid LMF file: Content does not appear to be XML');
    });

    it('should throw error for HTML content', () => {
      const htmlContent = '<!DOCTYPE html><html><body>Error page</body></html>';
      expect(() => parseLMFXML(htmlContent)).toThrow('Invalid LMF file: Content appears to be HTML error page, not XML');
    });

    it('should throw error for missing LexicalResource element', () => {
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<RootElement>
  <SomeOtherElement>Content</SomeOtherElement>
</RootElement>`;

      expect(() => parseLMFXML(invalidXML)).toThrow('Invalid LMF file: missing LexicalResource element');
    });

    it('should throw error for unsupported LMF version', () => {
      const unsupportedVersionXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource lmfVersion="2.0">
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      expect(() => parseLMFXML(unsupportedVersionXML)).toThrow('Unsupported LMF version: 2.0');
    });

    it('should throw error for HTTP error pages', () => {
      const errorPageContent = 'HTTP 404: Not Found';
      expect(() => parseLMFXML(errorPageContent)).toThrow('Invalid LMF file: Server returned HTTP error page');
    });
  });

  describe('diagnoseDownloadIssue', () => {
    it('should diagnose empty content', () => {
      expect(diagnoseDownloadIssue('')).toBe('Download failed: Empty content received');
    });

    it('should diagnose HTML content', () => {
      const htmlContent = '<!DOCTYPE html><html><body>Error</body></html>';
      expect(diagnoseDownloadIssue(htmlContent)).toBe('Download failed: Received HTML page instead of XML (possible 404 or server error)');
    });

    it('should diagnose 404 errors', () => {
      const errorContent = 'Error: File not found (404)';
      expect(diagnoseDownloadIssue(errorContent)).toBe('Download failed: File not found (404 error)');
    });

    it('should diagnose access denied errors', () => {
      const accessDeniedContent = 'Access denied (403)';
      expect(diagnoseDownloadIssue(accessDeniedContent)).toBe('Download failed: Access denied (403 error)');
    });

    it('should diagnose server errors', () => {
      const serverErrorContent = 'Internal server error (500)';
      expect(diagnoseDownloadIssue(serverErrorContent)).toBe('Download failed: Server error (500)');
    });

    it('should diagnose non-XML content', () => {
      const nonXMLContent = 'This is plain text, not XML';
      expect(diagnoseDownloadIssue(nonXMLContent)).toBe('Download failed: Content is not valid XML');
    });

    it('should diagnose missing LexicalResource', () => {
      const xmlWithoutLR = '<?xml version="1.0"?><Root><Element>Content</Element></Root>';
      expect(diagnoseDownloadIssue(xmlWithoutLR)).toBe('Download failed: XML does not contain LexicalResource element (not a valid LMF file)');
    });

    it('should indicate successful download for valid LMF', () => {
      const validLMF = '<?xml version="1.0"?><LexicalResource><Lexicon id="test"/></LexicalResource>';
      expect(diagnoseDownloadIssue(validLMF)).toBe('Download appears successful, but parsing failed');
    });
  });

  describe('analyzeXMLContent', () => {
    it('should analyze valid LMF XML', () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
    <Synset id="synset" partOfSpeech="n">
      <Definition><gloss>Test</gloss></Definition>
    </Synset>
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
      expect(analysis.rootElements).toContain('LexicalResource');
    });

    it('should analyze XML without declaration', () => {
      const xmlWithoutDecl = '<LexicalResource><Lexicon id="test"/></LexicalResource>';
      
      const analysis = analyzeXMLContent(xmlWithoutDecl);
      
      expect(analysis.isXML).toBe(true);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.hasLexicalResource).toBe(true);
      expect(analysis.hasLexicon).toBe(true);
    });

    it('should analyze non-XML content', () => {
      const nonXML = 'This is not XML content';
      
      const analysis = analyzeXMLContent(nonXML);
      
      expect(analysis.isXML).toBe(false);
      expect(analysis.hasXMLDeclaration).toBe(false);
      expect(analysis.hasLexicalResource).toBe(false);
      expect(analysis.contentLength).toBeGreaterThan(0);
    });

    it('should extract root elements correctly', () => {
      const xmlWithMultipleRoots = `<?xml version="1.0"?>
<LexicalResource>
  <Lexicon id="test"/>
  <LexicalEntry id="entry"/>
  <Synset id="synset"/>
</LexicalResource>`;

      const analysis = analyzeXMLContent(xmlWithMultipleRoots);
      
      expect(analysis.rootElements).toContain('LexicalResource');
      expect(analysis.rootElements).toContain('Lexicon');
      expect(analysis.rootElements).toContain('LexicalEntry');
      expect(analysis.rootElements).toContain('Synset');
    });
  });

  describe('Debug Mode', () => {
    it('should provide debug output when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      parseLMFXML(validXML, { debug: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] parseLMFXML() starting with'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] XML content validation passed'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Parsing XML with fast-xml-parser'));
      
      consoleSpy.mockRestore();
    });

    it('should not provide debug output when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      parseLMFXML(validXML, { debug: false });
      
      // Should not have debug messages
      const debugCalls = consoleSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('[DEBUG]')
      );
      expect(debugCalls).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle XML with special characters in attributes', () => {
      const specialCharsXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test &amp; More" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(specialCharsXML);
      expect(result.lexicons[0].label).toBe('Test & More');
    });

    it('should handle XML with CDATA sections', () => {
      const cdataXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <Synset id="synset" partOfSpeech="n">
      <Definition>
        <gloss><![CDATA[This is a <b>bold</b> definition]]></gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(cdataXML);
      expect(result.synsets[0].definitions[0].text).toBe('This is a <b>bold</b> definition');
    });

    it('should handle XML with comments', () => {
      const commentXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <!-- This is a comment -->
  <Lexicon id="test" label="Test" language="en" version="1.0">
    <LexicalEntry id="entry">
      <Lemma writtenForm="word" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = parseLMFXML(commentXML);
      expect(result.lexicons).toHaveLength(1);
      expect(result.lexicons[0].id).toBe('test');
    });
  });
});
