/**
 * Similarity Module
 * 
 * Provides various similarity metrics between synsets including:
 * - Path-based similarity
 * - Wu-Palmer similarity
 * - Leacock-Chodorow similarity
 * - Information Content-based metrics (Resnik, Lin, Jiang-Conrath)
 * 
 * This is a CORE MODULE - essential for WordNet functionality.
 */

import type { Plugin } from '../../wordnet-kernel.js';
import type { Synset } from '../../core/types.js';
import type { Freq } from './information-content.js';
import { pathSimilarity } from './path-similarity.js';
import { wuPalmerSimilarity } from './wu-palmer.js';
import { leacockChodorowSimilarity } from './leacock-chodorow.js';
import { resnikSimilarity, jiangConrathSimilarity, linSimilarity } from './resnik-lin-jcn.js';
import { createLifecyclePlugin } from '../../wordnet-kernel-lifecycle.js';

// Re-export individual functions for direct use
export { pathSimilarity } from './path-similarity.js';
export { wuPalmerSimilarity } from './wu-palmer.js';
export { leacockChodorowSimilarity } from './leacock-chodorow.js';
export { resnikSimilarity, jiangConrathSimilarity, linSimilarity } from './resnik-lin-jcn.js';
export * from './information-content.js';
import type { WordNetKernel } from '../../wordnet-kernel.js';

/**
 * Similarity module for WordNet (Core Module)
 */
export const similarity: Plugin = {
  name: 'similarity',
  methods: {
    // Path-based similarity - accepts synset objects or IDs
    path: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return pathSimilarity(synsetObj1, synsetObj2, core);
    },
    
    // Wu-Palmer similarity - accepts synset objects or IDs
    wup: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return wuPalmerSimilarity(synsetObj1, synsetObj2, core);
    },
    
    // Leacock-Chodorow similarity - accepts synset objects or IDs
    lch: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset, maxTaxonomyDepth: number) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return leacockChodorowSimilarity(synsetObj1, synsetObj2, maxTaxonomyDepth, core);
    },
    
    // Information Content-based similarities - accepts synset objects or IDs
    res: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset, ic: Freq) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return resnikSimilarity(synsetObj1, synsetObj2, ic, core);
    },
    jcn: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset, ic: Freq) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return jiangConrathSimilarity(synsetObj1, synsetObj2, ic, core);
    },
    lin: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset, ic: Freq) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return linSimilarity(synsetObj1, synsetObj2, ic, core);
    },

    // ILI-based similarity for cross-lingual comparisons
    getPathSimilarity: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return pathSimilarity(synsetObj1, synsetObj2, core);
    },

    getWuPalmerSimilarity: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return wuPalmerSimilarity(synsetObj1, synsetObj2, core);
    },

    getLeacockChodorowSimilarity: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      return leacockChodorowSimilarity(synsetObj1, synsetObj2, 3, core);
    },

    getJaccardSimilarity: async (_core, _synset1: string | Synset, _synset2: string | Synset) => {
      // Jaccard similarity implementation would go here
      // For now, return 0 as placeholder
      return 0;
    },

    getBestSimilarity: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      // Try multiple similarity metrics and return the best one
      const pathSim = await pathSimilarity(synsetObj1, synsetObj2, core);
      const wupSim = await wuPalmerSimilarity(synsetObj1, synsetObj2, core);
      return Math.max(pathSim, wupSim);
    },

    findMostSimilar: async (core: WordNetKernel, synsetId: string, _limit?: number) => {
      const synset = await core.synset(synsetId);
      if (!synset) return [];
      
      // This would need to be implemented to find similar synsets
      // For now, return empty array as placeholder
      return [];
    },

    // Cross-lingual similarity using CILI (Conceptual Interlingual Index)
    getCrossLingualSimilarity: async (core: WordNetKernel, synset1: string | Synset, synset2: string | Synset) => {
      const synsetObj1 = typeof synset1 === 'string' ? await core.synset(synset1) : synset1;
      const synsetObj2 = typeof synset2 === 'string' ? await core.synset(synset2) : synset2;
      
      // Check if synsets are from different lexicons
      if (synsetObj1.lexicon === synsetObj2.lexicon) {
        // Same lexicon - use regular similarity
        return pathSimilarity(synsetObj1, synsetObj2, core);
      }
      
      // Different lexicons - check if they have ILI mappings from CILI
      if (!synsetObj1.ili || !synsetObj2.ili) {
        throw new Error(
          'Cross-lingual similarity requires CILI (Conceptual Interlingual Index) to be installed ' +
          'and ILI mappings for both synsets. CILI is optional but required for the translation plugin ' +
          'and cross-lingual operations. For English-only similarity, use same-lexicon methods.'
        );
      }
      
      if (synsetObj1.ili === synsetObj2.ili) {
        return 1.0; // Same concept across languages (same CILI ILI)
      }
      
      // Find synsets with the same ILI in the same lexicon for comparison
      const synsets1 = await core.synsetsByILI(synsetObj1.ili);
      const synsets2 = await core.synsetsByILI(synsetObj2.ili);
      
      // Find synsets from the same lexicon
      const sameLexiconSynsets1 = synsets1.filter(s => s.lexicon === synsetObj1.lexicon);
      const sameLexiconSynsets2 = synsets2.filter(s => s.lexicon === synsetObj2.lexicon);
      
      if (sameLexiconSynsets1.length === 0 || sameLexiconSynsets2.length === 0) {
        return 0; // No comparable synsets found
      }
      
      // Use the first synset from each lexicon for comparison
      const firstSynset1 = sameLexiconSynsets1[0];
      const firstSynset2 = sameLexiconSynsets2[0];
      if (!firstSynset1 || !firstSynset2) return 0;
      return pathSimilarity(firstSynset1, firstSynset2, core);
    },
  },
  lifecycle: createLifecyclePlugin('similarity', {
    'lexicon:loaded': async (_event, data, _kernel) => {
      console.log(`🔄 Similarity plugin: Rebuilding caches after lexicon load: ${data.lexicon.id}`);
      // Here you could rebuild similarity caches, precompute common paths, etc.
      // For example: await rebuildSimilarityCache(kernel, data.lexicon);
    },
    'data:loaded': async (_event, data, _kernel) => {
      console.log(`🔄 Similarity plugin: Rebuilding caches after data load: ${data.recordCount} records`);
      // Here you could rebuild similarity caches, precompute common paths, etc.
      // For example: await rebuildSimilarityCache(kernel);
    }
  }, {
    priority: 50 // Medium priority - run after core data loading but before analytics
  })
};
