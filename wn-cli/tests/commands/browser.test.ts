import { describe, it, expect, beforeEach } from "vitest";
import { runCommand } from "./test-helper.js";
import { add, config } from "wn-ts";
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

describe("browser command tests", () => {
  const lexiconId = "test-browser";
  let lexiconDir: string;
  const indexNoun = "apple 12345\nbanana 23456";
  const dataNoun = "12345 apple data\n23456 banana data";

  beforeEach(async () => {
    // Define test-specific paths inside `beforeEach` to use the temp directory
    lexiconDir = join(config.dataDirectory, lexiconId);

    // Setup: create a dummy lexicon directory with the data files.
    // The browser prep command expects to find these files here.
    mkdirSync(lexiconDir, { recursive: true });
    writeFileSync(join(lexiconDir, "index.noun"), indexNoun);
    writeFileSync(join(lexiconDir, "data.noun"), dataNoun);
    writeFileSync(join(lexiconDir, "index.verb"), "");
    writeFileSync(join(lexiconDir, "data.verb"), "");
    writeFileSync(join(lexiconDir, "index.adj"), "");
    writeFileSync(join(lexiconDir, "data.adj"), "");
    writeFileSync(join(lexiconDir, "index.adv"), "");
    writeFileSync(join(lexiconDir, "data.adv"), "");

    // Create the lexicon XML file inside the lexicon's data directory,
    // which mirrors a real downloaded project structure.
    const testLexicon = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE LexicalResource SYSTEM \"http://globalwordnet.github.io/schemas/pwn_lmf.dtd\">\n<LexicalResource>\n  <Lexicon id=\"${lexiconId}\" label=\"Test Browser\" language=\"en\" version=\"1.0\">\n    <LexicalEntry id=\"w1\"><Lemma writtenForm=\"apple\" partOfSpeech=\"n\"/><Sense id=\"s1\" synset=\"ss1\"/></LexicalEntry>\n    <Synset id=\"ss1\" partOfSpeech=\"n\"><Definition>an apple</Definition></Synset>\n  </Lexicon>\n</LexicalResource>`;
    const lexiconXmlPath = join(lexiconDir, `${lexiconId}.xml`);
    writeFileSync(lexiconXmlPath, testLexicon);

    // Add the lexicon to the DB using the CLI command so it's in the same process context
    const { stderr } = await runCommand([
      "data", "add", lexiconXmlPath, "--force"
    ]);
    if (stderr) {
      console.warn("Warning: Failed to add lexicon via CLI:", stderr);
    }
  });

  it("browser prep runs successfully and writes JSON files", async () => {
    const outDir = join(config.dataDirectory, "browser-data");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Wrote");
    expect(stdout).toContain("Browser data prep complete");
    // Check output files
    const indexJson = join(outDir, lexiconId, "index.noun.json");
    const dataJson = join(outDir, lexiconId, "data.noun.json");
    expect(existsSync(indexJson)).toBe(true);
    expect(existsSync(dataJson)).toBe(true);
    const indexObj = JSON.parse(readFileSync(indexJson, "utf8"));
    expect(indexObj.apple).toBe("12345");
    const dataObj = JSON.parse(readFileSync(dataJson, "utf8"));
    expect(dataObj["12345"]).toContain("apple data");
  });

  it("browser prep --dry-run does not write files", async () => {
    const outDir = join(config.dataDirectory, "browser-dry");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir, "--dry-run"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Would write");
    expect(stdout).toContain("Browser data prep complete");
    // Should not create files
    expect(existsSync(join(outDir, lexiconId, "index.noun.json"))).toBe(false);
  });

  it("browser prep errors if lexicon is missing", async () => {
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", "not-installed"
    ]);
    expect(stderr).toContain("❌ Lexicon 'not-installed' is not installed.");
    expect(stdout).toBe("");
  });

  it("browser prep errors if no index/data files found", async () => {
    // Remove all the files created by `beforeEach` to test this case.
    const files = ['index.noun', 'data.noun', 'index.verb', 'data.verb', 'index.adj', 'data.adj', 'index.adv', 'data.adv'];
    for (const file of files) {
      if (existsSync(join(lexiconDir, file))) {
        unlinkSync(join(lexiconDir, file));
      }
    }

    const { stdout, stderr } = await runCommand([
      "browser",
      "prep",
      "--lexicon",
      lexiconId,
    ]);
    expect(stderr).toContain("❌ No index/data files found for lexicon");
    expect(stdout).toBe("");
  });

  it("browser prep works with custom outDir", async () => {
    const outDir = join(config.dataDirectory, "custom-browser");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Wrote");
    expect(stdout).toContain("Browser data prep complete");
    expect(existsSync(join(outDir, lexiconId, "index.noun.json"))).toBe(true);
  });
}); 
