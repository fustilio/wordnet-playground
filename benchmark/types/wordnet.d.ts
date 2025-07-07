declare module 'wordnet' {
  export interface WordNetDefinition {
    meta: {
      synsetType: string;
      words: string[];
      pointers: Array<{
        pointerSymbol: string;
        synsetOffset: string;
      }>;
    };
    glossary: string;
  }

  export interface WordNetModule {
    init(): Promise<void>;
    lookup(word: string): Promise<WordNetDefinition[]>;
    list(): Promise<string[]>;
  }

  const wordnet: WordNetModule;
  export default wordnet;
} 