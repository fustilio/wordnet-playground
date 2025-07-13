import { describe, it, expect } from "vitest";
import { runCommand } from "./test-helper.js";
import { add, config } from "wn-ts";
import { writeFileSync } from "fs";
import { join } from "path";

describe("disambiguation command tests", () => {
  it("disambiguation command without word shows error", async () => {
    const { stdout, stderr } = await runCommand(["disambiguation"]);
    expect(stdout).toContain("Error: No word specified.");
    expect(stderr).toBe('');
  });

  it("disambiguation command with a word runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["disambiguation", "bank"]);
    // Should either not find lexicons, or not find the word in the test lexicon.
    expect(stdout).toMatch(/(Cannot find any senses for "bank"|No synsets found for "bank")/);
    expect(stderr).toBe('');
  });

  it("disambiguation command with pos as argument runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["disambiguation", "bank", "n"]);
    // Should either not find lexicons, or not find the word in the test lexicon.
    expect(stdout).toMatch(/(Cannot find any senses for "bank"|No synsets found for "bank")/);
    expect(stderr).toBe('');
  });

  it('disambiguation shows CILI tip for synsets without definitions', async () => {
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

    const { stdout, stderr } = await runCommand(['disambiguation', 'undef', '--lexicon', 'test-nodef']);
    expect(stderr).toBe('');
    expect(stdout).toContain('Definition: No definition available in this lexicon.');
    expect(stdout).toContain("💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0");
  });
});
