/**
 * Shared utilities for relation queries
 *
 * Provides common functionality to reduce duplication across different relation query implementations.
 */

import type { WordNetKernel, WordNetCore } from '../../wordnet-kernel.js';
import type { Database } from '../../types/database.js';
import type { Kysely } from 'kysely';

/**
 * Common relation query options
 */
export interface RelationQueryOptions {
  lexicon?: string;
  limit?: number;
  offset?: number;
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  includeMetadata?: boolean;
}

/**
 * Common relation result structure
 */
export interface RelationResult {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
  relationType: string;
  definition?: string;
  example?: string;
  metadata?: Record<string, any>;
}

/**
 * Helper function to get Kysely database from kernel
 */
export function getKyselyDb(kernel: WordNetKernel): Kysely<Database> {
  // Try to access the database through the core
  const core = kernel.core as any;
  if (core?.kyselyDb?.db) {
    return core.kyselyDb.db as Kysely<Database>;
  }

  // Fallback: try to access directly from kernel
  const kyselyDb = (kernel as any).kyselyDb;
  if (kyselyDb?.db) {
    return kyselyDb.db as Kysely<Database>;
  }

  throw new Error(
    'Kysely database not available. Please ensure the kernel was initialized with a Kysely database.'
  );
}

/**
 * Helper function to resolve synset and get lexicon context
 */
export async function resolveSynsetWithLexicon(
  core: WordNetCore,
  synsetId: string,
  providedLexicon?: string
): Promise<{
  synset: any;
  targetLexicon: string;
}> {
  // For testing purposes, if core is undefined or core.synset is not available, return a default lexicon
  if (!core || typeof core.synset !== 'function') {
    return {
      synset: null,
      targetLexicon: providedLexicon || 'oewn:2024',
    };
  }

  const synset = await core.synset(synsetId);
  if (!synset) {
    throw new Error(`Synset not found: ${synsetId}`);
  }
  return {
    synset,
    targetLexicon: providedLexicon || synset.lexicon,
  };
}

/**
 * Common relation query base
 */
export function createRelationQuery(
  db: Kysely<Database>,
  synsetId: string,
  relationType: string | readonly string[],
  options: RelationQueryOptions = {}
): any {
  const {
    lexicon,
    limit,
    offset,
    includeDefinitions = false,
    includeExamples = false,
  } = options;

  // Add grouping for joins
  const groupByFields = [
    'relations.target_id',
    'words.lemma',
    'synsets.pos',
    'synsets.language',
    'synsets.lexicon',
    'relations.type',
  ] as const;

  let query = db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language',
      'synsets.lexicon',
      'relations.type as relationType',
    ])
    .where('relations.source_id', '=', synsetId)
    // Add relation type filter
    .$if(Array.isArray(relationType), qb =>
      qb.where('relations.type', 'in', relationType)
    )
    .$if(!Array.isArray(relationType), qb =>
      qb.where('relations.type', '=', relationType)
    )
    .$if(!!lexicon, qb => qb.where('synsets.lexicon', '=', lexicon!)) // Add lexicon filter if specified
    .$if(includeDefinitions, qb =>
      qb
        .leftJoin('definitions', 'synsets.id', 'definitions.synset_id')
        .select('definitions.text as definition')
    )
    .$if(includeExamples, qb =>
      qb
        .leftJoin('examples', 'senses.id', 'examples.sense_id')
        .select('examples.text as example')
    )
    .groupBy(groupByFields)
    .orderBy('words.lemma')
    .$if(!!limit, qb => qb.limit(limit!))
    .$if(!!offset, qb => qb.offset(offset!));

  return query;
}

/**
 * Execute a relation query with common error handling
 */
export async function executeRelationQuery(
  kernel: WordNetKernel,
  synsetId: string,
  relationType: string | readonly string[],
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  try {
    const db = getKyselyDb(kernel);
    const query = createRelationQuery(db, synsetId, relationType, options);
    const results = await query.execute();

    return results.map((row: any) => ({
      id: row.id,
      lemma: row.lemma,
      pos: row.pos,
      language: row.language || 'en', // Default to 'en' if null
      lexicon: row.lexicon,
      relationType: row.relationType,
      definition: (row as any).definition,
      example: (row as any).example,
      metadata: (row as any).metadata,
    }));
  } catch (error) {
    console.warn(`Error executing relation query for ${synsetId}:`, error);
    return [];
  }
}

/**
 * Execute a relation query with synset resolution
 */
export async function executeRelationQueryWithResolution(
  kernel: WordNetKernel,
  synsetId: string,
  relationType: string | readonly string[],
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  try {
    const { targetLexicon } = await resolveSynsetWithLexicon(
      kernel.core,
      synsetId,
      options.lexicon
    );

    return executeRelationQuery(kernel, synsetId, relationType, {
      ...options,
      lexicon: targetLexicon,
    });
  } catch (error) {
    console.warn(
      `Error executing relation query with resolution for ${synsetId}:`,
      error
    );
    return [];
  }
}

