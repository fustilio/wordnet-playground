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
    } catch (error) {
      console.error("Pako test failed:", error);
      throw error;
    }
  });

  test("pako handles large data efficiently", async () => {
    try {
      // Create a larger test dataset
      const largeData = "a".repeat(10000) + "b".repeat(10000) + "c".repeat(10000);
      
      // Test compression ratio
      const compressed = pako.gzip(largeData);
      const compressionRatio = compressed.length / largeData.length;
      
      console.log("Large data compression ratio:", compressionRatio);
      expect(compressionRatio).toBeLessThan(1); // Should compress
      expect(compressionRatio).toBeGreaterThan(0.001); // But not too much (adjusted for repetitive data)
      
      // Test round-trip
      const decompressed = pako.ungzip(compressed, { to: "string" });
      expect(decompressed).toBe(largeData);
    } catch (error) {
      console.error("Large data test failed:", error);
      throw error;
    }
  });
});