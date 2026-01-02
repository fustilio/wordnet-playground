/**
 * Example plugin: Word/synset filtering
 * Filters vocabulary based on custom criteria
 */

import type { Plugin, PluginHooks } from '../types.js';

/**
 * Filter function type
 */
export type FilterFunction = (entry: {
  ili: string;
  pos: string;
  def: string;
  words: Record<string, string[]>;
}) => boolean;

/**
 * Filter plugin configuration
 */
export interface FilterPluginConfig {
  /** Minimum word length */
  minWordLength?: number;
  /** Maximum word length */
  maxWordLength?: number;
  /** Exclude words matching regex patterns */
  excludePatterns?: RegExp[];
  /** Only include specific POS tags */
  posWhitelist?: string[];
  /** Exclude specific POS tags */
  posBlacklist?: string[];
  /** Custom filter function */
  customFilter?: FilterFunction;
}

/**
 * Filter plugin for customizable vocabulary filtering
 */
export class FilterPlugin implements Plugin {
  private config: FilterPluginConfig;
  private filteredCount = 0;

  meta = {
    name: 'filter',
    version: '1.0.0',
    description: 'Filters vocabulary based on configurable criteria',
    author: 'wn-serverless-dict'
  };

  constructor(config: FilterPluginConfig = {}) {
    this.config = config;
  }

  hooks: PluginHooks = {
    afterExtract: async (vocabulary) => {
      console.log('[FilterPlugin] Applying filters to vocabulary');
      const originalSize = vocabulary.size;

      const filtered = new Map<string, any>();

      for (const [ili, entry] of vocabulary.entries()) {
        if (this.shouldKeepEntry(entry)) {
          filtered.set(ili, entry);
        } else {
          this.filteredCount++;
        }
      }

      const removedCount = originalSize - filtered.size;
      console.log(`[FilterPlugin] Filtered ${removedCount} entries (${this.filteredCount} total filtered)`);

      return filtered;
    }
  };

  /**
   * Check if an entry should be kept based on filter criteria
   */
  private shouldKeepEntry(entry: any): boolean {
    // POS whitelist
    if (this.config.posWhitelist && !this.config.posWhitelist.includes(entry.pos)) {
      return false;
    }

    // POS blacklist
    if (this.config.posBlacklist && this.config.posBlacklist.includes(entry.pos)) {
      return false;
    }

    // Word length filters
    if (this.config.minWordLength || this.config.maxWordLength) {
      let hasValidWord = false;

      for (const words of Object.values(entry.words)) {
        for (const word of words as string[]) {
          const len = word.length;
          if (this.config.minWordLength && len < this.config.minWordLength) continue;
          if (this.config.maxWordLength && len > this.config.maxWordLength) continue;
          hasValidWord = true;
          break;
        }
        if (hasValidWord) break;
      }

      if (!hasValidWord) return false;
    }

    // Exclude patterns
    if (this.config.excludePatterns) {
      for (const words of Object.values(entry.words)) {
        for (const word of words as string[]) {
          for (const pattern of this.config.excludePatterns) {
            if (pattern.test(word)) {
              return false;
            }
          }
        }
      }
    }

    // Custom filter
    if (this.config.customFilter) {
      return this.config.customFilter(entry);
    }

    return true;
  }

  /**
   * Get the number of filtered entries
   */
  getFilteredCount(): number {
    return this.filteredCount;
  }

  /**
   * Reset filter count
   */
  reset(): void {
    this.filteredCount = 0;
  }
}