/**
 * Common relation query patterns
 */
export const relationQueryPatterns = {
  /**
   * Get direct relations (one level)
   */
  getDirectRelations: async (
    kernel: WordNetKernel,
    synsetId: string,
    relationType: string | readonly string[],
    options: RelationQueryOptions = {}
  ): Promise<RelationResult[]> => {
    return executeRelationQueryWithResolution(kernel, synsetId, relationType, options);
  },

  /**
   * Get all relations (recursive)
   */
  getAllRelations: async (
    kernel: WordNetKernel,
    synsetId: string,
    relationType: string | readonly string[],
    options: RelationQueryOptions = {}
  ): Promise<RelationResult[]> => {
    const results: RelationResult[] = [];
    const visited = new Set<string>();
    const queue = [synsetId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const relations = await executeRelationQueryWithResolution(
        kernel,
        currentId,
        relationType,
        options
      );

      results.push(...relations);

      // Add target synsets to queue for recursive traversal
      relations.forEach(rel => {
        if (!visited.has(rel.id)) {
          queue.push(rel.id);
        }
      });
    }

    return results;
  },

  /**
   * Get relations with depth limit
   */
  getRelationsWithDepth: async (
    kernel: WordNetKernel,
    synsetId: string,
    relationType: string | readonly string[],
    maxDepth: number,
    options: RelationQueryOptions = {}
  ): Promise<RelationResult[]> => {
    const results: RelationResult[] = [];
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: synsetId, depth: 0 }];

    while (queue.length > 0) {
      const { id: currentId, depth } = queue.shift()!;
      if (visited.has(currentId) || depth > maxDepth) continue;
      visited.add(currentId);

      const relations = await executeRelationQueryWithResolution(
        kernel,
        currentId,
        relationType,
        options
      );

      results.push(...relations);

      // Add target synsets to queue for recursive traversal
      if (depth < maxDepth) {
        relations.forEach(rel => {
          if (!visited.has(rel.id)) {
            queue.push({ id: rel.id, depth: depth + 1 });
          }
        });
      }
    }

    return results;
  },
};

/**
 * Common relation type constants
 */
export const RELATION_TYPES = {
  // Hierarchical relations
  HYPERNYM: 'hypernym',
  HYPONYM: 'hyponym',
  INSTANCE_HYPERNYM: 'instance_hypernym',
  INSTANCE_HYPONYM: 'instance_hyponym',

  // Part-whole relations
  HOLONYM: 'holonym',
  MERONYM: 'meronym',
  SUBSTANCE_HOLONYM: 'substance_holonym',
  SUBSTANCE_MERONYM: 'substance_meronym',
  PART_HOLONYM: 'part_holonym',
  PART_MERONYM: 'part_meronym',
  MEMBER_HOLONYM: 'member_holonym',
  MEMBER_MERONYM: 'member_meronym',

  // Similarity relations
  SIMILAR_TO: 'similar_to',
  ALSO_SEE: 'also_see',

  // Cause relations
  CAUSE: 'cause',
  ENTAILMENT: 'entailment',

  // Attribute relations
  ATTRIBUTE: 'attribute',

  // Domain relations
  DOMAIN_TOPIC: 'domain_topic',
  DOMAIN_REGION: 'domain_region',
  DOMAIN_USAGE: 'domain_usage',
  MEMBER_TOPIC: 'member_topic',
  MEMBER_REGION: 'member_region',
  MEMBER_USAGE: 'member_usage',
  SUBSTANCE_TOPIC: 'substance_topic',
  SUBSTANCE_REGION: 'substance_region',
  SUBSTANCE_USAGE: 'substance_usage',

  // Other relations
  ANTONYM: 'antonym',
  DERIVATIONALLY_RELATED: 'derivationally_related',
  PERTAINYM: 'pertainym',
  PARTICIPLE_OF: 'participle_of',
  SEE_ALSO: 'see_also',
} as const;

/**
 * Relation type categories for grouping
 */
export const RELATION_CATEGORIES = {
  HIERARCHICAL: [
    RELATION_TYPES.HYPERNYM,
    RELATION_TYPES.HYPONYM,
    RELATION_TYPES.INSTANCE_HYPERNYM,
    RELATION_TYPES.INSTANCE_HYPONYM,
  ],
  PART_WHOLE: [
    RELATION_TYPES.HOLONYM,
    RELATION_TYPES.MERONYM,
    RELATION_TYPES.SUBSTANCE_HOLONYM,
    RELATION_TYPES.SUBSTANCE_MERONYM,
    RELATION_TYPES.PART_HOLONYM,
    RELATION_TYPES.PART_MERONYM,
    RELATION_TYPES.MEMBER_HOLONYM,
    RELATION_TYPES.MEMBER_MERONYM,
  ],
  SIMILARITY: [RELATION_TYPES.SIMILAR_TO, RELATION_TYPES.ALSO_SEE],
  CAUSE: [RELATION_TYPES.CAUSE, RELATION_TYPES.ENTAILMENT],
  DOMAIN: [
    RELATION_TYPES.DOMAIN_TOPIC,
    RELATION_TYPES.DOMAIN_REGION,
    RELATION_TYPES.DOMAIN_USAGE,
    RELATION_TYPES.MEMBER_TOPIC,
    RELATION_TYPES.MEMBER_REGION,
    RELATION_TYPES.MEMBER_USAGE,
    RELATION_TYPES.SUBSTANCE_TOPIC,
    RELATION_TYPES.SUBSTANCE_REGION,
    RELATION_TYPES.SUBSTANCE_USAGE,
  ],
  OTHER: [
    RELATION_TYPES.ANTONYM,
    RELATION_TYPES.DERIVATIONALLY_RELATED,
    RELATION_TYPES.PERTAINYM,
    RELATION_TYPES.PARTICIPLE_OF,
    RELATION_TYPES.SEE_ALSO,
  ],
} as const;

