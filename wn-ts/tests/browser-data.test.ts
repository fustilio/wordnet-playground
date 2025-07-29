import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { makeBrowserData } from '../src/browser-data.js';
import { add, config, db } from 'wn-ts';
import { testUtils } from './setup';
import { logger } from '../src/utils/logger.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wn-ts-browser-data-test-'));
}

describe('browser-data', () => {
  let outDir: string;
  const lexiconId = 'test-browser';

  beforeEach(async () => {
    // Set up test data directory using the global setup pattern
    config.dataDirectory = testUtils.getTestDataDir();
    
    // Initialize database for tests
    await db.initialize();
    
    outDir = createTempDir();
    
    // Create a minimal LMF XML lexicon file for testing
    const testLexicon = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="${lexiconId}" label="Test Browser" language="en" version="1.0">
    <LexicalEntry id="w1">
      <Lemma writtenForm="apple" partOfSpeech="n"/>
      <Sense id="s1" synset="ss1"/>
    </LexicalEntry>
    <LexicalEntry id="w2">
      <Lemma writtenForm="banana" partOfSpeech="n"/>
      <Sense id="s2" synset="ss2"/>
    </LexicalEntry>
    <LexicalEntry id="w3">
      <Lemma writtenForm="run" partOfSpeech="v"/>
      <Sense id="s3" synset="ss3"/>
    </LexicalEntry>
    <Synset id="ss1" partOfSpeech="n">
      <Definition>a round fruit with red or green skin</Definition>
    </Synset>
    <Synset id="ss2" partOfSpeech="n">
      <Definition>a long curved fruit with yellow skin</Definition>
    </Synset>
    <Synset id="ss3" partOfSpeech="v">
      <Definition>move fast on foot</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
    
    const lexiconXmlPath = path.join(outDir, `${lexiconId}.xml`);
    fs.writeFileSync(lexiconXmlPath, testLexicon);
    
    // Add the lexicon to the database
    await add(lexiconXmlPath, { force: true });
  });

  afterEach(async () => {
    // Close database connection after each test
    await db.close();
    
    // Clean up test directory
    if (outDir && fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  describe('data generation', () => {
      it('creates chunked browser data files', () => {
    makeBrowserData({ lexiconId, outDir, chunkSize: 100 });
      
      // Check that files were created
      const metadataJson = path.join(outDir, 'metadata.json');
      const chunksJson = path.join(outDir, 'chunks.json');
      const words0Json = path.join(outDir, 'words0.json');
      const synsets0Json = path.join(outDir, 'synsets0.json');
      
      expect(fs.existsSync(metadataJson)).toBe(true);
      expect(fs.existsSync(chunksJson)).toBe(true);
      expect(fs.existsSync(words0Json)).toBe(true);
      expect(fs.existsSync(synsets0Json)).toBe(true);
      
      // Check file contents
      const metadata = JSON.parse(fs.readFileSync(metadataJson, 'utf8'));
      expect(metadata.lexiconId).toBe(lexiconId);
      expect(metadata.totalWords).toBeGreaterThan(0);
      expect(metadata.totalSynsets).toBeGreaterThan(0);
      
      const chunks = JSON.parse(fs.readFileSync(chunksJson, 'utf8'));
      expect(chunks.totalWordChunks).toBeGreaterThan(0);
      expect(chunks.totalSynsetChunks).toBeGreaterThan(0);
      expect(chunks.chunkSize).toBe(100);
      
      const words = JSON.parse(fs.readFileSync(words0Json, 'utf8'));
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      
      const synsets = JSON.parse(fs.readFileSync(synsets0Json, 'utf8'));
      expect(Array.isArray(synsets)).toBe(true);
      expect(synsets.length).toBeGreaterThan(0);
    });

    it('does not write files in dryRun mode', () => {
      makeBrowserData({ lexiconId, outDir, dryRun: true });
      
      // Should not create any files
      expect(fs.existsSync(path.join(outDir, 'metadata.json'))).toBe(false);
      expect(fs.existsSync(path.join(outDir, 'chunks.json'))).toBe(false);
      expect(fs.existsSync(path.join(outDir, 'words-0.json'))).toBe(false);
      expect(fs.existsSync(path.join(outDir, 'synsets-0.json'))).toBe(false);
    });

    it('works with custom chunk size', () => {
      makeBrowserData({ lexiconId, outDir, chunkSize: 1 });
      
      // With chunk size 1, we should have multiple chunk files
      const chunksJson = path.join(outDir, 'chunks.json');
      const chunks = JSON.parse(fs.readFileSync(chunksJson, 'utf8'));
      expect(chunks.totalWordChunks).toBeGreaterThan(1);
      expect(chunks.totalSynsetChunks).toBeGreaterThan(1);
    });
  });

  describe('progress tracking', () => {
    it('shows debug output when debug is enabled', () => {
      // Mock the logger to capture output
      const originalDebug = logger.debug;
      const originalConfig = logger.config;
      const originalSuccess = logger.success;
      const originalData = logger.data;
      
      const logs: string[] = [];
      
      logger.debug = (message: string) => logs.push(`DEBUG: ${message}`);
      logger.config = (message: string) => logs.push(`CONFIG: ${message}`);
      logger.success = (message: string) => logs.push(`SUCCESS: ${message}`);
      logger.data = (message: string) => logs.push(`DATA: ${message}`);

      try {
        makeBrowserData({ lexiconId, outDir, chunkSize: 100, debug: true }); // Set debug: true

        // Check that debug messages were logged
        const logText = logs.join('\n');
        expect(logText).toContain('Starting browser data preparation');
        expect(logText).toContain('Output directory:');
        expect(logText).toContain('Chunk size:');
        expect(logText).toContain('Browser data prep complete');
        expect(logText).toContain('Total time:');
      } finally {
        // Restore original logger methods
        logger.debug = originalDebug;
        logger.config = originalConfig;
        logger.success = originalSuccess;
        logger.data = originalData;
      }
    });

    it('suppresses debug output by default', () => {
      // Mock the logger to capture output
      const originalDebug = logger.debug;
      const originalConfig = logger.config;
      const originalSuccess = logger.success;
      const originalData = logger.data;
      
      const logs: string[] = [];
      
      logger.debug = (message: string) => logs.push(`DEBUG: ${message}`);
      logger.config = (message: string) => logs.push(`CONFIG: ${message}`);
      logger.success = (message: string) => logs.push(`SUCCESS: ${message}`);
      logger.data = (message: string) => logs.push(`DATA: ${message}`);

      try {
        makeBrowserData({ lexiconId, outDir, chunkSize: 100 }); // Default debug: false

        // Check that debug messages are NOT logged by default
        const logText = logs.join('\n');
        expect(logText).not.toContain('Starting browser data preparation');
        expect(logText).not.toContain('Output directory:');
        expect(logText).not.toContain('Chunk size:');
        // Note: success message won't appear in test environment due to logger level
      } finally {
        // Restore original logger methods
        logger.debug = originalDebug;
        logger.config = originalConfig;
        logger.success = originalSuccess;
        logger.data = originalData;
      }
    });
  });

  describe('error handling', () => {
    it('handles non-existent lexicon gracefully', () => {
      expect(() => {
        makeBrowserData({ lexiconId: 'non-existent', outDir });
      }).toThrow();
    });

    it('handles invalid output directory', () => {
      expect(() => {
        makeBrowserData({ lexiconId, outDir: 'C:\\nonexistent\\path\\with\\invalid\\characters\\*' });
      }).toThrow();
    });
  });

  describe('file system operations', () => {
    it('creates output directory if it does not exist', () => {
      const nestedDir = path.join(outDir, 'nested', 'deep');
      const nestedOutDir = path.join(nestedDir, 'output');
      
      makeBrowserData({ lexiconId, outDir: nestedOutDir, chunkSize: 100 });
      
      expect(fs.existsSync(nestedOutDir)).toBe(true);
      expect(fs.existsSync(path.join(nestedOutDir, 'metadata.json'))).toBe(true);
    });

    it('overwrites existing files', () => {
      // Create initial files
      makeBrowserData({ lexiconId, outDir, chunkSize: 100 });
      const initialMetadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
      
      // Create files again
      makeBrowserData({ lexiconId, outDir, chunkSize: 50 });
      const updatedMetadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
      
      // Should have different chunk sizes
      expect(initialMetadata).not.toEqual(updatedMetadata);
    });
  });
}); 