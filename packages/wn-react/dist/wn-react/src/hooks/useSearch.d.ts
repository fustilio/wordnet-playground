import { Synset } from '../../../wn-ts-core/src';
export interface UseSearchOptions {
    lexicon?: string | string[];
    autoInitialize?: boolean;
}
export interface UseSearchReturn {
    search: (term: string, options?: {
        pos?: string;
        limit?: number;
    }) => Promise<void>;
    results: Synset[];
    loading: boolean;
    error: Error | null;
    initialized: boolean;
}
export declare function useSearch(options?: UseSearchOptions): UseSearchReturn;
//# sourceMappingURL=useSearch.d.ts.map