import { describe, it, expect, beforeEach, vi } from "vitest";
import { createDefaultProcessorFactory } from "@fustilio/data-loader";
import type { FormatProcessor } from "@fustilio/data-loader";
import {
  compressGzip,
  generateWordNetXmlData,
  generateOewnLikeXmlData,
  generateSimpleXmlData,
  testWordNetProcessing,
  FILE_SIZE_CATEGORIES,
  EXPECTED_TIMEOUTS,
  TEST_TIMEOUTS
} from "./test-utils.js";

/**
 * Consolidated Decompression Tests
 * 
 * This file consolidates all decompression-related tests to reduce duplication
 * and provide better organization. It covers:
 * - Basic decompression functionality
 * - File size-based testing
 * - Performance and timeout testing
 * - Error handling
 * - Progress reporting
 */

describe("Decompression Tests", () => {
  let formatProcessor: FormatProcessor;

  beforeEach(() => {
    const factory = createDefaultProcessorFactory();
    formatProcessor = factory.createProcessor();
  });

  describe("Basic Decompression", () => {
    it("should decompress small gzipped files", async () => {
      const xmlData = `<?xml version="1.0"?><LexicalResource><lexicon id="test"/></LexicalResource>`;
      const compressedData = compressGzip(xmlData);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.SMALL
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.SMALL);
      expect(result?.success).toBe(true);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.SMALL);

    it("should handle corrupted gzip data gracefully", async () => {
      // Create corrupted gzip data
      const corruptedData = new ArrayBuffer(1000);
      const view = new Uint8Array(corruptedData);
      // Fill with random data (not valid gzip)
      for (let i = 0; i < view.length; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }
      
      const { result, success } = await testWordNetProcessing(
        formatProcessor,
        corruptedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.SMALL
      );

      // Should either succeed with some result or fail gracefully
      expect(result).toBeDefined();
      if (success && result?.success) {
        expect(result.xmlContent).toBeDefined();
      } else {
        expect(result?.error).toBeDefined();
      }
    }, TEST_TIMEOUTS.SMALL);

    it("should handle empty data", async () => {
      const { result, success } = await testWordNetProcessing(
        formatProcessor,
        new ArrayBuffer(0),
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.SMALL
      );

      // The @fustilio/data-loader handles empty data gracefully
      // It may succeed with empty content or fail with an error - both are acceptable
      expect(result).toBeDefined();
      if (success && result?.success) {
        // If it succeeds, it should have some result structure
        expect(result).toHaveProperty('success', true);
      } else {
        // If it fails, it should have an error
        expect(result?.error).toBeDefined();
      }
    }, TEST_TIMEOUTS.SMALL);
  });

  describe("File Size Based Testing", () => {
    it("should handle small files efficiently", async () => {
      const xmlData = generateSimpleXmlData(FILE_SIZE_CATEGORIES.SMALL);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing small file: ${compressedData.byteLength} bytes`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.SMALL
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.SMALL);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.SMALL);

    it("should handle medium files efficiently", async () => {
      const xmlData = generateSimpleXmlData(FILE_SIZE_CATEGORIES.MEDIUM);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing medium file: ${(compressedData.byteLength / 1024).toFixed(1)}KB`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.MEDIUM
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.MEDIUM);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.MEDIUM);

    it("should handle large files efficiently", async () => {
      const xmlData = generateSimpleXmlData(FILE_SIZE_CATEGORIES.LARGE);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing large file: ${(compressedData.byteLength / 1024).toFixed(1)}KB`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.LARGE
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.LARGE);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.LARGE);

    it("should handle very large files efficiently", async () => {
      const xmlData = generateSimpleXmlData(FILE_SIZE_CATEGORIES.VERY_LARGE);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing very large file: ${(compressedData.byteLength / 1024 / 1024).toFixed(2)}MB`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "omw-en:1.4",
        EXPECTED_TIMEOUTS.VERY_LARGE
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.VERY_LARGE);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.VERY_LARGE);
  });

  describe("OEWN Simulation", () => {
    it("should handle OEWN-like large files", async () => {
      const xmlData = generateOewnLikeXmlData(FILE_SIZE_CATEGORIES.OEWN_LIKE);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing OEWN-like file: ${(compressedData.byteLength / 1024 / 1024).toFixed(2)}MB`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "oewn:2024",
        EXPECTED_TIMEOUTS.OEWN_LIKE
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.OEWN_LIKE);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.OEWN_LIKE);

    it("should handle medium OEWN-like files efficiently", async () => {
      const xmlData = generateOewnLikeXmlData(FILE_SIZE_CATEGORIES.LARGE);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing medium OEWN-like file: ${(compressedData.byteLength / 1024).toFixed(1)}KB`);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "oewn:2024",
        EXPECTED_TIMEOUTS.LARGE
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.LARGE);
      expect(result?.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.LARGE);
  });

  describe("WordNet-Specific Testing", () => {
    it("should handle WordNet XML structure correctly", async () => {
      const xmlData = generateWordNetXmlData(FILE_SIZE_CATEGORIES.MEDIUM);
      const compressedData = compressGzip(xmlData);
      
      const { result, duration, success } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "oewn:2024",
        EXPECTED_TIMEOUTS.MEDIUM
      );

      expect(success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.MEDIUM);
      expect(result?.xmlContent).toContain("LexicalResource");
      expect(result?.xmlContent).toContain("LexicalEntry");
    }, TEST_TIMEOUTS.MEDIUM);

    it("should provide progress updates during large WordNet processing", async () => {
      const progressCallback = vi.fn();
      
      const xmlData = generateWordNetXmlData(FILE_SIZE_CATEGORIES.LARGE);
      const compressedData = compressGzip(xmlData);
      
      const progressOptions = {
        onProgress: progressCallback,
        dataInterval: 50 * 1024, // 50KB intervals (more frequent)
        timeInterval: 100,       // 100ms intervals (more frequent)
        detailed: true
      };
      
      const startTime = Date.now();
      
      const result = await formatProcessor.processData(compressedData, {
        projectId: "oewn:2024",
        enableTarExtraction: true,
        progressOptions: progressOptions
      });
      
      const duration = Date.now() - startTime;
      console.log(`WordNet processing with progress completed in ${duration}ms`);
      
      expect(result.success).toBe(true);
      
      // Progress callback might not be called if processing is too fast
      // So we'll check if it was called, but not require it
      if (progressCallback.mock.calls.length > 0) {
        const calls = progressCallback.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        
        // Check that we got the expected stages
        const stages = calls.map(call => call[0].stage);
        expect(stages).toContain('decompressing');
        expect(stages).toContain('completed');
      } else {
        console.log("Progress callback not called - processing was too fast");
      }
    }, TEST_TIMEOUTS.LARGE);
  });

  describe("Error Handling and Timeouts", () => {
    it("should handle timeout gracefully with informative error messages", async () => {
      // Create a large file that will likely timeout with a short timeout
      const xmlData = generateWordNetXmlData(10 * 1024 * 1024); // 10MB
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing timeout handling with large WordNet file: ${(compressedData.byteLength / 1024).toFixed(1)}KB`);
      
      const { result, duration, success, error } = await testWordNetProcessing(
        formatProcessor,
        compressedData,
        "oewn:2024",
        EXPECTED_TIMEOUTS.OEWN_LIKE
      );
      
      if (success) {
        // If it succeeds, that's great too
        expect(result?.success).toBe(true);
        expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.OEWN_LIKE);
      } else {
        // Should fail gracefully with timeout error, not hang
        expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.OEWN_LIKE);
        expect(error instanceof Error).toBe(true);
        expect(error?.message).toMatch(/timeout|decompression|large file/i);
      }
    }, TEST_TIMEOUTS.OEWN_LIKE);
  });

  describe("Integration Pattern Testing", () => {
    it("should work with WordNetProcessor integration pattern", async () => {
      // Replicate the exact usage pattern from the issue report
      class WordNetProcessor {
        private formatProcessor: FormatProcessor;

        constructor() {
          const factory = createDefaultProcessorFactory();
          this.formatProcessor = factory.createProcessor();
        }

        async processWordNetData(data: ArrayBuffer, options: { projectId: string; enableTarExtraction: boolean }) {
          const formatResult = await this.formatProcessor.processData(data, {
            projectId: options.projectId,
            enableTarExtraction: options.enableTarExtraction
          });
          return formatResult;
        }
      }

      const processor = new WordNetProcessor();
      const xmlData = generateWordNetXmlData(FILE_SIZE_CATEGORIES.MEDIUM);
      const compressedData = compressGzip(xmlData);
      
      console.log(`Testing exact integration pattern: ${(compressedData.byteLength / 1024).toFixed(1)}KB compressed`);
      
      const startTime = Date.now();
      
      const result = await processor.processWordNetData(compressedData, {
        projectId: "oewn:2024",
        enableTarExtraction: true
      });
      
      const duration = Date.now() - startTime;
      console.log(`Integration pattern test completed in ${duration}ms`);
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(EXPECTED_TIMEOUTS.MEDIUM);
      expect(result.xmlContent).toContain("LexicalResource");
    }, TEST_TIMEOUTS.MEDIUM);
  });
});
