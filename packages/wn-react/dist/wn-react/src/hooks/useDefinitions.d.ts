/**
 * Definitions hook - get word definitions
 */
export interface UseDefinitionsOptions {
    lexicon?: string | string[];
    autoInitialize?: boolean;
}
export interface UseDefinitionsReturn {
    getDefinitions: (term: string, pos?: string) => Promise<void>;
    definitions: Array<{
        text: string;
        pos: string;
        synsetId: string;
    }>;
    loading: boolean;
    error: Error | null;
    initialized: boolean;
}
export declare function useDefinitions(options?: UseDefinitionsOptions): UseDefinitionsReturn;
//# sourceMappingURL=useDefinitions.d.ts.map