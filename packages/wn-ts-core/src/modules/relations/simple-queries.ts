/**
 * Simple relation queries for the relations module
 * 
 * These provide straightforward database queries for basic relation types
 * without complex algorithms or taxonomy analysis.
 * 
 * All queries use Kysely for maximum type safety and consistency.
 */

import type { WordNetKernel } from '../../wordnet-kernel.js';
import type { Database } from '../../types/database.js';
import type { Kysely } from 'kysely';

// Helper function to get Kysely database from kernel
function getKyselyDb(kernel: WordNetKernel): Kysely<Database> {
  const kyselyDb = (kernel as any).kyselyDb;
  if (!kyselyDb?.db) {
    throw new Error('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
  }
  return kyselyDb.db as Kysely<Database>;
}

/**
 * Get hypernyms (parent concepts) - simple query version
 */
export async function getHypernyms(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', '=', 'hypernym')
    .groupBy(['relations.target_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get hyponyms (child concepts) - simple query version
 */
export async function getHyponyms(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.source_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.source_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.target_id', '=', synsetId)
    .where('relations.type', '=', 'hypernym')
    .groupBy(['relations.source_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get meronyms (part-of relationships)
 */
export async function getMeronyms(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', 'in', ['part_meronym', 'member_meronym', 'substance_meronym'])
    .groupBy(['relations.target_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get holonyms (whole-of relationships)
 */
export async function getHolonyms(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.source_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.source_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.target_id', '=', synsetId)
    .where('relations.type', 'in', ['part_meronym', 'member_meronym', 'substance_meronym'])
    .groupBy(['relations.source_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get entailments (logical relationships)
 */
export async function getEntailments(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', '=', 'entailment')
    .groupBy(['relations.target_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get similar concepts
 */
export async function getSimilarTos(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', '=', 'similar_to')
    .groupBy(['relations.target_id', 'words.lemma', 'synsets.pos', 'synsets.language'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || ''
  }));
}

/**
 * Get all relations of a specific type
 */
export async function getRelationsByType(core: WordNetKernel, synsetId: string, relationType: string): Promise<Array<{
  id: string;
  lemma: string;
  pos: string;
  language: string;
  type: string;
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets', 'relations.target_id', 'synsets.id')
    .innerJoin('senses', 'synsets.id', 'senses.synset_id')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .select([
      'relations.target_id as id',
      'words.lemma',
      'synsets.pos',
      'synsets.language',
      'relations.type'
    ])
    .where('relations.source_id', '=', synsetId)
    .where('relations.type', '=', relationType)
    .groupBy(['relations.target_id', 'words.lemma', 'synsets.pos', 'synsets.language', 'relations.type'])
    .orderBy('words.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    lemma: row.lemma,
    pos: row.pos,
    language: row.language || '',
    type: row.type
  }));
}

/**
 * Get all relations (both incoming and outgoing)
 */
export async function getAllRelations(core: WordNetKernel, synsetId: string): Promise<Array<{
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  source_lemma: string;
  target_lemma: string;
  direction: 'incoming' | 'outgoing';
}>> {
  const db = getKyselyDb(core);
  
  const result = await db
    .selectFrom('relations')
    .innerJoin('synsets as s1', 'relations.source_id', 's1.id')
    .innerJoin('synsets as s2', 'relations.target_id', 's2.id')
    .innerJoin('senses as sense1', 's1.id', 'sense1.synset_id')
    .innerJoin('words as w1', 'sense1.word_id', 'w1.id')
    .innerJoin('senses as sense2', 's2.id', 'sense2.synset_id')
    .innerJoin('words as w2', 'sense2.word_id', 'w2.id')
    .select([
      'relations.id',
      'relations.source_id',
      'relations.target_id',
      'relations.type',
      'w1.lemma as source_lemma',
      'w2.lemma as target_lemma',
      (eb) => eb.case()
        .when('relations.source_id', '=', synsetId)
        .then('outgoing')
        .when('relations.target_id', '=', synsetId)
        .then('incoming')
        .end()
        .as('direction')
    ])
    .where((eb) => eb.or([
      eb('relations.source_id', '=', synsetId),
      eb('relations.target_id', '=', synsetId)
    ]))
    .groupBy(['relations.id', 'relations.source_id', 'relations.target_id', 'relations.type', 'w1.lemma', 'w2.lemma'])
    .orderBy('relations.type')
    .orderBy('w2.lemma')
    .execute();
    
  return result.map(row => ({
    id: row.id,
    source_id: row.source_id,
    target_id: row.target_id,
    type: row.type,
    source_lemma: row.source_lemma,
    target_lemma: row.target_lemma,
    direction: row.direction as 'incoming' | 'outgoing'
  }));
}
