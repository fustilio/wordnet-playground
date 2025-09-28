
// Import core types from wn-ts-core
import type { PartOfSpeech, Word, Synset, Sense, Definition, Relation } from 'wn-ts-core';

// Import existing types from wn-ts-web
import type { 
  CacheInfo,
  DatabaseStorageInfo
} from '../types/index.js';

// Re-export core types for convenience
export type { PartOfSpeech, Word, Synset, Sense, Definition, Relation };

// Re-export existing types
export type { 
  CacheInfo,
  DatabaseStorageInfo
};

// Use core types directly as query result types since that's what the orchestrator returns
export type WordQueryResult = Word;
export type SynsetQueryResult = Synset;
export type SenseInfo = Sense;
export type DefinitionInfo = Definition;
export type WordInfo = Word;
export type RelationInfo = Relation;

// Use return types from core library methods instead of redefining
import type { LexiconStatistics } from '../types/index.js';
export type { LexiconStatistics };
export type OverallStatistics = Awaited<ReturnType<import('wn-ts-core').WordNetKernel['getStatistics']>>;

export interface MemoryQueryTestResult {
  lexicons: {
    success: boolean;
    count?: number;
    error?: string;
  };
  query: {
    success: boolean;
    words?: number;
    synsets?: number;
    error?: string;
  };
}

export interface WordNetWorkerAPI {
    initializeWordNet(lexiconId?: string): Promise<{
      success: boolean;
      error?: string;
      data?: {
        lexiconStats: LexiconStatistics[];
        statistics: OverallStatistics;
        hasInitialState: boolean;
      };
    }>;
    
    loadPackage(packageId: string, options?: { onProgress?: (progress: number) => void }): Promise<{
      success: boolean;
      data?: {
        statistics: OverallStatistics;
        lexiconStats: LexiconStatistics[];
      };
      error?: string;
    }>;
    
    getStatistics(): Promise<{
      success: boolean;
      data?: OverallStatistics;
      error?: string;
    }>;
    
    queryWords(term: string, pos?: PartOfSpeech): Promise<{
      success: boolean;
      data?: WordQueryResult[];
      error?: string;
    }>;
    
    querySynsets(term: string, pos?: PartOfSpeech): Promise<{
      success: boolean;
      data?: SynsetQueryResult[];
      error?: string;
    }>;
    
    querySenses(term: string, pos?: PartOfSpeech): Promise<{
      success: boolean;
      data?: SenseInfo[];
      error?: string;
    }>;
    
    clearData(): Promise<{
      success: boolean;
      error?: string;
    }>;
    
    getStatus(): Promise<{
      success: boolean;
      data?: {
        lexiconStats: LexiconStatistics[];
        statistics: OverallStatistics;
        hasData: boolean;
      };
      error?: string;
    }>;
    
    hasLoadedData(packageId?: string): Promise<{
      success: boolean;
      data?: {
        hasPackage?: boolean;
        hasData?: boolean;
        loadedCount: number;
      };
      error?: string;
    }>;
    
    testMemoryQueries(): Promise<{
      success: boolean;
      data?: MemoryQueryTestResult;
      error?: string;
    }>;
    
    // Additional methods needed to replace direct dataLoader access
    clearCache(): Promise<{
      success: boolean;
      error?: string;
    }>;
    
    getCacheInfo(): Promise<{
      success: boolean;
      data?: CacheInfo;
      error?: string;
    }>;
    
    searchWordsInLexicon(term: string, lexicon: string, language?: string): Promise<{
      success: boolean;
      data?: WordQueryResult[];
      error?: string;
    }>;
    
    // Advanced query methods
    getSensesByWordIdOrForm(wordIdOrForm: string): Promise<{
      success: boolean;
      data?: SenseInfo[];
      error?: string;
    }>;
    
    getWordsBySynsetAndLanguage(synsetId: string, language: string): Promise<{
      success: boolean;
      data?: WordInfo[];
      error?: string;
    }>;
    
