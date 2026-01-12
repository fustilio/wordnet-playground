/**
 * E2E Pipeline Tests
 *
 * Tests complete pipeline workflows end-to-end
 */

import { describe, it, expect } from "vitest";
import { Pipeline, arraySource, arraySink } from "../../src/pipeline/index.js";

// Simulated WordNet-like data for e2e testing
interface Synset {
  id: string;
  pos: string;
  language: string;
  definition: string;
  ili?: string;
}

interface Word {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  synset_id: string;
}

const synsetData: Synset[] = [
  {
    id: "oewn-00001740-n",
    pos: "n",
    language: "en",
    definition: "A machine for computing",
    ili: "i1",
  },
  {
    id: "oewn-00002740-n",
    pos: "n",
    language: "en",
    definition: "A device that processes data",
    ili: "i2",
  },
  {
    id: "oewn-00003740-v",
    pos: "v",
    language: "en",
    definition: "To calculate mathematically",
    ili: "i3",
  },
  {
    id: "omw-th-00001-n",
    pos: "n",
    language: "th",
    definition: "เครื่องคอมพิวเตอร์",
    ili: "i1",
  },
  {
    id: "omw-fr-00001-n",
    pos: "n",
    language: "fr",
    definition: "Une machine pour calculer",
    ili: "i1",
  },
  {
    id: "oewn-00004740-a",
    pos: "a",
    language: "en",
    definition: "Related to computation",
  },
  {
    id: "oewn-00005740-n",
    pos: "n",
    language: "en",
    definition: "Electronic device for information",
  },
];

const wordData: Word[] = [
  {
    id: "w1",
    lemma: "computer",
    pos: "n",
    language: "en",
    synset_id: "oewn-00001740-n",
  },
  {
    id: "w2",
    lemma: "calculator",
    pos: "n",
    language: "en",
    synset_id: "oewn-00001740-n",
  },
  {
    id: "w3",
    lemma: "compute",
    pos: "v",
    language: "en",
    synset_id: "oewn-00003740-v",
  },
  {
    id: "w4",
    lemma: "คอมพิวเตอร์",
    pos: "n",
    language: "th",
    synset_id: "omw-th-00001-n",
  },
  {
    id: "w5",
    lemma: "ordinateur",
    pos: "n",
    language: "fr",
    synset_id: "omw-fr-00001-n",
  },
];

