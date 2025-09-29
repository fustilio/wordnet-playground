/**
 * Wu-Palmer similarity metric
 */

import type { Synset } from '../../core/types.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { lowestCommonHypernyms, shortestPath, maxDepth } from '../../modules/relations/synset-utils.js';
import { calculateLcsSimilarity, calculateSimilarity } from './similarity-utils.js';

/**
 * Return the Wu-Palmer similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param wordnet - The Wordnet instance
 * @returns A similarity score between 0 and 1
 * @throws {WnError} When no path connects the synsets
 */
export async function wuPalmerSimilarity(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore
): Promise<number> {
  return calculateSimilarity(
    synset1,
    synset2,
    wordnet,
    'WuPalmerSimilarity',
    () => calculateLcsSimilarity(
      synset1,
      synset2,
      wordnet,
      lowestCommonHypernyms,
      async (lcs, s1, s2, wn) => {
        const i = (await shortestPath(s1, lcs, wn)).length;
        const j = (await shortestPath(s2, lcs, wn)).length;
        const k = (await maxDepth(lcs, wn)) + 1;
        return (2 * k) / (i + j + 2 * k);
      }
    )
  );
}