    getDefinitionsBySynsetId(synsetId: string): Promise<{
      success: boolean;
      data?: DefinitionInfo[];
      error?: string;
    }>;
    
    getSynsetById(synsetId: string): Promise<{
      success: boolean;
      data?: SynsetQueryResult;
      error?: string;
    }>;
    
    getWordsByIliAndLanguage(ili: string, language: string): Promise<{
      success: boolean;
      data?: WordInfo[];
      error?: string;
    }>;
    
    getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<{
      success: boolean;
      data?: WordInfo[];
      error?: string;
    }>;
    
    // NEW: Find ILI identifier for a given synset by querying CILI package
    getIliForSynset(synsetId: string): Promise<{
      success: boolean;
      data?: string; // The ILI identifier
      error?: string;
    }>;
    
    getLexiconStatistics(): Promise<{
      success: boolean;
      data?: LexiconStatistics[];
      error?: string;
    }>;
    
    // Statistics and analytics
    getPartOfSpeechDistribution(): Promise<{
      success: boolean;
      data?: Record<string, number>;
      error?: string;
    }>;
    
    // Database persistence
    flushDatabase(): Promise<{
      success: boolean;
      error?: string;
    }>;
    
    // Database information
    isDatabasePersistent(): Promise<{
      success: boolean;
      data?: boolean;
      error?: string;
    }>;
    
    getDatabaseStorageInfo(): Promise<{
      success: boolean;
      data?: DatabaseStorageInfo;
      error?: string;
    }>;
    
    // Enhanced Relations Methods - TODO: Implement in worker
    // For now, these methods are only available through the kernel, not the worker
    // Hierarchical relations
    // getHypernyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getHyponyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getInstanceHypernyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getInstanceHyponyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Part-whole relations
    // getMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getHolonyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getPartMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getMemberMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getSubstanceMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getPortionMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getLocationMeronyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Semantic role relations
    // getAgents(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getPatients(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getInstruments(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getResults(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getSources(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getTargets(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getLocations(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getDirections(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getManners(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getRoles(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Domain relations
    // getDomainTopics(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getDomainRegions(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Causal relations
    // getCauses(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getEntailments(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Similarity relations
    // getSimilar(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Opposition relations
    // getAntonyms(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Gender relations
    // getFeminine(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getMasculine(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Size relations
    // getDiminutives(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getAugmentatives(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // Generic query methods
    // getRelationsByType(synsetId: string, relationType: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getRelationsByCategory(synsetId: string, category: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: RelationResult[];
    //   error?: string;
    // }>;
    
    // getAvailableRelationTypes(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: string[];
    //   error?: string;
    // }>;
    
    // getRelationStatsByCategory(synsetId: string, lexicon?: string): Promise<{
    //   success: boolean;
    //   data?: Record<string, number>;
    //   error?: string;
    // }>;
    
    // Utility methods
    // getRelationDescriptions(): Promise<{
    //   success: boolean;
    //   data?: Record<string, string>;
    //   error?: string;
    // }>;
    
    // getRelationCategories(): Promise<{
    //   success: boolean;
    //   data?: Record<string, string[]>;
    //   error?: string;
    // }>;
    
    // isValidRelationType(relationType: string): Promise<{
    //   success: boolean;
    //   data?: boolean;
    //   error?: string;
    // }>;
    
    // getRelationTypesByCategory(category: string): Promise<{
    //   success: boolean;
    //   data?: string[];
    //   error?: string;
    // }>;
  }
  
  // Enhanced Relations Types
  export interface RelationResult {
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }

  // Common type for relation method return types
  export type RelationMethodReturn = Promise<RelationResult[]>;
  
  // Common type for relation method signatures
  export type RelationMethod = (synsetId: string, lexicon?: string) => RelationMethodReturn;
  
  // Common type for utility method return types
  export type RelationUtilityMethod<T> = () => Promise<T>;