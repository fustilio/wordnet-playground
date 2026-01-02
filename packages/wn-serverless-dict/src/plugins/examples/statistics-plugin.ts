/**
 * Example plugin: Statistics collector
 * Collects detailed statistics during dictionary generation
 */

import type { Plugin, PluginHooks } from '../types.js';
import type { DictionaryData } from '../../types/index.js';

/**
 * Statistics collected during generation
 */
export interface GenerationStatistics {
  /** Total synsets processed */
  totalSynsets: number;
  /** Total words processed */
  totalWords: number;
  /** Words per language */
  wordsPerLanguage: Record<string, number>;
  /** Synsets per POS */
  synsetsPerPOS: Record<string, number>;
  /** Average words per synset */
  avgWordsPerSynset: number;
  /** Generation time in ms */
  generationTime: number;
  /** Memory usage estimate */
  estimatedMemoryKB: number;
}

/**
 * Statistics plugin
 */
export class StatisticsPlugin implements Plugin {
  private stats: GenerationStatistics | null = null;
  private startTime = 0;

  meta = {
    name: 'statistics',
    version: '1.0.0',
    description: 'Collects detailed statistics during dictionary generation',
    author: 'wn-serverless-dict'
  };

  hooks: PluginHooks = {
    beforeGenerate: async (options) => {
      console.log('[StatisticsPlugin] Starting statistics collection');
      this.startTime = Date.now();
      this.stats = {
        totalSynsets: 0,
        totalWords: 0,
        wordsPerLanguage: {},
        synsetsPerPOS: {},
        avgWordsPerSynset: 0,
        generationTime: 0,
        estimatedMemoryKB: 0
      };
      return options;
    },

    afterExtract: async (vocabulary) => {
      if (!this.stats) return vocabulary;

      // Collect vocabulary statistics
      this.stats.totalSynsets = vocabulary.size;

      for (const [ili, entry] of vocabulary.entries()) {
        // Count POS
        const pos = entry.pos || 'unknown';
        this.stats.synsetsPerPOS[pos] = (this.stats.synsetsPerPOS[pos] || 0) + 1;

        // Count words per language
        for (const [lang, words] of Object.entries(entry.words)) {
          const wordCount = (words as string[]).length;
          this.stats.wordsPerLanguage[lang] = (this.stats.wordsPerLanguage[lang] || 0) + wordCount;
          this.stats.totalWords += wordCount;
        }
      }

      // Calculate average
      this.stats.avgWordsPerSynset = this.stats.totalWords / this.stats.totalSynsets;

      console.log('[StatisticsPlugin] Vocabulary statistics collected:');
      console.log(`  Synsets: ${this.stats.totalSynsets}`);
      console.log(`  Words: ${this.stats.totalWords}`);
      console.log(`  Avg words/synset: ${this.stats.avgWordsPerSynset.toFixed(2)}`);

      return vocabulary;
    },

    afterBuild: async (data) => {
      if (!this.stats) return data;

      // Calculate generation time
      this.stats.generationTime = Date.now() - this.startTime;

      // Estimate memory usage
      const jsonStr = JSON.stringify(data);
      this.stats.estimatedMemoryKB = jsonStr.length / 1024;

      console.log('[StatisticsPlugin] Final statistics:');
      console.log(`  Generation time: ${this.stats.generationTime}ms`);
      console.log(`  Estimated memory: ${this.stats.estimatedMemoryKB.toFixed(1)} KB`);

      return data;
    }
  };

  /**
   * Get collected statistics
   */
  getStatistics(): GenerationStatistics | null {
    return this.stats;
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.stats = null;
    this.startTime = 0;
  }
}
