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

        // Create dummy data files
        writeFileSync(join(lexiconSourceDir, "index.noun"), "cat 123\ndog 456");
        writeFileSync(
          join(lexiconSourceDir, "data.noun"),
          "123 a feline\n456 a canine"
        );
        // Add empty files for other parts of speech to avoid warnings
        writeFileSync(join(lexiconSourceDir, "index.verb"), "");
        writeFileSync(join(lexiconSourceDir, "data.verb"), "");
        writeFileSync(join(lexiconSourceDir, "index.adj"), "");
        writeFileSync(join(lexiconSourceDir, "data.adj"), "");
        writeFileSync(join(lexiconSourceDir, "index.adv"), "");
        writeFileSync(join(lexiconSourceDir, "data.adv"), "");
        
        // Add a minimal lexicon to the DB to make it "installed"
        const testLexicon = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd"><LexicalResource><Lexicon id="${lexiconId}" label="Test OEWN" language="en" version="2024"><LexicalEntry id="w1"><Lemma writtenForm="cat" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry><Synset id="ss1" partOfSpeech="n"><Definition>a cat</Definition></Synset></Lexicon></LexicalResource>`;
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
        ]);
        
        // STEP 3: Verify the results
        expect(result.stderr, "Browser prep command should not produce errors").toBe("");
        expect(result.stdout).toContain("Wrote");
        expect(result.stdout).toContain(`Browser data prep complete for lexicon '${lexiconId}'`);

        // Check that files were created
        const outLexiconDir = join(browserDataDir, lexiconId);
        const indexJsonPath = join(outLexiconDir, "index.noun.json");
        const dataJsonPath = join(outLexiconDir, "data.noun.json");
        expect(existsSync(indexJsonPath), "index.noun.json should be created").toBe(true);
        expect(existsSync(dataJsonPath), "data.noun.json should be created").toBe(true);

        // Check the content of one of the files
        const indexData = JSON.parse(readFileSync(indexJsonPath, "utf-8"));
        expect(indexData.cat).toBe("123");
      },
      30000
    );
  }
);
