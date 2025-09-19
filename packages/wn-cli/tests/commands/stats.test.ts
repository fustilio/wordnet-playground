import { describe, it, expect, beforeEach } from "vitest";
import { runCommand } from "./test-helper.js";
import { writeFileSync } from 'fs';
import { join } from 'path';
import { add, config } from "wn-ts";

// Minimal LMF XML for testing stats
const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-lexicon" label="Test Lexicon" language="en" email="test@example.com" license="test" version="1.0" url="http://example.com">
    <LexicalEntry id="test-w1">
      <Lemma writtenForm="cat" partOfSpeech="n"/>
      <Sense id="test-s1" synset="test-ss1"/>
    </LexicalEntry>
    <LexicalEntry id="test-w2">
      <Lemma writtenForm="feline" partOfSpeech="n"/>
      <Sense id="test-s2" synset="test-ss1"/>
    </LexicalEntry>
    <Synset id="test-ss1" partOfSpeech="n">
      <Definition>a small domesticated carnivorous mammal with soft fur</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>
`;

describe("stats command tests", () => {
  beforeEach(async () => {
    // The test-helper now creates a unique directory for each test.
    // We just need to create our test file inside it.
    const testFile = join(config.dataDirectory, 'test-lexicon.xml');
    writeFileSync(testFile, testLexicon);
    // Add data before each test
    await add(testFile, { force: true });
  });

  it("stats command runs successfully and shows correct counts", async () => {
    // Test data is now added in beforeEach
    const { stdout, stderr } = await runCommand(["stats"]);

    expect(stdout).toContain("Database Statistics for *");
    // Use regex to be resilient to whitespace differences from color codes
    expect(stdout).toMatch(/📝\s*Total words:\s*2/);
    expect(stdout).toMatch(/📚\s*Total synsets:\s*1/);
    expect(stdout).toMatch(/🎯\s*Total senses:\s*2/);
    expect(stdout).toMatch(/📖\s*Total lexicons:\s*1/);
    expect(stderr).toBe("");
  });

  it("stats command with --quality flag runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["stats", "--quality"]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Database Statistics for *");
    expect(stdout).toContain("Data Quality Metrics");
    expect(stdout).toContain("Synsets with ILI:");
    expect(stdout).toContain("Synsets with definitions:");
  });
});
