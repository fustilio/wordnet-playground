/**
 * Path-based similarity metrics
 */

import type { Synset } from '../../core/types.js';
import { WnError } from '../../core/types.js';
import type { WordNetCore } from '../../wordnet-kernel.js';

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
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  _checkIfLexiconCompatible(synset1, synset2);
  
  if (synset1.id === synset2.id) return 1.0;
  try {
    // Note: This will need to be updated when we convert synset-utils to relations plugin
    const pathArr = await (wordnet as any).getShortestPath(synset1, synset2);
    if (pathArr.length === 0) return 0;
    const distance = pathArr.length;
    return 1 / (distance + 1);
  } catch (error) {
    return 0;
  }
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

/**
 * Check if two synsets are from compatible lexicons for similarity comparison.
 * 
 * @param synset1 - First synset
 * @param synset2 - Second synset
 * @throws {WnError} When synsets are from incompatible lexicons
 */
function _checkIfLexiconCompatible(synset1: Synset, synset2: Synset): void {
  if (synset1.lexicon !== synset2.lexicon) {
    throw new WnError(
      `Synsets must be from the same lexicon for direct similarity comparison. ` +
      `Synset1: ${synset1.id} (${synset1.lexicon}), Synset2: ${synset2.id} (${synset2.lexicon}). ` +
      `Use getCrossLingualSimilarity() for cross-lingual comparisons.`
    );
  }
}
