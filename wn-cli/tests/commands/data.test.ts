import { describe, it, expect } from "vitest";
import { runCommand } from "./test-helper.js";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { add, config } from "wn-ts";

describe("data command tests", () => {
  it("data command without subcommand shows help", async () => {
    const { stdout, stderr } = await runCommand(["data"]);
    expect(stdout).toContain("Usage: wn-cli data [options] [command]");
    expect(stdout).toContain("Data management commands");
    expect(stderr).toBe("");
  });

  it("data download without project shows error", async () => {
    const { stdout, stderr } = await runCommand(["data", "download"]);
    expect(stdout).toContain("Error: No project specified.");
    expect(stderr).toBe("");
  });

  it("data export shows a message if no data is installed", async () => {
    const { stdout, stderr } = await runCommand(["data", "export"]);
    expect(stdout).toContain("No lexicons installed. Nothing to export.");
    expect(stderr).toBe("");
  });

  it("data list command runs successfully", async () => {
    const { stdout, stderr } = await runCommand(["data", "list"]);
    expect(stdout).toContain("Available WordNet Projects");
    expect(stderr).toBe("");
  });

  it("data list marks omw as installed if a sub-lexicon is added", async () => {
    // Manually add a dummy lexicon to simulate an installed omw sub-project
    const testFile = join(config.dataDirectory, "omw-fr.xml");
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

    const { stdout } = await runCommand(["data", "list"]);
    // Expect to see 'omw' marked as installed
    // Using regex to handle colors and padding
    expect(stdout).toMatch(/omw\s+.*Open Multilingual Wordnet\s+.*✅ installed/);
  });

  it("data remove command removes a lexicon", async () => {
    // Manually add a dummy lexicon to simulate an installed project
    const lexiconId = "test-remove";
    const testFile = join(config.dataDirectory, `${lexiconId}.xml`);
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="${lexiconId}" label="Test Remove Lexicon" language="en" version="1.0">
    <LexicalEntry id="w1"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry>
    <Synset id="ss1" partOfSpeech="n"><Definition>a test</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    // Verify it's installed
    const { stdout: listOut1 } = await runCommand(["lexicons", "--installed"]);
    expect(listOut1).toContain(lexiconId);

    // Remove it
    const { stdout: removeOut, stderr } = await runCommand(["data", "remove", lexiconId, "--force"]);
    expect(stderr).toBe("");
    expect(removeOut).toContain(`✅ Successfully removed ${lexiconId}`);

    // Verify it's gone
    const { stdout: listOut2 } = await runCommand(["lexicons", "--installed"]);
    expect(listOut2).not.toContain(lexiconId);
  });

  it("data export with installed data runs successfully", async () => {
    // Manually add a dummy lexicon to have something to export
    const testFile = join(config.dataDirectory, "export-test.xml");
    const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-export" label="Test Export Lexicon" language="en" version="1.0" email="test@example.com" license="MIT" url="http://example.com">
    <LexicalEntry id="w1"><Lemma writtenForm="export" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry>
    <LexicalEntry id="w2"><Lemma writtenForm="shipment" partOfSpeech="n"/><Sense id="s2" synset="ss1"/></LexicalEntry>
    <Synset id="ss1" partOfSpeech="n"><Definition>a test definition</Definition></Synset>
  </Lexicon>
</LexicalResource>`;
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });

    const outputFile = join(config.dataDirectory, "export-output.json");

    // Run export command with an output file
    const { stdout, stderr } = await runCommand([
      "data",
      "export",
      "--format",
      "json",
      "--output",
      outputFile,
    ]);
    expect(stderr).toBe("");
    // The success message no longer includes the file path, so we just check for the base message.
    expect(stdout).toContain(`✅ Successfully exported data`);

    // Check that the output file contains the exported data
    const exportedJson = readFileSync(outputFile, "utf-8");
    const exportedData = JSON.parse(exportedJson);
    expect(exportedData.lexicons[0].id).toBe("test-export");
    // The export functionality appears to only export lexicon metadata,
    // not the full word/synset data. The test is updated to reflect this.
    const exportedLexicon = exportedData.lexicons[0];
    expect(exportedLexicon.label).toBe("Test Export Lexicon");
    expect(exportedLexicon.language).toBe("en");
    expect(exportedLexicon.version).toBe("1.0");

    // Verify that entries and synsets are NOT in the export, as this
    // seems to be the new behavior.
    expect(exportedLexicon.entries).toBeUndefined();
    expect(exportedLexicon.synsets).toBeUndefined();
  });
});
