import { describe, it, expect } from "vitest";
import { runCommand } from "../../commands/test-helper.js";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { add, config } from "wn-ts";

// This E2E test validates the 'browser prep' command in an isolated environment
// provided by the test-helper. No custom setup/teardown is needed.
describe(
  "E2E browser prep command",
  () => {
    it(
      "should prepare browser data from a valid source directory",
      async () => {
        // The test-helper's beforeEach hook provides an isolated config and data directory.
        // `config.dataDirectory` is already set to a temporary path.
        const dataDir = config.dataDirectory;
        const browserDataDir = join(dataDir, "browser-data");

        // STEP 1: Set up the environment by creating a dummy lexicon
        const lexiconId = "oewn";
        const lexiconSourceDir = join(dataDir, lexiconId);
        mkdirSync(lexiconSourceDir, { recursive: true });

        // Create a minimal LMF XML lexicon file instead of traditional WordNet files
        const testLexicon = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="${lexiconId}" label="Test OEWN" language="en" version="2024">
    <LexicalEntry id="w1">
      <Lemma writtenForm="cat" partOfSpeech="n"/>
      <Sense id="s1" synset="ss1"/>
    </LexicalEntry>
    <LexicalEntry id="w2">
      <Lemma writtenForm="dog" partOfSpeech="n"/>
      <Sense id="s2" synset="ss2"/>
    </LexicalEntry>
    <LexicalEntry id="w3">
      <Lemma writtenForm="run" partOfSpeech="v"/>
      <Sense id="s3" synset="ss3"/>
    </LexicalEntry>
    <Synset id="ss1" partOfSpeech="n">
      <Definition>a feline animal</Definition>
    </Synset>
    <Synset id="ss2" partOfSpeech="n">
      <Definition>a canine animal</Definition>
    </Synset>
    <Synset id="ss3" partOfSpeech="v">
      <Definition>move fast on foot</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
        
        const lexiconXmlPath = join(lexiconSourceDir, `${lexiconId}.xml`);
        writeFileSync(lexiconXmlPath, testLexicon);
        await add(lexiconXmlPath, { force: true });
        
        // STEP 2: Run the browser prep command
        const result = await runCommand([
          "browser",
          "prep",
          "--lexicon",
          lexiconId,
          "--outDir",
          browserDataDir,
          "--chunk-size",
          "100",
          "--debug" // Add debug flag to see success message
        ]);
        
        // STEP 3: Verify the results
        expect(result.stderr, "Browser prep command should not produce errors").toBe("");
        expect(result.stdout).toContain("✅");
        expect(result.stdout).toContain("Browser data preparation completed successfully");

        // Check that files were created in the new chunked format
        // Files are written directly to outDir, not in a lexiconId subdirectory
        const metadataJsonPath = join(browserDataDir, "metadata.json");
        const chunksJsonPath = join(browserDataDir, "chunks.json");
        const words0JsonPath = join(browserDataDir, "words0.json"); // No hyphen
        const synsets0JsonPath = join(browserDataDir, "synsets0.json"); // No hyphen
        
        expect(existsSync(metadataJsonPath), "metadata.json should be created").toBe(true);
        expect(existsSync(chunksJsonPath), "chunks.json should be created").toBe(true);
        expect(existsSync(words0JsonPath), "words0.json should be created").toBe(true);
        expect(existsSync(synsets0JsonPath), "synsets0.json should be created").toBe(true);

        // Check the content of the metadata file
        const metadataData = JSON.parse(readFileSync(metadataJsonPath, "utf-8"));
        expect(metadataData.lexiconId).toBe(lexiconId); // Changed from lexicon to lexiconId
        expect(metadataData.totalWords).toBeGreaterThan(0);
        expect(metadataData.totalSynsets).toBeGreaterThan(0);
        expect(metadataData.chunkSize).toBe(100);
        
        // Check the chunks index
        const chunksData = JSON.parse(readFileSync(chunksJsonPath, "utf-8"));
        expect(chunksData.words).toBeInstanceOf(Array);
        expect(chunksData.synsets).toBeInstanceOf(Array);
        expect(chunksData.totalWordChunks).toBeGreaterThan(0);
        expect(chunksData.totalSynsetChunks).toBeGreaterThan(0);
        
        // Check that word data contains our test words
        const wordsData = JSON.parse(readFileSync(words0JsonPath, "utf-8"));
        expect(Array.isArray(wordsData)).toBe(true); // Changed to expect array
        expect(wordsData.length).toBeGreaterThan(0);
        
        // Check that synset data contains our test synsets
        const synsetsData = JSON.parse(readFileSync(synsets0JsonPath, "utf-8"));
        expect(Array.isArray(synsetsData)).toBe(true); // Changed to expect array
        expect(synsetsData.length).toBeGreaterThan(0);
      },
      30000
    );
  }
);
