import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../../src/factory";
import type { WebWordnet } from "../../../src/web-wordnet";
import type { DataLoader } from "../../../src/data-loader";

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("WordNet E2E Tests", () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance("oewn:2024");
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;

    // Use the actual DataLoader to download and load the full OEWN database
    await dataLoader.downloadAndLoad("oewn:2024");
  }, 300000); // Increase timeout for setup to 5 minutes

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  it("should have loaded the data correctly", async () => {
    const stats = await wordnet.getStatistics();
    // Check for a reasonable amount of data, not exact numbers
    expect(stats.totalWords).toBeGreaterThan(100000);
    expect(stats.totalSynsets).toBeGreaterThan(80000);
  });

  describe("Querying with real data", () => {
    it("should search for a common word and verify its properties", async () => {
      const words = await wordnet.words("happy", "a");
      expect(words.length).toBeGreaterThanOrEqual(1);

      const happyWord = words.find((w) => w.lemma === "happy");
      expect(happyWord).toBeDefined();
      expect(happyWord?.lemma).toBe("happy");
      expect(happyWord?.pos).toBe("a");
      expect(happyWord?.lexicon).toBe("oewn");
    });

    it("should get a synset and verify its properties", async () => {
      const synsets = await wordnet.synsets("joy", "n");
      expect(synsets.length).toBeGreaterThanOrEqual(1);

      const joySynset = synsets.find((s) =>
        s.definitions.some((d) => d.text.includes("happiness"))
      );
      expect(joySynset).toBeDefined();
      expect(joySynset?.pos).toBe("n");
      expect(joySynset?.definitions.length).toBeGreaterThanOrEqual(1);
      
      const joyDefinition = joySynset?.definitions.find((d) => d.text.includes("happiness"));
      expect(joyDefinition).toBeDefined();
      expect(joyDefinition?.text.length).toBeGreaterThan(20);
    });

    it("should get senses for a word", async () => {
      const senses = await wordnet.senses("run", "v");
      expect(senses.length).toBeGreaterThanOrEqual(1);

      const firstSense = senses[0];
      expect(firstSense).toHaveProperty("id");
      expect(firstSense).toHaveProperty("word");
      expect(firstSense).toHaveProperty("synset");
    });
  });

  it("should retrieve statistics about the real data", async () => {
    const stats = await wordnet.getStatistics();
    expect(stats.totalWords).toBeGreaterThan(100000);
    expect(stats.totalSynsets).toBeGreaterThan(80000);

    const quality = await wordnet.getDataQualityMetrics();
    expect(quality.iliCoveragePercentage).toBeGreaterThan(95);
  });
});
