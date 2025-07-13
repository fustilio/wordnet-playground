import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runCommand } from '../../commands/test-helper.js';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('E2E Command Suite', () => {
  let e2eDataDir: string;

  beforeAll(() => {
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-cli-suite-e2e-'));
  });

  afterAll(async () => {
    if (e2eDataDir && existsSync(e2eDataDir)) {
      rmSync(e2eDataDir, { recursive: true, force: true });
    }
    // Reset config to avoid affecting other tests or local dev
    await runCommand(['config', '--reset', '--force']);
  });

  it('should run a full command suite sequentially', async () => {
    console.log("Setting up E2E test environment for command suite...");
    
    // STEP 1: Download oewn, query for a word, and check for CILI tip
    let result = await runCommand(["data", "download", "oewn:2024"]);
    // Retry up to 2 more times on failure to handle flaky E2E network
    for (let i = 0; i < 2 && result.stderr; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      result = await runCommand(["data", "download", "oewn:2024"]);
    }
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("🎉 Project oewn:2024 is now installed and ready to use.");

    result = await runCommand(["query", "word", "happy", "a"]);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("💡 Tip: Install 'cili' for more definitions.");

    // STEP 2: Download CILI and verify definition now appears
    result = await runCommand(["data", "download", "cili:1.0"]);
    for (let i = 0; i < 2 && result.stderr; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      result = await runCommand(["data", "download", "cili:1.0"]);
    }
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("🎉 Project cili:1.0 is now installed and ready to use.");

    result = await runCommand(["query", "word", "happy", "a"]);
    expect(result.stdout).toContain("Definition: enjoying or showing or marked by joy or pleasure");
    expect(result.stdout).not.toContain("💡 Tip: Install 'cili' for more definitions.");
    
    console.log("E2E setup complete for command suite.");

    // STEP 3: List installed lexicons and show stats
    let { stdout } = await runCommand(['lexicons', '--installed']);
    expect(stdout).not.toContain('cili');
    expect(stdout).toContain('oewn');
  
    ({ stdout } = await runCommand(['stats']));
    expect(stdout).toMatch(/📝\s*Total words:\s*[1-9]\d*/);
    expect(stdout).toMatch(/📚\s*Total synsets:\s*[1-9]\d*/);
    expect(stdout).toMatch(/🌍\s*Total ILI entries:\s*[1-9]\d*/);

    // STEP 4: Run core query commands
    ({ stdout } = await runCommand(['query', 'word', 'cat', '--pos', 'n']));
    expect(stdout).toContain('Querying "cat" in oewn...');
    expect(stdout).toContain('Found 1 words:');
    
    // STEP 5: Run advanced query commands
    ({ stdout } = await runCommand(['disambiguation', 'bank']));
    expect(stdout).toContain('Word Sense Disambiguation for "bank"');
    expect(stdout).toContain('Found 18 senses:');

    // STEP 6: Test multilingual capabilities
    // Download Thai data
    result = await runCommand(["data", "download", "omw-th:1.4"]);
    for (let i = 0; i < 2 && result.stderr; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      result = await runCommand(["data", "download", "omw-th:1.4"]);
    }
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("🎉 Project omw-th:1.4 is now installed and ready to use.");

    // Attempt a multilingual query for a Thai word. The CLI should provide a helpful tip.
    const thaiWord = "คอมพิวเตอร์"; // "computer" in Thai
    result = await runCommand(["multilingual", thaiWord]);
    expect(result.stderr).toBe("");

    // Check for the helpful tip when the word is not in the default 'oewn' lexicon
    expect(result.stdout).toContain(
      `No synsets found for "${thaiWord}" in 'oewn'`
    );
    expect(result.stdout).toContain(
      "💡 Tip: If searching for a non-English word, specify its lexicon with --lexicon."
    );
    
    // Retry with the correct lexicon and verify success
    result = await runCommand([
      "multilingual",
      thaiWord,
      "--lexicon",
      "omw-th",
      "--target",
      "en",
    ]);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`Multilingual Analysis for "${thaiWord}"`);
    expect(result.stdout).toContain("Found 1 synsets:");
    // Check for the English definition from CILI to confirm cross-language linking
    expect(result.stdout).toContain("a machine for performing calculations automatically");
    expect(result.stdout).not.toContain("Total ILI entries: 0"); // Verify ILI was used

    // STEP 7: Perform data management tasks
    // Data removal is tested in a separate, faster integration test.
  }, 300000); // 5 minute timeout for the whole suite
});
