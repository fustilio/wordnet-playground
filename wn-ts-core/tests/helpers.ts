import { BaseWordnet } from '../src/wordnet';
import type { Word, Sense, Synset, Lexicon, PartOfSpeech, ILI, Project, WordQuery, SynsetQuery, SenseQuery } from '../src/types';

type WordsFn = (query?: WordQuery) => Promise<Word[]>;
type SynsetFn = (id: string) => Promise<Synset>;

interface TestWordnetOptions {
    words?: WordsFn;
    synset?: SynsetFn;
}

/**
 * A mock Wordnet class for testing. Extends BaseWordnet to ensure
 * type safety and proper implementation of all abstract methods.
 * Allows overriding specific methods for different test scenarios.
 */
export class TestWordnet extends BaseWordnet {
    private wordsFn: WordsFn;
    private synsetFn: SynsetFn;

    constructor(options: TestWordnetOptions = {}) {
        super({ lexicon: 'test-en' });
        this.wordsFn = options.words || (async () => []);
        this.synsetFn = options.synset || (async () => {
            throw new Error('Mock synset not implemented');
        });
    }

    async words(query?: WordQuery): Promise<Word[]> {
        return this.wordsFn(query);
    }

    async synset(synsetId: string): Promise<Synset> {
        return this.synsetFn(synsetId);
    }
    
    // Implement all other abstract methods with default behavior
    async lexicons(): Promise<Lexicon[]> { return []; }
    async expandedLexicons(): Promise<Lexicon[]> { return []; }
    async senses(query?: SenseQuery): Promise<Sense[]> { return []; }
    async synsets(query?: SynsetQuery): Promise<Synset[]> { return []; }
    async word(wordId: string): Promise<Word> { 
        throw new Error(`Mock word not implemented for ${wordId}`);
    }
    async sense(senseId: string): Promise<Sense> { 
        throw new Error(`Mock sense not implemented for ${senseId}`);
    }
    async ili(iliId: string): Promise<ILI> { 
        throw new Error(`Mock ili not implemented for ${iliId}`);
    }
    async ilis(status?: string): Promise<ILI[]> { return []; }
    async getProjects(): Promise<Project[]> { return []; }
    async getStatistics() { return { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 }; }
    async getLexiconStatistics(lexiconId?: string) { return []; }
    async getDataQualityMetrics() { return { synsetsWithILI: 0, synsetsWithoutILI: 0, iliCoveragePercentage: 0, emptySynsets: 0, synsetsWithDefinitions: 0 }; }
    async getPartOfSpeechDistribution() { return {}; }
    async getSynsetSizeAnalysis() { return { averageSize: 0, maxSize: 0, minSize: 0, sizeDistribution: {} }; }
    async close() { /* no-op */ }
}
