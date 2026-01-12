/**
 * Checksum utilities tests
 */

import { describe, it, expect } from "vitest";
import {
  computeChecksum,
  checksumBatch,
  compareChecksums,
  filterChangedRows,
} from "../src/pipeline/checksum.js";

describe("Checksum Utilities", () => {
  describe("computeChecksum()", () => {
    it("should compute deterministic checksum for same data", () => {
      const data = { id: 1, name: "test", value: 42 };

      const checksum1 = computeChecksum(data);
      const checksum2 = computeChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(32); // MD5 hash length
    });

    it("should produce different checksums for different data", () => {
      const data1 = { id: 1, name: "test", value: 42 };
      const data2 = { id: 1, name: "test", value: 43 };

      const checksum1 = computeChecksum(data1);
      const checksum2 = computeChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it("should be deterministic regardless of property order", () => {
      const data1 = { id: 1, name: "test", value: 42 };
      const data2 = { value: 42, id: 1, name: "test" };

      const checksum1 = computeChecksum(data1);
      const checksum2 = computeChecksum(data2);

      expect(checksum1).toBe(checksum2);
    });

    it("should hash only selected fields when specified", () => {
      const data1 = {
        id: 1,
        name: "test",
        value: 42,
        timestamp: "2024-01-01",
      };
      const data2 = {
        id: 1,
        name: "test",
        value: 42,
        timestamp: "2024-01-02",
      };

      // Hash only business fields, ignore timestamp
      const checksum1 = computeChecksum(data1, ["id", "name", "value"]);
      const checksum2 = computeChecksum(data2, ["id", "name", "value"]);

      expect(checksum1).toBe(checksum2);
    });

    it("should produce different checksums when selected fields differ", () => {
      const data1 = {
        id: 1,
        name: "test",
        value: 42,
        timestamp: "2024-01-01",
      };
      const data2 = {
        id: 1,
        name: "changed",
        value: 42,
        timestamp: "2024-01-01",
      };

      const checksum1 = computeChecksum(data1, ["id", "name", "value"]);
      const checksum2 = computeChecksum(data2, ["id", "name", "value"]);

      expect(checksum1).not.toBe(checksum2);
    });

    it("should handle missing fields gracefully", () => {
      const data = { id: 1, name: "test" };

      const checksum = computeChecksum(data, [
        "id",
        "name",
        "nonexistent_field",
      ]);

      expect(checksum).toBeDefined();
      expect(checksum).toHaveLength(32);
    });

    it("should handle nested objects", () => {
      const data = {
        id: 1,
        metadata: { foo: "bar", nested: { value: 42 } },
      };

      const checksum = computeChecksum(data);

      expect(checksum).toBeDefined();
      expect(checksum).toHaveLength(32);
    });

    it("should handle arrays", () => {
      const data = { id: 1, tags: ["a", "b", "c"] };

      const checksum = computeChecksum(data);

      expect(checksum).toBeDefined();
      expect(checksum).toHaveLength(32);
    });

    it("should handle null and undefined values", () => {
      const data = { id: 1, value: null, other: undefined };

      const checksum = computeChecksum(data);

      expect(checksum).toBeDefined();
      expect(checksum).toHaveLength(32);
    });
  });

  describe("checksumBatch()", () => {
    it("should compute checksums for multiple rows", () => {
      const rows = [
        { id: 1, name: "apple" },
        { id: 2, name: "banana" },
        { id: 3, name: "cherry" },
      ];

      const checksums = checksumBatch(rows);

      expect(checksums).toHaveLength(3);
      expect(checksums[0]).toHaveLength(32);
      expect(checksums[1]).toHaveLength(32);
      expect(checksums[2]).toHaveLength(32);
      // Each should be unique
      expect(new Set(checksums).size).toBe(3);
    });

    it("should respect field selection in batch", () => {
      const rows = [
        { id: 1, name: "apple", timestamp: "2024-01-01" },
        { id: 2, name: "banana", timestamp: "2024-01-02" },
      ];

      const checksums = checksumBatch(rows, ["id", "name"]);

      expect(checksums).toHaveLength(2);
      expect(checksums[0]).not.toBe(checksums[1]);
    });
  });

  describe("compareChecksums()", () => {
    it("should identify new rows", () => {
      const rows = [
        { id: "1", name: "apple" },
        { id: "2", name: "banana" },
      ];
      const existingChecksums = new Map<string, string>();

      const comparisons = compareChecksums(rows, "id", existingChecksums);

      expect(comparisons).toHaveLength(2);
      expect(comparisons[0].isNew).toBe(true);
      expect(comparisons[1].isNew).toBe(true);
      expect(comparisons[0].hasChanged).toBeUndefined();
      expect(comparisons[1].hasChanged).toBeUndefined();
    });

    it("should identify unchanged rows", () => {
      const rows = [
        { id: "1", name: "apple" },
        { id: "2", name: "banana" },
      ];

      // Pre-compute checksums
      const existingChecksums = new Map<string, string>();
      existingChecksums.set("1", computeChecksum(rows[0]));
      existingChecksums.set("2", computeChecksum(rows[1]));

      const comparisons = compareChecksums(rows, "id", existingChecksums);

      expect(comparisons).toHaveLength(2);
      expect(comparisons[0].isNew).toBe(false);
      expect(comparisons[0].hasChanged).toBe(false);
      expect(comparisons[1].isNew).toBe(false);
      expect(comparisons[1].hasChanged).toBe(false);
    });

    it("should identify changed rows", () => {
      const rows = [
        { id: "1", name: "apple" },
        { id: "2", name: "banana_modified" },
      ];

      const existingChecksums = new Map<string, string>();
      existingChecksums.set(
        "1",
        computeChecksum({ id: "1", name: "apple" })
      );
      existingChecksums.set(
        "2",
        computeChecksum({ id: "2", name: "banana" })
      );

      const comparisons = compareChecksums(rows, "id", existingChecksums);

      expect(comparisons[0].isNew).toBe(false);
      expect(comparisons[0].hasChanged).toBe(false);
      expect(comparisons[1].isNew).toBe(false);
      expect(comparisons[1].hasChanged).toBe(true);
    });

    it("should handle mixed new and changed rows", () => {
      const rows = [
        { id: "1", name: "apple" }, // unchanged
        { id: "2", name: "banana_modified" }, // changed
        { id: "3", name: "cherry" }, // new
      ];

      const existingChecksums = new Map<string, string>();
      existingChecksums.set(
        "1",
        computeChecksum({ id: "1", name: "apple" })
      );
      existingChecksums.set(
        "2",
        computeChecksum({ id: "2", name: "banana" })
      );

      const comparisons = compareChecksums(rows, "id", existingChecksums);

      expect(comparisons[0].hasChanged).toBe(false);
      expect(comparisons[1].hasChanged).toBe(true);
      expect(comparisons[2].isNew).toBe(true);
    });
  });

  describe("filterChangedRows()", () => {
    it("should filter out unchanged rows", () => {
      const rows = [
        { id: "1", name: "apple" },
        { id: "2", name: "banana" },
        { id: "3", name: "cherry" },
      ];

      const existingChecksums = new Map<string, string>();
      existingChecksums.set("1", computeChecksum(rows[0]));
      existingChecksums.set("2", computeChecksum(rows[1]));
      existingChecksums.set("3", computeChecksum(rows[2]));

      const filtered = filterChangedRows(rows, "id", existingChecksums);

      expect(filtered).toHaveLength(0);
    });

    it("should include new rows", () => {
      const rows = [
        { id: "1", name: "apple" },
        { id: "2", name: "banana" },
      ];

      const existingChecksums = new Map<string, string>();

      const filtered = filterChangedRows(rows, "id", existingChecksums);

      expect(filtered).toHaveLength(2);
      expect(filtered).toEqual(rows);
    });

    it("should include changed rows", () => {
      const rows = [
        { id: "1", name: "apple_modified" },
        { id: "2", name: "banana" },
      ];

      const existingChecksums = new Map<string, string>();
      existingChecksums.set(
        "1",
        computeChecksum({ id: "1", name: "apple" })
      );
      existingChecksums.set("2", computeChecksum(rows[1]));

      const filtered = filterChangedRows(rows, "id", existingChecksums);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("should respect field selection when filtering", () => {
      const rows = [
        { id: "1", name: "apple", timestamp: "2024-01-01" },
        { id: "2", name: "banana", timestamp: "2024-01-02" },
      ];

      // Store checksums with only id and name
      const existingChecksums = new Map<string, string>();
      existingChecksums.set("1", computeChecksum(rows[0], ["id", "name"]));
      existingChecksums.set("2", computeChecksum(rows[1], ["id", "name"]));

      // Even though timestamp changed, should be filtered out
      const modifiedRows = [
        { id: "1", name: "apple", timestamp: "2024-02-01" },
        { id: "2", name: "banana", timestamp: "2024-02-02" },
      ];

      const filtered = filterChangedRows(
        modifiedRows,
        "id",
        existingChecksums,
        ["id", "name"]
      );

      expect(filtered).toHaveLength(0);
    });
  });
});

