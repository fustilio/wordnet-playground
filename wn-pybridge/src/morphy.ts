import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

export interface LemmatizeResult {
  [pos: string]: Set<string>;
}

/**
 * Morphy lemmatizer module providing access to Python wn.morphy functionality
 */
export class Morphy {
  private pythonMorphyModule: any = null;
  private pythonMorphy: any = null;
  private initialized = false;
  private wnBridge: any;

  constructor(wnBridge: any) {
    this.wnBridge = wnBridge;
  }

  /**
   * Initialize the morphy module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonMorphyModule = await python('wn.morphy');
        // Create a Morphy instance with the WordNet object
        const pythonWn = await this.wnBridge.getPythonWordNet();
        this.pythonMorphy = await this.pythonMorphyModule.Morphy(pythonWn);
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize morphy module: ${error}`);
      }
    }
  }

  /**
   * Lemmatize a word form with optional part of speech
   */
  async lemmatize(form: string, pos?: string): Promise<LemmatizeResult> {
    await this.ensureInitialized();
    try {
      // Import the helper module and function
      const pyHelpers = await python('./pybridge_helpers.py');
      // Call the helper function
      const jsonString = await pyHelpers.morphy_to_json(this.pythonMorphy, form, pos);
      const plainObj = JSON.parse(jsonString);
      const jsResult: LemmatizeResult = {};
      for (const key in plainObj) {
        const realKey = key === 'null' ? null : key;
        jsResult[realKey as string] = new Set(plainObj[key]);
      }
      return jsResult;
    } catch (error) {
      console.error('Morphy lemmatize error:', error);
      throw new WnDatabaseError(`Failed to lemmatize '${form}': ${error}`);
    }
  }

  /**
   * Get all lemmas for a word form across all parts of speech
   */
  async getAllLemmas(form: string): Promise<LemmatizeResult> {
    return this.lemmatize(form);
  }

  /**
   * Get lemmas for a specific part of speech
   */
  async getLemmasForPos(form: string, pos: string): Promise<Set<string>> {
    const result = await this.lemmatize(form, pos);
    return result[pos] || new Set<string>();
  }
} 