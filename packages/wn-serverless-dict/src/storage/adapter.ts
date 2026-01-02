/**
 * Storage adapter pattern for flexible dictionary persistence
 * Inspired by the adapter pattern from wn-ts-core
 */

import type { DictionaryData } from '../types/index.js';

/**
 * Storage adapter interface
 * Allows dictionaries to be stored in different formats/backends
 */
export interface StorageAdapter {
  /**
   * Adapter name
   */
  readonly name: string;

  /**
   * Save dictionary data
   * @param data - Dictionary data to save
   * @param destination - Storage destination (path, URL, etc.)
   */
  save(data: DictionaryData, destination: string): Promise<void>;

  /**
   * Load dictionary data
   * @param source - Storage source (path, URL, etc.)
   */
  load(source: string): Promise<DictionaryData>;

  /**
   * Check if data exists at source
   * @param source - Storage source to check
   */
  exists(source: string): Promise<boolean>;

  /**
   * Get metadata about stored dictionary without loading full data
   * @param source - Storage source
   */
  getMetadata?(source: string): Promise<{
    size: number;
    modified: Date;
    compressed?: boolean;
  }>;

  /**
   * Delete stored dictionary
   * @param source - Storage source
   */
  delete?(source: string): Promise<void>;
}

/**
 * Storage adapter options
 */
export interface StorageAdapterOptions {
  /** Enable compression */
  compress?: boolean;
  /** Pretty-print JSON (for JSON adapters) */
  pretty?: boolean;
  /** Custom encoding */
  encoding?: BufferEncoding;
}
