import { describe, it, expect, beforeEach } from "vitest";
import { runCommand } from "./test-helper.js";
import { add, config, db } from "wn-ts";
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import path from "path";

describe("browser command tests", () => {
  const lexiconId = "test-browser";
  let lexiconDir: string;

  beforeEach(async () => {
    // Define test-specific paths inside `beforeEach` to use the temp directory
    lexiconDir = join(config.dataDirectory, lexiconId);

    // Setup: create a dummy lexicon directory with LMF XML data
    mkdirSync(lexiconDir, { recursive: true });

    // Create a minimal LMF XML lexicon file
    const testLexicon = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="${lexiconId}" label="Test Browser" language="en" version="1.0">
    <LexicalEntry id="w1">
      <Lemma writtenForm="apple" partOfSpeech="n"/>
      <Sense id="s1" synset="ss1"/>
    </LexicalEntry>
    <LexicalEntry id="w2">
      <Lemma writtenForm="banana" partOfSpeech="n"/>
      <Sense id="s2" synset="ss2"/>
    </LexicalEntry>
    <LexicalEntry id="w3">
      <Lemma writtenForm="run" partOfSpeech="v"/>
      <Sense id="s3" synset="ss3"/>
    </LexicalEntry>
    <Synset id="ss1" partOfSpeech="n">
      <Definition>a round fruit with red or green skin</Definition>
    </Synset>
    <Synset id="ss2" partOfSpeech="n">
      <Definition>a long curved fruit with yellow skin</Definition>
    </Synset>
    <Synset id="ss3" partOfSpeech="v">
      <Definition>move fast on foot</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
    
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

  it("browser prep runs successfully and writes chunked JSON files", async () => {
    const outDir = join(config.dataDirectory, "browser-data");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir, "--debug"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("✅");
    expect(stdout).toContain("Browser data preparation completed successfully");
    
    // Check output files - new chunked format
    const metadataJson = join(outDir, "metadata.json");
    const chunksJson = join(outDir, "chunks.json");
    const words0Json = join(outDir, "words0.json");
    const synsets0Json = join(outDir, "synsets0.json");

    expect(existsSync(metadataJson)).toBe(true);
    expect(existsSync(chunksJson)).toBe(true);
    expect(existsSync(words0Json)).toBe(true);
    expect(existsSync(synsets0Json)).toBe(true);
    
    // Check metadata content
    const metadata = JSON.parse(readFileSync(metadataJson, "utf8"));
    expect(metadata.lexiconId).toBe(lexiconId);
    expect(metadata.totalWords).toBeGreaterThan(0);
    expect(metadata.totalSynsets).toBeGreaterThan(0);
    expect(metadata.chunkSize).toBe(1000);
  });

  it("browser prep --dry-run does not write files", async () => {
    const outDir = join(config.dataDirectory, "browser-dry");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir, "--dry-run", "--debug"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Browser data preparation completed successfully");
    // Should not create files
    expect(existsSync(join(outDir, "metadata.json"))).toBe(false);
  });

  it("browser prep errors if lexicon is missing", async () => {
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", "not-installed", "--debug"
    ]);
    expect(stderr).toContain("❌ Browser data preparation failed:");
    expect(stderr).toContain("Lexicon 'not-installed' is not installed");
    expect(stdout).toContain("🚀 Starting browser data preparation");
    expect(stdout).toContain("📁 Output directory:");
    expect(stdout).toContain("📦 Chunk size:");
  });

  it("browser prep works with debug flag", async () => {
    // Use the test lexicon that's already set up in the test environment
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--debug"
    ]);

    expect(stderr).toBe("");
    expect(stdout).toContain("🚀 Starting browser data preparation");
    expect(stdout).toContain("📁 Output directory:");
    expect(stdout).toContain("📦 Chunk size:");
    expect(stdout).toContain("✅ Browser data preparation completed successfully");
  });

  it("browser prep works with custom outDir", async () => {
    const outDir = join(config.dataDirectory, "browser-data");
    const customOutDir = join(outDir, "custom");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", customOutDir, "--debug"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("✅");
    expect(stdout).toContain("Browser data preparation completed successfully");
    expect(existsSync(join(customOutDir, "metadata.json"))).toBe(true);
  });

  it("browser prep works with custom chunk size", async () => {
    const outDir = join(config.dataDirectory, "browser-data");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir, "--chunk-size", "1", "--debug"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("✅");
    expect(stdout).toContain("Browser data preparation completed successfully");
    
    // With chunk size 1, we should have multiple chunk files
    const chunksJson = join(outDir, "chunks.json");
    const chunks = JSON.parse(readFileSync(chunksJson, "utf8"));
    expect(chunks.totalWordChunks).toBeGreaterThan(1);
    expect(chunks.totalSynsetChunks).toBeGreaterThan(1);
  });

  it("browser prep shows progress tracking", async () => {
    const outDir = join(config.dataDirectory, "browser-data");
    const { stdout, stderr } = await runCommand([
      "browser", "prep", "--lexicon", lexiconId, "--outDir", outDir, "--debug"
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("🚀 Starting browser data preparation");
    expect(stdout).toContain("📁 Output directory:");
    expect(stdout).toContain("📦 Chunk size:");
  });
}); 
