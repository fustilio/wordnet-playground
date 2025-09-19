import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

export interface ExportOptions {
  version?: string;
}

/**
 * Export module providing access to Python wn export functionality
 */
export class Export {
  private pythonWnModule: any = null;
  private initialized = false;
  private wnBridge: any;

  constructor(wnBridge: any) {
    this.wnBridge = wnBridge;
  }

  /**
   * Initialize the export module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonWnModule = await python('wn');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize export module: ${error}`);
      }
    }
  }

  /**
   * Export lexicons to a WN-LMF file
   */
  async export(
    lexiconIds: string[],
    destination: string,
    options: ExportOptions = {}
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      const { version = '1.0' } = options;
      
      // Get the lexicons from the WordNet instance
      const pythonWn = await this.wnBridge.getPythonWordNet();
      const allLexicons = await pythonWn.lexicons();
      
      // Find the specific lexicons
      const targetLexicons = [];
      for (const lex of allLexicons) {
        const lexId = await lex.id;
        if (lexiconIds.includes(lexId)) {
          targetLexicons.push(lex);
        }
      }
      
      if (targetLexicons.length === 0) {
        throw new WnDatabaseError(`No lexicons found from the provided IDs: ${lexiconIds.join(', ')}`);
      }
      
      // Convert JavaScript array to Python list
      const builtins = await python('builtins');
      const pythonLexicons = await builtins.list(targetLexicons);
      
      await this.pythonWnModule.export(
        pythonLexicons,
        destination,
        version
      );
    } catch (error) {
      throw new WnDatabaseError(`Failed to export lexicons to '${destination}': ${error}`);
    }
  }

  /**
   * Export a single lexicon to a WN-LMF file
   */
  async exportLexicon(
    lexiconId: string,
    destination: string,
    options: ExportOptions = {}
  ): Promise<void> {
    return this.export([lexiconId], destination, options);
  }

  /**
   * Get supported LMF versions
   */
  getSupportedVersions(): string[] {
    return ['1.0', '1.1', '1.3', '1.4'];
  }
} 