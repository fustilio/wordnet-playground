declare module 'node-wordnet' {
  export interface WordNetResult {
    synsetOffset: string;
    pos: string;
    lemma: string;
    synonyms: string[];
    gloss: string;
    ptrs: any[];
  }

  export interface WordNetSense {
    synsetOffset: string;
    pos: string;
    lemma: string;
  }

  export default class NodeWordNet {
    constructor();
    
    open(): Promise<void>;
    close(): Promise<void>;
    
    lookup(word: string): Promise<WordNetResult[]>;
    findSense(senseKey: string): Promise<WordNetSense>;
    validForms(word: string): Promise<string[]>;
  }
} 