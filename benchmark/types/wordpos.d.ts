declare module 'wordpos' {
  export interface POSResult {
    nouns: string[];
    verbs: string[];
    adjectives: string[];
    adverbs: string[];
  }

  export interface WordPOSOptions {
    count?: number;
    pos?: string;
  }

  export default class WordPOS {
    constructor();
    
    getPOS(text: string, callback: (result: POSResult) => void): void;
    getNouns(text: string, callback: (nouns: string[]) => void): void;
    getVerbs(text: string, callback: (verbs: string[]) => void): void;
    getAdjectives(text: string, callback: (adjectives: string[]) => void): void;
    getAdverbs(text: string, callback: (adverbs: string[]) => void): void;
    
    lookup(word: string, callback: (result: any[]) => void): void;
    rand(options: WordPOSOptions, callback: (words: string[]) => void): void;
  }
} 