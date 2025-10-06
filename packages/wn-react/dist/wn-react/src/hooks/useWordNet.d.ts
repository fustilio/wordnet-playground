import { WordnetOptions, Synset } from '../../../wn-ts-core/src';
export interface UseWordNetOptions extends Partial<WordnetOptions> {
    autoInitialize?: boolean;
    lexicon?: string | string[];
}
export interface UseWordNetReturn {
    search: (term: string, options?: {
        pos?: string;
        limit?: number;
    }) => Promise<void>;
    define: (term: string, pos?: string) => Promise<void>;
    translate: (term: string, fromLang: string, toLang: string) => Promise<void>;
    related: (term: string, relationType: 'hypernym' | 'hyponym') => Promise<void>;
    results: Synset[];
    definitions: Array<{
        text: string;
        pos: string;
        synsetId: string;
    }>;
    translations: string[];
    relations: Synset[];
    loading: boolean;
    error: Error | null;
    initialized: boolean;
    initialize: () => Promise<void>;
    close: () => Promise<void>;
    getHypernyms?: (synsetId: string) => Promise<Synset[]>;
    getHyponyms?: (synsetId: string) => Promise<Synset[]>;
    getPathSimilarity?: (synset1: string, synset2: string) => Promise<number>;
    getWuPalmerSimilarity?: (synset1: string, synset2: string) => Promise<number>;
}
export declare function useWordNet(options?: UseWordNetOptions): UseWordNetReturn;
//# sourceMappingURL=useWordNet.d.ts.map