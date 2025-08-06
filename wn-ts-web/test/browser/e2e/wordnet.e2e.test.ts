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
  }, 60000); // Increase timeout for setup

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

  it("should be able to search for a common word", async () => {
    const words = await wordnet.words("happy", "a");
    expect(words.length).toBeGreaterThanOrEqual(1);
    const happyWord = words.find((w) => w.lemma === "happy");
    expect(happyWord).toBeDefined();
  });

  it("should be able to get a synset from the real data", async () => {
    const synsets = await wordnet.synsets("joy", "n");
    expect(synsets.length).toBeGreaterThanOrEqual(1);
    const joySynset = synsets.find((s) =>
      s.definitions.some((d) => d.text.includes("feeling of great pleasure"))
    );
    expect(joySynset).toBeDefined();
  });

  it("should retrieve statistics about the real data", async () => {
    const stats = await wordnet.getStatistics();
    expect(stats.totalWords).toBeGreaterThan(100000);
    expect(stats.totalSynsets).toBeGreaterThan(80000);

    const quality = await wordnet.getDataQualityMetrics();
    expect(quality.iliCoveragePercentage).toBeGreaterThan(95);
  });
});
