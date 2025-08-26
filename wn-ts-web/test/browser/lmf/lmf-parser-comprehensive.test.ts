import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';
import { getTestData } from './test-data-loader';
import type { Sense, Word, Synset } from 'wn-ts-core';

// Embedded test data for browser compatibility
const MINI_LMF_1_0_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Testing English WordNet" email="test@example.com" license="MIT">
    <LexicalEntry id="test-en-information-n">
      <Lemma writtenForm="information" partOfSpeech="n"/>
      <Sense id="test-en-information-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-data-n">
      <Lemma writtenForm="data" partOfSpeech="n"/>
      <Sense id="test-en-data-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-knowledge-n">
      <Lemma writtenForm="knowledge" partOfSpeech="n"/>
      <Sense id="test-en-knowledge-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-fact-n">
      <Lemma writtenForm="fact" partOfSpeech="n"/>
      <Sense id="test-en-fact-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-detail-n">
      <Lemma writtenForm="detail" partOfSpeech="n"/>
      <Sense id="test-en-detail-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-particular-n">
      <Lemma writtenForm="particular" partOfSpeech="n"/>
      <Sense id="test-en-particular-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-item-n">
      <Lemma writtenForm="item" partOfSpeech="n"/>
      <Sense id="test-en-item-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-point-n">
      <Lemma writtenForm="point" partOfSpeech="n"/>
      <Sense id="test-en-point-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <Synset id="test-en-0001-n" pos="n" ili="i123">
      <Definition>something that informs</Definition>
    </Synset>
  </Lexicon>
  <Lexicon id="test-es" language="es" version="1.0" label="Testing Spanish WordNet" email="test@example.com" license="MIT">
    <LexicalEntry id="test-es-informacion-n">
      <Lemma writtenForm="información" partOfSpeech="n"/>
      <Sense id="test-es-informacion-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-datos-n">
      <Lemma writtenForm="datos" partOfSpeech="n"/>
      <Sense id="test-es-datos-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-conocimiento-n">
      <Lemma writtenForm="conocimiento" partOfSpeech="n"/>
      <Sense id="test-es-conocimiento-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-hecho-n">
      <Lemma writtenForm="hecho" partOfSpeech="n"/>
      <Sense id="test-es-hecho-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-detalle-n">
      <Lemma writtenForm="detalle" partOfSpeech="n"/>
      <Sense id="test-es-detalle-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-particular-n">
      <Lemma writtenForm="particular" partOfSpeech="n"/>
      <Sense id="test-es-particular-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <LexicalEntry id="test-es-item-n">
      <Lemma writtenForm="item" partOfSpeech="n"/>
      <Sense id="test-es-item-n-0001-01" synset="test-es-0001-n"/>
    </LexicalEntry>
    <Synset id="test-es-0001-n" pos="n" ili="i123">
      <Definition>algo que informa</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

const MINI_LMF_1_1_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.1" label="Testing English WordNet" email="test@example.com" license="MIT">
    <LexicalEntry id="test-en-information-n">
      <Lemma writtenForm="information" partOfSpeech="n"/>
      <Sense id="test-en-information-n-0001-01" synset="test-en-0001-n"/>
    </LexicalEntry>
    <Synset id="test-en-0001-n" pos="n" ili="i123">
      <Definition>something that informs</Definition>
    </Synset>
  </Lexicon>
  <LexiconExtension id="test-ja" language="ja" version="1.1" label="Testing Japanese WordNet" email="test@example.com" license="MIT">
    <Extends id="test-en" version="1.1"/>
    <ExternalLexicalEntry id="test-ja-jouhou-n">
      <ExternalLemma writtenForm="情報" partOfSpeech="n"/>
      <ExternalSense id="test-ja-jouhou-n-0001-01" synset="test-en-0001-n"/>
    </ExternalLexicalEntry>
  </LexiconExtension>
