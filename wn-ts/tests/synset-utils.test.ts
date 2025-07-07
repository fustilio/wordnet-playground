import { describe, it, expect } from 'vitest';
import { Wordnet } from '../src/wordnet';
import { hypernyms, shortestPath, maxDepth, lowestCommonHypernyms } from '../src/synset-utils';
import type { Synset } from '../src/types';

const synsets: Record<string, Synset> = {
  root: {
    id: 'root',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  a: {
    id: 'a',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r1', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  b: {
    id: 'b',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r2', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  c: {
    id: 'c',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r3', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  d: {
    id: 'd',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r4', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
};

class MockWordnet {
  async synset(id: string): Promise<Synset | undefined> {
    return synsets[id];
  }
}

const wordnet = new MockWordnet() as unknown as Wordnet;

describe('synset-utils', () => {
  it('hypernyms returns direct hypernyms', async () => {
    const a = synsets['a'];
    const hypers = await hypernyms(a, wordnet);
    expect(hypers.length).toBe(1);
    expect(hypers[0].id).toBe('root');
  });

  it('shortestPath finds path between synsets', async () => {
    const c = synsets['c'];
    const d = synsets['d'];
    const path = await shortestPath(c, d, wordnet);
    // c -> a, d -> a, so they share 'a' as common ancestor
    expect(path.length).toBeGreaterThan(0);
    // The path should contain their common ancestor 'a'
    const pathIds = path.map(s => s.id);
    expect(pathIds).toContain('a');
  });

  it('maxDepth computes the correct depth', async () => {
    const c = synsets['c'];
    const depth = await maxDepth(c, wordnet);
    expect(depth).toBe(2); // c -> a -> root
  });

  it('lowestCommonHypernyms finds the LCS', async () => {
    const c = synsets['c'];
    const b = synsets['b'];
    const lcs = await lowestCommonHypernyms(c, b, wordnet);
    expect(lcs.length).toBe(1);
    expect(lcs[0].id).toBe('root');
  });
}); 