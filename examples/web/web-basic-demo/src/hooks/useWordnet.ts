import { useWordNet } from 'wn-react';

export interface WordnetConfig {
  lang?: string;
  autoLoad?: boolean;
}

export interface WordDefinition {
  text: string;
  example?: string;
}

export interface WordResult {
  word: string;
  partOfSpeech: string;
  definitions: WordDefinition[];
}

export interface UseWordnetReturn {
  // State
  loading: boolean;
  error: string | null;
  ready: boolean;
  
  // Basic operations
  getDefinitions: (word: string) => Promise<WordResult[]>;
  searchWords: (term: string) => Promise<WordResult[]>;
  
  // Utility
  isReady: () => boolean;
}

/**
 * Simplified WordNet hook for basic operations
 * 
 * Usage:
 * ```tsx
 * const { getDefinitions, loading, ready } = useWordnet({ lang: 'en-US' });
 * 
 * const definitions = await getDefinitions('water');
 * ```
 */
export function useWordnet(config: WordnetConfig = {}): UseWordnetReturn {
  const { lang = 'en-US', autoLoad = true } = config;
  
  // Use the main WordNet hook
  const {
    search,
    results,
    loading,
    error,
    initialized
  } = useWordNet({
    lexicon: 'oewn:2024',
    autoInitialize: autoLoad
  });

  const isReady = () => {
    return initialized && !loading && !error;
  };

  const getDefinitions = async (word: string): Promise<any[]> => {
    if (!isReady()) {
      throw new Error('WordNet is not ready. Please wait for initialization to complete.');
    }

    try {
      await search(word);
      return results || [];
    } catch (err) {
      throw new Error(`Failed to get definitions for "${word}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const searchWords = async (term: string): Promise<any[]> => {
    if (!isReady()) {
      throw new Error('WordNet is not ready. Please wait for initialization to complete.');
    }

    try {
      await search(term);
      return results || [];
    } catch (err) {
      throw new Error(`Failed to search for "${term}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return {
    loading,
    error: error?.message || null,
    ready: isReady(),
    getDefinitions,
    searchWords,
    isReady
  };
}
