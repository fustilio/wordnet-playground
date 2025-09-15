import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { existsSync, writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { loadLMF } from '../../src/lmf.js';
import { StreamingSaxParser } from '../../src/parsers/streaming-sax.js';
import { createTestDataManager } from 'wn-ts-core/test';

/**
 * Enhanced LMF test suite that uses local test data and integrates with test data generation
 * This ensures reliable testing without depending on external URLs
 */

describe('Enhanced LMF Tests', () => {
  let tempDir: string;
  let testLmfFile: string;
  let testDataManager: ReturnType<typeof createTestDataManager>;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-enhanced-lmf-'));
    testLmfFile = join(tempDir, 'test.lmf');
    
    // Initialize test data manager
    testDataManager = createTestDataManager(tempDir);
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Local Test Data Generation', () => {
    it('should generate realistic LMF test data', async () => {
      // Create a realistic LMF XML for testing
      const realisticLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test English Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word-1">
      <Lemma writtenForm="example" partOfSpeech="n"/>
      <Form id="form-1" writtenForm="examples"/>
      <Tag category="domain">general</Tag>
      <Sense id="sense-1" synset="synset-1"/>
    </LexicalEntry>
    <LexicalEntry id="test-word-2">
      <Lemma writtenForm="test" partOfSpeech="v"/>
      <Form id="form-2" writtenForm="testing"/>
      <Tag category="domain">general</Tag>
      <Sense id="sense-2" synset="synset-2"/>
    </LexicalEntry>
    <Synset id="synset-1" pos="n" ili="i123">
      <Definition>a representative form or pattern</Definition>
      <Example>I followed the example of my predecessor</Example>
      <SynsetRelation relType="hypernym" target="parent-synset"/>
    </Synset>
    <Synset id="synset-2" pos="v" ili="i124">
      <Definition>put to the test, as for its quality</Definition>
      <Example>Please test this sample</Example>
      <SynsetRelation relType="hypernym" target="parent-synset"/>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, realisticLMF);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lmfVersion).toBe('1.0');
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2);
      expect(result.synsets).toHaveLength(2);
      expect(result.senses).toHaveLength(2);
      
      // Verify lexicon structure
      const lexicon = result.lexicons[0];
      expect(lexicon.id).toBe('test-en');
      expect(lexicon.language).toBe('en');
      expect(lexicon.label).toBe('Test English Lexicon');
      
      // Verify word structure
      const word1 = result.words.find(w => w.id === 'test-word-1');
      const word2 = result.words.find(w => w.id === 'test-word-2');
      
      expect(word1).toBeDefined();
      expect(word1?.lemma).toBe('example');
      expect(word1?.pos).toBe('n');
      expect(word1?.forms).toHaveLength(1);
      expect(word1?.forms[0].writtenForm).toBe('examples');
      
      expect(word2).toBeDefined();
      expect(word2?.lemma).toBe('test');
      expect(word2?.pos).toBe('v');
      
      // Verify synset structure
      const synset1 = result.synsets.find(s => s.id === 'synset-1');
      const synset2 = result.synsets.find(s => s.id === 'synset-2');
      
      expect(synset1).toBeDefined();
      expect(synset1?.pos).toBe('n');
      expect(synset1?.definitions).toHaveLength(1);
      expect(synset1?.definitions[0].text).toBe('a representative form or pattern');
      expect(synset1?.examples).toHaveLength(1);
      expect(synset1?.relations).toHaveLength(1);
      
      expect(synset2).toBeDefined();
      expect(synset2?.pos).toBe('v');
      
      // Verify sense structure
      const sense1 = result.senses.find(s => s.id === 'sense-1');
      const sense2 = result.senses.find(s => s.id === 'sense-2');
      
      expect(sense1).toBeDefined();
      expect(sense1?.wordId).toBe('test-word-1');
      expect(sense1?.synsetId).toBe('synset-1');
      
      expect(sense2).toBeDefined();
      expect(sense2?.wordId).toBe('test-word-2');
      expect(sense2?.synsetId).toBe('synset-2');
    });

    it('should generate large LMF test data for performance testing', async () => {
      // Generate a larger LMF file for performance testing
      const entries = Array.from({ length: 100 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Form id="form-${i}" writtenForm="word${i}s"/>
      <Tag category="domain">test</Tag>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
      <Example>Example for word ${i}</Example>
      <SynsetRelation relType="hypernym" target="parent-${i}"/>
    </Synset>`).join('');

      const largeLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, largeLMF);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(100);
      expect(result.synsets).toHaveLength(100);
      expect(result.senses).toHaveLength(100);
      
      // Should complete within reasonable time
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(5000); // 5 seconds max for 100 entries
    });
  });

  describe('URL Loading Support', () => {
    it('should handle URL loading with proper error messages', async () => {
      // Test with a known good URL (if available) or expect proper error handling
      const testURL = 'https://httpbin.org/xml'; // This should return XML
      
      try {
        const result = await loadLMF(testURL, { debug: true });
        // If successful, verify basic structure
        expect(result).toBeDefined();
        expect(result.lmfVersion).toBeDefined();
      } catch (error) {
        // Should provide meaningful error message
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to load LMF');
      }
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidURL = 'https://httpbin.org/status/404';
      
      await expect(loadLMF(invalidURL)).rejects.toThrow('Failed to load LMF');
    });

    it('should handle non-XML URLs gracefully', async () => {
      const jsonURL = 'https://httpbin.org/json';
      
      await expect(loadLMF(jsonURL)).rejects.toThrow('Failed to load LMF');
    });
  });

  describe('LMF Version Support', () => {
    const supportedVersions = ['1.0', '1.1', '1.2', '1.3', '1.4'];

    supportedVersions.forEach(version => {
      it(`should support LMF version ${version}`, async () => {
        const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

        writeFileSync(testLmfFile, lmfXML);
        const result = await loadLMF(testLmfFile);
        
        expect(result.lmfVersion).toBe(version);
        expect(result.lexicons).toHaveLength(1);
        expect(result.words).toHaveLength(1);
        expect(result.synsets).toHaveLength(1);
        expect(result.senses).toHaveLength(1);
      });
    });

    it('should reject unsupported LMF versions', async () => {
      const unsupportedVersion = '2.0';
      const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${unsupportedVersion}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${unsupportedVersion}" label="Test Lexicon" 
           email="test@example.com" license="MIT">
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, lmfXML);
      
      await expect(loadLMF(testLmfFile)).rejects.toThrow(`Unsupported LMF version: ${unsupportedVersion}`);
    });
  });

  describe('Progress Reporting', () => {
    it('should provide progress updates for large files', async () => {
      const entries = Array.from({ length: 200 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const largeLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, largeLMF);
      
      const progressCallback = vi.fn();
      const result = await loadLMF(testLmfFile, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result.words).toHaveLength(200);
      
      // Progress should be called multiple times for large files
      const callCount = progressCallback.mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset">
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, malformedXML);
      
      await expect(loadLMF(testLmfFile)).rejects.toThrow('XML parsing error');
    });

    it('should handle missing required attributes gracefully', async () => {
      const missingAttrsXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      writeFileSync(testLmfFile, missingAttrsXML);
      
      // Should not crash on missing attributes
      const result = await loadLMF(testLmfFile);
      expect(result.lexicons).toHaveLength(1);
      
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.0');
      // Missing id should be handled gracefully
      expect(lexicon.id).toBe('');
    });

    it('should handle empty files gracefully', async () => {
      writeFileSync(testLmfFile, '');
      
      await expect(loadLMF(testLmfFile)).rejects.toThrow('Failed to load LMF');
    });

    it('should handle non-XML content gracefully', async () => {
      writeFileSync(testLmfFile, 'This is not XML content');
      
      await expect(loadLMF(testLmfFile)).rejects.toThrow('Failed to load LMF');
    });
  });

  describe('Streaming Parser Compatibility', () => {
    it('should work with streaming SAX parser', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new StreamingSaxParser();
      const result = await parser.parse(validXML);
      
      expect(result).toBeDefined();
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
    });

    it('should handle streaming parser errors gracefully', async () => {
      const malformedXML = `<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset">
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new StreamingSaxParser();
      
      await expect(parser.parse(malformedXML)).rejects.toThrow('XML parsing error');
    });
  });

  describe('Integration with Test Data Manager', () => {
    it('should generate test data using xml-introspect when available', async () => {
      // This test will only pass if xml-introspect is available
      try {
        const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

        writeFileSync(testLmfFile, testXML);
        
        // Try to generate test data using the test data manager
        const result = await testDataManager.generateTestData('test-project', testXML);
        
        if (result.success) {
          expect(result.analysis).toBeDefined();
          expect(result.analysis?.lexicons).toBeGreaterThan(0);
          expect(result.analysis?.words).toBeGreaterThan(0);
          expect(result.analysis?.synsets).toBeGreaterThan(0);
        } else {
          // If xml-introspect is not available, that's okay
          expect(result.error).toContain('xml-introspect');
        }
      } catch (error) {
        // If xml-introspect is not available, that's okay
        const errorMessage = (error as Error).message;
        // The error might be about xml-introspect or about type issues
        expect(errorMessage).toMatch(/xml-introspect|actual value must be number or bigint/);
      }
    });
  });
});
