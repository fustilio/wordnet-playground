/**
 * Wu-Palmer similarity metric
 */

import type { Synset } from '../../core/types.js';
import { WnError } from '../../core/errors.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { lowestCommonHypernyms, shortestPath, maxDepth } from '../../modules/relations/synset-utils.js';

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
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  _checkIfLexiconCompatible(synset1, synset2);
  
  if (synset1.id === synset2.id) return 1.0;
  
  const lcsList = await lowestCommonHypernyms(synset1, synset2, wordnet);
  if (lcsList.length === 0) {
    return 0;
  }
  const lcs = lcsList[0];
  if (!lcs) {
    return 0;
  }
  const i = (await shortestPath(synset1, lcs, wordnet)).length;
  const j = (await shortestPath(synset2, lcs, wordnet)).length;
  const k = (await maxDepth(lcs, wordnet)) + 1;
  return (2 * k) / (i + j + 2 * k);
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
