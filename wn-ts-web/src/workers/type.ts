
export interface WordNetWorkerAPI {
    initializeWordNet(lexiconId?: string): Promise<{
      success: boolean;
      error?: string;
      data?: {
        lexiconStats: any[];
        statistics: any;
        hasInitialState: boolean;
      };
    }>;
    
    loadPackage(packageId: string, options?: { onProgress?: (progress: number) => void }): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    loadDemoData(options?: { onProgress?: (progress: number) => void }): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    getStatistics(): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    queryWords(term: string, pos?: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    querySynsets(term: string, pos?: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    querySenses(term: string, pos?: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    clearData(): Promise<{
      success: boolean;
      error?: string;
    }>;
    
    getStatus(): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    hasLoadedData(packageId?: string): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    testMemoryQueries(): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    // Additional methods needed to replace direct dataLoader access
    clearCache(): Promise<{
      success: boolean;
      error?: string;
    }>;
    
    getCacheInfo(): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    searchWordsInLexicon(term: string, lexicon: string, language?: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    // Advanced query methods
    getSensesByWordIdOrForm(wordIdOrForm: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    getWordsBySynsetAndLanguage(synsetId: string, language: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    getDefinitionsBySynsetId(synsetId: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    getSynsetById(synsetId: string): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
    
    getWordsByIliAndLanguage(ili: string, language: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    getLexiconStatistics(): Promise<{
      success: boolean;
      data?: any[];
      error?: string;
    }>;
    
    // Statistics and analytics
    getPartOfSpeechDistribution(): Promise<{
      success: boolean;
      data?: Record<string, number>;
      error?: string;
    }>;
  }