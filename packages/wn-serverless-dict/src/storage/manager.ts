/**
 * Storage manager with fallback strategy
 * Manages multiple storage adapters with automatic fallback
 */

import type { StorageAdapter } from './adapter.js';
import type { DictionaryData } from '../types/index.js';

/**
 * Storage manager configuration
 */
export interface StorageManagerConfig {
  /** Primary storage adapter */
  primary: StorageAdapter;
  /** Fallback adapters (tried in order if primary fails) */
  fallbacks?: StorageAdapter[];
  /** Enable automatic retry on failure */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in ms */
  retryDelay?: number;
}

/**
 * Storage manager for managing dictionary persistence
 * Supports multiple adapters with automatic fallback
 */
export class StorageManager {
  private config: Required<StorageManagerConfig>;
  private adapters: StorageAdapter[];

  constructor(config: StorageManagerConfig) {
    this.config = {
      primary: config.primary,
      fallbacks: config.fallbacks || [],
      autoRetry: config.autoRetry ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000
    };

    this.adapters = [this.config.primary, ...this.config.fallbacks];
  }

  /**
   * Save dictionary using primary adapter with fallback
   */
  async save(data: DictionaryData, destination: string): Promise<void> {
    let lastError: Error | null = null;

    for (const adapter of this.adapters) {
      try {
        console.log(`[StorageManager] Saving with ${adapter.name} adapter to ${destination}`);
        await this.saveWithRetry(adapter, data, destination);
        console.log(`[StorageManager] Successfully saved with ${adapter.name} adapter`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[StorageManager] ${adapter.name} adapter failed:`, error);
        continue;
      }
    }

    throw new Error(
      `All storage adapters failed. Last error: ${lastError?.message || 'unknown'}`
    );
  }

  /**
   * Load dictionary using adapters with fallback
   */
  async load(source: string): Promise<DictionaryData> {
    let lastError: Error | null = null;

    for (const adapter of this.adapters) {
      try {
        // Check if source exists before attempting to load
        const exists = await adapter.exists(source);
        if (!exists) {
          continue;
        }

        console.log(`[StorageManager] Loading with ${adapter.name} adapter from ${source}`);
        const data = await this.loadWithRetry(adapter, source);
        console.log(`[StorageManager] Successfully loaded with ${adapter.name} adapter`);
        return data;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[StorageManager] ${adapter.name} adapter failed:`, error);
        continue;
      }
    }

    throw new Error(
      `All storage adapters failed to load. Last error: ${lastError?.message || 'unknown'}`
    );
  }

  /**
   * Check if dictionary exists using any adapter
   */
  async exists(source: string): Promise<boolean> {
    for (const adapter of this.adapters) {
      try {
        const exists = await adapter.exists(source);
        if (exists) return true;
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  /**
   * Get metadata using first available adapter
   */
  async getMetadata(source: string) {
    for (const adapter of this.adapters) {
      try {
        if (adapter.getMetadata) {
          const exists = await adapter.exists(source);
          if (exists) {
            return await adapter.getMetadata(source);
          }
        }
      } catch (error) {
        continue;
      }
    }
    throw new Error(`No adapter could retrieve metadata for: ${source}`);
  }

  /**
   * Delete from all adapters
   */
  async delete(source: string): Promise<void> {
    const errors: Error[] = [];

    for (const adapter of this.adapters) {
      try {
        if (adapter.delete) {
          const exists = await adapter.exists(source);
          if (exists) {
            await adapter.delete(source);
          }
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length === this.adapters.length) {
      throw new Error(`Failed to delete from any adapter: ${errors[0].message}`);
    }
  }

  /**
   * Save with automatic retry
   */
  private async saveWithRetry(
    adapter: StorageAdapter,
    data: DictionaryData,
    destination: string
  ): Promise<void> {
    let attempts = 0;
    let lastError: Error;

    while (attempts <= this.config.maxRetries) {
      try {
        await adapter.save(data, destination);
        return;
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (attempts <= this.config.maxRetries && this.config.autoRetry) {
          console.log(
            `[StorageManager] Retry ${attempts}/${this.config.maxRetries} after ${this.config.retryDelay}ms`
          );
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Load with automatic retry
   */
  private async loadWithRetry(adapter: StorageAdapter, source: string): Promise<DictionaryData> {
    let attempts = 0;
    let lastError: Error;

    while (attempts <= this.config.maxRetries) {
      try {
        return await adapter.load(source);
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (attempts <= this.config.maxRetries && this.config.autoRetry) {
          console.log(
            `[StorageManager] Retry ${attempts}/${this.config.maxRetries} after ${this.config.retryDelay}ms`
          );
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Get list of registered adapters
   */
  getAdapters(): StorageAdapter[] {
    return [...this.adapters];
  }

  /**
   * Get primary adapter
   */
  getPrimaryAdapter(): StorageAdapter {
    return this.config.primary;
  }
}
