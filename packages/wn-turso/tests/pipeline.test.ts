/**
 * Pipeline tests
 */

import { describe, it, expect } from "vitest";
import {
  Pipeline,
  arraySource,
  arraySink,
  filter,
  map,
  take,
  compose,
} from "../src/pipeline/index.js";

// Test data
const testData = [
  { id: 1, name: "apple", category: "fruit", price: 1.5 },
  { id: 2, name: "banana", category: "fruit", price: 0.5 },
  { id: 3, name: "carrot", category: "vegetable", price: 0.8 },
  { id: 4, name: "date", category: "fruit", price: 2.0 },
  { id: 5, name: "eggplant", category: "vegetable", price: 1.2 },
];

describe("Pipeline", () => {
  describe("from() and toArray()", () => {
    it("should create pipeline from array source", async () => {
      const result = await Pipeline.from(arraySource(testData)).toArray();

      expect(result).toHaveLength(5);
      expect(result).toEqual(testData);
    });
  });

  describe("filter()", () => {
    it("should filter rows by predicate", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .filter((row) => row.category === "fruit")
        .toArray();

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.category === "fruit")).toBe(true);
    });

    it("should chain multiple filters", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .filter((row) => row.category === "fruit")
        .filter((row) => row.price > 1)
        .toArray();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(["apple", "date"]);
    });
  });

  describe("map()", () => {
    it("should transform rows", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .map((row) => ({ ...row, upperName: row.name.toUpperCase() }))
        .toArray();

      expect(result).toHaveLength(5);
      expect(result[0].upperName).toBe("APPLE");
    });

    it("should change row shape", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .map((row) => ({ key: row.id, value: row.name }))
        .toArray();

      expect(result[0]).toEqual({ key: 1, value: "apple" });
    });
  });

  describe("extend()", () => {
    it("should add properties to rows", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .extend((row) => ({
          computed: row.price * 2,
          timestamp: "now",
        }))
        .toArray();

      expect(result[0]).toHaveProperty("computed");
      expect(result[0]).toHaveProperty("timestamp");
      expect(result[0].computed).toBe(3.0);
      expect(result[0].name).toBe("apple"); // Original properties preserved
    });
  });

  describe("take() and skip()", () => {
    it("should take first n rows", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .take(2)
        .toArray();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual([1, 2]);
    });

    it("should skip first n rows", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .skip(3)
        .toArray();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual([4, 5]);
    });

    it("should combine skip and take for pagination", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .skip(1)
        .take(2)
        .toArray();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual([2, 3]);
    });
  });

  describe("distinct()", () => {
    it("should deduplicate by key", async () => {
      const dataWithDupes = [
        { id: 1, category: "a" },
        { id: 2, category: "a" },
        { id: 3, category: "b" },
      ];

      const result = await Pipeline.from(arraySource(dataWithDupes))
        .distinct((row) => row.category)
        .toArray();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.category)).toEqual(["a", "b"]);
    });
  });

  describe("tap()", () => {
    it("should execute side effect without modifying data", async () => {
      const tapped: number[] = [];

      const result = await Pipeline.from(arraySource(testData))
        .tap((row) => tapped.push(row.id))
        .toArray();

      expect(result).toEqual(testData);
      expect(tapped).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("count()", () => {
    it("should count total rows", async () => {
      const count = await Pipeline.from(arraySource(testData)).count();

      expect(count).toBe(5);
    });

    it("should count filtered rows", async () => {
      const count = await Pipeline.from(arraySource(testData))
        .filter((row) => row.category === "fruit")
        .count();

      expect(count).toBe(3);
    });
  });

  describe("to()", () => {
    it("should write to sink and return result", async () => {
      const sink = arraySink<(typeof testData)[0]>();

      const result = await Pipeline.from(arraySource(testData))
        .filter((row) => row.category === "vegetable")
        .to(sink);

      expect(result.processed).toBe(2);
      expect(result.inserted).toBe(2);
      expect(sink.items).toHaveLength(2);
    });
  });

  describe("batch()", () => {
    it("should batch rows into arrays", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .batch(2)
        .toArray();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });
  });

  describe("transform()", () => {
    it("should filter out nulls", async () => {
      const result = await Pipeline.from(arraySource(testData))
        .transform((row) => (row.price > 1 ? row : null))
        .toArray();

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.price > 1)).toBe(true);
    });
  });
});

describe("Standalone Operators", () => {
  describe("filter()", () => {
    it("should work as standalone function", async () => {
      const source = arraySource(testData);
      const filtered = filter<(typeof testData)[0]>((r) => r.price > 1)(
        source.read()
      );

      const result: typeof testData = [];
      for await (const row of filtered) {
        result.push(row);
      }

      expect(result).toHaveLength(3);
    });
  });

  describe("compose()", () => {
    it("should compose multiple operators", async () => {
      const composed = compose(
        filter<(typeof testData)[0]>((r) => r.category === "fruit"),
        map((r) => ({ ...r, doubled: r.price * 2 })),
        take(2)
      );

      const source = arraySource(testData);
      const result: any[] = [];
      for await (const row of composed(source.read())) {
        result.push(row);
      }

      expect(result).toHaveLength(2);
      expect(result[0].doubled).toBe(3.0);
    });
  });
});

describe("Array Source/Sink", () => {
  it("should provide count from source", async () => {
    const source = arraySource(testData);
    const count = await source.count?.();

    expect(count).toBe(5);
  });

  it("should collect items in sink", async () => {
    const sink = arraySink<{ id: number }>();

    await sink.write(
      (async function* () {
        yield { id: 1 };
        yield { id: 2 };
      })()
    );

    expect(sink.items).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
