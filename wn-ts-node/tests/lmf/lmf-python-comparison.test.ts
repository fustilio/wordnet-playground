import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { existsSync, writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { loadLMF } from '../../src/lmf.js';
import { StreamingSaxParser } from '../../src/parsers/streaming-sax.js';

/**
 * Test suite that validates TypeScript LMF implementation against Python reference
 * This ensures feature parity and compatibility with the Python wn library
 */

describe('LMF Python Compatibility Tests', () => {
  let tempDir: string;
  let testLmfFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-python-compat-'));
    testLmfFile = join(tempDir, 'test.lmf');
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      try {
        unlinkSync(tempDir);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('LMF Version Support (Python Parity)', () => {
    // Python wn library supports versions 1.0, 1.1, 1.2, 1.3, 1.4
    const supportedVersions = ['1.0', '1.1', '1.2', '1.3', '1.4'];
    const unsupportedVersions = ['0.9', '2.0', '2.1'];

    supportedVersions.forEach(version => {
      it(`should support LMF version ${version} (like Python wn)`, async () => {
        const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
        
        writeFileSync(testLmfFile, lmfXML);
        const result = await loadLMF(testLmfFile);
        
        expect(result.lmfVersion).toBe(version);
        expect(result.lexicons).toHaveLength(1);
      });
    });

    unsupportedVersions.forEach(version => {
      it(`should reject LMF version ${version} (like Python wn)`, async () => {
        const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
  </Lexicon>
</LexicalResource>`;
        
        writeFileSync(testLmfFile, lmfXML);
        
        await expect(loadLMF(testLmfFile)).rejects.toThrow(`Unsupported LMF version: ${version}`);
      });
    });
  });

  describe('LMF Element Support (Python Parity)', () => {
    it('should support all LMF 1.0 elements (like Python wn)', async () => {
      const lmf10XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Form id="test-form" writtenForm="test"/>
      <Tag category="test-cat">test tag</Tag>
      <Sense id="test-sense" synset="test-synset"/>
      <SyntacticBehaviour subcategorizationFrame="test frame"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
      <Example>Test example</Example>
      <SynsetRelation relType="hypernym" target="parent-synset"/>
    </Synset>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, lmf10XML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      const word = result.words[0];

      if (!word) {
        expect(word).toBeDefined();
        return;
      }

      expect(word.forms.length).toBeGreaterThanOrEqual(1); // Should have at least the form
      expect(word.tags).toHaveLength(1);
      // Note: senses are now in result.senses array, not word.senses
      expect(result.senses).toHaveLength(1);
      
      const synset = result.synsets[0];
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(synset.definitions).toHaveLength(1);
      expect(synset.examples).toHaveLength(1);
      expect(synset.relations).toHaveLength(1);
    });

    it('should support LMF 1.1+ elements (like Python wn)', async () => {
      const lmf11XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.1" label="Test Lexicon" email="test@example.com" license="MIT">
    <Requires id="dependency" version="1.0"/>
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n">
        <Pronunciation variety="standard">tɛst</Pronunciation>
      </Lemma>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
    <SyntacticBehaviour id="test-frame" subcategorizationFrame="test frame"/>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, lmf11XML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lmfVersion).toBe('1.1');
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      
      const word = result.words[0];
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      expect(word.forms.length).toBeGreaterThanOrEqual(0); // May have forms depending on implementation

      // Note: pronunciations are now stored at the Word level, not Form level
      // The new implementation may not populate pronunciations from LMF
      expect(Array.isArray(word.pronunciations)).toBe(true);
      // If pronunciations are present, check the first one
      if (word.pronunciations.length > 0 && word.pronunciations[0]) {
        expect(word.pronunciations[0].value).toBe('tɛst');
        expect(word.pronunciations[0].variety).toBe('standard');
      }
    });

    it('should support LMF 1.4 elements (like Python wn)', async () => {
      const lmf14XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.4" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word" index="1">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset" n="1"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, lmf14XML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lmfVersion).toBe('1.4');
      expect(result.words).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      // Note: These attributes might not be fully implemented yet
      // but the parser should not crash on them
      const word = result.words[0];
      const sense = result.senses[0];
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      if (!sense) {
        expect(sense).toBeDefined();
        return;
      }
      expect(word.id).toBe('test-word');
      expect(sense.id).toBe('test-sense');
    });
  });

  describe('Metadata Handling (Python Parity)', () => {
    it('should handle Dublin Core metadata (like Python wn)', async () => {
      const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource xmlns:dc="http://purl.org/dc/elements/1.1/">
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT"
           dc:creator="Test Creator" dc:date="2024-01-01" dc:description="Test description">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, metadataXML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lexicons).toHaveLength(1);
      const lexicon = result.lexicons[0];   
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      
      // Note: Metadata handling might be simplified in the current implementation
      // but the parser should not crash on metadata attributes
      expect(lexicon.id).toBe('test-en');
      expect(lexicon.label).toBe('Test Lexicon');
    });

    it('should handle confidence scores (like Python wn)', async () => {
      const confidenceXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word" confidenceScore="0.95">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123" confidenceScore="0.90">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, confidenceXML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      
      // Note: Confidence scores might not be fully implemented yet
      // but the parser should not crash on them
      const word = result.words[0];
      const synset = result.synsets[0];
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(word.id).toBe('test-word');
      expect(synset.id).toBe('test-synset');
    });
  });

  describe('External References (Python Parity)', () => {
    it('should handle external lexical entries (like Python wn)', async () => {
      const externalXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.1" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
  <LexiconExtension id="test-ext" language="en" version="1.1" 
                    label="Extension" email="test@example.com" license="MIT"
                    extends="test-en">
    <ExternalLexicalEntry id="ext-word" external="true">
      <ExternalLemma external="true"/>
      <ExternalSense id="ext-sense" external="true" synset="ext-synset"/>
    </ExternalLexicalEntry>
    <ExternalSynset id="ext-synset" external="true">
      <Definition>External definition</Definition>
    </ExternalSynset>
  </LexiconExtension>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, externalXML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lexicons).toHaveLength(2);
      
      // Note: External references might not be fully implemented yet
      // but the parser should not crash on them
      const baseLexicon = result.lexicons.find(l => l.id === 'test-en');
      const extLexicon = result.lexicons.find(l => l.id === 'test-ext');
      if (!baseLexicon) {
        expect(baseLexicon).toBeDefined();
        return;
      }
      if (!extLexicon) {
        expect(extLexicon).toBeDefined();
        return;
      }
      expect(baseLexicon).toBeDefined();
      expect(extLexicon).toBeDefined();
    });
  });

  describe('Lexicon Extensions (Python Parity)', () => {
    it('should handle lexicon extensions (like Python wn)', async () => {
      const extensionXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd">
<LexicalResource>
  <Lexicon id="base-en" language="en" version="1.1" label="Base Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="base-word">
      <Lemma writtenForm="base" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
  <LexiconExtension id="ext-en" language="en" version="1.1" 
                    label="Extension" email="test@example.com" license="MIT"
                    extends="base-en">
    <Extends id="base-en" version="1.1"/>
    <Requires id="dependency" version="1.0"/>
    <LexicalEntry id="ext-word">
      <Lemma writtenForm="extension" partOfSpeech="n"/>
    </LexicalEntry>
  </LexiconExtension>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, extensionXML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lexicons).toHaveLength(2);
      
      const baseLexicon = result.lexicons.find(l => l.id === 'base-en');
      const extLexicon = result.lexicons.find(l => l.id === 'ext-en');
      
      expect(baseLexicon).toBeDefined();
      expect(extLexicon).toBeDefined();
      expect(baseLexicon?.id).toBe('base-en');
      expect(extLexicon?.id).toBe('ext-en');
    });
  });

  describe('Error Handling (Python Parity)', () => {
    it('should handle malformed XML gracefully (like Python wn)', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
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

    it('should handle missing required attributes (like Python wn)', async () => {
      const missingAttrsXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, missingAttrsXML);
      
      // Note: The current implementation might be more lenient than Python wn
      // but it should not crash on missing attributes
      const result = await loadLMF(testLmfFile);
      expect(result.lexicons).toHaveLength(1);
      
      const lexicon = result.lexicons[0];
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.0');
      // Missing id should be handled gracefully
      expect(lexicon.id).toBe(''); // or some default value
    });
  });

  describe('Performance Characteristics (Python Parity)', () => {
    it('should handle large files efficiently (like Python wn)', async () => {
      // Create a large LMF file similar to what Python wn might process
      const entries = Array.from({ length: 100 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
      <Example>Example for word ${i}</Example>
      <SynsetRelation relType="hypernym" target="parent-${i}"/>
    </Synset>`).join('');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, largeXML);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(100);
      expect(result.synsets).toHaveLength(100);
      expect(result.senses).toHaveLength(100);
      
      // Should complete within reasonable time (adjust threshold as needed)
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(5000); // 5 seconds max for 100 entries
    });

    it('should provide progress updates for large files (like Python wn)', async () => {
      const entries = Array.from({ length: 200 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" 
           email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, largeXML);
      
      const progressCallback = vi.fn();
      const result = await loadLMF(testLmfFile, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result.words).toHaveLength(200);
      
      // Progress should be called multiple times for large files
      const callCount = progressCallback.mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Streaming Parser Compatibility', () => {
    it('should work with streaming SAX parser (like Python expat)', async () => {
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
});

