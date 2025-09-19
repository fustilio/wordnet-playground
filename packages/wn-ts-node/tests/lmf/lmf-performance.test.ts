import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { loadLMF } from '../../src/lmf.js';
import { StreamingSaxParser } from '../../src/parsers/streaming-sax.js';

/**
 * LMF Performance Tests
 * Focused on performance characteristics, memory usage, and scalability
 */

describe('LMF Performance', () => {
  let tempDir: string;
  let testLmfFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-lmf-perf-'));
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

  describe('Large File Handling', () => {
    it('should handle large files efficiently', async () => {
      const entries = Array.from({ length: 1000 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
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
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, largeLMF);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(1000);
      expect(result.synsets).toHaveLength(1000);
      expect(result.senses).toHaveLength(1000);
      
      // Should complete within reasonable time
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(10000); // 10 seconds max for 1000 entries
    });

    it('should provide progress updates for large files', async () => {
      const entries = Array.from({ length: 500 }, (_, i) => `
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
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, largeLMF);
      
      const progressCallback = vi.fn();
      const result = await loadLMF(testLmfFile, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result.words).toHaveLength(500);
      
      // Progress should be called multiple times for large files
      const callCount = progressCallback.mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle very large files without memory issues', async () => {
      const entries = Array.from({ length: 5000 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

      const veryLargeLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, veryLargeLMF);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(5000);
      expect(result.synsets).toHaveLength(5000);
      expect(result.senses).toHaveLength(5000);
      
      // Should complete within reasonable time even for very large files
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(30000); // 30 seconds max for 5000 entries
    });
  });

  describe('Streaming Parser Performance', () => {
    it('should handle large files efficiently with streaming parser', async () => {
      const entries = Array.from({ length: 2000 }, (_, i) => `
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

      const parser = new StreamingSaxParser();
      
      const startTime = Date.now();
      const result = await parser.parse(largeXML);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(2000);
      expect(result.synsets).toHaveLength(2000);
      expect(result.senses).toHaveLength(2000);
      
      // Streaming parser should be faster for large files
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(15000); // 15 seconds max for 2000 entries
    });

    it('should call progress callback regularly for large files', async () => {
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

      const parser = new StreamingSaxParser();
      const progressCallback = vi.fn();
      
      const result = await parser.parse(largeXML, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result.words).toHaveLength(1000);
      
      // Progress should be called multiple times for large files
      const callCount = progressCallback.mock.calls.length;
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle multiple concurrent parsing operations', async () => {
      const createTestLMF = (id: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-${id}" language="en" version="1.0" label="Test Lexicon ${id}" email="test@example.com" license="MIT">
    <LexicalEntry id="word-${id}">
      <Lemma writtenForm="word${id}" partOfSpeech="n"/>
      <Sense id="sense-${id}" synset="synset-${id}"/>
    </LexicalEntry>
    <Synset id="synset-${id}" pos="n" ili="i${id}">
      <Definition>Definition for word ${id}</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      // Create multiple test files
      const testFiles = [];
      for (let i = 0; i < 5; i++) {
        const filePath = join(tempDir, `test-${i}.lmf`);
        writeFileSync(filePath, createTestLMF(i.toString()));
        testFiles.push(filePath);
      }

      // Parse all files concurrently
      const startTime = Date.now();
      const results = await Promise.all(
        testFiles.map(file => loadLMF(file))
      );
      const endTime = Date.now();

      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.lexicons).toHaveLength(1);
        
        const lexicon = result.lexicons[0];
        if (!lexicon) {
          expect(lexicon).toBeDefined();
          return;
        }
        expect(lexicon.id).toBe(`test-${index}`);
        
        expect(result.words).toHaveLength(1);
        expect(result.synsets).toHaveLength(1);
        expect(result.senses).toHaveLength(1);
      });

      // Should complete within reasonable time
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(5000); // 5 seconds max for 5 concurrent files
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle files with many small entries efficiently', async () => {
      const entries = Array.from({ length: 10000 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="w${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>D${i}</Definition>
    </Synset>`).join('');

      const manySmallLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, manySmallLMF);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(10000);
      expect(result.synsets).toHaveLength(10000);
      expect(result.senses).toHaveLength(10000);
      
      // Should handle many small entries efficiently
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(20000); // 20 seconds max for 10000 entries
    });

    it('should handle files with complex nested structures efficiently', async () => {
      const complexEntries = Array.from({ length: 100 }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Form id="form-${i}-1" writtenForm="word${i}s"/>
      <Form id="form-${i}-2" writtenForm="word${i}ing"/>
      <Tag category="domain">test</Tag>
      <Tag category="frequency">high</Tag>
      <Sense id="sense-${i}-1" synset="synset-${i}-1"/>
      <Sense id="sense-${i}-2" synset="synset-${i}-2"/>
    </LexicalEntry>
    <Synset id="synset-${i}-1" pos="n" ili="i${i}1">
      <Definition>Primary definition for word ${i}</Definition>
      <Definition language="es">Definición primaria para palabra ${i}</Definition>
      <Example>Example 1 for word ${i}</Example>
      <Example>Example 2 for word ${i}</Example>
      <SynsetRelation relType="hypernym" target="parent-${i}"/>
      <SynsetRelation relType="hyponym" target="child-${i}"/>
    </Synset>
    <Synset id="synset-${i}-2" pos="n" ili="i${i}2">
      <Definition>Secondary definition for word ${i}</Definition>
      <SynsetRelation relType="similar" target="similar-${i}"/>
    </Synset>`).join('');

      const complexLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
${complexEntries}
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, complexLMF);
      
      const startTime = Date.now();
      const result = await loadLMF(testLmfFile);
      const endTime = Date.now();
      
      expect(result.words).toHaveLength(100);
      expect(result.synsets).toHaveLength(200); // 2 synsets per word
      expect(result.senses).toHaveLength(200); // 2 senses per word
      
      // Should handle complex structures efficiently
      const parseTime = endTime - startTime;
      expect(parseTime).toBeLessThan(10000); // 10 seconds max for complex structures
    });
  });
});
