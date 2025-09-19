import { python } from 'pythonia';
import { WnDatabaseError } from './types.js';

export interface DownloadOptions {
  force?: boolean;
  progressHandler?: any;
}

/**
 * Download module providing access to Python wn download functionality
 */
export class Download {
  private pythonWnModule: any = null;
  private initialized = false;

  constructor() {
    // Download module doesn't need wnBridge as it works independently
  }

  /**
   * Initialize the download module
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.pythonWnModule = await python('wn');
        this.initialized = true;
      } catch (error) {
        throw new WnDatabaseError(`Failed to initialize download module: ${error}`);
      }
    }
  }

  /**
   * Download a lexicon
   */
  async download(
    lexiconSpec: string,
    options: DownloadOptions = {}
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      const { force = false } = options;
      
      await this.pythonWnModule.download(lexiconSpec, force);
    } catch (error) {
      throw new WnDatabaseError(`Failed to download lexicon '${lexiconSpec}': ${error}`);
    }
  }

  /**
   * Download multiple lexicons
   */
  async downloadMultiple(
    lexiconSpecs: string[],
    options: DownloadOptions = {}
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      const { force = false } = options;
      
      for (const spec of lexiconSpecs) {
        await this.pythonWnModule.download(spec, force);
      }
    } catch (error) {
      throw new WnDatabaseError(`Failed to download lexicons: ${error}`);
    }
  }

  /**
   * Get available lexicon specifications
   */
  async getAvailableLexicons(): Promise<string[]> {
    await this.ensureInitialized();
    try {
      const projects = await this.pythonWnModule.projects();
      const specs: string[] = [];
      
      for (const project of projects) {
        const id = await project.id;
        const version = await project.version;
        specs.push(`${id}:${version}`);
      }
      
      return specs;
    } catch (error) {
      throw new WnDatabaseError(`Failed to get available lexicons: ${error}`);
    }
  }

  /**
   * Check if a lexicon is already downloaded
   */
  async isDownloaded(lexiconSpec: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      // Try to create a WordNet instance with the spec
      // If it succeeds, the lexicon is downloaded
      await this.pythonWnModule.Wordnet(lexiconSpec);
      return true;
    } catch {
      return false;
    }
  }
} 