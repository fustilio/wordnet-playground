import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingSaxParser, FullStreamingParser, createStreamingSaxParser } from '../../src/parsers/streaming-sax.js';
import type { LMFLoadOptions } from 'wn-ts-core';

/**
 * LMF Streaming Parser Tests
 * Focused on streaming parser specific functionality and performance
 */

describe('LMF Streaming Parser', () => {
  let parser: StreamingSaxParser;
  let fullParser: FullStreamingParser;

  beforeEach(() => {
    parser = new StreamingSaxParser();
    fullParser = new FullStreamingParser();
  });

  describe('StreamingSaxParser', () => {
    it('should have correct name and description', () => {
      expect(parser.name).toBe('Streaming SAX Parser');
      expect(parser.description).toBe('Memory-efficient streaming parser for large LMF files using SAX');
    });

    it('should parse valid LMF XML content', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(validXML);
      
      expect(result).toBeDefined();
      expect(result.lmfVersion).toBe('1.0'); // Default version
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      // Verify data integrity
      const lexicon = result.lexicons[0];
      const word = result.words[0];
      const synset = result.synsets[0];
      const sense = result.senses[0];
      
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      expect(lexicon.id).toBe('test-en');
      
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
      
      if (!sense) {
        expect(sense).toBeDefined();
        return;
      }
      expect(sense.id).toBe('test-sense');
    });

    it('should handle invalid input gracefully', async () => {
      const invalidInputs = [
        '', // Empty string
        '   ', // Whitespace only
        null as any, // Null
        undefined as any, // Undefined
        123 as any, // Number
        'This is not XML' // Non-XML content
      ];

      for (const input of invalidInputs) {
        if (input === '' || input === '   ' || input === null || input === undefined || typeof input !== 'string') {
          await expect(parser.parse(input)).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
        } else {
          // For non-XML content, expect XML parsing error
          await expect(parser.parse(input)).rejects.toThrow('XML parsing error');
        }
      }
    });

    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset">
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      await expect(parser.parse(malformedXML)).rejects.toThrow('XML parsing error');
    });

    it('should handle debug mode', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await parser.parse(validXML, { debug: true });
      
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Streaming SAX Parser: Starting parse');
      expect(result).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should handle progress callback', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const progressCallback = vi.fn();
      const result = await parser.parse(validXML, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle multiple lexicons', async () => {
      const multiLexiconXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test English" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word-en">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
  <Lexicon id="test-es" language="es" version="1.0" label="Test Spanish" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word-es">
      <Lemma writtenForm="prueba" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(multiLexiconXML);
      
      expect(result.lexicons).toHaveLength(2);
      expect(result.words).toHaveLength(2);
      
      const enLexicon = result.lexicons.find(l => l.id === 'test-en');
      const esLexicon = result.lexicons.find(l => l.id === 'test-es');
      
      if (!enLexicon) {
        expect(enLexicon).toBeDefined();
        return;
      }
      if (!esLexicon) {
        expect(esLexicon).toBeDefined();
        return;
      }
      expect(enLexicon.language).toBe('en');
      expect(esLexicon.language).toBe('es');
    });

    it('should handle complex synset structures', async () => {
      const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition language="en">Test definition</Definition>
      <Definition language="es">Definición de prueba</Definition>
      <Example language="en">This is a test example.</Example>
      <SynsetRelation relType="hypernym" target="parent-synset"/>
      <SynsetRelation relType="hyponym" target="child-synset"/>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(complexXML);
      
      expect(result.synsets).toHaveLength(1);
      const synset = result.synsets[0];
      
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(synset.definitions).toHaveLength(2);
      expect(synset.examples).toHaveLength(1);
      expect(synset.relations).toHaveLength(2);
    });

    it('should handle sense examples and counts', async () => {
      const senseXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset">
        <Example language="en">This is a test.</Example>
        <Count>42</Count>
      </Sense>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(senseXML);
      
      expect(result.senses).toHaveLength(1);
      const sense = result.senses[0];
      
      if (!sense) {
        expect(sense).toBeDefined();
        return;
      }
      expect(sense.examples).toHaveLength(1);
      expect(sense.counts).toHaveLength(1);
    });
  });

  describe('FullStreamingParser', () => {
    it('should have correct name and description', () => {
      expect(fullParser.name).toBe('Full Streaming Parser');
      expect(fullParser.description).toBe('Complete LMF streaming parser with full data extraction');
    });

    it('should parse XML content using SAX parser', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const result = await fullParser.parse(validXML);
      
      expect(result).toBeDefined();
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
    });
  });

  describe('Factory functions', () => {
    it('should create StreamingSaxParser instance', () => {
      const createdParser = createStreamingSaxParser();
      
      expect(createdParser).toBeInstanceOf(StreamingSaxParser);
      expect(createdParser.name).toBe('Streaming SAX Parser');
      expect(createdParser.description).toBe('Memory-efficient streaming parser for large LMF files using SAX');
    });
  });

  describe('Integration with LMF interfaces', () => {
    it('should implement LMFParser interface correctly', () => {
      expect(typeof parser.parse).toBe('function');
      expect(parser.name).toBeDefined();
      expect(parser.description).toBeDefined();
      
      // Test that parse method returns a Promise
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const parsePromise = parser.parse(validXML);
      expect(parsePromise).toBeInstanceOf(Promise);
      
      return expect(parsePromise).resolves.toBeDefined();
    });

    it('should handle LMFLoadOptions correctly', async () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;

      const options: LMFLoadOptions = {
        debug: true,
        progress: (p: number) => console.log(`Progress: ${p}`)
      };

      const result = await parser.parse(validXML, options);
      expect(result).toBeDefined();
    });
  });
});