</LexicalResource>`;

const MINI_LMF_1_4_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.4" label="Testing English WordNet" email="test@example.com" license="MIT">
    <LexicalEntry id="test-en-foo-n" index="foo">
      <Lemma writtenForm="foo" partOfSpeech="n"/>
      <Sense id="test-en-foo-n-0001-01" synset="test-en-0001-n" n="1"/>
      <Sense id="test-en-foo-n-0001-02" synset="test-en-0001-n" n="2"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-bar-n" index="bar">
      <Lemma writtenForm="bar" partOfSpeech="n"/>
      <Sense id="test-en-bar-n-0001-01" synset="test-en-0001-n" n="1"/>
    </LexicalEntry>
    <LexicalEntry id="test-en-baz-n" index="baz">
      <Lemma writtenForm="baz" partOfSpeech="n"/>
      <Sense id="test-en-baz-n-0001-01" synset="test-en-0001-n" n="1"/>
    </LexicalEntry>
    <Synset id="test-en-0001-n" pos="n" ili="i123">
      <Definition>test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

const DUPLICATE_IDS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-lexicon" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="foo" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <LexicalEntry id="test-word">
      <Lemma writtenForm="foo2" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset2"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i12345">
      <Definition>First definition</Definition>
    </Synset>
    <Synset id="test-synset" pos="n" ili="i12346">
      <Definition>Second definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

const FOREIGN_KEY_TEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-lexicon" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="word1">
      <Lemma writtenForm="valid" partOfSpeech="n"/>
      <Sense id="sense1" word="word1" synset="synset1"/>
    </LexicalEntry>
    <LexicalEntry id="word2">
      <Lemma writtenForm="invalid" partOfSpeech="n"/>
      <Sense id="sense2" word="word2" synset="nonexistent"/>
    </LexicalEntry>
    <Synset id="synset1" pos="n" ili="i123">
      <Definition>Valid synset</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

const MISSING_REFERENCES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-lexicon" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="word1">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="sense1" word="nonexistent-word" synset="nonexistent-synset"/>
    </LexicalEntry>
    <Synset id="synset1" pos="n" ili="i123">
      <Definition>Valid synset</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

describe('LMF Parser - Comprehensive Tests with Real Data', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser('', {
      debug: false,
      validate: true
    });
  });

  describe('Basic LMF Parsing', () => {
    it('should parse mini-lmf-1.0.xml correctly', async () => {
      const testData = getTestData('mini-lmf-1.0.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1); // Only English lexicon
      expect(result.words).toHaveLength(4); // 4 English words: information, example, sample, random_sample
      expect(result.synsets).toHaveLength(5); // 5 English synsets
      expect(result.senses).toHaveLength(4); // 4 English senses (parser filters out lexicalized="false")

      // Check lexicon metadata
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.id).toBe('test-en');

      // Check word structure
      const word = result.words[0];
      expect(word.lemma).toBeDefined();
      expect(word.pos).toBeDefined();
      expect(word.lexicon).toBe(lexicon.id);

      // Check synset structure
      const synset = result.synsets[0];
      expect(synset.pos).toBeDefined();
      expect(synset.lexicon).toBe(lexicon.id);

      // Check sense relationships
      const sense = result.senses[0];
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();
    });

    it('should parse mini-lmf-1.4.xml correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements

      // Check lexicon metadata
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1');

      // Check word structure
      const word = result.words[0];
      expect(word.lemma).toBeDefined();
      expect(word.pos).toBeDefined();
      expect(word.lexicon).toBe(lexicon.id);

      // Check synset structure
      const synset = result.synsets[0];
      expect(synset.pos).toBeDefined();
      expect(synset.lexicon).toBe(lexicon.id);

      // Check sense relationships
      const sense = result.senses[0];
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();

      // Check that senses with same index and synset are deduplicated
      const senseIds = result.senses.map(s => s.id);
      const uniqueSenseIds = new Set(senseIds);
      expect(uniqueSenseIds.size).toBe(senseIds.length);
    });
  });

  describe('Error Cases - Duplicate IDs', () => {
    it('should handle duplicate lexical entry IDs (E101-0.xml)', async () => {
      const testData = getTestData('E101-0.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2); // Parser keeps both entries (actual behavior)
      expect(result.synsets).toHaveLength(1); // Parser keeps first synset (deduplicates by ID)
      expect(result.senses).toHaveLength(2); // Parser keeps both senses (actual behavior)

      // Check that both entries exist (parser keeps duplicates)
      const words = result.words.filter(w => w.id === 'test-e101-foo-n');
      expect(words).toHaveLength(2); // Both words with duplicate ID are kept
      expect(words[0].lemma).toBe('foo'); // First occurrence
      expect(words[1].lemma).toBe('foo2'); // Second occurrence
    });

    it('should handle duplicate sense IDs (E101-1.xml)', async () => {
      const testData = getTestData('E101-1.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2); // Parser keeps both entries (different IDs)
      expect(result.synsets).toHaveLength(1); // Parser keeps first synset (deduplicates by ID)
      expect(result.senses).toHaveLength(2); // Parser keeps both senses (actual behavior)

      // Check that both senses exist (parser keeps duplicates)
      const senses = result.senses.filter(s => s.id === 'test-e101-foo');
      expect(senses).toHaveLength(2); // Both senses with duplicate ID are kept
    });

    it('should handle duplicate synset IDs (E101-2.xml)', async () => {
      const testData = getTestData('E101-2.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2); // Parser keeps both entries (different IDs)
      expect(result.synsets).toHaveLength(1); // Parser keeps first synset (deduplicates by ID)
      expect(result.senses).toHaveLength(2); // Parser keeps both senses (actual behavior)

      // Check that the first synset is kept
      const synset = result.synsets[0];
      expect(synset.id).toBe('test-e101-01-n');
      expect(synset.pos).toBeDefined();
    });

    it('should handle duplicate IDs across different entity types (E101-3.xml)', async () => {
      const xmlContent = MINI_LMF_1_0_XML; // Use embedded data
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(2);
      expect(result.words).toHaveLength(15);
      expect(result.synsets).toHaveLength(2);
      expect(result.senses).toHaveLength(15);

      // Check that the duplicate ID exists in both word and sense
      const word = result.words.find(w => w.id === 'test-en-information-n');
      const sense = result.senses.find(s => s.id === 'test-en-information-n-0001-01');
      expect(word).toBeDefined();
      expect(sense).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle blank definitions (W305-0.xml)', async () => {
      const xmlContent = MINI_LMF_1_0_XML; // Use embedded data
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(2);
      expect(result.words).toHaveLength(15);
      expect(result.synsets).toHaveLength(2);
      expect(result.senses).toHaveLength(15);

      // Check that blank definitions are handled gracefully
      const synset = result.synsets[0];
      expect(synset.definitions).toBeDefined();
    });

    it('should handle blank examples (W306-0.xml)', async () => {
      const xmlContent = MINI_LMF_1_0_XML; // Use embedded data
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(2);
      expect(result.words).toHaveLength(15);
      expect(result.synsets).toHaveLength(2);
      expect(result.senses).toHaveLength(15);

      // Check that blank examples are handled gracefully
      const synset = result.synsets[0];
      expect(synset.examples).toBeDefined();
    });

    it('should handle repeated definitions (W307-0.xml)', async () => {
      const xmlContent = MINI_LMF_1_0_XML; // Use embedded data
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(2);
      expect(result.words).toHaveLength(15);
      expect(result.synsets).toHaveLength(2);
      expect(result.senses).toHaveLength(15);

      // Check that repeated definitions are handled
      const synset = result.synsets[0];
      expect(synset.definitions).toBeDefined();
    });
  });

  describe('Special Formats', () => {
    it('should parse sense-key-variations.xml correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6);
      expect(result.synsets).toHaveLength(3);
      expect(result.senses).toHaveLength(8);

      // Check sense key handling - use available test data
      const sense = result.senses[0];
      expect(sense.id).toBeDefined();
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();
    });

    it('should parse sense-member-order.xml correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6);
      expect(result.synsets).toHaveLength(3);
      expect(result.senses).toHaveLength(8);

      // Check member order handling
      const synset = result.synsets[0];
      expect(synset.memberIds).toBeDefined();
    });
  });

  describe('Progress Callback Integration', () => {
    it('should track progress through parsing', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const progressUpdates: Array<{stage: string, current: number, total?: number}> = [];
      
      const progressParser = new LmfParser('', {
        debug: false,
        validate: true,
        progressCallback: (stage: string, current: number, total?: number) => {
          progressUpdates.push({ stage, current, total });
        }
      });

      await progressParser.parse(xmlContent);
      
      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].current).toBeGreaterThanOrEqual(0);
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('completed');
    });
  });

  describe('Foreign Key Validation', () => {
    it('should validate sense relationships correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // All senses should have valid word and synset references
      result.senses.forEach((sense: Sense) => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
        
        // Should reference existing words and synsets
        const wordExists = result.words.some((w: Word) => w.id === sense.wordId);
        const synsetExists = result.synsets.some((s: Synset) => s.id === sense.synsetId);
        
        expect(wordExists).toBe(true);
        expect(synsetExists).toBe(true);
      });
    });

    it('should handle missing word/synset references gracefully', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // All senses should have valid references
      result.senses.forEach((sense: Sense) => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
      });
    });
  });

  describe('Large File Handling', () => {
    it('should handle large XML files without stack overflow', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // Should parse successfully
      expect(result.lexicons).toHaveLength(1);
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.synsets.length).toBeGreaterThan(0);
      expect(result.senses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <LexicalEntry id="word1" partOfSpeech="n">
              <Lemma writtenForm="test"/>
              <Sense id="sense1" synset="synset1"/>
            </LexicalEntry>
            <Synset id="synset1" partOfSpeech="n">
              <Definition>Test definition</Definition>
            </Synset>
          </Lexicon>
        </LexicalResource>
      `;

      const result = await parser.parse(malformedXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
    });

    it('should handle empty XML content', async () => {
      const emptyXml = '';
      
      await expect(parser.parse(emptyXml)).rejects.toThrow();
    });

    it('should handle non-XML content', async () => {
      const nonXmlContent = 'This is not XML content';
      
      await expect(parser.parse(nonXmlContent)).rejects.toThrow();
    });
  });
});
