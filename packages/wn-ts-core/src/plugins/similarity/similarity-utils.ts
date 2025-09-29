/**
 * Shared utilities for similarity calculations
 * 
 * Provides common functionality to reduce duplication across different similarity algorithms.
 */

import type { Synset } from '../../core/types.js';
import { WnError } from '../../core/errors.js';
import type { WordNetCore } from '../../wordnet-kernel.js';
import { shortestPath, lowestCommonHypernyms } from '../../modules/relations/synset-utils.js';

/**
 * Common similarity calculation options
 */
export interface SimilarityOptions {
  posCompatible?: boolean;
  lexiconCompatible?: boolean;
  allowSelfComparison?: boolean;
}

/**
 * Default similarity options
 */
export const DEFAULT_SIMILARITY_OPTIONS: SimilarityOptions = {
  posCompatible: true,
  lexiconCompatible: true,
  allowSelfComparison: true
};

/**
 * Check if two parts of speech are compatible for similarity comparison.
 * 
 * @param pos1 - First part of speech
 * @param pos2 - Second part of speech
 * @param options - Similarity options
 * @throws {WnError} When parts of speech are not compatible
 */
export function checkPosCompatibility(
  pos1: string, 
  pos2: string, 
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): void {
  if (options.posCompatible && pos1 !== pos2) {
    throw new WnError(`Parts of speech must match: ${pos1} != ${pos2}`);
  }
}

/**
 * Check if two synsets are from compatible lexicons for similarity comparison.
 * 
 * @param synset1 - First synset
 * @param synset2 - Second synset
 * @param options - Similarity options
 * @throws {WnError} When lexicons are not compatible
 */
export function checkLexiconCompatibility(
  synset1: Synset, 
  synset2: Synset, 
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): void {
  if (options.lexiconCompatible && synset1.lexicon !== synset2.lexicon) {
    throw new WnError(`Lexicons must match: ${synset1.lexicon} != ${synset2.lexicon}`);
  }
}

/**
 * Check if two synsets are the same (self-comparison).
 * 
 * @param synset1 - First synset
 * @param synset2 - Second synset
 * @param options - Similarity options
 * @returns True if synsets are the same and self-comparison is allowed
 */
export function checkSelfComparison(
  synset1: Synset, 
  synset2: Synset, 
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): boolean {
  if (options.allowSelfComparison && synset1.id === synset2.id) {
    return true;
  }
  return false;
}

/**
 * Validate synsets for similarity comparison.
 * 
 * @param synset1 - First synset
 * @param synset2 - Second synset
 * @param options - Similarity options
 * @returns True if synsets are the same (self-comparison), false otherwise
 * @throws {WnError} When validation fails
 */
export function validateSynsetsForSimilarity(
  synset1: Synset, 
  synset2: Synset, 
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): boolean {
  checkPosCompatibility(synset1.pos, synset2.pos, options);
  checkLexiconCompatibility(synset1, synset2, options);
  return checkSelfComparison(synset1, synset2, options);
}

/**
 * Common similarity calculation result
 */
export interface SimilarityResult {
  score: number;
  distance?: number;
  lcs?: Synset;
  path?: Synset[];
  metadata?: Record<string, any>;
}

/**
 * Create a similarity result
 */
export function createSimilarityResult(
  score: number, 
  metadata: Partial<SimilarityResult> = {}
): SimilarityResult {
  return {
    score,
    ...metadata
  };
}

/**
 * Common error handling for similarity calculations
 */
export function handleSimilarityError(
  error: any, 
  synset1: Synset, 
  synset2: Synset, 
  algorithm: string
): number {
  if (error instanceof WnError) {
    throw error;
  }
  
  // Log the error for debugging but return 0 for similarity
  console.warn(`[${algorithm}] Error calculating similarity between ${synset1.id} and ${synset2.id}:`, error);
  return 0;
}

/**
 * Common path-based similarity calculation
 */
export async function calculatePathSimilarity(
  synset1: Synset,
  synset2: Synset,
  _wordnet: WordNetCore,
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): Promise<SimilarityResult> {
  try {
    // Check for self-comparison
    if (checkSelfComparison(synset1, synset2, options)) {
      return createSimilarityResult(1.0, { distance: 0 });
    }

    // Get shortest path
    const pathArr = await shortestPath(synset1, synset2, _wordnet);
    if (pathArr.length === 0) {
      return createSimilarityResult(0, { distance: Infinity });
    }

    const distance = pathArr.length;
    const score = 1 / (distance + 1);
    
    return createSimilarityResult(score, { 
      distance, 
      path: pathArr 
    });
  } catch (error) {
    const score = handleSimilarityError(error, synset1, synset2, 'PathSimilarity');
    return createSimilarityResult(score);
  }
}

