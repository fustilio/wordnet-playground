/**
 * Relations hook - get word relations (hypernyms, hyponyms, etc.)
 */

import { useState, useCallback } from 'react';
import { useWordNet } from './useWordNet.js';
import type { Synset } from 'wn-ts-core';

export interface UseRelationsOptions {
  lexicon?: string | string[];
  autoInitialize?: boolean;
}

export interface UseRelationsReturn {
  getHypernyms: (term: string) => Promise<void>;
  getHyponyms: (term: string) => Promise<void>;
  getMeronyms: (term: string) => Promise<void>;
  getHolonyms: (term: string) => Promise<void>;
  hypernyms: Synset[];
  hyponyms: Synset[];
  meronyms: Synset[];
  holonyms: Synset[];
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

export function useRelations(options: UseRelationsOptions = {}): UseRelationsReturn {
  const { related, relations, loading, error, initialized, getHypernyms, getHyponyms } = useWordNet(options);

  const [hypernyms, setHypernyms] = useState<Synset[]>([]);
  const [hyponyms, setHyponyms] = useState<Synset[]>([]);
  const [meronyms, setMeronyms] = useState<Synset[]>([]);
  const [holonyms, setHolonyms] = useState<Synset[]>([]);

  const getHypernymsForTerm = useCallback(async (term: string) => {
    await related(term, 'hypernym');
    setHypernyms(relations);
  }, [related, relations]);

  const getHyponymsForTerm = useCallback(async (term: string) => {
    await related(term, 'hyponym');
    setHyponyms(relations);
  }, [related, relations]);

  const getMeronymsForTerm = useCallback(async (term: string) => {
    // This would need to be implemented in the core library
    console.warn('Meronyms not yet implemented');
    setMeronyms([]);
  }, []);

  const getHolonymsForTerm = useCallback(async (term: string) => {
    // This would need to be implemented in the core library
    console.warn('Holonyms not yet implemented');
    setHolonyms([]);
  }, []);

  return {
    getHypernyms: getHypernymsForTerm,
    getHyponyms: getHyponymsForTerm,
    getMeronyms: getMeronymsForTerm,
    getHolonyms: getHolonymsForTerm,
    hypernyms,
    hyponyms,
    meronyms,
    holonyms,
    loading,
    error,
    initialized,
  };
}
