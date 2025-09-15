import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { loadLMF } from '../../src/lmf.js';

/**
 * LMF Version Support Tests
 * Comprehensive testing of all supported LMF versions and their features
 */

describe('LMF Version Support', () => {
  let tempDir: string;
  let testLmfFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-lmf-versions-'));
    testLmfFile = join(tempDir, 'test.lmf');
  });

  afterEach(() => {
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Supported Versions', () => {
    const supportedVersions = ['1.0', '1.1', '1.2', '1.3', '1.4'];

    supportedVersions.forEach(version => {
      it(`should support LMF version ${version}`, async () => {
        const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
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
  });

  describe('Unsupported Versions', () => {
    const unsupportedVersions = ['0.9', '2.0', '2.1'];

    unsupportedVersions.forEach(version => {
      it(`should reject LMF version ${version}`, async () => {
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

  describe('Version-Specific Features', () => {
    it('should handle LMF 1.0 basic elements', async () => {
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
      
      expect(result.lmfVersion).toBe('1.0');
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      const word = result.words[0];
      const synset = result.synsets[0];
      
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      if (!word.forms) {
        expect(word.forms).toBeDefined();
        return;
      }
      expect(word.forms).toHaveLength(1);
      
      if (!word.tags) {
        expect(word.tags).toBeDefined();
        return;
      }
      expect(word.tags).toHaveLength(1);
      
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(synset.definitions).toHaveLength(1);
      expect(synset.examples).toHaveLength(1);
      expect(synset.relations).toHaveLength(1);
    });

    it('should handle LMF 1.1+ advanced features', async () => {
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
      if (!word.pronunciations) {
        expect(word.pronunciations).toBeDefined();
        return;
      }
      expect(word.pronunciations).toBeDefined();
      expect(Array.isArray(word.pronunciations)).toBe(true);
    });

    it('should handle LMF 1.4 latest features', async () => {
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
      
      const word = result.words[0];
      const sense = result.senses[0];
      
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      expect(word.id).toBe('test-word');
      
      if (!sense) {
        expect(sense).toBeDefined();
        return;
      }
      expect(sense.id).toBe('test-sense');
    });
  });

  describe('Metadata Handling', () => {
    it('should handle Dublin Core metadata', async () => {
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
      expect(lexicon.id).toBe('test-en');
      expect(lexicon.label).toBe('Test Lexicon');
    });

    it('should handle confidence scores', async () => {
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
      
      const word = result.words[0];
      const synset = result.synsets[0];
      
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      expect(word.id).toBe('test-word');
      
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(synset.id).toBe('test-synset');
    });
  });
});
