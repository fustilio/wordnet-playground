/**
 * Information Content-based similarity metrics (Resnik, Lin, Jiang-Conrath)
 */

import type { Synset } from '../../core/types.js';
import { WnError } from '../../core/types.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { information_content } from './information-content.js';
import type { Freq } from './information-content.js';

/**
 * Return the Resnik similarity between two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param ic - Information Content weights
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 */
export async function resnikSimilarity(
  synset1: Synset, 
  synset2: Synset, 
  ic: Freq, 
  wordnet: WordNetCore
): Promise<number> {
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  
  const lcs = await _mostInformativeLcs(synset1, synset2, ic, wordnet);
  return information_content(lcs, ic);
}

/**
 * Return the Jiang-Conrath similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param ic - Information Content weights
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 */
export async function jiangConrathSimilarity(
  synset1: Synset,
  synset2: Synset,
  ic: Freq,
  wordnet: WordNetCore
): Promise<number> {
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  if (synset1.id === synset2.id) return 1.0;
  
  const ic1 = information_content(synset1, ic);
  const ic2 = information_content(synset2, ic);
  const lcs = await _mostInformativeLcs(synset1, synset2, ic, wordnet);
  const icLcs = information_content(lcs, ic);
  
  // Handle edge cases
  if (ic1 === 0 && ic2 === 0 && icLcs === 0) {
    return 0;
  }
  
  const denom = ic1 + ic2 - 2 * icLcs;
  if (denom <= 0) {
    return 0;
  }
  
  return 1 / denom;
}

/**
 * Return the Lin similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param ic - Information Content weights
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 */
export async function linSimilarity(
  synset1: Synset,
  synset2: Synset,
  ic: Freq,
  wordnet: WordNetCore
): Promise<number> {
  _checkIfPosCompatible(synset1.pos, synset2.pos);
  if (synset1.id === synset2.id) return 1.0;
  const ic1 = information_content(synset1, ic);
  const ic2 = information_content(synset2, ic);
  const lcs = await _mostInformativeLcs(synset1, synset2, ic, wordnet);
  const icLcs = information_content(lcs, ic);
  const denom = ic1 + ic2;
  if (denom === 0) {
    return 0;
  } else {
    return Math.min(1, (2 * icLcs) / denom);
  }
}

/**
 * Find the most informative least common subsumer of two synsets.
 * 
 * @param synset1 - The first synset
 * @param synset2 - The second synset
 * @param ic - Information Content weights
 * @param wordnet - The Wordnet instance
 * @returns The most informative LCS
 */
async function _mostInformativeLcs(
  synset1: Synset,
  synset2: Synset,
  ic: Freq,
  wordnet: WordNetCore
): Promise<Synset> {
  // Note: This will need to be updated when we convert synset-utils to relations plugin
  const lcsList = await (wordnet as any).getLowestCommonHypernyms(synset1, synset2);
  if (lcsList.length === 0) {
    throw new WnError('No common subsumers found');
  }
  
  const firstLcs = lcsList[0];
  if (!firstLcs) {
    throw new WnError('No LCS found');
  }
  
  let mostInformative = firstLcs;
  let maxIc = information_content(mostInformative, ic);
  
  for (const lcs of lcsList.slice(1)) {
    const currentIc = information_content(lcs, ic);
    if (currentIc > maxIc) {
      maxIc = currentIc;
      mostInformative = lcs;
    }
  }
  
  return mostInformative;
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
