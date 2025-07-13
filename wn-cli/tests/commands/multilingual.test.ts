import { describe, it, expect } from "vitest";
import { runCommand } from "./test-helper.js";
import { add, config } from "wn-ts";
import { writeFileSync } from "fs";
import { join } from "path";

describe("multilingual command tests", () => {
  it("multilingual command without word shows error", async () => {
    const { stdout, stderr } = await runCommand(["multilingual"]);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it("multilingual command with a word runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["multilingual", "computer"]);
    // Should either not find lexicons, or not find the word in the test lexicon.
    expect(stdout).toMatch(/(Cannot find multilingual data for "computer"|No synsets found for "computer")/);
    expect(stderr).toBe('');
  });

  it("multilingual command with pos as argument runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["multilingual", "computer", "n"]);
    // Should either not find lexicons, or not find the word in the test lexicon.
    expect(stdout).toMatch(/(Cannot find multilingual data for "computer"|No synsets found for "computer")/);
    expect(stderr).toBe('');
  });

  it('multilingual shows CILI tip for synsets without definitions', async () => {
    // Setup test data with a synset that has no definition
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-nodef" label="No Def Lexicon" language="en" version="1.0">
    <LexicalEntry id="w_undef"><Lemma writtenForm="undef" partOfSpeech="n"/><Sense id="s_undef" synset="ss_undef"/></LexicalEntry>
    <Synset id="ss_undef" ili="i12345" partOfSpeech="n"></Synset>
  </Lexicon>
</LexicalResource>`;
    const testFile = join(config.dataDirectory, "nodef.xml");
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    const { stdout, stderr } = await runCommand(['multilingual', 'undef', '--lexicon', 'test-nodef']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Definition: No definition available in this lexicon.');
    expect(stdout).toContain("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0");
  });

  it('multilingual shows helpful tip when word is not found in default lexicon', async () => {
    // Setup: add a dummy english lexicon to avoid the "no lexicons" message
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="oewn" label="Test OEWN" language="en" version="2024">
    <LexicalEntry id="w_test"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="s_test" synset="ss_test"/></LexicalEntry>
    <Synset id="ss_test" partOfSpeech="n"><Definition>a test definition</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    const testFile = join(config.dataDirectory, "oewn.xml");
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    // Try to look up a word that doesn't exist
    const { stdout, stderr } = await runCommand(["multilingual", "nonexistent"]);

    expect(stderr).toBe('');
    expect(stdout).toContain(`No synsets found for "nonexistent" in 'oewn'`);
    expect(stdout).toContain("💡 Tip: If searching for a non-English word, specify its lexicon with --lexicon.");
    expect(stdout).toContain('Example: wn-cli multilingual "nonexistent" --lexicon <source-lexicon>');
  });
});
