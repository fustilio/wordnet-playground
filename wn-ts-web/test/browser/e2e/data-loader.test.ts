import pako from 'pako';
import { describe, it, expect, vi, beforeEach, test } from 'vitest';

describe("load data", () => {
  test("pako compression and decompression", async () => {
    try {
      // Test pako gzip compression
      const testData = "hello world";
      const compressed = pako.gzip(testData);
      console.log("compressed length:", compressed.length);
      expect(compressed.length).toBeGreaterThan(0);
      expect(compressed).toBeInstanceOf(Uint8Array);

      // Test pako gzip decompression
      const decompressed = pako.ungzip(compressed, { to: "string" });
      console.log("decompressed:", decompressed);
      expect(decompressed).toBe(testData);

      // Test pako deflate compression
      const deflated = pako.deflate(testData);
      console.log("deflated length:", deflated.length);
      expect(deflated.length).toBeGreaterThan(0);
      expect(deflated).toBeInstanceOf(Uint8Array);

      // Test pako inflate decompression
      const inflated = pako.inflate(deflated, { to: "string" });
      console.log("inflated:", inflated);
      expect(inflated).toBe(testData);

    } catch (e) {
      console.error("Test failed:", e);
      throw e; // Re-throw to fail the test properly
    }
  });

  test("pako with larger data", async () => {
    try {
      // Test with larger data to ensure pako handles it properly
      const largeData = "This is a larger test string with more content to compress and decompress using pako library. It should handle various data sizes correctly.";
      
      // Compress and decompress
      const compressed = pako.gzip(largeData);
      const decompressed = pako.ungzip(compressed, { to: "string" });
      
      expect(decompressed).toBe(largeData);
      expect(compressed.length).toBeLessThan(largeData.length); // Compression should reduce size
      
    } catch (e) {
      console.error("Large data test failed:", e);
      throw e;
    }
  });
});