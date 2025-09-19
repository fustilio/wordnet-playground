import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { isLMF, loadLMF } from '../../src/lmf.js';

/**
 * Core LMF functionality tests
 * Focused on essential parsing, validation, and basic error handling
 */

describe('LMF Core Functionality', () => {
  let tempDir: string;
  let testLmfFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'wn-ts-lmf-core-'));
    testLmfFile = join(tempDir, 'test.lmf');
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

  describe('File Validation', () => {
    it('should identify valid LMF files', async () => {
      const validLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, validLMF);
      expect(await isLMF(testLmfFile)).toBe(true);
    });

    it('should reject invalid LMF files', async () => {
      const invalidCases = [
        // No XML declaration
        `<LexicalResource><Lexicon id="test"></Lexicon></LexicalResource>`,
        // No DOCTYPE
        `<?xml version="1.0"?><LexicalResource><Lexicon id="test"></Lexicon></LexicalResource>`,
        // No LexicalResource root
        `<?xml version="1.0"?><!DOCTYPE LexicalResource SYSTEM "WN-LMF-1.0.dtd"><Root></Root>`,
        // Empty file
        ``,
        // Non-XML content
        `This is not XML`
      ];

      for (const content of invalidCases) {
        writeFileSync(testLmfFile, content);
        expect(await isLMF(testLmfFile)).toBe(false);
      }
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = join(tempDir, 'nonexistent.lmf');
      expect(await isLMF(nonExistentFile)).toBe(false);
    });
  });

  describe('Basic Parsing', () => {
    it('should parse minimal valid LMF file', async () => {
      const minimalLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
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
      
      writeFileSync(testLmfFile, minimalLMF);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lmfVersion).toBe('1.0');
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
      expect(sense.wordId).toBe('test-word');
      expect(sense.synsetId).toBe('test-synset');
    });

    it('should handle multiple lexicons', async () => {
      const multiLexicon = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="English" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word-en">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
  <Lexicon id="test-es" language="es" version="1.0" label="Spanish" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word-es">
      <Lemma writtenForm="prueba" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, multiLexicon);
      const result = await loadLMF(testLmfFile);
      
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
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
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
      
      writeFileSync(testLmfFile, malformedXML);
      await expect(loadLMF(testLmfFile)).rejects.toThrow('XML parsing error');
    });

    it('should handle missing required attributes gracefully', async () => {
      const missingAttrsXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, missingAttrsXML);
      const result = await loadLMF(testLmfFile);
      
      expect(result.lexicons).toHaveLength(1);
      const lexicon = result.lexicons[0];
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      expect(lexicon.language).toBe('en');
      expect(lexicon.id).toBe(''); // Should default to empty string
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = join(tempDir, 'nonexistent.lmf');
      await expect(loadLMF(nonExistentFile)).rejects.toThrow('Failed to load LMF file');
    });
  });

  describe('Progress Reporting', () => {
    it('should call progress callback when provided', async () => {
      const validLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
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
      
      writeFileSync(testLmfFile, validLMF);
      
      const progressCallback = vi.fn();
      const result = await loadLMF(testLmfFile, { progress: progressCallback });
      
      expect(progressCallback).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

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
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
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

  describe('Debug Mode', () => {
    it('should provide debug output when enabled', async () => {
      const validLMF = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="1.0" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
    </LexicalEntry>
  </Lexicon>
</LexicalResource>`;
      
      writeFileSync(testLmfFile, validLMF);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await loadLMF(testLmfFile, { debug: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});
