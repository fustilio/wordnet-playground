import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingSaxParser, FullStreamingParser, createStreamingSaxParser } from '../../src/parsers/streaming-sax.js';
import type { LMFLoadOptions } from 'wn-ts-core';

describe('Streaming SAX Parser', () => {
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
      
      // Check lexicon
      const lexicon = result.lexicons[0];
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      expect(lexicon.id).toBe('test-en');
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.0');
      expect(lexicon.label).toBe('Test Lexicon');
      
      // Check word
      const word = result.words[0];
      if (!word) {
        expect(word).toBeDefined();
        return;
      }
      expect(word.id).toBe('test-word');
      expect(word.lemma).toBe('test');
      expect(word.pos).toBe('n');
      expect(word.language).toBe('en');
      expect(word.lexicon).toBe('test-en');
      
      // Check synset
      const synset = result.synsets[0];
      if (!synset) {
        expect(synset).toBeDefined();
        return;
      }
      expect(synset.id).toBe('test-synset');
      expect(synset.pos).toBe('n');
      expect(synset.language).toBe('en');
      expect(synset.lexicon).toBe('test-en');
      
      // Check sense
      const sense = result.senses[0];
      if (!sense) {
        expect(sense).toBeDefined();
        return;
      }
      expect(sense.id).toBe('test-sense');
      expect(sense.word).toBe('test-word');
      expect(sense.synset).toBe('test-synset');
    });

    it('should handle empty XML content', async () => {
      await expect(parser.parse('')).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
    });

    it('should handle non-string content', async () => {
      await expect(parser.parse(null as any)).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
      await expect(parser.parse(undefined as any)).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
      await expect(parser.parse(123 as any)).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
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

    it('should handle large XML content', async () => {
      // Create a larger XML with multiple entries
      const entries = Array.from({ length: 50 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(largeXML);
      
      expect(result.words).toHaveLength(50);
      expect(result.synsets).toHaveLength(50);
      expect(result.senses).toHaveLength(50);
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
      
      expect(enLexicon).toBeDefined();
      expect(esLexicon).toBeDefined();
      expect(enLexicon?.language).toBe('en');
      expect(esLexicon?.language).toBe('es');
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

  describe('Error handling', () => {
    it('should handle stream errors gracefully', async () => {
      // This test might be challenging to trigger in a unit test environment
      // but we can test that the parser doesn't crash on malformed content
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

    it('should handle empty content gracefully', async () => {
      await expect(parser.parse('')).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
      await expect(parser.parse('   ')).rejects.toThrow('Invalid LMF file: XML content is empty or not a string');
    });
  });

  describe('Performance characteristics', () => {
    it('should handle large XML files efficiently', async () => {
      // Create a very large XML file to test memory efficiency
      const entries = Array.from({ length: 1000 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;

      const startTime = Date.now();
      const result = await parser.parse(largeXML);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(1000);
      expect(result.synsets).toHaveLength(1000);
      expect(result.senses).toHaveLength(1000);
      
      // Should complete within reasonable time (adjust threshold as needed)
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(10000); // 10 seconds max
    });

    it('should call progress callback regularly for large files', async () => {
      const entries = Array.from({ length: 500 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;

      const progressCallback = vi.fn();
      const result = await parser.parse(largeXML, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result.words).toHaveLength(500);
      
      // Progress should be called multiple times for large files
      const callCount = progressCallback.mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
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

