/**
 * Leacock-Chodorow similarity metric
 */

import type { Synset } from '../../core/types.js';
import { WnError } from '../../core/errors.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { shortestPath } from '../../modules/relations/synset-utils.js';

/**
 * Return the Leacock-Chodorow similarity between two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param maxTaxonomyDepth - The taxonomy depth
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 * @throws {WnError} When maxDepth is not greater than 0
 */
export async function leacockChodorowSimilarity(
  synset1: Synset,
  synset2: Synset,
  maxTaxonomyDepth: number,
  wordnet: WordNetCore
): Promise<number> {
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  
  if (maxTaxonomyDepth <= 0) {
    throw new WnError('maxDepth must be greater than 0');
  }
  
  const distance = (await shortestPath(synset1, synset2, wordnet)).length;
  return -Math.log((distance + 1) / (2 * maxTaxonomyDepth));
}

/**
 * Check if two parts of speech are compatible for similarity comparison.
 * 
 * @param pos1 - First part of speech
 * @param pos2 - Second part of speech
 * @throws {WnError} When parts of speech are not compatible
 */
function _checkIfPosCompatible(pos1: string, pos2: string): void {
  if (pos1 !== pos2) {
    throw new WnError(`Parts of speech must match: ${pos1} != ${pos2}`);
  }
}
