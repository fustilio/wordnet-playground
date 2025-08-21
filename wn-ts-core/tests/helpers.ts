import { BaseWordnet } from '../src/wordnet';
import type { Word, Sense, Synset, Lexicon, ILI, Project, WordQuery, SynsetQuery, SenseQuery } from '../src/types';

export class MockWordnetClient extends BaseWordnet {
  async words(query?: WordQuery): Promise<Word[]> { return []; }
  async synsets(query?: SynsetQuery): Promise<Synset[]> { return []; }
  async senses(query?: SenseQuery): Promise<Sense[]> { return []; }
  async word(wordId: string): Promise<Word | undefined> { return undefined; }
  async synset(synsetId: string): Promise<Synset | undefined> { return undefined; }
  async sense(senseId: string): Promise<Sense | undefined> { return undefined; }
  async ili(iliId: string): Promise<ILI | undefined> { return undefined; }
  async ilis(status?: string): Promise<ILI[]> { return []; }
  async lexicons(): Promise<Lexicon[]> { return []; }
  async lexicon(lexiconId: string): Promise<Lexicon | undefined> { return undefined; }
  async projects(): Promise<Project[]> { return []; }
  async project(projectId: string): Promise<Project | undefined> { return undefined; }
  async searchWords(query: string): Promise<Word[]> { return []; }
  async searchSynsets(query: string): Promise<Synset[]> { return []; }
  async wordsByForm(form: string): Promise<Word[]> { return []; }
  async synsetsByILI(ili: string): Promise<Synset[]> { return []; }
  async wordsByILI(ili: string): Promise<Word[]> { return []; }
  async wordsBySynset(synsetId: string): Promise<Word[]> { return []; }
  async sensesByWord(wordId: string): Promise<Sense[]> { return []; }
  async sensesBySynset(synsetId: string): Promise<Sense[]> { return []; }
  async relationsBySynset(synsetId: string): Promise<any[]> { return []; }
  async relationsByWord(wordId: string): Promise<any[]> { return []; }
  async examplesBySynset(synsetId: string): Promise<any[]> { return []; }
  async examplesByWord(wordId: string): Promise<any[]> { return []; }
  async definitionsBySynset(synsetId: string): Promise<any[]> { return []; }
  async formsByWord(wordId: string): Promise<any[]> { return []; }
  async getLexiconStatistics(lexiconId?: string) { 
    return [{
      lexiconId: 'test',
      label: 'Test',
      language: 'en',
      version: '1.0',
      wordCount: 0,
      synsetCount: 0,
      senseCount: 0,
      iliCount: 0
    }]; 
  }
  async getDataQualityMetrics() { 
    return { 
      synsetsWithILI: 0, 
      synsetsWithoutILI: 0, 
      iliCoveragePercentage: 0, 
      emptySynsets: 0, 
      synsetsWithDefinitions: 0,
      synsetsWithExamples: 0,
      averageSynsetSize: 0
    }; 
  }
  async getPartOfSpeechDistribution() { return {}; }
  async getSynsetSizeAnalysis() { 
    return {
      averageSize: 0,
      maxSize: 0,
      minSize: 0,
      sizeDistribution: {}
    };
  }
  async getStatistics() { 
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0
    };
  }
}

export class TestWordnet extends BaseWordnet {
  async words(query?: WordQuery): Promise<Word[]> { return []; }
  async synsets(query?: SynsetQuery): Promise<Synset[]> { return []; }
  async senses(query?: SenseQuery): Promise<Sense[]> { return []; }
  async word(wordId: string): Promise<Word | undefined> { return undefined; }
  async synset(synsetId: string): Promise<Synset | undefined> { return undefined; }
  async sense(senseId: string): Promise<Sense | undefined> { return undefined; }
  async ili(iliId: string): Promise<ILI | undefined> { return undefined; }
  async ilis(status?: string): Promise<ILI[]> { return []; }
  async lexicons(): Promise<Lexicon[]> { return []; }
  async lexicon(lexiconId: string): Promise<Lexicon | undefined> { return undefined; }
  async projects(): Promise<Project[]> { return []; }
  async project(projectId: string): Promise<Project | undefined> { return undefined; }
  async searchWords(query: string): Promise<Word[]> { return []; }
  async searchSynsets(query: string): Promise<Synset[]> { return []; }
  async wordsByForm(form: string): Promise<Word[]> { return []; }
  async synsetsByILI(ili: string): Promise<Synset[]> { return []; }
  async wordsByILI(ili: string): Promise<Word[]> { return []; }
  async wordsBySynset(synsetId: string): Promise<Word[]> { return []; }
  async sensesByWord(wordId: string): Promise<Sense[]> { return []; }
  async sensesBySynset(synsetId: string): Promise<Sense[]> { return []; }
  async relationsBySynset(synsetId: string): Promise<any[]> { return []; }
  async relationsByWord(wordId: string): Promise<any[]> { return []; }
  async examplesBySynset(synsetId: string): Promise<any[]> { return []; }
  async examplesByWord(wordId: string): Promise<any[]> { return []; }
  async definitionsBySynset(synsetId: string): Promise<any[]> { return []; }
  async formsByWord(wordId: string): Promise<any[]> { return []; }
  async getLexiconStatistics(lexiconId?: string) { 
    return [{
      lexiconId: 'test',
      label: 'Test',
      language: 'en',
      version: '1.0',
      wordCount: 0,
      synsetCount: 0,
      senseCount: 0,
      iliCount: 0
    }]; 
  }
  async getDataQualityMetrics() { 
    return { 
      synsetsWithILI: 0, 
      synsetsWithoutILI: 0, 
      iliCoveragePercentage: 0, 
      emptySynsets: 0, 
      synsetsWithDefinitions: 0,
      synsetsWithExamples: 0,
      averageSynsetSize: 0
    }; 
  }
  async getPartOfSpeechDistribution() { return {}; }
  async getSynsetSizeAnalysis() { 
    return {
      averageSize: 0,
      maxSize: 0,
      minSize: 0,
      sizeDistribution: {}
    };
  }
  async getStatistics() { 
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0
    };
  }
}
