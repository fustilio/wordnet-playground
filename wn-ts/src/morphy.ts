/**
 * Morphological analysis for lemmatization.
 * 
 * This module provides morphological analysis capabilities for
 * finding base forms of words, matching the Python wn.morphy implementation.
 */

import type { Wordnet } from './wordnet.js';
import type { PartOfSpeech } from './types.js';

export type MorphyResult = Partial<Record<PartOfSpeech | 'null', Set<string>>>;

// Exception mapping for irregular forms
type POSExceptionMap = Record<string, Set<string>>;
type ExceptionMap = Partial<Record<PartOfSpeech, POSExceptionMap>>;

// Morphological rules: (suffix, replacement, system)
type Rule = [string, string, number];

// System flags for rule compatibility
const SYSTEM = {
  PWN: 1,
  NLTK: 2,
  WN: 4,
  ALL: 7
} as const;

// Detachment rules for different parts of speech
const DETACHMENT_RULES: Partial<Record<PartOfSpeech, Rule[]>> = {
  'n': [
    ['s', '', SYSTEM.ALL],
    ['ces', 'x', SYSTEM.WN],
    ['ses', 's', SYSTEM.ALL],
    ['ves', 'f', SYSTEM.NLTK | SYSTEM.WN],
    ['ives', 'ife', SYSTEM.WN],
    ['xes', 'x', SYSTEM.ALL],
    ['xes', 'xis', SYSTEM.WN],
    ['zes', 'z', SYSTEM.ALL],
    ['ches', 'ch', SYSTEM.ALL],
    ['shes', 'sh', SYSTEM.ALL],
    ['men', 'man', SYSTEM.ALL],
    ['ies', 'y', SYSTEM.ALL],
  ],
  'v': [
    ['s', '', SYSTEM.ALL],
    ['ies', 'y', SYSTEM.ALL],
    ['es', 'e', SYSTEM.ALL],
    ['es', '', SYSTEM.ALL],
    ['ed', 'e', SYSTEM.ALL],
    ['ed', '', SYSTEM.ALL],
    ['ing', 'e', SYSTEM.ALL],
    ['ing', '', SYSTEM.ALL],
  ],
  'a': [
    ['er', '', SYSTEM.ALL],
    ['est', '', SYSTEM.ALL],
    ['er', 'e', SYSTEM.ALL],
    ['est', 'e', SYSTEM.ALL],
  ],
  'r': [
    ['er', '', SYSTEM.ALL],
    ['est', '', SYSTEM.ALL],
    ['er', 'e', SYSTEM.ALL],
    ['est', 'e', SYSTEM.ALL],
  ]
};

/**
 * A morphological analyzer for finding base forms of words.
 * 
 * Objects of this class are callables that take a wordform and an
 * optional part of speech and return a dictionary mapping parts of
 * speech to lemmas. If objects of this class are not created with a
 * Wordnet object, the returned lemmas may be invalid.
 */
export class Morphy {
  private wordnet: Wordnet | undefined;
  private _initialized: boolean;
  private _initPromise: Promise<void> | undefined;
  private _exceptions: ExceptionMap;
  private _all_lemmas: Partial<Record<PartOfSpeech, Set<string>>>;
  private _rules: Partial<Record<PartOfSpeech, Rule[]>>;

  constructor(wordnet?: Wordnet) {
    this.wordnet = wordnet;
    
    // Filter rules to only include WN system rules
    this._rules = {
      'n': DETACHMENT_RULES['n']?.filter(rule => rule[2] & SYSTEM.WN) || [],
      'v': DETACHMENT_RULES['v']?.filter(rule => rule[2] & SYSTEM.WN) || [],
      'a': DETACHMENT_RULES['a']?.filter(rule => rule[2] & SYSTEM.WN) || [],
      'r': DETACHMENT_RULES['r']?.filter(rule => rule[2] & SYSTEM.WN) || [],
    };

    // Initialize exception mapping and lemma sets
    this._exceptions = {
      'n': {},
      'v': {},
      'a': {},
      'r': {}
    };
    
    this._all_lemmas = {
      'n': new Set(),
      'v': new Set(),
      'a': new Set(),
      'r': new Set()
    };

    if (wordnet) {
      this._initPromise = this._initializeFromWordnet();
      this._initialized = false; // Will be set to true after initialization completes
    } else {
      this._initialized = false;
    }
  }

