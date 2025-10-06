/**
 * Simple search hook - just search functionality
 */

import { useState, useCallback } from 'react';
import { useWordNet } from './useWordNet.js';
import type { Synset } from 'wn-ts-core';

export interface UseSearchOptions {
  lexicon?: string | string[];
  autoInitialize?: boolean;
}

export interface UseSearchReturn {
  search: (term: string, options?: { pos?: string; limit?: number }) => Promise<void>;
  results: Synset[];
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { search, results, loading, error, initialized } = useWordNet(options);

  return {
    search,
    results,
    loading,
    error,
    initialized,
  };
}
