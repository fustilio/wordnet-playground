import { bench, describe, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { loadLMF, createMinimalLMF, parseLMFXML, isLMF } from '../src/lmf';
import { taxonomyShortestPath } from '../src/taxonomy';
import { path } from '../src/similarity';
import { Morphy } from '../src/morphy';
import { add, remove } from '../src/data-management';
import { Wordnet } from '../src/wordnet';
import { getTestContext, cleanupTestContext, createMockData } from './conftest';
import type { TestContext } from './conftest';

let testContext: TestContext;
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
    await loadLMF(filePath);
  });

  bench('load mini-lmf-1.1.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.1.xml');
    await loadLMF(filePath);
  });

  bench('load mini-lmf-1.3.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.3.xml');
    await loadLMF(filePath);
  });

  bench('load mini-lmf-1.4.xml', async () => {
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.4.xml');
    await loadLMF(filePath);
  });
});

describe('Database Operations', () => {
  beforeAll(async () => {
    testContext = await getTestContext();
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
    await wordnet.synsets('information');
  });

  bench('wordnet.words("information")', async () => {
    await wordnet.words('information');
  });

  bench('wordnet.synsets("example")', async () => {
    await wordnet.synsets('example');
  });

  bench('wordnet.words("example")', async () => {
    await wordnet.words('example');
  });

  bench('wordnet.synsets("example", "n")', async () => {
    await wordnet.synsets('example', 'n');
  });

  bench('wordnet.words("example", "n")', async () => {
    await wordnet.words('example', 'n');
  });
});

describe('Similarity Calculations with Real Data', () => {
  let wordnet: Wordnet;
  let synsetA: any;
  let synsetB: any;

  beforeAll(async () => {
    // Load real test data
    const filePath = join(TEST_DATA_DIR, 'mini-lmf-1.0.xml');
    await add(filePath, { force: true });
    wordnet = new Wordnet('test-en');
    
    // Get two synsets for similarity calculation
    const synsets = await wordnet.synsets('information');
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
      await path(synsetA, synsetB, wordnet);
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
    for (const synset of testContext.mockData.synsets.slice(0, 1000)) {
      results.push(synset.id);
    }
  });

  bench('process all words', () => {
    const results: string[] = [];
    for (const word of testContext.mockData.words.slice(0, 1000)) {
      results.push(word.lemma);
    }
  });

  bench('process all senses', () => {
    const results: string[] = [];
    for (const sense of testContext.mockData.senses.slice(0, 1000)) {
      results.push(sense.id);
    }
  });
}); 