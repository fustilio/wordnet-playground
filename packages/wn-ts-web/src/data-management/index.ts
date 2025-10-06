/**
 * Data Management Module for wn-ts-web
 * 
 * This module provides the web-specific implementations of the shared data management system
 */

// Re-export the WebDataManager and related types
export * from './adapters/index.js';

// Create a DataLoader class that extends WebDataManager for backward compatibility
import { WebDataManager } from './adapters/web-data-manager.js';
import type { WebDataManagerConfig } from './adapters/web-data-manager.js';
import type { ProgressCallback } from '../types/progress.js';

/**
 * DataLoader class for backward compatibility
 * This wraps WebDataManager to provide the same interface as the old DataLoader
 */
export class DataLoader extends WebDataManager {
  constructor(database: any, wordnet: any) {
    const config: WebDataManagerConfig = {
      database,
      wordnet,
    };
    super(config);
  }

  /**
   * Download and load WordNet data into the browser database
   * This method provides backward compatibility with the old DataLoader interface
   */
  async downloadAndLoad(
    projectIdWithVersion: string,
    options: { force?: boolean; progress?: ProgressCallback } = {}
  ): Promise<void> {
    return await super.downloadAndLoad(projectIdWithVersion, options);
  }

  /**
   * Load raw downloaded data into the database
   */
  async loadFromBuffer(
    data: ArrayBuffer,
    projectIdWithVersion: string,
    options: { force?: boolean; progress?: ProgressCallback } = {}
  ): Promise<void> {
    await super.loadFromBuffer(data, projectIdWithVersion, options);
    
    // Update statistics after loading data
    if ((this as any).config.wordnet && typeof (this as any).config.wordnet.getQueryService === 'function') {
      const queryService = (this as any).config.wordnet.getQueryService();
      // Note: getStatistics method doesn't exist on QueryService, so we'll skip this
    }
    
    // Emit events for backward compatibility
    if ((this as any).config.wordnet && typeof (this as any).config.wordnet.emitDataChanged === 'function') {
      (this as any).config.wordnet.emitDataChanged('packageLoaded', {
        packageId: projectIdWithVersion,
        timestamp: new Date().toISOString()
      });
    }
    
    if ((this as any).config.wordnet && typeof (this as any).config.wordnet.emitStatisticsUpdated === 'function') {
      (this as any).config.wordnet.emitStatisticsUpdated();
    }
  }

  /**
   * Download a file from a URL
   */
  async downloadFile(
    url: string,
    progress?: ProgressCallback,
    fallbackUrl?: string
  ): Promise<ArrayBuffer> {
    return await super.downloadFile(url, progress);
  }

  /**
   * Check if any data exists in the database
   */
  async hasData(): Promise<boolean> {
    return await super.hasData();
  }

  /**
   * Ensure data is loaded (load if not present)
   */
  async ensureDataLoaded(projectId: string = "oewn:2024"): Promise<void> {
    return await super.ensureDataLoaded(projectId);
  }

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    return await super.clearAllData();
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    return await super.getStatistics();
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up any web-specific resources
    // Note: parent class doesn't have a destroy method
  }
}

// Export the WebDataManager as the default export for new code
export { WebDataManager } from './adapters/web-data-manager.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Download WordNet data
 * 
 * @param lexicon - Lexicon to download
 * @param options - Download options
 * 
 * @example
 * ```typescript
 * import { download } from 'wn-ts-web';
 * 
 * await download('oewn:2024', { storage: 'opfs' });
 * ```
 */
export async function download(
  lexicon: string,
  options: { storage?: 'opfs' | 'indexeddb' | 'memory'; force?: boolean } = {}
): Promise<void> {
  const { storage = 'opfs', force = false } = options;
  
  // Create a temporary WebDataManager instance for downloading
  const manager = new WebDataManager({
    storage,
    // Other config options would go here
  } as any);
  
  await manager.downloadAndLoad(lexicon, { force });
}

/**
 * Get available lexicons
 * 
 * @returns List of available lexicons
 * 
 * @example
 * ```typescript
 * import { getLexicons } from 'wn-ts-web';
 * 
 * const lexicons = await getLexicons();
 * console.log(lexicons); // ['oewn:2024', 'oewn:2023', ...]
 * ```
 */
export async function getLexicons(): Promise<string[]> {
  // This would typically come from a catalog or API
  // For now, return a hardcoded list
  return [
    'oewn:2024',
    'oewn:2023',
    'cili:2024',
    'ewn:2024',
  ];
}