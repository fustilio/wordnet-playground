import { describe, it, expect, beforeEach } from "vitest";
import { runCommand } from "../commands/test-helper.js";
import { add, config } from "wn-ts";
import { writeFileSync } from "fs";
import { join } from "path";
import { performance } from "perf_hooks";

// Add a real lexicon for performance testing
const testLexicon = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/pwn_lmf.dtd">
<LexicalResource>
  <Lexicon id="test-perf" label="Perf Lexicon" language="en" version="1.0">
    <LexicalEntry id="w1"><Lemma writtenForm="test" partOfSpeech="n"/><Sense id="s1" synset="ss1"/></LexicalEntry>
    <LexicalEntry id="w2"><Lemma writtenForm="exam" partOfSpeech="n"/><Sense id="s2" synset="ss1"/></LexicalEntry>
    <Synset id="ss1" partOfSpeech="n"><Definition>a test</Definition></Synset>
  </Lexicon>
</LexicalResource>`;

describe("Performance Tests", () => {
  beforeEach(async () => {
    const testFile = join(config.dataDirectory, "perf.xml");
    writeFileSync(testFile, testLexicon);
    await add(testFile, { force: true });
  });

  it("query word command should be performant", async () => {
    const timings: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await runCommand(["query", "word", "test"]);
      const endTime = performance.now();
      timings.push(endTime - startTime);
    }

    const averageTime = timings.reduce((a, b) => a + b, 0) / iterations;
    console.log(`Average 'query word' time: ${averageTime.toFixed(2)}ms`);

    // The spec requires commands to be under 2 seconds
    expect(averageTime).toBeLessThan(2000);
  });

  it("stats command should be performant", async () => {
    const timings: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await runCommand(["stats"]);
      const endTime = performance.now();
      timings.push(endTime - startTime);
    }

    const averageTime = timings.reduce((a, b) => a + b, 0) / iterations;
    console.log(`Average 'stats' time: ${averageTime.toFixed(2)}ms`);

    expect(averageTime).toBeLessThan(2000);
  });

  it("query synonyms command should be performant", async () => {
    const timings: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await runCommand(["query", "synonyms", "test"]);
        const endTime = performance.now();
        timings.push(endTime - startTime);
    }

    const averageTime = timings.reduce((a, b) => a + b, 0) / iterations;
    console.log(`Average 'query synonyms' time: ${averageTime.toFixed(2)}ms`);

    expect(averageTime).toBeLessThan(2000);
  });

  it("should have acceptable memory usage", async () => {
    const memoryUsageBefore = process.memoryUsage().heapUsed;
    await runCommand(["stats", "--quality"]);
    const memoryUsageAfter = process.memoryUsage().heapUsed;

    const memoryConsumed = (memoryUsageAfter - memoryUsageBefore) / 1024 / 1024; // in MB
    console.log(`Memory consumed by 'stats' command: ${memoryConsumed.toFixed(2)}MB`);
    
    // The spec requires memory usage to be under 100MB
    expect(memoryConsumed).toBeLessThan(100);
  });
});
