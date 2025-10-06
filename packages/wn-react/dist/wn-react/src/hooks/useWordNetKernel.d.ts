import { WordnetOptions, Word, Sense, Synset, Lexicon, ILI, WordQuery, SynsetQuery, SenseQuery } from '../../../wn-ts-core/src';
export interface UseWordNetKernelOptions extends Partial<WordnetOptions> {
    lexicon?: string | string[];
    plugins?: string[];
}
export interface UseWordNetKernelReturn {
    wordnet: any | null;
    loading: boolean;
    error: Error | null;
    initialized: boolean;
    initialize: (lexicon?: string | string[], options?: UseWordNetKernelOptions) => Promise<void>;
    close: () => Promise<void>;
    words: (query?: WordQuery) => Promise<Word[]>;
    word: (wordId: string) => Promise<Word | undefined>;
    synsets: (query?: SynsetQuery) => Promise<Synset[]>;
    synset: (synsetId: string) => Promise<Synset | undefined>;
    senses: (query?: SenseQuery) => Promise<Sense[]>;
    sense: (senseId: string) => Promise<Sense | undefined>;
    lexicons: () => Promise<Lexicon[]>;
    ili: (iliId: string) => Promise<ILI | undefined>;
    ilis: (status?: string) => Promise<ILI[]>;
    getHypernyms?: (synsetId: string) => Promise<Synset[]>;
    getHyponyms?: (synsetId: string) => Promise<Synset[]>;
    getMeronyms?: (synsetId: string) => Promise<Synset[]>;
    getHolonyms?: (synsetId: string) => Promise<Synset[]>;
    getPathSimilarity?: (synset1: string, synset2: string) => Promise<number>;
    getWuPalmerSimilarity?: (synset1: string, synset2: string) => Promise<number>;
    getTranslations?: (synsetId: string, targetLanguage?: string) => Promise<string[]>;
    getPlugins: () => string[];
    hasPlugin: (pluginName: string) => boolean;
}
export declare function useWordNetKernel(options?: UseWordNetKernelOptions): UseWordNetKernelReturn;
//# sourceMappingURL=useWordNetKernel.d.ts.map