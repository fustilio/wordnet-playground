/**
 * Validation functions for Wordnet data.
 * 
 * This module provides functions for validating Wordnet data
 * structures and relationships.
 */

import type { Synset, Sense, Word, Relation } from './types.js';
import { WnError } from './types.js';

/**
 * Validate a synset.
 * 
 * @param synset - The synset to validate
 * @throws {WnError} If the synset is invalid
 */
export function validateSynset(synset: Synset): void {
  if (!synset.id) {
    throw new WnError('Synset must have an ID');
  }
  
  if (!synset.partOfSpeech) {
    throw new WnError('Synset must have a part of speech');
  }
  
  if (!synset.language) {
    throw new WnError('Synset must have a language');
  }
  
  if (!synset.lexicon) {
    throw new WnError('Synset must have a lexicon');
  }
  
  // Validate relations
  for (const relation of synset.relations) {
    validateRelation(relation);
  }
  
  // Validate members (array of strings)
  for (const memberId of synset.members) {
    if (!memberId || typeof memberId !== 'string') {
      throw new WnError('Synset members must be valid string IDs');
    }
  }
  
  // Validate senses (array of strings)
  for (const senseId of synset.senses) {
    if (!senseId || typeof senseId !== 'string') {
      throw new WnError('Synset senses must be valid string IDs');
    }
  }
}

/**
 * Validate a sense.
 * 
 * @param sense - The sense to validate
 * @throws {WnError} If the sense is invalid
 */
export function validateSense(sense: Sense): void {
  if (!sense.id) {
    throw new WnError('Sense must have an ID');
  }
  
  if (!sense.word) {
    throw new WnError('Sense must have a word');
  }
  
  if (!sense.synset) {
    throw new WnError('Sense must have a synset');
  }
  
  // Validate word and synset IDs
  if (!sense.word || typeof sense.word !== 'string') {
    throw new WnError('Sense must have a valid word ID');
  }
  if (!sense.synset || typeof sense.synset !== 'string') {
    throw new WnError('Sense must have a valid synset ID');
  }
}

/**
 * Validate a word.
 * 
 * @param word - The word to validate
 * @throws {WnError} If the word is invalid
 */
export function validateWord(word: Word): void {
  if (!word.id) {
    throw new WnError('Word must have an ID');
  }
  
  if (!word.lemma) {
    throw new WnError('Word must have a lemma');
  }
  
  if (!word.partOfSpeech) {
    throw new WnError('Word must have a part of speech');
  }
  
  if (!word.language) {
    throw new WnError('Word must have a language');
  }
  
  if (!word.lexicon) {
    throw new WnError('Word must have a lexicon');
  }
}

/**
 * Validate a relation.
 * 
 * @param relation - The relation to validate
 * @throws {WnError} If the relation is invalid
 */
export function validateRelation(relation: Relation): void {
  if (!relation.id) {
    throw new WnError('Relation must have an ID');
  }
  
  if (!relation.type) {
    throw new WnError('Relation must have a type');
  }
  
  if (!relation.target) {
    throw new WnError('Relation must have a target');
  }
}

/**
 * Validate a complete Wordnet structure.
 * 
 * @param synsets - Array of synsets to validate
 * @throws {WnError} If any synset is invalid
 */
export function validateWordnet(synsets: Synset[]): void {
  for (const synset of synsets) {
    validateSynset(synset);
  }
  
  // Check for circular references
  checkCircularReferences(synsets);
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