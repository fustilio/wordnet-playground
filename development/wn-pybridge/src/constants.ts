import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

/**
 * Constants module providing access to Python wn constants
 */
export class Constants {
  private pythonConstantsModule: any = null;
  private initialized = false;
  private cachedConstants: any = null;

  constructor() {
    // Constants module doesn't need wnBridge as it works independently
  }

  /**
   * Initialize the constants module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonConstantsModule = await python('wn.constants');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize constants module: ${error}`);
      }
    }
  }

  /**
   * Get all constants
   */
  async getAllConstants(): Promise<any> {
    if (this.cachedConstants) {
      return this.cachedConstants;
    }

    await this.ensureInitialized();
    try {
      const constants: any = {};
      
      // Get common constants
      constants.NOUN = await this.pythonConstantsModule.NOUN;
      constants.VERB = await this.pythonConstantsModule.VERB;
      constants.ADJ = await this.pythonConstantsModule.ADJ;
      constants.ADV = await this.pythonConstantsModule.ADV;
      constants.ADJ_SAT = await this.pythonConstantsModule.ADJ_SAT;
      
      // Get parts of speech (return as Python object for now)
      constants.PARTS_OF_SPEECH = await this.pythonConstantsModule.PARTS_OF_SPEECH;
      
      // Get relation constants (return as Python objects for now)
      constants.SYNSET_RELATIONS = await this.pythonConstantsModule.SYNSET_RELATIONS;
      constants.SENSE_RELATIONS = await this.pythonConstantsModule.SENSE_RELATIONS;
      constants.SENSE_SYNSET_RELATIONS = await this.pythonConstantsModule.SENSE_SYNSET_RELATIONS;
      
      // Get reverse relations (return as Python object for now)
      constants.REVERSE_RELATIONS = await this.pythonConstantsModule.REVERSE_RELATIONS;
      
      this.cachedConstants = constants;
      return constants;
    } catch (error) {
      throw new WnDatabaseError(`Failed to get constants: ${error}`);
    }
  }

  /**
   * Get parts of speech constants
   */
  async getPartsOfSpeech(): Promise<string[]> {
    const constants = await this.getAllConstants();
    return constants.PARTS_OF_SPEECH;
  }

  /**
   * Get synset relation types
   */
  async getSynsetRelations(): Promise<string[]> {
    const constants = await this.getAllConstants();
    return constants.SYNSET_RELATIONS;
  }

  /**
   * Get sense relation types
   */
  async getSenseRelations(): Promise<string[]> {
    const constants = await this.getAllConstants();
    return constants.SENSE_RELATIONS;
  }

  /**
   * Get reverse relations mapping
   */
  async getReverseRelations(): Promise<Record<string, string>> {
    const constants = await this.getAllConstants();
    return constants.REVERSE_RELATIONS;
  }

  /**
   * Get a specific constant
   */
  async getConstant(name: string): Promise<any> {
    await this.ensureInitialized();
    try {
      return await this.pythonConstantsModule[name];
    } catch (error) {
      throw new WnDatabaseError(`Failed to get constant '${name}': ${error}`);
    }
  }
} 