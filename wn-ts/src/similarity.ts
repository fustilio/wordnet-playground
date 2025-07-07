/**
 * Synset similarity metrics.
 * 
 * This module provides various similarity measures between synsets,
 * including path-based, information content-based, and taxonomy-based metrics.
 */

import type { Synset } from './types.js';
import { WnError } from './types.js';
import { information_content } from './ic.js';
import type { Freq } from './ic.js';
import { shortestPath, maxDepth, lowestCommonHypernyms } from './synset-utils.js';
import { Wordnet } from './wordnet.js';

/**
 * Return the Path similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param wordnet - The Wordnet instance
 * @returns A similarity score between 0 and 1
 */
export async function path(
  synset1: Synset,
  synset2: Synset,
  wordnet: Wordnet
): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
  if (synset1.id === synset2.id) return 1.0;
  try {
    const pathArr = await shortestPath(synset1, synset2, wordnet);
    if (pathArr.length === 0) return 0;
    const distance = pathArr.length;
    return 1 / (distance + 1);
  } catch (error) {
    return 0;
  }
}

/**
 * Return the Wu-Palmer similarity of two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param wordnet - The Wordnet instance
 * @returns A similarity score between 0 and 1
 * @throws {WnError} When no path connects the synsets
 */
export async function wup(
  synset1: Synset,
  synset2: Synset,
  wordnet: Wordnet
): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
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
 * Return the Leacock-Chodorow similarity between two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param maxTaxonomyDepth - The taxonomy depth
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 * @throws {WnError} When maxDepth is not greater than 0
 */
export async function lch(
  synset1: Synset,
  synset2: Synset,
  maxTaxonomyDepth: number,
  wordnet: Wordnet
): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
  
  if (maxTaxonomyDepth <= 0) {
    throw new WnError('maxDepth must be greater than 0');
  }
  
  const distance = (await shortestPath(synset1, synset2, wordnet)).length;
  return -Math.log((distance + 1) / (2 * maxTaxonomyDepth));
}

/**
 * Return the Resnik similarity between two synsets.
 * 
 * @param synset1 - The first synset to compare
 * @param synset2 - The second synset to compare
 * @param ic - Information Content weights
 * @param wordnet - The Wordnet instance
 * @returns A similarity score
 */
export async function res(synset1: Synset, synset2: Synset, ic: Freq, wordnet: Wordnet): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
  
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
export async function jcn(
  synset1: Synset,
  synset2: Synset,
  ic: Freq,
  wordnet: Wordnet
): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
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
export async function lin(
  synset1: Synset,
  synset2: Synset,
  ic: Freq,
  wordnet: Wordnet
): Promise<number> {
  _checkIfPosCompatible(synset1.partOfSpeech, synset2.partOfSpeech);
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
  wordnet: Wordnet
): Promise<Synset> {
  const lcsList = await lowestCommonHypernyms(synset1, synset2, wordnet);
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