/**
 * Common LCS (Lowest Common Subsumer) based similarity calculation
 */
export async function calculateLcsSimilarity(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore,
  lcsFunction: (s1: Synset, s2: Synset, wn: WordNetCore) => Promise<Synset[]>,
  scoreFunction: (lcs: Synset, s1: Synset, s2: Synset, wn: WordNetCore) => Promise<number>,
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): Promise<SimilarityResult> {
  try {
    // Check for self-comparison
    if (checkSelfComparison(synset1, synset2, options)) {
      return createSimilarityResult(1.0, { lcs: synset1 });
    }

    // Get LCS list
    const lcsList = await lcsFunction(synset1, synset2, wordnet);
    if (lcsList.length === 0) {
      return createSimilarityResult(0);
    }

    const lcs = lcsList[0];
    if (!lcs) {
      return createSimilarityResult(0);
    }

    // Calculate score using provided function
    const score = await scoreFunction(lcs, synset1, synset2, wordnet);
    
    return createSimilarityResult(score, { lcs });
  } catch (error) {
    const score = handleSimilarityError(error, synset1, synset2, 'LcsSimilarity');
    return createSimilarityResult(score);
  }
}

/**
 * Common information content based similarity calculation
 */
export async function calculateIcSimilarity(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore,
  ic: any, // Information content weights
  lcsFunction: (s1: Synset, s2: Synset, ic: any, wn: WordNetCore) => Promise<Synset>,
  icFunction: (synset: Synset, ic: any) => number,
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): Promise<SimilarityResult> {
  try {
    // Check for self-comparison
    if (checkSelfComparison(synset1, synset2, options)) {
      return createSimilarityResult(1.0, { lcs: synset1 });
    }

    // Get most informative LCS
    const lcs = await lcsFunction(synset1, synset2, ic, wordnet);
    const score = icFunction(lcs, ic);
    
    return createSimilarityResult(score, { lcs });
  } catch (error) {
    const score = handleSimilarityError(error, synset1, synset2, 'IcSimilarity');
    return createSimilarityResult(score);
  }
}

/**
 * Common similarity calculation wrapper
 */
export async function calculateSimilarity(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore,
  algorithm: string,
  calculation: () => Promise<SimilarityResult>,
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): Promise<number> {
  try {
    // Validate synsets
    if (validateSynsetsForSimilarity(synset1, synset2, options)) {
      return 1.0;
    }

    // Perform calculation
    const result = await calculation();
    return result.score;
  } catch (error) {
    return handleSimilarityError(error, synset1, synset2, algorithm);
  }
}

/**
 * Common similarity calculation with detailed result
 */
export async function calculateSimilarityDetailed(
  synset1: Synset,
  synset2: Synset,
  wordnet: WordNetCore,
  algorithm: string,
  calculation: () => Promise<SimilarityResult>,
  options: SimilarityOptions = DEFAULT_SIMILARITY_OPTIONS
): Promise<SimilarityResult> {
  try {
    // Validate synsets
    if (validateSynsetsForSimilarity(synset1, synset2, options)) {
      return createSimilarityResult(1.0, { lcs: synset1 });
    }

    // Perform calculation
    return await calculation();
  } catch (error) {
    const score = handleSimilarityError(error, synset1, synset2, algorithm);
    return createSimilarityResult(score);
  }
}

/**
 * Common similarity calculation utilities
 */
export const similarityUtils = {
  /**
   * Normalize similarity score to 0-1 range
   */
  normalizeScore: (score: number, min: number = 0, max: number = 1): number => {
    return Math.max(0, Math.min(1, (score - min) / (max - min)));
  },

  /**
   * Calculate distance from similarity score
   */
  similarityToDistance: (similarity: number): number => {
    return similarity === 0 ? Infinity : 1 / similarity - 1;
  },

  /**
   * Calculate similarity from distance
   */
  distanceToSimilarity: (distance: number): number => {
    return distance === Infinity ? 0 : 1 / (distance + 1);
  },

  /**
   * Check if similarity score is valid
   */
  isValidScore: (score: number): boolean => {
    return typeof score === 'number' && !isNaN(score) && isFinite(score) && score >= 0 && score <= 1;
  },

  /**
   * Clamp similarity score to valid range
   */
  clampScore: (score: number): number => {
    return Math.max(0, Math.min(1, score));
  }
};
