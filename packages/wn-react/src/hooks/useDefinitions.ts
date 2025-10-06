/**
 * Definitions hook - get word definitions
 */

import { useState, useCallback } from 'react';
import { useWordNet } from './useWordNet.js';

export interface UseDefinitionsOptions {
  lexicon?: string | string[];
  autoInitialize?: boolean;
}

export interface UseDefinitionsReturn {
  getDefinitions: (term: string, pos?: string) => Promise<void>;
  definitions: Array<{ text: string; pos: string; synsetId: string }>;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

export function useDefinitions(options: UseDefinitionsOptions = {}): UseDefinitionsReturn {
  const { define, definitions, loading, error, initialized } = useWordNet(options);

  return {
    getDefinitions: define,
    definitions,
    loading,
    error,
    initialized,
  };
}
