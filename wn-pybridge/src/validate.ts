import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

export interface ValidationResult {
  [code: string]: {
    [id: string]: any;
  };
}

export interface ValidationReport {
  [code: string]: {
    message: string;
    results: ValidationResult;
  };
}

export interface ValidationOptions {
  select?: string[];
  progressHandler?: any;
}

/**
 * Validation module providing access to Python wn.validate functionality
 */
export class Validation {
  private pythonValidateModule: any = null;
  private initialized = false;
  private wnBridge: any;

  constructor(wnBridge: any) {
    this.wnBridge = wnBridge;
  }

  /**
   * Initialize the validation module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonValidateModule = await python('wn.validate');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize validation module: ${error}`);
      }
    }
  }

  /**
   * Validate a lexicon
   */
  async validate(
    lexiconId: string,
    options: ValidationOptions = {}
  ): Promise<ValidationReport> {
    await this.ensureInitialized();
    try {
      const { select = ['E', 'W'] } = options;
      
      // Get the lexicon from the WordNet instance
      const pythonWn = await this.wnBridge.getPythonWordNet();
      const lexicons = await pythonWn.lexicons();
      
      // Find the specific lexicon
      let targetLexicon = null;
      for (const lex of lexicons) {
        if (await lex.id === lexiconId) {
          targetLexicon = lex;
          break;
        }
      }
      
      if (!targetLexicon) {
        throw new WnDatabaseError(`Lexicon '${lexiconId}' not found`);
      }
      
      // Convert JavaScript array to Python list
      const builtins = await python('builtins');
      const pythonSelect = await builtins.list(select);
      
      const result = await this.pythonValidateModule.validate(
        targetLexicon,
        pythonSelect
      );
      
      // Convert Python dict to JavaScript object
      const jsResult: ValidationReport = {};
      const keys = await result.keys();
      
      for (const key of keys) {
        const value = await result.get(key);
        jsResult[key] = {
          message: await value.message,
          results: await this.convertValidationResults(await value.results)
        };
      }
      
      return jsResult;
    } catch (error) {
      throw new WnDatabaseError(`Failed to validate lexicon '${lexiconId}': ${error}`);
    }
  }

  /**
   * Convert Python validation results to JavaScript
   */
  private async convertValidationResults(results: any): Promise<ValidationResult> {
    const jsResults: ValidationResult = {};
    const keys = await results.keys();
    
    for (const key of keys) {
      const value = await results.get(key);
      jsResults[key] = await this.convertToJsObject(value);
    }
    
    return jsResults;
  }

  /**
   * Convert Python object to JavaScript object
   */
  private async convertToJsObject(obj: any): Promise<any> {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Check if it's a dict
    try {
      const keys = await obj.keys();
      const result: any = {};
      for (const key of keys) {
        const value = await obj.get(key);
        result[key] = await this.convertToJsObject(value);
      }
      return result;
    } catch {
      // Not a dict, return as is
      return obj;
    }
  }

  /**
   * Get available validation check codes
   */
  getAvailableChecks(): string[] {
    return [
      'E101', // ID is not unique within the lexicon
      'W201', // Lexical entry has no senses
      'W202', // Redundant sense between lexical entry and synset
      'W203', // Redundant lexical entry with the same lemma and synset
      'E204', // Synset of sense is missing
      'W301', // Synset is empty (not associated with any lexical entries)
      'W302', // ILI is repeated across synsets
      'W303', // Proposed ILI is missing a definition
      'W304', // Existing ILI has a spurious definition
      'W305', // Synset has a blank definition
      'W306', // Synset has a blank example
      'W307', // Synset repeats an existing definition
      'E401', // Relation target is missing or invalid
      'W402', // Relation type is invalid for the source and target
      'W403', // Redundant relation between source and target
      'W404', // Reverse relation is missing
      'W501', // Synset's part-of-speech is different from its hypernym's
      'W502'  // Relation is a self-loop
    ];
  }
} 