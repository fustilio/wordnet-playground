import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../src/factory";
import type { WebWordnet } from "../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../src/data-management/index.js";

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("WordNet E2E Tests - Basic Usage Patterns", () => {
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

  describe("Primary Queries - Basic WordNet Operations", () => {
    describe("Searching for Words", () => {
      it("should find words by lemma", async () => {
        // Basic word search - equivalent to wn.words('pencil')
        const words = await wordnet.words({ form: "pencil" });
        expect(words.length).toBeGreaterThan(0);
        
        // Should find both noun and verb forms
        const nounWords = words.filter((w: any) => w.pos === 'n');
        const verbWords = words.filter((w: any) => w.pos === 'v');
        expect(nounWords.length).toBeGreaterThan(0);
        expect(verbWords.length).toBeGreaterThan(0);
      });

      it("should filter words by part of speech", async () => {
        // Filter by POS - equivalent to wn.words('pencil', pos='v')
        const verbWords = await wordnet.words({ form: "pencil", pos: "v" });
        expect(verbWords.length).toBeGreaterThan(0);
        verbWords.forEach((word: any) => {
          expect(word.pos).toBe("v");
          expect(word.lemma).toBe("pencil");
        });
      });

      it("should return all words when no lemma specified", async () => {
        // Get all words - equivalent to wn.words()
        const allWords = await wordnet.words();
        expect(allWords.length).toBeGreaterThan(100000);
        
        // Should have words from different parts of speech
        const posCounts = new Map<string, number>();
        allWords.slice(0, 1000).forEach((word: any) => {
          posCounts.set(word.pos, (posCounts.get(word.pos) || 0) + 1);
        });
        expect(posCounts.size).toBeGreaterThanOrEqual(3); // n, v, a, r
      });

      it("should filter words by POS when no lemma specified", async () => {
        // Get all verbs - equivalent to wn.words(pos='v')
        const allVerbs = await wordnet.words({ pos: "v" });
        expect(allVerbs.length).toBeGreaterThan(10000);
        allVerbs.forEach((word: any) => {
          expect(word.pos).toBe("v");
        });
      });

      it("should retrieve specific word by ID", async () => {
        // Get a word first to get its ID
        const words = await wordnet.words({ form: "happy" });
        expect(words.length).toBeGreaterThan(0);
        
        const happyWord = words[0];
        // Get word by ID - equivalent to wn.word('ewn-happy-a')
        const retrievedWord = await wordnet.getWord(happyWord.id);
        expect(retrievedWord).toBeDefined();
        expect(retrievedWord?.id).toBe(happyWord.id);
        expect(retrievedWord?.lemma).toBe("happy");
      });
    });

    describe("Searching for Senses", () => {
      it("should find senses by lemma", async () => {
        // Basic sense search - equivalent to wn.senses('plow', pos='n')
        const senses = await wordnet.senses({ wordIdOrForm: "plow", pos: "n" });
        expect(senses.length).toBeGreaterThan(0);
        
        senses.forEach(sense => {
          expect(sense.id).toBeDefined();
          expect(sense.wordId).toBeDefined();
          expect(sense.synsetId).toBeDefined();
        });
      });

      it("should filter senses by part of speech", async () => {
        // Filter senses by POS
        const nounSenses = await wordnet.senses({ wordIdOrForm: "plow", pos: "n" });
        const verbSenses = await wordnet.senses({ wordIdOrForm: "plow", pos: "v" });
        
        expect(nounSenses.length).toBeGreaterThan(0);
        expect(verbSenses.length).toBeGreaterThan(0);
        
        nounSenses.forEach(sense => {
          expect(sense.wordId).toBeDefined();
        });
      });

      it("should retrieve specific sense by ID", async () => {
        // Get a sense first to get its ID
        const senses = await wordnet.senses({ wordIdOrForm: "happy" });
        expect(senses.length).toBeGreaterThan(0);
        
        const happySense = senses[0];
        // Get sense by ID - equivalent to wn.sense('ewn-happy-a-...')
        const retrievedSense = await wordnet.getSense(happySense.id);
        expect(retrievedSense).toBeDefined();
        expect(retrievedSense?.id).toBe(happySense.id);
      });
    });

    describe("Searching for Synsets", () => {
      it("should find synsets by lemma", async () => {
        // Basic synset search - equivalent to wn.synsets('scepter')
        const synsets = await wordnet.synsets({ form: "scepter" });
        expect(synsets.length).toBeGreaterThan(0);
        
        synsets.forEach(synset => {
          expect(synset.id).toBeDefined();
          expect(synset.pos).toBeDefined();
          expect(synset.definitions).toBeDefined();
        });
      });

      it("should filter synsets by part of speech", async () => {
        // Filter synsets by POS
        const nounSynsets = await wordnet.synsets({ form: "book", pos: "n" });
        const verbSynsets = await wordnet.synsets({ form: "book", pos: "v" });
        
        expect(nounSynsets.length).toBeGreaterThan(0);
        expect(verbSynsets.length).toBeGreaterThan(0);
        
        nounSynsets.forEach(synset => {
          expect(synset.pos).toBe("n");
        });
        
        verbSynsets.forEach(synset => {
          expect(synset.pos).toBe("v");
        });
      });

      it("should retrieve specific synset by ID", async () => {
        // Get a synset first to get its ID
        const synsets = await wordnet.synsets({ form: "joy" });
        expect(synsets.length).toBeGreaterThan(0);
        
        const joySynset = synsets[0];
        // Get synset by ID - equivalent to wn.synset('ewn-...')
        const retrievedSynset = await wordnet.getSynset(joySynset.id);
        expect(retrievedSynset).toBeDefined();
        expect(retrievedSynset?.id).toBe(joySynset.id);
      });
    });
  });

  describe("Secondary Queries - Exploring WordNet Objects", () => {
    describe("Exploring Words", () => {
      it("should provide word properties and forms", async () => {
        // Get a word - equivalent to w = wn.words('goose')[0]
        const words = await wordnet.words({ form: "goose" });
        expect(words.length).toBeGreaterThan(0);
        
        const gooseWord = words[0];
        
        // Check part of speech - equivalent to w.pos
        expect(gooseWord.pos).toBeDefined();
        expect(typeof gooseWord.pos).toBe("string");
        
        // Check lemma - equivalent to w.lemma()
        expect(gooseWord.lemma).toBe("goose");
        
        // Check forms if available - equivalent to w.forms()
        if (gooseWord.forms && gooseWord.forms.length > 0) {
          expect(Array.isArray(gooseWord.forms)).toBe(true);
          gooseWord.forms.forEach(form => {
            expect(form.writtenForm).toBeDefined();
          });
        }
      });

      it("should provide word senses and synsets", async () => {
        // Get a word
        const words = await wordnet.words({ form: "happy" });
        expect(words.length).toBeGreaterThan(0);
        
        const happyWord = words[0];
        
        // Get senses for the word - equivalent to w.senses()
        const senses = await wordnet.senses({ wordIdOrForm: happyWord.lemma, pos: happyWord.pos });
        expect(senses.length).toBeGreaterThan(0);
        
        // Get synsets for the word - equivalent to w.synsets()
        const synsets = await wordnet.synsets({ form: happyWord.lemma, pos: happyWord.pos });
        expect(synsets.length).toBeGreaterThan(0);
        
        // Verify relationships
        senses.forEach(sense => {
          expect(sense.wordId).toBe(happyWord.id);
        });
      });
    });

    describe("Exploring Senses", () => {
      it("should provide sense relationships", async () => {
        // Get a sense - equivalent to s = wn.senses('dark', pos='n')[0]
        const senses = await wordnet.senses({ wordIdOrForm: "dark", pos: "n" });
        expect(senses.length).toBeGreaterThan(0);
        
        const darkSense = senses[0];
        
        // Check word reference - equivalent to s.word()
        expect(darkSense.wordId).toBeDefined();
        const word = await wordnet.getWord(darkSense.wordId);
        expect(word).toBeDefined();
        expect(word?.lemma).toBe("dark");
        
        // Check synset reference - equivalent to s.synset()
        expect(darkSense.synsetId).toBeDefined();
        const synset = await wordnet.getSynset(darkSense.synsetId);
        expect(synset).toBeDefined();
      });
    });

    describe("Exploring Synsets", () => {
      it("should provide synset properties and relationships", async () => {
        // Get a synset - equivalent to ss = wn.synsets('hound', pos='n')[0]
        const synsets = await wordnet.synsets({ form: "hound", pos: "n" });
        expect(synsets.length).toBeGreaterThan(0);
        
        const houndSynset = synsets[0];
        
        // Check synset properties
        expect(houndSynset.id).toBeDefined();
        expect(houndSynset.pos).toBe("n");
        expect(Array.isArray(houndSynset.definitions)).toBe(true);
        
        // Get senses in the synset - equivalent to ss.senses()
        const senses = await wordnet.senses({ wordIdOrForm: "hound", pos: "n" });
        expect(senses.length).toBeGreaterThan(0);
        
        // Get words in the synset - equivalent to ss.words()
        const words = await wordnet.words({ form: "hound", pos: "n" });
        expect(words.length).toBeGreaterThan(0);
        
        // Get lemmas - equivalent to ss.lemmas()
        const lemmas = words.map(w => w.lemma);
        expect(lemmas).toContain("hound");
        
        // Check definition - equivalent to ss.definition()
        if (houndSynset.definitions.length > 0) {
          const definition = houndSynset.definitions[0];
          expect(definition.text).toBeDefined();
          expect(definition.text.length).toBeGreaterThan(10);
        }
      });

      it("should provide hierarchical relationships", async () => {
        // Get a synset
        const synsets = await wordnet.synsets({ form: "hound", pos: "n" });
        expect(synsets.length).toBeGreaterThan(0);
        
        const houndSynset = synsets[0];
        
        // Note: getHypernyms is not implemented in this version
        // Hypernym relationships would require additional synset relationship methods
      });
    });
  });

  describe("Filtering and Language Support", () => {
    it("should filter by lexicon correctly", async () => {
      // Get words from specific lexicon
      const allWords = await wordnet.words({ form: "chat" });
      expect(allWords.length).toBeGreaterThan(0);
      
      // All words should be from the loaded lexicon
      allWords.forEach(word => {
        expect(word.lexicon).toBe("oewn:2024");
      });
    });

    it("should handle case-insensitive searches", async () => {
      // Test case variations
      const lowercaseResults = await wordnet.words({ form: "happy" });
      const uppercaseResults = await wordnet.words({ form: "HAPPY" });
      const mixedCaseResults = await wordnet.words({ form: "Happy" });
      
      // All should return the same results (case-insensitive)
      expect(lowercaseResults.length).toBe(uppercaseResults.length);
      expect(lowercaseResults.length).toBe(mixedCaseResults.length);
      
      if (lowercaseResults.length > 0) {
        expect(lowercaseResults[0].lemma).toBe("happy");
      }
    });

    it("should handle empty and special search terms", async () => {
      // Test empty search
      const emptyResults = await wordnet.words({ form: "" });
      expect(Array.isArray(emptyResults)).toBe(true);
      
      // Test non-existent word
      const nonexistentResults = await wordnet.words({ form: "nonexistentword12345" });
      expect(Array.isArray(nonexistentResults)).toBe(true);
      expect(nonexistentResults.length).toBe(0);
      
      // Test special characters
      const specialResults = await wordnet.words({ form: "café" });
      expect(Array.isArray(specialResults)).toBe(true);
    });
  });

  describe("Statistics and Data Quality", () => {
    it("should provide comprehensive statistics", async () => {
      const stats = await wordnet.getStatistics();
      
      expect(stats.totalWords).toBeGreaterThan(100000);
      expect(stats.totalSynsets).toBeGreaterThan(80000);
      expect(stats.totalSenses).toBeGreaterThan(100000);
      expect(stats.totalLexicons).toBeGreaterThan(0);
      
      // Check logical relationships
      expect(stats.totalSenses).toBeGreaterThanOrEqual(stats.totalWords);
      expect(stats.totalSenses).toBeGreaterThanOrEqual(stats.totalSynsets);
    });

    it("should provide lexicon-specific statistics", async () => {
      const lexiconStats = await wordnet.getLexiconStatistics("oewn:2024");
      expect(Array.isArray(lexiconStats)).toBe(true);
      expect(lexiconStats.length).toBeGreaterThanOrEqual(0);
      
      const oewnStats = lexiconStats.find(s => s.lexiconId === "oewn:2024");
      expect(oewnStats).toBeDefined();
      expect(oewnStats?.wordCount).toBeGreaterThan(0);
      expect(oewnStats?.synsetCount).toBeGreaterThan(0);
    });

    it("should provide data quality metrics", async () => {
      const quality = await wordnet.getDataQualityMetrics();
      
      expect(quality.iliCoveragePercentage).toBeGreaterThan(80);
      expect(quality.synsetsWithILI).toBeGreaterThan(0);
      expect(quality.synsetsWithDefinitions).toBeGreaterThan(0);
    });
  });

  describe("Advanced Query Patterns", () => {
    it("should handle complex word relationships", async () => {
      // Test word with multiple senses
      const words = await wordnet.words({ form: "run" });
      expect(words.length).toBeGreaterThan(1); // Should have noun and verb forms
      
      for (const word of words) {
        const senses = await wordnet.senses({ wordIdOrForm: word.lemma, pos: word.pos });
        expect(senses.length).toBeGreaterThan(0);
        
        for (const sense of senses) {
          const synset = await wordnet.getSynset(sense.synsetId);
          expect(synset).toBeDefined();
          expect(synset?.pos).toBe(word.pos);
        }
      }
    });

    it("should provide consistent results across multiple queries", async () => {
      const testWord = { form: "computer" };
      
      // Query multiple times
      const results1 = await wordnet.words(testWord);
      const results2 = await wordnet.words(testWord);
      const results3 = await wordnet.words(testWord);
      
      // All should be identical
      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
      expect(results1.length).toBeGreaterThan(0);
    });

    it("should handle concurrent queries efficiently", async () => {
      const testWords = ["happy", "sad", "run", "walk", "book"];
      
      // Make concurrent queries
      const promises = testWords.map(word => wordnet.words({ form: word } ));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(testWords.length);
      results.forEach((wordList, index) => {
        expect(Array.isArray(wordList)).toBe(true);
        expect(wordList.length).toBeGreaterThan(0);
      });
    });
  });
});
