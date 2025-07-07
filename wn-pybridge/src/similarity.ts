import { python } from 'pythonia';
import { Synset, SimilarityOptions, WnDatabaseError } from './types.js';

/**
 * Similarity module providing access to Python wn similarity functions
 */
export class Similarity {
  private pythonSimilarityModule: any = null;
  private initialized = false;

  constructor(private wnBridge: any) {}

  /**
   * Initialize the similarity module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonSimilarityModule = await python('wn.similarity');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize similarity module: ${error}`);
      }
    }
  }

  /**
   * Path similarity between two synsets
   */
  async path(synsetId1: string, synsetId2: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.path(synset1, synset2);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate path similarity: ${error}`);
    }
  }

  /**
   * Wu-Palmer similarity between two synsets
   */
  async wup(synsetId1: string, synsetId2: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.wup(synset1, synset2);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate Wu-Palmer similarity: ${error}`);
    }
  }

  /**
   * Leacock-Chodorow similarity between two synsets
   * TODO: Replace 20 with actual taxonomy depth
   */
  async lch(synsetId1: string, synsetId2: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.lch(synset1, synset2, 20);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate Leacock-Chodorow similarity: ${error}`);
    }
  }

  /**
   * Resnik similarity between two synsets (requires IC)
   */
  async res(synsetId1: string, synsetId2: string, ic: any): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.res(synset1, synset2, ic);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate Resnik similarity: ${error}`);
    }
  }

  /**
   * Lin similarity between two synsets (requires IC)
   */
  async lin(synsetId1: string, synsetId2: string, ic: any): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.lin(synset1, synset2, ic);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate Lin similarity: ${error}`);
    }
  }

  /**
   * Jiang-Conrath similarity between two synsets (requires IC)
   */
  async jcn(synsetId1: string, synsetId2: string, ic: any): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset1 = await this.wnBridge.getPythonSynset(synsetId1);
      const synset2 = await this.wnBridge.getPythonSynset(synsetId2);
      return await this.pythonSimilarityModule.jcn(synset1, synset2, ic);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate Jiang-Conrath similarity: ${error}`);
    }
  }

  /**
   * Calculate all similarity measures between two synsets
   */
  async all(synsetId1: string, synsetId2: string, ic?: any): Promise<{
    path: number;
    wup: number;
    lch: number;
    res?: number;
    lin?: number;
    jcn?: number;
  }> {
    const result: any = {
      path: await this.path(synsetId1, synsetId2),
      wup: await this.wup(synsetId1, synsetId2),
      lch: await this.lch(synsetId1, synsetId2)
    };

    if (ic) {
      result.res = await this.res(synsetId1, synsetId2, ic);
      result.lin = await this.lin(synsetId1, synsetId2, ic);
      result.jcn = await this.jcn(synsetId1, synsetId2, ic);
    }

    return result;
  }
} 