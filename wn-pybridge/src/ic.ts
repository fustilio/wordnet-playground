import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

export interface ICWeights {
  [pos: string]: {
    [synsetId: string]: number;
  };
}

export interface ICOptions {
  distributeWeight?: boolean;
  smoothing?: number;
}

/**
 * Information Content module providing access to Python wn.ic functionality
 */
export class InformationContent {
  private pythonIcModule: any = null;
  private initialized = false;
  private wnBridge: any;

  constructor(wnBridge: any) {
    this.wnBridge = wnBridge;
  }

  /**
   * Initialize the IC module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonIcModule = await python('wn.ic');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize IC module: ${error}`);
      }
    }
  }

  /**
   * Compute Information Content weights from a corpus
   */
  async compute(
    corpus: string[],
    options: ICOptions = {}
  ): Promise<ICWeights> {
    await this.ensureInitialized();
    try {
      const { distributeWeight = true, smoothing = 1.0 } = options;
      
      // Convert JavaScript array to Python list
      const builtins = await python('builtins');
      const pythonCorpus = await builtins.list(corpus);
      const pythonWn = await this.wnBridge.getPythonWordNet();
      
      const result = await this.pythonIcModule.compute(
        pythonCorpus,
        pythonWn,
        distributeWeight,
        smoothing
      );
      
      // Convert Python dict to JavaScript object
      const jsResult: ICWeights = {};
      const keys = await result.keys();
      
      for (const key of keys) {
        const posDict = await result.get(key);
        jsResult[key] = {};
        
        const posKeys = await posDict.keys();
        for (const posKey of posKeys) {
          const value = await posDict.get(posKey);
          // Handle None key (total weight)
          const jsKey = posKey === null ? null : posKey;
          jsResult[key][jsKey] = value;
        }
      }
      
      return jsResult;
    } catch (error) {
      throw new WnDatabaseError(`Failed to compute IC weights: ${error}`);
    }
  }

  /**
   * Load Information Content weights from a file
   */
  async load(source: string, getSynsetId?: (offset: number, pos: string) => string): Promise<ICWeights> {
    await this.ensureInitialized();
    try {
      const pythonWn = await this.wnBridge.getPythonWordNet();
      
      let result;
      if (getSynsetId) {
        // For now, skip the custom function - we'll implement this later
        result = await this.pythonIcModule.load(source, pythonWn);
      } else {
        result = await this.pythonIcModule.load(source, pythonWn);
      }
      
      // Convert Python dict to JavaScript object
      const jsResult: ICWeights = {};
      const keys = await result.keys();
      
      for (const key of keys) {
        const posDict = await result.get(key);
        jsResult[key] = {};
        
        const posKeys = await posDict.keys();
        for (const posKey of posKeys) {
          const value = await posDict.get(posKey);
          const jsKey = posKey === null ? null : posKey;
          jsResult[key][jsKey] = value;
        }
      }
      
      return jsResult;
    } catch (error) {
      throw new WnDatabaseError(`Failed to load IC weights from '${source}': ${error}`);
    }
  }

  /**
   * Calculate Information Content value for a synset
   */
  async informationContent(synsetId: string, freq: ICWeights): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset = await this.wnBridge.getPythonSynset(synsetId);
      
      // Convert JavaScript freq object to Python dict
      const builtins = await python('builtins');
      const pythonFreq = await builtins.dict(freq);
      
      return await this.pythonIcModule.information_content(synset, pythonFreq);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate IC for synset '${synsetId}': ${error}`);
    }
  }

  /**
   * Calculate synset probability
   */
  async synsetProbability(synsetId: string, freq: ICWeights): Promise<number> {
    await this.ensureInitialized();
    try {
      const synset = await this.wnBridge.getPythonSynset(synsetId);
      
      // Convert JavaScript freq object to Python dict
      const builtins = await python('builtins');
      const pythonFreq = await builtins.dict(freq);
      
      return await this.pythonIcModule.synset_probability(synset, pythonFreq);
    } catch (error) {
      throw new WnDatabaseError(`Failed to calculate probability for synset '${synsetId}': ${error}`);
    }
  }
} 