/**
 * Path-based similarity metrics
 */

import type { Synset } from '../../core/types.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { calculatePathSimilarity, calculateSimilarity } from './similarity-utils.js';

/**
 * Return the Path similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param wordnet - The Wordnet instance
 * @returns A similarity score between 0 and 1
 */
export async function pathSimilarity(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore
): Promise<number> {
  return calculateSimilarity(
    synset1,
    synset2,
    wordnet,
    'PathSimilarity',
    () => calculatePathSimilarity(synset1, synset2, wordnet)
  );
}

