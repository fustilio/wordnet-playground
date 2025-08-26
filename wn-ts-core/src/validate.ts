/**
 * Validation functions for Wordnet data using Zod schemas.
 * 
 * This module provides functions for validating Wordnet data
 * structures and relationships using Zod schemas for runtime
 * type safety and automatic TypeScript type inference.
 */

import type { Relation, Sense, Synset, Word } from './types.js';
import { WnError } from './types.js';
import {
  SynsetSchema,
  WordSchema,
  SenseSchema,
  RelationSchema,
  SynsetArraySchema,
} from './schemas.js';

/**
 * Validate a synset using Zod schema.
 * 
 * @param synset - The synset to validate
 * @throws {WnError} If the synset is invalid
 */
export function validateSynset(synset: unknown): synset is Synset {
  const result = SynsetSchema.safeParse(synset);
  if (!result.success) {
    throw new WnError(`Invalid synset: ${result.error.message}`);
  }
  return true;
}

/**
 * Validate a sense using Zod schema.
 * 
 * @param sense - The sense to validate
 * @throws {WnError} If the sense is invalid
 */
export function validateSense(sense: unknown): sense is Sense {
  const result = SenseSchema.safeParse(sense);
  if (!result.success) {
    throw new WnError(`Invalid sense: ${result.error.message}`);
  }
  return true;
}

/**
 * Validate a word using Zod schema.
 * 
 * @param word - The word to validate
 * @throws {WnError} If the word is invalid
 */
export function validateWord(word: unknown): word is Word {
  const result = WordSchema.safeParse(word);
  if (!result.success) {
    throw new WnError(`Invalid word: ${result.error.message}`);
  }
  return true;
}

/**
 * Validate a relation using Zod schema.
 * 
 * @param relation - The relation to validate
 * @throws {WnError} If the relation is invalid
 */
export function validateRelation(relation: unknown): relation is Relation {
  const result = RelationSchema.safeParse(relation);
  if (!result.success) {
    throw new WnError(`Invalid relation: ${result.error.message}`);
  }
  return true;
}

/**
 * Validate a complete Wordnet structure using Zod schema.
 * 
 * @param synsets - Array of synsets to validate
 * @throws {WnError} If any synset is invalid
 */
export function validateWordnet(synsets: unknown): synsets is Synset[] {
  const result = SynsetArraySchema.safeParse(synsets);
  if (!result.success) {
    throw new WnError(`Invalid WordNet data: ${result.error.message}`);
  }
  
  // Check for circular references after schema validation
  checkCircularReferences(result.data);
  return true;
}

/**
 * Check for circular references in synset relations.
 * 
 * @param synsets - Array of synsets to check
 * @throws {WnError} If circular references are found
 */
function checkCircularReferences(synsets: Synset[]): void {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(synsetId: string): void {
    if (recursionStack.has(synsetId)) {
      throw new WnError(`Circular reference detected: ${synsetId}`);
    }
    
    if (visited.has(synsetId)) {
      return;
    }
    
    visited.add(synsetId);
    recursionStack.add(synsetId);
    
    const synset = synsets.find(s => s.id === synsetId);
    if (synset) {
      for (const relation of synset.relations) {
        if (relation.type === 'hypernym') {
          dfs(relation.target);
        }
      }
    }
    
    recursionStack.delete(synsetId);
  }
  
  for (const synset of synsets) {
    if (!visited.has(synset.id)) {
      dfs(synset.id);
    }
  }
}

// Export the Zod schemas for direct use if needed
export {
  SynsetSchema,
  WordSchema,
  SenseSchema,
  RelationSchema,
  SynsetArraySchema,
} from './schemas.js'; 
