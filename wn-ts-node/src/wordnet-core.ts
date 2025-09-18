/**
 * WordNet Core Implementation for Node.js
 * 
 * This implements the WordNetCore interface using the existing KyselyWordnet
 * to provide a bridge between the new kernel architecture and the existing Node.js implementation.
 */

import type { WordNetCore } from 'wn-ts-core';
import type {
  Word,
  Sense,
  Synset,
  ILI,
  WordQuery,
  SynsetQuery,
  SenseQuery
} from 'wn-ts-core';
import { KyselyWordnet } from './kysely-wordnet.js';
import type { NodeWordnetConfig } from './kysely-wordnet.js';

/**
 * Node.js implementation of WordNetCore interface
 * Bridges the new kernel architecture with existing KyselyWordnet
 */
export class NodeWordNetCore implements WordNetCore {
  private kyselyWordnet: KyselyWordnet;

  constructor(lexicon: string | string[] = '*', options: Partial<NodeWordnetConfig> = {}) {
    // Ensure filename is provided for NodeWordnetConfig
    const config: NodeWordnetConfig = {
      filename: ':memory:',
      ...options
    };
    this.kyselyWordnet = new KyselyWordnet(lexicon, config);
  }

  // Core database operations
  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> {
    // KyselyWordnet doesn't have a direct query method, so we'll need to implement this
    // For now, return empty array - this would need to be implemented using the database directly
    console.warn('Direct SQL queries not implemented in NodeWordNetCore. Use specific methods instead.');
    return [];
  }

  // Base WordNet methods (delegate to KyselyWordnet)
  async words(query?: WordQuery): Promise<Word[]> {
    return this.kyselyWordnet.words(query);
  }

  async word(wordId: string): Promise<Word> {
    const word = await this.kyselyWordnet.getWord(wordId);
    if (!word) {
      throw new Error(`Word with id ${wordId} not found`);
    }
    return word;
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    return this.kyselyWordnet.synsets(query);
  }

  async synset(synsetId: string): Promise<Synset> {
    const synset = await this.kyselyWordnet.getSynset(synsetId);
    if (!synset) {
      throw new Error(`Synset with id ${synsetId} not found`);
    }
    return synset;
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    return this.kyselyWordnet.senses(query);
  }

  async sense(senseId: string): Promise<Sense> {
    const sense = await this.kyselyWordnet.getSense(senseId);
    if (!sense) {
      throw new Error(`Sense with id ${senseId} not found`);
    }
    return sense;
  }

  // ILI methods (delegate to KyselyWordnet)
  async ili(iliId: string): Promise<ILI> {
    const ili = await this.kyselyWordnet.getIli(iliId);
    if (!ili) {
      throw new Error(`ILI with id ${iliId} not found`);
    }
    return ili;
  }

  async ilis(status?: string): Promise<ILI[]> {
    return this.kyselyWordnet.ilis(status);
  }

  async lexicons(): Promise<any[]> {
    return this.kyselyWordnet.lexicons();
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    return this.kyselyWordnet.synsetsByILI(iliId);
  }

  // Additional methods for plugin system
  async getWord(form: string): Promise<Word[]> {
    return this.kyselyWordnet.words({ form });
  }

  async getSynset(id: string): Promise<any | null> {
    try {
      return await this.kyselyWordnet.getSynset(id);
    } catch {
      return null;
    }
  }

  async getSenses(wordId: string): Promise<Sense[]> {
    return this.kyselyWordnet.senses({ wordIdOrForm: wordId });
  }

  async getDefinitions(synsetId: string): Promise<any[]> {
    const synset = await this.kyselyWordnet.getSynset(synsetId);
    if (!synset) return [];
    return synset.definitions || [];
  }

  async getRelations(synsetId: string, type?: string): Promise<any[]> {
    const synset = await this.kyselyWordnet.getSynset(synsetId);
    if (!synset || !synset.relations) return [];
    
    if (type) {
      return synset.relations.filter(rel => rel.type === type);
    }
    
    return synset.relations;
  }

  // Additional utility methods
  async initialize(): Promise<void> {
    await this.kyselyWordnet.initialize();
  }

  async close(): Promise<void> {
    await this.kyselyWordnet.close();
  }

  // Get the underlying KyselyWordnet instance for advanced usage
  getKyselyWordnet(): KyselyWordnet {
    return this.kyselyWordnet;
  }
}
