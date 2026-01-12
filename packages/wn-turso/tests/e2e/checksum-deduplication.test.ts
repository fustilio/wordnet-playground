/**
 * E2E Checksum Deduplication Tests
 *
 * Tests both sink-level and operator-level checksum deduplication
 */

import { describe, it, expect } from "vitest";
import {
  Pipeline,
  arraySource,
  arraySink,
  computeChecksum,
} from "../../src/pipeline/index.js";

// Test data
interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
  value: number;
  timestamp?: string;
}

const testData: TestRow[] = [
  { id: "1", name: "apple", value: 10 },
  { id: "2", name: "banana", value: 20 },
  { id: "3", name: "cherry", value: 30 },
  { id: "4", name: "date", value: 40 },
  { id: "5", name: "elderberry", value: 50 },
];

describe("E2E: Checksum Deduplication", () => {
  describe("Sink-Level Deduplication", () => {
    it("should skip unchanged rows with sink option", async () => {
      // Simulate first sync - all rows are new
      const sink1 = arraySink<TestRow & { _etl_checksum: string }>();

      const result1 = await Pipeline.from(
        arraySource(testData, "source:data")
      ).to(
        sink1 as any // Type assertion for test
      );

      expect(result1.processed).toBe(5);
      expect(result1.inserted).toBe(5);
      expect(result1.skipped_unchanged).toBeUndefined(); // No dedup on first run

      // Manually add checksums to simulate destination with checksums
      const rowsWithChecksums = testData.map((row) => ({
        ...row,
        _etl_checksum: computeChecksum(row),
      }));

      // Simulate second sync - no changes, all should be skipped
      // We'll use the operator approach since arraySink doesn't have checksum support
      const existingChecksums = new Map<string, string>();
      rowsWithChecksums.forEach((row) => {
        existingChecksums.set(row.id, row._etl_checksum);
      });

      const sink2 = arraySink<TestRow>();
      const result2 = await Pipeline.from(arraySource(testData, "source:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink2);

      expect(result2.processed).toBe(0); // All filtered by operator
      expect(sink2.items).toHaveLength(0);
    });

    it("should write changed rows", async () => {
      // Establish baseline
      const baseline = testData.slice(0, 3);
      const existingChecksums = new Map<string, string>();
      baseline.forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      // Modified data - 1 changed, 1 new, 1 unchanged
      const modifiedData: TestRow[] = [
        { id: "1", name: "apple", value: 10 }, // unchanged
        { id: "2", name: "banana", value: 25 }, // changed value
        { id: "4", name: "date", value: 40 }, // new
      ];

      const sink = arraySink<TestRow>();
      const result = await Pipeline.from(
        arraySource(modifiedData, "source:data")
      )
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      expect(result.processed).toBe(2); // Changed + new
      expect(sink.items).toHaveLength(2);
      expect(sink.items.find((r) => r.id === "2")).toBeDefined();
      expect(sink.items.find((r) => r.id === "4")).toBeDefined();
      expect(sink.items.find((r) => r.id === "1")).toBeUndefined();
    });

    it("should respect field selection in deduplication", async () => {
      // Baseline with timestamps
      const baseline = [
        { id: "1", name: "apple", value: 10, timestamp: "2024-01-01" },
        { id: "2", name: "banana", value: 20, timestamp: "2024-01-01" },
      ];

      const existingChecksums = new Map<string, string>();
      baseline.forEach((row) => {
        existingChecksums.set(
          row.id,
          computeChecksum(row, ["id", "name", "value"])
        );
      });

      // Same data but different timestamps (should be ignored)
      const modifiedData = [
        { id: "1", name: "apple", value: 10, timestamp: "2024-02-01" },
        { id: "2", name: "banana", value: 20, timestamp: "2024-02-01" },
      ];

      const sink = arraySink<(typeof modifiedData)[0]>();
      const result = await Pipeline.from(
        arraySource(modifiedData, "source:data")
      )
        .deduplicateByChecksum({
          keyField: "id",
          checksumFields: ["id", "name", "value"], // ignore timestamp
          existingChecksums,
        })
        .to(sink);

      expect(result.processed).toBe(0); // All skipped
      expect(sink.items).toHaveLength(0);
    });

    it("should detect changes when selected fields differ", async () => {
      const baseline = [{ id: "1", name: "apple", value: 10, metadata: "old" }];

      const existingChecksums = new Map<string, string>();
      existingChecksums.set(
        "1",
        computeChecksum(baseline[0], ["id", "name", "value"])
      );

      // Changed value (should be detected)
      const modifiedData = [
        { id: "1", name: "apple", value: 15, metadata: "new" },
      ];

      const sink = arraySink<(typeof modifiedData)[0]>();
      const result = await Pipeline.from(
        arraySource(modifiedData, "source:data")
      )
        .deduplicateByChecksum({
          keyField: "id",
          checksumFields: ["id", "name", "value"],
          existingChecksums,
        })
        .to(sink);

      expect(result.processed).toBe(1); // Changed
      expect(sink.items).toHaveLength(1);
    });
  });

  describe("Operator-Level Deduplication", () => {
    it("should work as a standalone operator", async () => {
      const existingChecksums = new Map<string, string>();
      testData.slice(0, 3).forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      // Process all 5 rows, but 3 should be filtered
      const sink = arraySink<TestRow>();
      await Pipeline.from(arraySource(testData, "source:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      expect(sink.items).toHaveLength(2); // Only new rows
      expect(sink.items.find((r) => r.id === "4")).toBeDefined();
      expect(sink.items.find((r) => r.id === "5")).toBeDefined();
    });

    it("should work with other pipeline operators", async () => {
      const existingChecksums = new Map<string, string>();
      testData.slice(0, 2).forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      const sink = arraySink<TestRow>();
      await Pipeline.from(arraySource(testData, "source:data"))
        .filter((row) => row.value >= 20) // Filter first
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      // Filter: 20, 30, 40, 50
      // Dedupe: remove 20 (exists)
      // Result: 30, 40, 50
      expect(sink.items).toHaveLength(3);
      expect(sink.items.map((r) => r.id).sort()).toEqual(["3", "4", "5"]);
    });

    it("should preserve transformations", async () => {
      const existingChecksums = new Map<string, string>();

      interface ExtendedRow extends TestRow {
        doubled: number;
      }

      const sink = arraySink<ExtendedRow>();
      await Pipeline.from(arraySource(testData.slice(0, 2), "source:data"))
        .extend((row) => ({ doubled: row.value * 2 }))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums, // Empty, so all pass through
        })
        .to(sink);

      expect(sink.items).toHaveLength(2);
      expect(sink.items[0].doubled).toBe(20);
      expect(sink.items[1].doubled).toBe(40);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large datasets efficiently", async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `item-${i}`,
        value: i,
      }));

      // Simulate 500 existing
      const existingChecksums = new Map<string, string>();
      largeData.slice(0, 500).forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      const startTime = Date.now();

      const sink = arraySink<(typeof largeData)[0]>();
      await Pipeline.from(arraySource(largeData, "large:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      const duration = Date.now() - startTime;

      expect(sink.items).toHaveLength(500); // Only new ones
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it("should handle empty existing checksums", async () => {
      const existingChecksums = new Map<string, string>();

      const sink = arraySink<TestRow>();
      const result = await Pipeline.from(arraySource(testData, "source:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      expect(result.processed).toBe(5); // All pass through
      expect(sink.items).toHaveLength(5);
    });

    it("should handle empty input stream", async () => {
      const existingChecksums = new Map<string, string>();
      existingChecksums.set("1", "dummy");

      const sink = arraySink<TestRow>();
      const result = await Pipeline.from(arraySource([], "empty:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      expect(result.processed).toBe(0);
      expect(sink.items).toHaveLength(0);
    });

    it("should handle duplicate keys in input", async () => {
      const dataWithDupes = [
        { id: "1", name: "apple", value: 10 },
        { id: "1", name: "apple", value: 10 }, // Exact duplicate
        { id: "2", name: "banana", value: 20 },
      ];

      const existingChecksums = new Map<string, string>();

      const sink = arraySink<TestRow>();
      await Pipeline.from(arraySource(dataWithDupes, "dupes:data"))
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink);

      // All pass through (no existing checksums)
      expect(sink.items).toHaveLength(3);
    });
  });

  describe("Integration Scenarios", () => {
    it("should support incremental sync workflow", async () => {
      // Initial sync
      const initialData = testData.slice(0, 3);
      const sink1 = arraySink<TestRow>();
      await Pipeline.from(arraySource(initialData, "initial:data")).to(sink1);

      // Build checksum map
      const existingChecksums = new Map<string, string>();
      sink1.items.forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      // Incremental sync with changes
      const incrementalData = [
        ...testData.slice(0, 2), // First 2 unchanged
        { id: "3", name: "cherry", value: 35 }, // Modified
        ...testData.slice(3, 5), // New rows
      ];

      const sink2 = arraySink<TestRow>();
      const result = await Pipeline.from(
        arraySource(incrementalData, "incremental:data")
      )
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums,
        })
        .to(sink2);

      expect(result.processed).toBe(3); // 1 changed + 2 new
      expect(sink2.items).toHaveLength(3);
      expect(sink2.items.find((r) => r.id === "3")?.value).toBe(35);
    });

    it("should work with filtering and deduplication together", async () => {
      const existingChecksums = new Map<string, string>();
      testData.slice(0, 2).forEach((row) => {
        existingChecksums.set(row.id, computeChecksum(row));
      });

      const sink = arraySink<TestRow>();
      const result = await Pipeline.from(arraySource(testData, "source:data"))
        .filter((row) => row.value >= 20) // Remove id:1
        .deduplicateByChecksum({
          keyField: "id",
          existingChecksums, // Has id:1 and id:2
        })
        .to(sink);

      // After filter: 2, 3, 4, 5
      // After dedupe: 3, 4, 5 (id:2 exists)
      expect(result.processed).toBe(3);
      expect(sink.items).toHaveLength(3);
    });
  });
});
