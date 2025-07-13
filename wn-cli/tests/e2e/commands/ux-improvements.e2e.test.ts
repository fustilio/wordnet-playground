import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runCommand } from "../../commands/test-helper.js";
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// These tests perform actual downloads and can be slow. They test a sequential user journey.
describe("E2E UX Improvements", () => {
  let e2eDataDir: string;

  beforeAll(() => {
    e2eDataDir = mkdtempSync(join(tmpdir(), 'wn-cli-ux-e2e-'));
  });

  afterAll(async () => {
    if (e2eDataDir && existsSync(e2eDataDir)) {
      rmSync(e2eDataDir, { recursive: true, force: true });
    }
    // Reset config to avoid affecting other tests or local dev
    await runCommand(['config', '--reset', '--force']);
  });

  it(
    "should guide a user through a full installation and query journey",
    async () => {
      // STEP 1: Download oewn, query for "happy", and check for CILI tip
      let result = await runCommand(["data", "download", "oewn:2024"]);
      // Retry up to 2 more times on failure to handle flaky E2E network
      for (let i = 0; i < 2 && result.stderr; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        result = await runCommand(["data", "download", "oewn:2024"]);
      }
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(
        "🎉 Project oewn:2024 is now installed and ready to use."
      );

      result = await runCommand(["query", "word", "happy", "a"]);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(
        "💡 Tip: Install 'cili' for more definitions. Run: wn-cli data download cili:1.0"
      );

      // STEP 2: Download CILI and verify definition now appears without the tip
      result = await runCommand(["data", "download", "cili:1.0"]);
      for (let i = 0; i < 2 && result.stderr; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        result = await runCommand(["data", "download", "cili:1.0"]);
      }
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(
        "🎉 Project cili:1.0 is now installed and ready to use."
      );

      result = await runCommand(["query", "word", "happy", "a"]);
      expect(result.stderr).toBe("");
      // The actual definition should now be present
      expect(result.stdout).toContain(
        "Definition: enjoying or showing or marked by joy or pleasure"
      );
      // The tip should NOT be present
      expect(result.stdout).not.toContain(
        "💡 Tip: Install 'cili' for more definitions."
      );

      // STEP 3: Download Thai data
      result = await runCommand(["data", "download", "omw-th:1.4"]);
      for (let i = 0; i < 2 && result.stderr; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        result = await runCommand(["data", "download", "omw-th:1.4"]);
      }
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(
        "🎉 Project omw-th:1.4 is now installed and ready to use."
      );

      // STEP 4: Attempt a multilingual query for a Thai word. The CLI should provide a helpful tip.
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

      // STEP 5: Retry with the correct lexicon and verify success
      result = await runCommand([
        "multilingual",
        thaiWord,
        "--lexicon",
        "omw-th",
        "--target",
        "en",
      ]);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(
        `Multilingual Analysis for "${thaiWord}"`
      );
      expect(result.stdout).toContain("Found 1 synsets:");
      // Check for the English definition from CILI to confirm cross-language linking
      expect(result.stdout).toContain("a machine for performing calculations automatically");
      expect(result.stdout).not.toContain("Total ILI entries: 0"); // Verify ILI was used
    },
    300000 // Allow 5 minutes for all downloads
  );
});
