/**
 * In-memory storage adapter
 * Stores dictionaries in memory for testing and development
 */

import type { StorageAdapter } from '../adapter.js';
import type { DictionaryData } from '../../types/index.js';

/**
 * In-memory storage adapter
 * Useful for testing and development without file I/O
 */
export class MemoryStorageAdapter implements StorageAdapter {
  readonly name = 'memory';
  private storage = new Map<string, { data: DictionaryData; timestamp: Date }>();

  async save(data: DictionaryData, destination: string): Promise<void> {
    // Deep clone to avoid mutations
    const clonedData = JSON.parse(JSON.stringify(data)) as DictionaryData;
    this.storage.set(destination, {
      data: clonedData,
      timestamp: new Date()
    });
  }

  async load(source: string): Promise<DictionaryData> {
    const entry = this.storage.get(source);
    if (!entry) {
      throw new Error(`Dictionary not found in memory: ${source}`);
    }

    // Return a deep clone to avoid mutations
    return JSON.parse(JSON.stringify(entry.data)) as DictionaryData;
  }

  async exists(source: string): Promise<boolean> {
    return this.storage.has(source);
  }

  async getMetadata(source: string) {
    const entry = this.storage.get(source);
    if (!entry) {
      throw new Error(`Dictionary not found in memory: ${source}`);
    }

    const jsonStr = JSON.stringify(entry.data);
    return {
      size: jsonStr.length,
      modified: entry.timestamp,
      compressed: false
    };
  }

  async delete(source: string): Promise<void> {
    this.storage.delete(source);
  }

  /**
   * Clear all stored dictionaries
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * List all stored dictionary keys
   */
  list(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Get storage statistics
   */
  getStats() {
    let totalSize = 0;
    for (const [key, entry] of this.storage.entries()) {
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      count: this.storage.size,
      totalSize,
      avgSize: this.storage.size > 0 ? totalSize / this.storage.size : 0
    };
  }
}
