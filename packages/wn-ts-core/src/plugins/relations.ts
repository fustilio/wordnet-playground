/**
 * Relations Plugin for WordNet Kernel
 * 
 * Provides comprehensive relationship queries for synsets including:
 * - Hypernyms and hyponyms
 * - Meronyms and holonyms  
 * - Entailments and similar-to relationships
 * - Custom relation type queries
 * - All relations (incoming and outgoing)
 */

import type { WordNetCore, Plugin, WordNetKernel } from '../wordnet-kernel.js';
import type { Database } from '../types/database.js';
import type { Kysely } from 'kysely';
import { createLifecyclePlugin } from '../wordnet-kernel-lifecycle.js';
// import { logger } from '../../utils/logger.js';

// Helper function to resolve synset and get lexicon context
async function resolveSynsetWithLexicon(core: WordNetCore, synsetId: string, providedLexicon?: string) {
  const synset = await core.synset(synsetId);
  if (!synset) {
    throw new Error(`Synset not found: ${synsetId}`);
  }
  return {
    synset,
    targetLexicon: providedLexicon || synset.lexicon
  };
}

// Helper function to get Kysely database from kernel
function getKyselyDb(kernel: WordNetKernel): Kysely<Database> {
  const kyselyDb = (kernel as any).kyselyDb;
  if (!kyselyDb?.db) {
    throw new Error('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
  }
  return kyselyDb.db as Kysely<Database>;
}

// Helper function to execute Kysely relation queries
async function executeRelationQuery(
  kernel: WordNetKernel,
  synsetId: string,
  targetLexicon: string,
  relationType: string | string[]
): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}>> {
  const db = getKyselyDb(kernel);
  const relationTypes = Array.isArray(relationType) ? relationType : [relationType];
  
  const result = await db
    .selectFrom('synsets')
    .innerJoin('relations', 'synsets.id', 'relations.target_id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'synsets.id',
      'synsets.pos',
      'synsets.language',
      'synsets.lexicon',
      'words.lemma'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', 'in', relationTypes)
    .where('synsets.lexicon', '=', targetLexicon)
    .groupBy(['synsets.id', 'synsets.pos', 'synsets.language', 'synsets.lexicon', 'words.lemma'])
    .orderBy('words.lemma')
    .execute();
  
  return result.map(synset => ({
    id: synset.id,
    lemma: synset.lemma,
    pos: synset.pos,
    language: synset.language || 'en',
    lexicon: synset.lexicon
  }));
}

export const relations: Plugin = {
  name: 'relations',
  methods: {
  // Hypernyms (more general concepts)
  getHypernyms: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      'hypernym'
    );
  },

  // Hyponyms (more specific concepts)
  getHyponyms: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      'hyponym'
    );
  },

  // Meronyms (part-of relationships)
  getMeronyms: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      ['meronym', 'part_meronym', 'member_meronym', 'substance_meronym']
    );
  },

  // Holonyms (whole-of relationships)
  getHolonyms: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      ['holonym', 'part_holonym', 'member_holonym', 'substance_holonym']
    );
  },

  // Entailments (logical implications)
  getEntailments: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      'entailment'
    );
  },

  // Similar-to relationships
  getSimilarTos: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    return executeRelationQuery(
      kernel,
      synsetId,
      targetLexicon,
      'similar_to'
    );
  },

  // Relations by specific type
  getRelationsByType: async (kernel: WordNetKernel, synsetId: string, relationType: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    const db = getKyselyDb(kernel);
    const result = await db
      .selectFrom('synsets')
      .innerJoin('relations', 'synsets.id', 'relations.target_id')
      .innerJoin('senses', 'synsets.id', 'senses.synset_id')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .select([
        'synsets.id',
        'synsets.pos',
        'synsets.language',
        'synsets.lexicon',
        'words.lemma',
        'relations.type'
      ])
      .where('relations.source_id', '=', synsetId)
      .where('relations.type', '=', relationType)
      .where('synsets.lexicon', '=', targetLexicon)
      .groupBy(['synsets.id', 'synsets.pos', 'synsets.language', 'synsets.lexicon', 'words.lemma', 'relations.type'])
      .orderBy('words.lemma')
      .execute();
    
    return result.map(synset => ({
      id: synset.id,
      lemma: synset.lemma,
      pos: synset.pos,
      language: synset.language || 'en',
      lexicon: synset.lexicon,
      type: synset.type
    }));
  },

  // All relations (both incoming and outgoing)
  getAllRelations: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    const db = getKyselyDb(kernel);
    const result = await db
      .selectFrom('relations')
      .innerJoin('synsets as s1', 'relations.source_id', 's1.id')
      .innerJoin('synsets as s2', 'relations.target_id', 's2.id')
      .innerJoin('senses as se1', 's1.id', 'se1.synset_id')
      .innerJoin('words as w1', 'se1.word_id', 'w1.id')
      .innerJoin('senses as se2', 's2.id', 'se2.synset_id')
      .innerJoin('words as w2', 'se2.word_id', 'w2.id')
      .select([
        'relations.id',
        'relations.source_id',
        'relations.target_id',
        'relations.type',
        'w1.lemma as source_lemma',
        'w2.lemma as target_lemma',
        's1.lexicon as source_lexicon',
        's2.lexicon as target_lexicon'
      ])
      .where((eb) => eb.or([
        eb('relations.source_id', '=', synsetId),
        eb('relations.target_id', '=', synsetId)
      ]))
      .where((eb) => eb.or([
        eb('s1.lexicon', '=', targetLexicon),
        eb('s2.lexicon', '=', targetLexicon)
      ]))
      .groupBy(['relations.id', 'relations.source_id', 'relations.target_id', 'relations.type', 'w1.lemma', 'w2.lemma', 's1.lexicon', 's2.lexicon'])
      .orderBy(['relations.type', 'w2.lemma'])
      .execute();
    
    return result.map(rel => ({
      id: rel.id,
      sourceId: rel.source_id,
      targetId: rel.target_id,
      type: rel.type,
      sourceLemma: rel.source_lemma,
      targetLemma: rel.target_lemma,
      sourceLexicon: rel.source_lexicon,
      targetLexicon: rel.target_lexicon,
      direction: rel.source_id === synsetId ? 'outgoing' as const : 'incoming' as const
    }));
  },

  // Get relation types available for a synset
  getRelationTypes: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    const db = getKyselyDb(kernel);
    const result = await db
      .selectFrom('relations')
      .innerJoin('synsets as s1', 'relations.source_id', 's1.id')
      .innerJoin('synsets as s2', 'relations.target_id', 's2.id')
      .select(['relations.type'])
      .where((eb) => eb.or([
        eb('relations.source_id', '=', synsetId),
        eb('relations.target_id', '=', synsetId)
      ]))
      .where((eb) => eb.or([
        eb('s1.lexicon', '=', targetLexicon),
        eb('s2.lexicon', '=', targetLexicon)
      ]))
      .distinct()
      .orderBy('relations.type')
      .execute();
    
    return result.map(row => row.type);
  },

  // Get relation statistics
  getRelationStats: async (kernel: WordNetKernel, synsetId: string, lexicon?: string) => {
    const { targetLexicon } = await resolveSynsetWithLexicon(kernel.core, synsetId, lexicon);
    
    const db = getKyselyDb(kernel);
    
    // We need to separate incoming and outgoing counts
    const outgoingResult = await db
      .selectFrom('relations')
      .innerJoin('synsets as s1', 'relations.source_id', 's1.id')
      .innerJoin('synsets as s2', 'relations.target_id', 's2.id')
      .select([
        'relations.type',
        (eb) => eb.fn.count('relations.id').as('count')
      ])
      .where('relations.source_id', '=', synsetId)
      .where('s1.lexicon', '=', targetLexicon)
      .groupBy('relations.type')
      .orderBy('relations.type')
      .execute();
    
    const incomingResult = await db
      .selectFrom('relations')
      .innerJoin('synsets as s1', 'relations.source_id', 's1.id')
      .innerJoin('synsets as s2', 'relations.target_id', 's2.id')
      .select([
        'relations.type',
        (eb) => eb.fn.count('relations.id').as('count')
      ])
      .where('relations.target_id', '=', synsetId)
      .where('s2.lexicon', '=', targetLexicon)
      .groupBy('relations.type')
      .orderBy('relations.type')
      .execute();
    
    const stats: Array<{ type: string; count: number; direction: 'incoming' | 'outgoing' }> = [];
    
    // Add outgoing stats
    outgoingResult.forEach(row => {
      stats.push({ type: row.type, count: Number(row.count), direction: 'outgoing' as const });
    });
    
    // Add incoming stats
    incomingResult.forEach(row => {
      stats.push({ type: row.type, count: Number(row.count), direction: 'incoming' as const });
    });
    
    return stats;
  }
  },
  lifecycle: createLifecyclePlugin('relations', {
    'kernel:init': async (_event, _data, _kernel) => {
      console.log(`🔗 Relations plugin: Kernel initialized`);
      // Relations plugin is ready to serve relationship queries
    },
    'lexicon:loaded': async (_event, data, _kernel) => {
      console.log(`🔗 Relations plugin: Lexicon loaded - ${data.lexicon.id}`);
      // Relations are now available for this lexicon
    },
    'data:loaded': async (_event, data, _kernel) => {
      console.log(`🔗 Relations plugin: Data loaded - ${data.recordCount} records`);
      // All relationship data is now available
    }
  }, {
    priority: 10, // High priority for lifecycle events
    dependencies: [] // No dependencies
  })
};
