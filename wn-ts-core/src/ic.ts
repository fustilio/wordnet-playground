/**
 * Information Content is a corpus-based metrics of synset or sense specificity.
 * 
 * This module provides functions for computing and loading information content
 * weights from corpora and files.
 */

import type { Synset, PartOfSpeech } from './types.js';
import { WnError } from './types.js';
import { Wordnet } from './wordnet.js';
import { hypernyms } from './synset-utils.js';

// Just use a subset of all available parts of speech
const IC_PARTS_OF_SPEECH = new Set<PartOfSpeech>(['n', 'v', 'a', 'r']);

export type Freq = Record<string, Record<string, number>>;

/**
 * Calculate the Information Content value for a synset.
 * 
 * The information content of a synset is the negative log of the
 * synset probability.
 * 
 * @param synset - The synset to calculate IC for
 * @param freq - The frequency mapping
 * @returns The information content value
 */
export function information_content(synset: Synset, freq: Freq): number {
  const prob = synset_probability(synset, freq);
  if (prob <= 0) {
    return 0;
  }
  return -Math.log(prob);
}

/**
 * Calculate the synset probability.
 * 
 * The synset probability is defined as freq(ss)/N where freq(ss) is
 * the IC weight for the synset and N is the total IC weight for all
 * synsets with the same part of speech.
 * 
 * @param synset - The synset to calculate probability for
 * @param freq - The frequency mapping
 * @returns The synset probability
 */
export function synset_probability(synset: Synset, freq: Freq): number {
  const posFreq = freq[synset.partOfSpeech];
  if (!posFreq) {
    return 0;
  }
  const total = posFreq['__total__'] || 1;
  const synsetFreq = posFreq[synset.id] || 0;
  return synsetFreq / total;
}

/**
 * Populate an Information Content weight mapping to a smoothing value.
 * 
 * All synsets in wordnet are inserted into the dictionary and
 * mapped to smoothing.
 * 
 * @param wordnet - The wordnet instance
 * @param smoothing - The smoothing value
 * @returns The initialized frequency mapping
 */
async function _initialize(wordnet: Wordnet, smoothing: number): Promise<Freq> {
  const freq: Freq = {};
  
  for (const pos of IC_PARTS_OF_SPEECH) {
    freq[pos] = {};
    const synsets = await wordnet.synsets('', pos);
    for (const synset of synsets) {
      freq[pos][synset.id] = smoothing;
    }
    // Also initialize totals for each part-of-speech
    freq[pos]['__total__'] = smoothing;
  }
  
  // Handle ADJ_SAT as just ADJ
  const adjSatSynsets = await wordnet.synsets('', 's');
  for (const synset of adjSatSynsets) {
    const posFreq = freq['a'];
    if (posFreq) {
      posFreq[synset.id] = smoothing;
    }
  }
  
  return freq;
}

/**
 * Compute Information Content weights from a corpus.
 * 
 * @param corpus - An iterable of string tokens
 * @param wordnet - An instantiated Wordnet object
 * @param distributeWeight - If true, the counts for a word are divided evenly among all synsets for the word
 * @param smoothing - The initial value given to each synset
 * @returns The computed frequency mapping
 */
export async function compute(
  corpus: string[],
  wordnet: Wordnet,
  distributeWeight = true,
  smoothing = 1.0
): Promise<Freq> {
  const freq = await _initialize(wordnet, smoothing);
  const counts = new Map<string, number>();
  
  // Count occurrences
  for (const token of corpus) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  
  const hypernymCache = new Map<Synset, Synset[]>();
  
  for (const [word, count] of counts) {
    const synsets = await wordnet.synsets(word);
    const num = synsets.length;
    if (num === 0) {
      continue;
    }
    
    const weight = distributeWeight ? count / num : count;
    
    for (const synset of synsets) {
      let pos = synset.partOfSpeech;
      if (pos === 's') {
        pos = 'a'; // ADJ_SAT -> ADJ
      }
      if (!IC_PARTS_OF_SPEECH.has(pos)) {
        continue;
      }
      
      const posFreq = freq[pos];
      if (posFreq) {
        posFreq['__total__'] = (posFreq['__total__'] || 0) + weight;
        
        // Update frequency for this synset and all its hypernyms
        const agenda: Array<[Synset, Set<Synset>]> = [[synset, new Set()]];
        
        while (agenda.length > 0) {
          const [ss, seen] = agenda.pop()!;
          
          // Avoid cycles
          if (seen.has(ss)) {
            continue;
          }
          
          posFreq[ss.id] = (posFreq[ss.id] || 0) + weight;
          
          // Get hypernyms using the synset-utils function
          if (!hypernymCache.has(ss)) {
            const hypers = await hypernyms(ss, wordnet);
            hypernymCache.set(ss, hypers);
          }
          
          const cachedHypernyms = hypernymCache.get(ss);
          if (cachedHypernyms) {
            for (const hyp of cachedHypernyms) {
              agenda.push([hyp, new Set([...seen, ss])]);
            }
          }
        }
      }
    }
  }
  
  return freq;
}

/**
 * Load an Information Content mapping from a file.
 * 
 * @param source - A path to an information content weights file
 * @param wordnet - A Wordnet instance with synset identifiers matching the offsets in the weights file
 * @param getSynsetId - A callable that takes a synset offset and part of speech and returns a synset ID
 * @returns The loaded frequency mapping
 * @throws {WnError} If wordnet does not have exactly one lexicon
 */
export async function load(
  _source: string,
  wordnet: Wordnet,
  getSynsetId?: (offset: number, pos: string) => string
): Promise<Freq> {
  const lexicons = await wordnet.lexicons();
  if (lexicons.length !== 1) {
    throw new WnError('Wordnet must have exactly one lexicon');
  }
  
  const firstLexicon = lexicons[0];
  if (!firstLexicon) {
    throw new WnError('No lexicon found');
  }
  
  const lexid = firstLexicon.id;
  if (!getSynsetId) {
    getSynsetId = (offset: number, pos: string) => `${lexid}-${pos}${offset.toString().padStart(8, '0')}`;
  }
  
  const freq = await _initialize(wordnet, 0.0);
  
  // Note: This is a simplified implementation
  // In a real implementation, you would parse the IC file format
  // For now, we'll return the initialized freq with smoothing values
  console.warn('IC file loading is not fully implemented yet');
  
  return freq;
}

 