  /**
   * Initialize the morphological analyzer from a wordnet.
   */
  private async _initializeFromWordnet(): Promise<void> {
    if (!this.wordnet) return;

    // Get words for all parts of speech
    const posList: PartOfSpeech[] = ['n', 'v', 'a', 'r'];
    for (const pos of posList) {
      const words = await this.wordnet.words('', pos) as import('./types.js').Word[];
      for (const word of words) {
        const wordPos = pos;
        if (!wordPos || !this._exceptions[wordPos]) continue;
        const posExc = this._exceptions[wordPos]!;
        const forms = (word.forms || []) as import('./types.js').Form[];
        
        // Handle cases where forms might be missing (e.g., in test mocks)
        let lemma: string | undefined;
        if (forms.length > 0 && forms[0]?.writtenForm) {
          lemma = forms[0].writtenForm;
        } else if ('id' in word && typeof word.id === 'string') {
          // Extract lemma from id (e.g., "test-example-n" -> "example")
          const idParts = word.id.split('-');
          if (idParts.length >= 3) {
            // Format is typically: prefix-lemma-pos
            // So lemma is the second-to-last part (before the POS)
            lemma = idParts[idParts.length - 2];
          } else if (idParts.length === 2) {
            // Format might be: lemma-pos
            lemma = idParts[0];
          }
        }
        
        if (lemma && this._all_lemmas[wordPos]) {
          this._all_lemmas[wordPos]!.add(lemma);
        }
        
        // Map other forms to the lemma
        for (let i = 1; i < forms.length; i++) {
          const otherForm = forms[i]?.writtenForm;
          if (otherForm && lemma) {
            if (otherForm in posExc) {
              posExc[otherForm]!.add(lemma);
            } else {
              posExc[otherForm] = new Set([lemma]);
            }
          }
        }
      }
    }
    
    // Mark initialization as complete
    this._initialized = true;
  }

  /**
   * Callable interface - find the base forms of a word.
   * 
   * @param form - The word form to analyze
   * @param pos - The part of speech (optional)
   * @returns A mapping of parts of speech to sets of base forms
   */
  async __call__(form: string, pos?: PartOfSpeech): Promise<MorphyResult> {
    return this.analyze(form, pos);
  }

  /**
   * Find the base forms of a word.
   * 
   * @param form - The word form to analyze
   * @param pos - The part of speech (optional)
   * @returns A mapping of parts of speech to sets of base forms
   */
  async analyze(form: string, pos?: PartOfSpeech): Promise<MorphyResult> {
    // Wait for initialization to complete if it's in progress
    if (this._initPromise) {
      await this._initPromise;
    }
    
    const result: MorphyResult = {};
    const posList = pos ? [pos] : ['n', 'v', 'a', 'r'] as PartOfSpeech[];
    const noPosForms = result['null'] || new Set();
    for (const _pos of posList) {
      if (!(_pos in DETACHMENT_RULES)) continue;
      const candidates = await this._morphstr(form, _pos);
      // For uninitialized Morphy, always include the original form
      if (!this._initialized) {
        candidates.add(form);
      }
      // Remove forms that are already in the null pos set
      const filtered = new Set<string>();
      for (const candidate of candidates) {
        if (!noPosForms.has(candidate)) {
          filtered.add(candidate);
        }
      }
      result[_pos] = filtered;
    }
    if (!this._initialized && !pos) {
      result['null'] = new Set([form]);
    }
    return result;
  }

  /**
   * Apply morphological rules to a word form for a specific part of speech.
   * 
   * @param form - The word form to analyze
   * @param pos - The part of speech
   * @returns Set of candidate lemmas
   */
  private async _morphstr(form: string, pos: PartOfSpeech): Promise<Set<string>> {
    const candidates = new Set<string>();
    if (this._initialized) {
      const allLemmas = this._all_lemmas[pos];
      // If the form is already a lemma, include it
      if (allLemmas && allLemmas.has(form)) {
        candidates.add(form);
      }
      // Add exceptions
      const exceptions = this._exceptions[pos]?.[form] || new Set();
      for (const exception of exceptions) {
        if (allLemmas && allLemmas.has(exception)) {
          candidates.add(exception);
        }
      }
    }
    // Apply morphological rules
    const rules = this._rules[pos] || [];
    for (const [suffix, replacement] of rules) {
      if (form.endsWith(suffix) && suffix.length < form.length) {
        const candidate = form.slice(0, -suffix.length) + replacement;
        if (!this._initialized || (this._all_lemmas[pos] && this._all_lemmas[pos]!.has(candidate))) {
          candidates.add(candidate);
        }
      }
    }
    return candidates;
  }

  /**
   * Legacy method for backward compatibility.
   * 
   * @param word - The word to analyze
   * @param pos - The part of speech (optional)
   * @returns A mapping of parts of speech to sets of base forms
   */
  async analyzeWord(word: string, pos?: PartOfSpeech): Promise<MorphyResult> {
    return this.analyze(word, pos);
  }
}

/**
 * Create a Morphy instance.
 * 
 * @param wordnet - Optional Wordnet instance for validation
 * @returns A new Morphy instance
 */
export function createMorphy(wordnet?: Wordnet): Morphy {
  return new Morphy(wordnet);
}

/**
 * Default morphy instance for convenience.
 */
export const morphy = new Morphy(); 