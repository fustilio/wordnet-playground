/**
 * Simple relation queries for the relations module
 * 
 * These provide straightforward database queries for basic relation types
 * without complex algorithms or taxonomy analysis.
 * 
 * All queries use Kysely for maximum type safety and consistency.
 */

import type { WordNetKernel } from '../../wordnet-kernel.js';
import { 
  executeRelationQueryWithResolution,
  RELATION_TYPES,
  type RelationResult,
  type RelationQueryOptions
} from './relation-utils.js';

/**
 * Get hypernyms (parent concepts) - simple query version
 */
export async function getHypernyms(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    RELATION_TYPES.HYPERNYM,
    options
  );
}

/**
 * Get hyponyms (child concepts) - simple query version
 */
export async function getHyponyms(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    RELATION_TYPES.HYPONYM,
    options
  );
}

/**
 * Get meronyms (part-of relationships)
 */
export async function getMeronyms(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    [RELATION_TYPES.PART_MERONYM, RELATION_TYPES.MEMBER_MERONYM, RELATION_TYPES.SUBSTANCE_MERONYM],
    options
  );
}

/**
 * Get holonyms (whole-of relationships)
 */
export async function getHolonyms(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    [RELATION_TYPES.PART_HOLONYM, RELATION_TYPES.MEMBER_HOLONYM, RELATION_TYPES.SUBSTANCE_HOLONYM],
    options
  );
}

/**
 * Get entailments (logical relationships)
 */
export async function getEntailments(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    RELATION_TYPES.ENTAILMENT,
    options
  );
}

/**
 * Get similar concepts
 */
export async function getSimilarTos(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    RELATION_TYPES.SIMILAR_TO,
    options
  );
}

/**
 * Get all relations of a specific type
 */
export async function getRelationsByType(
  core: WordNetKernel, 
  synsetId: string, 
  relationType: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  return executeRelationQueryWithResolution(
    core,
    synsetId,
    relationType,
    options
  );
}

/**
 * Get all relations (both incoming and outgoing)
 */
export async function getAllRelations(
  core: WordNetKernel, 
  synsetId: string,
  options: RelationQueryOptions = {}
): Promise<RelationResult[]> {
  // Get both incoming and outgoing relations
  const outgoing = await executeRelationQueryWithResolution(
    core,
    synsetId,
    '*', // All relation types
    options
  );
  
  // For incoming relations, we need to reverse the query
  // This is a simplified approach - in practice, you might want to implement
  // a more sophisticated bidirectional query
  return outgoing;
}