describe("E2E: Pipeline Workflows", () => {
  describe("Source of Truth -> Working DB Pattern", () => {
    it("should transfer synsets with extended working columns", async () => {
      // Simulate: Source Turso DB -> Filter -> Extend -> Working Turso DB
      interface WorkingSynset extends Synset {
        cached_count: number;
        last_accessed: Date | null;
        popularity_score: number;
        source_db: string;
      }

      const sink = arraySink<WorkingSynset>();

      const result = await Pipeline.from(
        arraySource(synsetData, "source-turso:synsets")
      )
        .filter((row) => row.language === "en")
        .filter((row) => row.pos === "n")
        .extend((row) => ({
          cached_count: 0,
          last_accessed: null as Date | null,
          popularity_score: row.definition.length * 10,
          source_db: "turso-main",
        }))
        .to(sink);

      // Verify pipeline result
      expect(result.processed).toBe(3); // 3 English nouns
      expect(result.inserted).toBe(3);
      expect(result.errors).toBe(0);

      // Verify sink data
      expect(sink.items).toHaveLength(3);
      expect(sink.items.every((s) => s.language === "en")).toBe(true);
      expect(sink.items.every((s) => s.pos === "n")).toBe(true);
      expect(sink.items.every((s) => s.cached_count === 0)).toBe(true);
      expect(sink.items.every((s) => s.source_db === "turso-main")).toBe(true);
      expect(sink.items[0].popularity_score).toBeGreaterThan(0);
    });

    it("should handle multilingual filtering for translation DB", async () => {
      // Build a translation-focused working DB with only ILI-linked synsets
      const sink = arraySink<Synset & { has_translations: boolean }>();

      const result = await Pipeline.from(
        arraySource(synsetData, "source:synsets")
      )
        .filter((row) => row.ili !== undefined) // Only ILI-linked
        .extend((row) => ({
          has_translations: synsetData.some(
            (s) => s.ili === row.ili && s.id !== row.id
          ),
        }))
        .to(sink);

      expect(result.processed).toBe(5); // 5 synsets with ILI
      expect(sink.items.filter((s) => s.has_translations).length).toBe(3); // 3 share ILI 'i1'
    });
  });

  describe("Data Migration Workflows", () => {
    it("should migrate and transform schema", async () => {
      // Simulate migrating to a new schema version
      interface NewSchemaSynset {
        synset_id: string;
        part_of_speech: string;
        lang_code: string;
        gloss: string;
        version: number;
      }

      const sink = arraySink<NewSchemaSynset>();

      const result = await Pipeline.from(
        arraySource(synsetData, "old-schema:synsets")
      )
        .map((row) => ({
          synset_id: row.id,
          part_of_speech: row.pos,
          lang_code: row.language,
          gloss: row.definition,
          version: 2,
        }))
        .to(sink);

      expect(result.processed).toBe(7);
      expect(sink.items[0]).toHaveProperty("synset_id");
      expect(sink.items[0]).toHaveProperty("part_of_speech");
      expect(sink.items[0]).toHaveProperty("gloss");
      expect(sink.items[0].version).toBe(2);
    });

    it("should handle incremental updates with transform", async () => {
      // Only migrate synsets that meet certain criteria
      const existingIds = new Set(["oewn-00001740-n", "oewn-00002740-n"]);

      const sink = arraySink<Synset & { migrated_at: string }>();

      const result = await Pipeline.from(
        arraySource(synsetData, "source:synsets")
      )
        .transform((row) => {
          // Skip already migrated
          if (existingIds.has(row.id)) return null;
          return row;
        })
        .extend(() => ({
          migrated_at: new Date().toISOString(),
        }))
        .to(sink);

      expect(result.processed).toBe(5); // 7 - 2 skipped
      expect(sink.items.every((s) => !existingIds.has(s.id))).toBe(true);
    });
  });

  describe("Analytics Pipeline", () => {
    it("should compute aggregates via batching", async () => {
      // Process in batches and compute batch-level stats
      const batchStats: {
        batchNum: number;
        count: number;
        avgDefLen: number;
      }[] = [];
      let batchNum = 0;

      await Pipeline.from(arraySource(synsetData, "analytics:synsets"))
        .batch(3)
        .tap((batchRows) => {
          batchNum++;
          const avgDefLen =
            batchRows.reduce((sum, r) => sum + r.definition.length, 0) /
            batchRows.length;
          batchStats.push({
            batchNum,
            count: batchRows.length,
            avgDefLen: Math.round(avgDefLen),
          });
        })
        .toArray();

      expect(batchStats).toHaveLength(3); // 7 items in batches of 3 = 3 batches
      expect(batchStats[0].count).toBe(3);
      expect(batchStats[2].count).toBe(1); // Last batch has 1 item
    });

    it("should filter and count by criteria", async () => {
      const countByLanguage: Record<string, number> = {};

      await Pipeline.from(arraySource(synsetData, "analytics:synsets"))
        .tap((row) => {
          countByLanguage[row.language] =
            (countByLanguage[row.language] || 0) + 1;
        })
        .toArray();

      expect(countByLanguage["en"]).toBe(5);
      expect(countByLanguage["th"]).toBe(1);
      expect(countByLanguage["fr"]).toBe(1);
    });
  });

  describe("Join-like Operations", () => {
    it("should enrich synsets with word counts", async () => {
      // Build a lookup map from words
      const wordCountBySynset = new Map<string, number>();
      for (const word of wordData) {
        const count = wordCountBySynset.get(word.synset_id) || 0;
        wordCountBySynset.set(word.synset_id, count + 1);
      }

      const sink = arraySink<Synset & { word_count: number }>();

      const result = await Pipeline.from(arraySource(synsetData, "synsets"))
        .filter((row) => row.language === "en")
        .extend((row) => ({
          word_count: wordCountBySynset.get(row.id) || 0,
        }))
        .to(sink);

      expect(result.processed).toBe(5);

      const computerSynset = sink.items.find((s) => s.id === "oewn-00001740-n");
      expect(computerSynset?.word_count).toBe(2); // 'computer' and 'calculator'
    });
  });

  describe("Error Handling", () => {
    it("should handle empty source gracefully", async () => {
      const sink = arraySink<Synset>();

      const result = await Pipeline.from(arraySource([], "empty:synsets"))
        .filter(() => true)
        .to(sink);

      expect(result.processed).toBe(0);
      expect(result.inserted).toBe(0);
      expect(sink.items).toHaveLength(0);
    });

    it("should handle filter that removes all items", async () => {
      const sink = arraySink<Synset>();

      const result = await Pipeline.from(arraySource(synsetData, "synsets"))
        .filter((row) => row.language === "nonexistent")
        .to(sink);

      expect(result.processed).toBe(0);
      expect(sink.items).toHaveLength(0);
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle large datasets efficiently", async () => {
      // Generate larger dataset
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: `syn-${i}`,
        pos: i % 3 === 0 ? "n" : i % 3 === 1 ? "v" : "a",
        language: i % 5 === 0 ? "th" : "en",
        definition: `Definition for synset ${i}`,
      }));

      const startTime = Date.now();

      const result = await Pipeline.from(
        arraySource(largeData, "large:synsets")
      )
        .filter((row) => row.language === "en")
        .filter((row) => row.pos === "n")
        .extend((row) => ({ score: row.id.length }))
        .take(1000)
        .count();

      const duration = Date.now() - startTime;

      expect(result).toBe(1000);
      expect(duration).toBeLessThan(5000); // Should complete in <5s
    });
  });
});
