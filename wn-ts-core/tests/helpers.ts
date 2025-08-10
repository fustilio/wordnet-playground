import { BaseWordnet } from '../src/wordnet';
import type { Word, Sense, Synset, Lexicon, PartOfSpeech, ILI, Project } from '../src/types';

type WordsFn = (form: string, pos?: PartOfSpeech) => Promise<Word[]>;
type SynsetFn = (id: string) => Promise<Synset | undefined>;

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
        this.synsetFn = options.synset || (async () => undefined);
    }

    async words(form: string, pos?: PartOfSpeech): Promise<Word[]> {
        return this.wordsFn(form, pos);
    }

    async synset(synsetId: string): Promise<Synset | undefined> {
        return this.synsetFn(synsetId);
    }
    
    // Implement all other abstract methods with default behavior
    async lexicons(): Promise<Lexicon[]> { return []; }
    async expandedLexicons(): Promise<Lexicon[]> { return []; }
    async senses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]> { return []; }
    async synsets(form: string, pos?: PartOfSpeech, ili?: string): Promise<Synset[]> { return []; }
    async word(wordId: string): Promise<Word | undefined> { return undefined; }
    async sense(senseId: string): Promise<Sense | undefined> { return undefined; }
    async ili(iliId: string): Promise<ILI | undefined> { return undefined; }
    async ilis(status?: string): Promise<ILI[]> { return []; }
    async getProjects(): Promise<Project[]> { return []; }
    async getStatistics() { return { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 }; }
    async getLexiconStatistics(lexiconId?: string) { return []; }
    async getDataQualityMetrics() { return { synsetsWithILI: 0, synsetsWithoutILI: 0, iliCoveragePercentage: 0, emptySynsets: 0, synsetsWithDefinitions: 0 }; }
    async getPartOfSpeechDistribution() { return {}; }
    async getSynsetSizeAnalysis() { return { averageSize: 0, maxSize: 0, minSize: 0, sizeDistribution: {} }; }
    async close() { /* no-op */ }
}
