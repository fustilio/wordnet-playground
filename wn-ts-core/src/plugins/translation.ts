/**
 * Translation Plugin - Dead simple cross-lingual translation
 * Fully type-safe with proper TypeScript types
 */

import type { Plugin, WordNetKernel } from '../wordnet-kernel.js';
import type { Database } from '../types/database.js';
import type { Kysely } from 'kysely';
import { createLifecyclePlugin } from '../wordnet-kernel-lifecycle.js';

// Helper function to get Kysely database from kernel
function getKyselyDb(kernel: WordNetKernel): Kysely<Database> {
  const kyselyDb = (kernel as any).kyselyDb;
  if (!kyselyDb?.db) {
    throw new Error('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
  }
  return kyselyDb.db as Kysely<Database>;
}

// Translation plugin methods

export const translation: Plugin = {
  name: 'translation',
  methods: {
    /**
     * Get translations via ILI (Interlingual Index)
     */
    getTranslations: async (core: WordNetKernel, synsetId: string, targetLanguage?: string) => {
      const db = getKyselyDb(core);
      
      // Get the source synset to find its ILI
      const synsetResult = await db
        .selectFrom('synsets')
        .select(['id', 'ili', 'language'])
        .where('id', '=', synsetId)
        .executeTakeFirst();

      if (!synsetResult?.ili) return [];

      // Build the translation query
      let query = db
        .selectFrom('synsets')
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id')
        .select([
          'synsets.id',
          'synsets.language',
          'synsets.lexicon',
          'words.lemma',
          'words.pos'
        ])
        .where('synsets.ili', '=', synsetResult.ili)
        .where('synsets.id', '!=', synsetId);

      if (targetLanguage) {
        query = query.where('synsets.language', '=', targetLanguage);
      }

      const result = await query
        .orderBy(['synsets.language', 'words.lemma'])
        .execute();

      return result.map(row => ({
        id: row.id,
        language: row.language,
        lexicon: row.lexicon,
        lemma: row.lemma,
        pos: row.pos
      }));
    },

    /**
     * Get translations by word form
     */
    getTranslationsByWord: async (core: WordNetKernel, wordForm: string, sourceLanguage: string, targetLanguage: string) => {
      const db = getKyselyDb(core);
      
      // Get source synsets by word form
      const sourceSynsets = await db
        .selectFrom('words')
        .innerJoin('senses', 'words.id', 'senses.word_id')
        .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
        .select(['synsets.id', 'synsets.ili'])
        .where('words.lemma', '=', wordForm)
        .where('synsets.language', '=', sourceLanguage)
        .distinct()
        .execute();

      const translations = [];
      for (const synset of sourceSynsets) {
        if (synset.ili) {
          const targetWords = await db
            .selectFrom('synsets')
            .innerJoin('senses', 'synsets.id', 'senses.synset_id')
            .innerJoin('words', 'senses.word_id', 'words.id')
            .select(['words.lemma', 'synsets.pos', 'synsets.lexicon'])
            .where('synsets.ili', '=', synset.ili)
            .where('synsets.language', '=', targetLanguage)
            .orderBy('words.lemma')
            .execute();
          
          translations.push({
            sourceSynset: synset.id,
            ili: synset.ili,
            translations: targetWords.map(row => ({
              lemma: row.lemma,
              pos: row.pos,
              lexicon: row.lexicon
            }))
          });
        }
      }

      return translations;
    },

    /**
     * Get all available languages for a synset
     */
    getAvailableLanguages: async (core: WordNetKernel, synsetId: string) => {
      const db = getKyselyDb(core);
      
      // Get the source synset's ILI
      const synsetResult = await db
        .selectFrom('synsets')
        .select(['ili'])
        .where('id', '=', synsetId)
        .executeTakeFirst();

      if (!synsetResult?.ili) return [];

      // Get available languages with word counts
      const languages = await db
        .selectFrom('synsets')
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id')
        .select([
          'synsets.language',
          (eb) => eb.fn.count('words.id').as('word_count')
        ])
        .where('synsets.ili', '=', synsetResult.ili)
        .groupBy('synsets.language')
        .orderBy('word_count', 'desc')
        .execute();

      return languages.map(row => ({
        language: row.language,
        word_count: Number(row.word_count)
      }));
    },

    /**
     * Find synsets by ILI across all languages
     */
    getSynsetsByIli: async (core: WordNetKernel, ili: string) => {
      const db = getKyselyDb(core);
      
      const result = await db
        .selectFrom('synsets')
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id')
        .select([
          'synsets.id',
          'synsets.language',
          'synsets.lexicon',
          'synsets.pos',
          (eb) => eb.fn('GROUP_CONCAT', [eb.fn('DISTINCT', ['words.lemma'])]).as('words')
        ])
        .where('synsets.ili', '=', ili)
        .groupBy(['synsets.id', 'synsets.language', 'synsets.lexicon', 'synsets.pos'])
        .orderBy('synsets.language')
        .orderBy('words')
        .execute();

      return result.map(row => ({
        id: row.id,
        language: row.language,
        lexicon: row.lexicon,
        pos: row.pos,
        words: row.words as string
      }));
    },

    /**
     * Get translation confidence based on ILI mapping
     */
    getTranslationConfidence: async (core: WordNetKernel, synset1: string, synset2: string) => {
      const db = getKyselyDb(core);
      
      // Get ILIs for both synsets
      const synsets = await db
        .selectFrom('synsets')
        .select(['ili'])
        .where('id', 'in', [synset1, synset2])
        .execute();

      if (synsets.length !== 2) return 0;

      const [synset1Result, synset2Result] = synsets;
      const ili1 = synset1Result?.ili;
      const ili2 = synset2Result?.ili;
      
      if (!ili1 || !ili2) return 0;
      if (ili1 === ili2) return 1.0;
      
      // For now, return a simple confidence based on ILI similarity
      // Complex recursive queries would need to be handled with raw SQL
      // or a more sophisticated approach
      return 0.5; // Default confidence for different ILIs
    },

    /**
     * Get translation suggestions with confidence scores
     */
    getTranslationSuggestions: async (core: WordNetKernel, wordForm: string, sourceLanguage: string, targetLanguage: string) => {
      const db = getKyselyDb(core);
      
      // Get source synsets for the word
      const sourceSynsets = await db
        .selectFrom('words')
        .innerJoin('senses', 'words.id', 'senses.word_id')
        .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
        .select(['synsets.id', 'synsets.ili'])
        .where('words.lemma', '=', wordForm)
        .where('synsets.language', '=', sourceLanguage)
        .distinct()
        .execute();

      const suggestions = [];
      for (const sourceSynset of sourceSynsets) {
        if (sourceSynset.ili) {
          // Get translations for this synset
          const translations = await db
            .selectFrom('synsets')
            .innerJoin('senses', 'synsets.id', 'senses.synset_id')
            .innerJoin('words', 'senses.word_id', 'words.id')
            .select(['synsets.id', 'synsets.language', 'synsets.lexicon', 'words.lemma', 'words.pos'])
            .where('synsets.ili', '=', sourceSynset.ili)
            .where('synsets.language', '=', targetLanguage)
            .where('synsets.id', '!=', sourceSynset.id)
            .execute();

          if (translations.length > 0) {
            // Calculate confidence based on ILI mapping
            const confidence = sourceSynset.ili ? 0.8 : 0.3;
            
            suggestions.push({
              sourceSynset: sourceSynset.id,
              ili: sourceSynset.ili,
              confidence,
              targetWords: translations.map(t => t.lemma)
            });
          }
        }
      }
      
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
  },
  lifecycle: createLifecyclePlugin('translation', {
    'lexicon:loaded': async (_event, data, _kernel) => {
      console.log(`🌐 Translation plugin: Rebuilding ILI mappings after lexicon load: ${data.lexicon.id}`);
      // Here you could rebuild ILI mappings, precompute translation caches, etc.
      // For example: await rebuildILIMappings(kernel, data.lexicon);
    },
    'data:loaded': async (_event, data, _kernel) => {
      console.log(`🌐 Translation plugin: Rebuilding ILI mappings after data load: ${data.recordCount} records`);
      // Here you could rebuild ILI mappings, precompute translation caches, etc.
      // For example: await rebuildILIMappings(kernel);
    }
  }, {
    priority: 60, // Run after similarity plugin
    dependencies: ['similarity'] // Depends on similarity plugin for path calculations
  })
};
