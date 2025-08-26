import { describe, it, expect } from 'vitest';
import { BaseWordnet } from '../src/wordnet';
import { hypernyms, shortestPath, maxDepth, lowestCommonHypernyms } from '../src/synset-utils';
import type { Synset } from '../src/types';

const synsets: Record<string, Synset> = {
  root: {
    id: 'root',
    pos: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: [],
  },
  a: {
    id: 'a',
    pos: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r1', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: [],
  },
  b: {
    id: 'b',
    pos: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r2', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: [],
  },
  c: {
    id: 'c',
    pos: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r3', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: [],
  },
  d: {
    id: 'd',
    pos: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r4', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: [],
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