import { describe, it, expect } from "vitest";
import { runCommand } from "./test-helper.js";
import { writeFileSync } from 'fs';
import { join } from 'path';
import { add, config } from "wn-ts";

describe("lexicons command tests", () => {
  it("lexicons command runs successfully and lists all lexicons", async () => {
    const { stdout, stderr } = await runCommand(["lexicons"]);
    expect(stdout).toContain("Available Lexicons");
    // Should contain projects
    expect(stdout).toContain("oewn");
    expect(stdout).toContain("omw");
    // Should contain sub-lexicons
    expect(stdout).toContain("omw-fr");
    expect(stderr).toBe("");
  });

  it("lexicons command with --installed only shows installed", async () => {
    const testFile = join(config.dataDirectory, 'oewn.xml');
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="oewn" label="Test OEWN" language="en" version="2024">
    <LexicalEntry id="w1"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry>
    <Synset id="ss1" partOfSpeech="n"><Definition>a test</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    const { stdout } = await runCommand(["lexicons", "--installed"]);

    expect(stdout).toContain("oewn");
    expect(stdout).not.toContain("omw-fr");
    expect(stdout).toMatch(/oewn\s+.*✅ installed/);
    expect(stdout).not.toMatch(/omw-fr\s+.*✅ installed/);
  });

  it("lexicons command with --available only shows available", async () => {
    const testFile = join(config.dataDirectory, 'oewn.xml');
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="oewn" label="Test OEWN" language="en" version="2024">
    <LexicalEntry id="w1"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry>
    <Synset id="ss1" partOfSpeech="n"><Definition>a test</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    const { stdout } = await runCommand(["lexicons", "--available"]);

    // Should not contain the installed one
    expect(stdout).not.toContain("oewn");
    // Should contain one that is not installed
    expect(stdout).toContain("omw-fr");
  });

  it("lexicons command with --language filter works", async () => {
    // Add a dummy french lexicon to ensure the filter has something to find
    const testFile = join(config.dataDirectory, 'omw-fr.xml');
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="omw-fr" label="Test French Lexicon" language="fr" version="1.4">
    <LexicalEntry id="omw-fr-w1"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="omw-fr-s1" synset="omw-fr-ss1"/></LexicalEntry>
    <Synset id="omw-fr-ss1" partOfSpeech="n"><Definition>un test</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    const { stdout } = await runCommand(["lexicons", "--language", "fr"]);
    expect(stdout).toContain("omw-fr");
    expect(stdout).not.toContain("oewn");
    expect(stdout).not.toContain("pwn");
  });
});