/**
 * Relation type descriptions
 */
export const RELATION_DESCRIPTIONS = {
  [RELATION_TYPES.HYPERNYM]: 'More general concept',
  [RELATION_TYPES.HYPONYM]: 'More specific concept',
  [RELATION_TYPES.INSTANCE_HYPERNYM]: 'Class of which this is an instance',
  [RELATION_TYPES.INSTANCE_HYPONYM]: 'Instance of this class',
  [RELATION_TYPES.HOLONYM]: 'Whole of which this is a part',
  [RELATION_TYPES.MERONYM]: 'Part of this whole',
  [RELATION_TYPES.SIMILAR_TO]: 'Similar concept',
  [RELATION_TYPES.ALSO_SEE]: 'Related concept to see also',
  [RELATION_TYPES.CAUSE]: 'Causes this',
  [RELATION_TYPES.ENTAILMENT]: 'Entails this',
  [RELATION_TYPES.ANTONYM]: 'Opposite meaning',
  [RELATION_TYPES.DERIVATIONALLY_RELATED]: 'Derivationally related form',
  [RELATION_TYPES.PERTAINYM]: 'Pertaining to this',
  [RELATION_TYPES.PARTICIPLE_OF]: 'Participle form of this verb',
  [RELATION_TYPES.SEE_ALSO]: 'See also this concept',
} as const;

/**
 * Utility functions for relation queries
 */
export const relationUtils = {
  /**
   * Check if a relation type is hierarchical
   */
  isHierarchical: (relationType: string): boolean => {
    return RELATION_CATEGORIES.HIERARCHICAL.includes(relationType as any);
  },

  /**
   * Check if a relation type is part-whole
   */
  isPartWhole: (relationType: string): boolean => {
    return RELATION_CATEGORIES.PART_WHOLE.includes(relationType as any);
  },

  /**
   * Check if a relation type is domain-related
   */
  isDomain: (relationType: string): boolean => {
    return RELATION_CATEGORIES.DOMAIN.includes(relationType as any);
  },

  /**
   * Get the inverse relation type
   */
  getInverseRelation: (relationType: string): string | null => {
    const inverseMap: Record<string, string> = {
      [RELATION_TYPES.HYPERNYM]: RELATION_TYPES.HYPONYM,
      [RELATION_TYPES.HYPONYM]: RELATION_TYPES.HYPERNYM,
      [RELATION_TYPES.INSTANCE_HYPERNYM]: RELATION_TYPES.INSTANCE_HYPONYM,
      [RELATION_TYPES.INSTANCE_HYPONYM]: RELATION_TYPES.INSTANCE_HYPERNYM,
      [RELATION_TYPES.HOLONYM]: RELATION_TYPES.MERONYM,
      [RELATION_TYPES.MERONYM]: RELATION_TYPES.HOLONYM,
      [RELATION_TYPES.SUBSTANCE_HOLONYM]: RELATION_TYPES.SUBSTANCE_MERONYM,
      [RELATION_TYPES.SUBSTANCE_MERONYM]: RELATION_TYPES.SUBSTANCE_HOLONYM,
      [RELATION_TYPES.PART_HOLONYM]: RELATION_TYPES.PART_MERONYM,
      [RELATION_TYPES.PART_MERONYM]: RELATION_TYPES.PART_HOLONYM,
      [RELATION_TYPES.MEMBER_HOLONYM]: RELATION_TYPES.MEMBER_MERONYM,
      [RELATION_TYPES.MEMBER_MERONYM]: RELATION_TYPES.MEMBER_HOLONYM,
    };

    return inverseMap[relationType] || null;
  },

  /**
   * Get all relation types in a category
   */
  getRelationTypesInCategory: (
    category: keyof typeof RELATION_CATEGORIES
  ): string[] => {
    return [...RELATION_CATEGORIES[category]];
  },

  /**
   * Get description for a relation type
   */
  getRelationDescription: (relationType: string): string => {
    return (
      RELATION_DESCRIPTIONS[relationType as keyof typeof RELATION_DESCRIPTIONS] ||
      'Unknown relation type'
    );
  },
};
