import { bench, describe, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { createMinimalLMF, parseLMFXML, createWordNet } from 'wn-ts-core';
import { taxonomyShortestPath } from '../src/taxonomy';
import { similarity } from 'wn-ts-core/plugins';
import { Morphy } from 'wn-ts-core';
import { add, remove } from '../src/data-management/index.js';
import { Wordnet } from '../src/wordnet';
import { getTestContext, cleanupTestContext, createMockData } from 'wn-ts-core/test';
import type { TestContext } from 'wn-ts-core/test';
import type { Word, Synset, Sense, Definition, WordNetWithPlugins, WordNetKernel } from 'wn-ts-core';

let testContext: TestContext;
let mockData: { synsets: Synset[]; words: Word[]; senses: Sense[]; definitions: Definition[] };
const morphy = new Morphy();

// Test data paths
const TEST_DATA_DIR = join(__dirname, '..', 'tests', 'data');

describe('LMF Loading', () => {
  bench('load minimal LMF', () => {
    createMinimalLMF();
  });

  bench('load LMF from XML string', () => {
    const xmlContent = `
      <LexicalResource lmfVersion="1.0">
        <Lexicon id="test-en" label="Test English" language="en">
          <LexicalEntry id="test-en-example-n">
            <Lemma writtenForm="example" partOfSpeech="n"/>
            <Sense id="test-en-example-n-0001-01" synset="test-en-0001-n"/>
          </LexicalEntry>
          <Synset id="test-en-0001-n" partOfSpeech="n"/>
        </Lexicon>
      </LexicalResource>
    `;
    parseLMFXML(xmlContent);
  });

  bench('load mini-lmf-1.0.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.0.xml');
    await parseLMFXML(filePath);
  });

  bench('load mini-lmf-1.1.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.1.xml');
    await parseLMFXML(filePath);
  });

  bench('load mini-lmf-1.3.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.3.xml');
    await parseLMFXML(filePath);
  });

  bench('load mini-lmf-1.4.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.4.xml');
    await parseLMFXML(filePath);
  });
});

describe('Database Operations', () => {
  beforeAll(async () => {
    testContext = await getTestContext();
    mockData = {
      synsets: createMockData('synset', 1000),
      words: createMockData('word', 1000),
      senses: createMockData('sense', 1000),
      definitions: createMockData('definition', 1000)
    };
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  bench('add mini-lmf-1.0.xml to database', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.0.xml');
    await add(filePath, { force: true });
  });

  bench('add mini-lmf-1.1.xml to database', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.1.xml');
    await add(filePath, { force: true });
  });

  bench('remove lexicon from database', async () => {
    await remove('test-en');
  });
});

describe('Wordnet Operations with Real Data', () => {
  let wordnet: Wordnet;

  beforeAll(async () => {
    // Load real test data
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.0.xml');
    await add(filePath, { force: true });
    wordnet = new Wordnet('test-en');
  });

  afterAll(async () => {
    await remove('test-en');
  });

  bench('wordnet.synsets("information")', async () => {
    await wordnet.synsets({ form: 'information' });
  });

  bench('wordnet.words("information")', async () => {
    await wordnet.words({ form: 'information' });
  });

  bench('wordnet.synsets("example")', async () => {
    await wordnet.synsets({ form: 'example' });
  });

  bench('wordnet.words("example")', async () => {
    await wordnet.words({ form: 'example' });
  });

  bench('wordnet.synsets("example", "n")', async () => {
    await wordnet.synsets({ form: 'example', pos: 'n' });
  });

  bench('wordnet.words("example", "n")', async () => {
    await wordnet.words({ form: 'example', pos: 'n' });
  });
});

describe('Similarity Calculations with Real Data', () => {
  let wordnet: Wordnet;
  let wordnetKernel: WordNetWithPlugins<[typeof similarity]>;
  let synsetA: Synset | undefined;
  let synsetB: Synset | undefined;

  beforeAll(async () => {
    // Load real test data
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.0.xml');
    await add(filePath, { force: true });
    wordnet = new Wordnet('test-en');
    
    // Create WordNetKernel with the Wordnet instance as core
    wordnetKernel = createWordNet({
      core: wordnet,
      plugins: [similarity]
    });
    
    // Get two synsets for similarity calculation
    const synsets = await wordnet.synsets({ form: 'information' });
    if (synsets.length >= 2) {
      synsetA = synsets[0];
      synsetB = synsets[1];
    }
  });

  afterAll(async () => {
    await remove('test-en');
  });

  bench('path similarity', async () => {
    if (synsetA && synsetB) {
      await similarity.methods.path(wordnetKernel.getCore() as WordNetKernel, synsetA, synsetB);
    }
  });

  bench('taxonomyShortestPath', async () => {
    if (synsetA && synsetB) {
      await taxonomyShortestPath(synsetA, synsetB, wordnet);
    }
  });
});

describe('Morphological Analysis', () => {
  bench('Morphy.analyze("examples")', async () => {
    await morphy.analyze('examples');
  });

  bench('Morphy.analyze("examples", "n")', async () => {
    await morphy.analyze('examples', 'n');
  });

  bench('Morphy.analyze("running")', async () => {
    await morphy.analyze('running');
  });

  bench('Morphy.analyze("running", "v")', async () => {
    await morphy.analyze('running', 'v');
  });

  bench('Morphy.analyze("happier")', async () => {
    await morphy.analyze('happier');
  });

  bench('Morphy.analyze("happier", "a")', async () => {
    await morphy.analyze('happier', 'a');
  });
});

describe('Large Scale Operations', () => {
  beforeAll(async () => {
    testContext = await getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  bench('process all synsets', () => {
    const results: string[] = [];
    for (const synset of mockData.synsets.slice(0, 1000)) {
      results.push(synset.id);
    }
  });

  bench('process all words', () => {
    const results: string[] = [];
    for (const word of mockData.words.slice(0, 1000)) {
      results.push(word.lemma);
    }
  });

  bench('process all senses', () => {
    const results: string[] = [];
    for (const sense of mockData.senses.slice(0, 1000)) {
      results.push(sense.id);
    }
  });
}); 