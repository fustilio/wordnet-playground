import { Synset } from '../../../wn-ts-core/src';
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
export declare function useRelations(options?: UseRelationsOptions): UseRelationsReturn;
//# sourceMappingURL=useRelations.d.ts.map