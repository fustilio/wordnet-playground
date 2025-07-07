import { bench, describe, beforeAll, afterAll } from 'vitest';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { 
  getParser, 
  getParserNames, 
  getAllParserInfo,
  PARSER_REGISTRY 
} from '../src/parsers/index.js';

// File cache to avoid recreating files
const fileCache = new Map<string, string>();

async function getOrCreateLmfFile(
  name: string,
  numWords: number,
  numSynsets: number
): Promise<string> {
  const cacheKey = `${name}-${numWords}-${numSynsets}`;
  if (fileCache.has(cacheKey)) {
    return fileCache.get(cacheKey)!;
  }
  const filePath = await createLmfFile(name, numWords, numSynsets);
  fileCache.set(cacheKey, filePath);
  return filePath;
}

describe('LMF Parser Approaches Benchmark', () => {
  afterAll(async () => {
    // Clear the cache to free up memory
    fileCache.clear();
  });

  // --- Benchmarks ---
  [
    {
      name: 'Tiny',
      numWords: 1,
      numSynsets: 1,
    },
    {
      name: 'Small',
      numWords: 10,
      numSynsets: 10,
    },
    // {
    //   name: 'Medium',
    //   numWords: 100,
    //   numSynsets: 100,
    // },
    // {
    //   name: 'Large',
    //   numWords: 1000,
    //   numSynsets: 1000,
    // },
    // {
    //     name: "Impossible",
    //     numWords: 10000,
    //     numSynsets: 10000,
    // }
  ].forEach(({ name, numWords, numSynsets }) => {
    describe(name, () => {
      const slug = name.toLowerCase().replace(/ /g, '-');
      
      // Generate benchmarks for all available parsers
      Object.entries(PARSER_REGISTRY).forEach(([parserKey, parserInfo]) => {
        bench(`${parserInfo.name} - ${name}`, async () => {
          const parser = parserInfo.factory();
          await parser.parse(await getOrCreateLmfFile(slug, numWords, numSynsets));
        });
      });
    });
  });
});

// Helper function to create LMF test files
async function createLmfFile(
  name: string,
  numWords: number,
  numSynsets: number
): Promise<string> {
  try {
    const testDir = join(tmpdir(), 'wn-ts-lmf-bench');
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
    const filePath = join(testDir, `${name}-test-lmf.xml`);

    // Check if file already exists to avoid recreation
    if (existsSync(filePath)) {
      return filePath;
    }

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">\n<LexicalResource lmfVersion="1.0">\n  <Lexicon id="test-bench-lexicon" label="Benchmark Test Lexicon" language="en" version="1.0" email="" license="" url="" citation="" logo="">`;
    for (let i = 0; i < numWords; i++) {
      xmlContent += `\n    <LexicalEntry id="test-bench-word-${i}">\n      <Lemma writtenForm="word${i}" partOfSpeech="n"/>\n      <Sense id="test-bench-sense-${i}" synset="test-bench-synset-${i}"/>\n    </LexicalEntry>`;
    }
    for (let i = 0; i < numSynsets; i++) {
      xmlContent += `\n    <Synset id="test-bench-synset-${i}" ili="i${i.toString().padStart(8, '0')}" partOfSpeech="n">\n      <Definition language="en">Definition for benchmark synset ${i}</Definition>\n    </Synset>`;
    }
    xmlContent += `\n  </Lexicon>\n</LexicalResource>`;
    await writeFile(filePath, xmlContent);
    return filePath;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
