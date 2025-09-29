import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import { validateForeignKeyReferences } from './helpers.js';

/**
 * Clear conflicting lexicon data before inserting new data
 * This prevents PRIMARY KEY constraint errors and ensures clean data
 */
export async function clearConflictingLexiconData(
  db: Kysely<Database>,
  lexiconIds: string[],
  logger?: { step: (message: string, data?: any) => void }
): Promise<void> {
  if (lexiconIds.length === 0) return;

  logger?.step(`clearing conflicting lexicons: ${lexiconIds.join(", ")}`);

  for (const lexiconId of lexiconIds) {
    const baseId = lexiconId.split(':')[0];
    
    logger?.step(`Deleting lexicon data for IDs: ${lexiconId}, ${baseId}`);
    
    // First, get the synset IDs that belong to these lexicons
    const lexiconIdsForQuery = baseId ? [lexiconId, baseId] : [lexiconId];
    const synsetsToDelete = await db
      .selectFrom('synsets')
      .select('id')
      .where('lexicon', 'in', lexiconIdsForQuery)
      .execute();
    
    const synsetIds = synsetsToDelete.map((s: any) => s.id);
    logger?.step(`Found ${synsetIds.length} synsets to delete`);
    
    // Delete related data in the correct order (respecting foreign key constraints)
    if (synsetIds.length > 0) {
      // Delete senses that reference these synsets
      await db.deleteFrom('senses').where('synset_id', 'in', synsetIds).execute();
      logger?.step(`Deleted senses for ${synsetIds.length} synsets`);
      
      // Delete definitions that reference these synsets  
      await db.deleteFrom('definitions').where('synset_id', 'in', synsetIds).execute();
      logger?.step(`Deleted definitions for ${synsetIds.length} synsets`);
    }
    
    // Delete words and synsets that reference these lexicons
    const lexiconIds = baseId ? [lexiconId, baseId] : [lexiconId];
    await db.deleteFrom('words').where('lexicon', 'in', lexiconIds).execute();
    logger?.step(`Deleted words for lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    await db.deleteFrom('synsets').where('lexicon', 'in', lexiconIds).execute();
    logger?.step(`Deleted synsets for lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    // Finally, delete the lexicons themselves - use more comprehensive deletion
    await db.deleteFrom('lexicons').where('id', 'in', lexiconIds).execute();
    logger?.step(`Deleted lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    // Also try to delete any lexicons that might have case variations or whitespace
    if (baseId) {
      await db.deleteFrom('lexicons').where('id', 'like', `%${baseId}%`).execute();
    }
    logger?.step(`Deleted lexicons with pattern: %${baseId}%`);
    
    // Verify deletion worked by checking if any lexicons remain
    const remainingLexicons = await db
      .selectFrom('lexicons')
      .select('id')
      .where('id', 'in', lexiconIds)
      .execute();
    logger?.step(`Verification: ${remainingLexicons.length} lexicons remain with IDs: ${remainingLexicons.map(l => l.id).join(', ')}`);
    
    // Also check for any lexicons that might match our pattern
    const patternLexicons = await db
      .selectFrom('lexicons')
      .select('id')
      .where('id', 'like', `%${baseId}%`)
      .execute();
    logger?.step(`Pattern check: ${patternLexicons.length} lexicons match pattern %${baseId}%: ${patternLexicons.map(l => l.id).join(', ')}`);
    
    // If we still have lexicons, let's see what's in the database
    if (remainingLexicons.length > 0 || patternLexicons.length > 0) {
      const allLexicons = await db
        .selectFrom('lexicons')
        .select('id')
        .execute();
      logger?.step(`All lexicons in database: ${allLexicons.map(l => l.id).join(', ')}`);
    }
    
    // Also try to delete any lexicons that might have case variations or whitespace
    // This is a more aggressive approach to ensure we clear all possible conflicts
    const allLexicons = await db
      .selectFrom('lexicons')
      .select('id')
      .execute();
    
    const conflictingLexicons = allLexicons.filter(l => 
      (baseId && l.id.toLowerCase().includes(baseId.toLowerCase())) || 
      l.id.toLowerCase().includes(lexiconId.toLowerCase())
    );
    
    if (conflictingLexicons.length > 0) {
      logger?.step(`Found additional conflicting lexicons: ${conflictingLexicons.map(l => l.id).join(', ')}`);
      await db.deleteFrom('lexicons').where('id', 'in', conflictingLexicons.map(l => l.id)).execute();
      logger?.step(`Deleted additional conflicting lexicons`);
    }
  }
  
  logger?.step(`conflicting data cleared`);
}


/**
 * Insert LMF data in the correct order with transaction management
 */
export async function insertLMFDataInTransaction(
  db: Kysely<Database>,
  dataToInsert: {
    lexicons: Database["lexicons"][];
    words: Database["words"][];
    synsets: Database["synsets"][];
    senses: Database["senses"][];
    definitions: Database["definitions"][];
  },
  logger?: { 
    step: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  }
): Promise<void> {
  const { lexicons, words, synsets, senses, definitions } = dataToInsert;

  // Validate foreign key references before starting transaction
  validateForeignKeyReferences(dataToInsert, logger);

  await db.transaction().execute(async (trx) => {
    // Clear conflicting data first
    if (lexicons.length > 0) {
      const lexiconIds = lexicons.map(l => l.id);
      await clearConflictingLexiconData(trx, lexiconIds, logger);
    }

    // Insert lexicons first (required for foreign key constraints)
    logger?.step(`inserting lexicons first (required for foreign key constraints)`);
    if (lexicons.length > 0) {
      logger?.step(`inserting ${lexicons.length} lexicons with IDs: ${lexicons.map((l) => l.id).join(", ")}`);
      logger?.step(`lexicon data to insert:`, JSON.stringify(lexicons, null, 2));
      
      // Use individual inserts to avoid "too many SQL variables" error
      for (let i = 0; i < lexicons.length; i++) {
        const lexicon = lexicons[i];
        if (i % 1000 === 0) {
          logger?.step(`Inserting lexicon ${i + 1}/${lexicons.length}: ${lexicon.id}`);
        }
        try {
          await trx.insertInto('lexicons').values(lexicon as any).onConflict((oc) => oc.column('id').doNothing()).execute();
        } catch (error) {
          logger?.error(`Failed to insert lexicon ${i + 1}: ${lexicon.id}`, error);
          throw error;
        }
      }
      
      logger?.debug(`inserted ${lexicons.length} lexicons with IDs: ${lexicons.map((l) => l.id).join(", ")}`);
    } else {
      logger?.error(`no lexicons to insert - this may cause foreign key constraint failures`);
    }

    // Insert words (they reference lexicons)
    logger?.step(`inserting words (referencing lexicons)`);
    if (words.length > 0) {
      // Use individual inserts to avoid "too many SQL variables" error
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (i % 1000 === 0) {
          logger?.step(`Inserting word ${i + 1}/${words.length}: ${word.lemma}`);
        }
        await trx.insertInto('words').values(word as any).onConflict((oc) => oc.column('id').doNothing()).execute();
      }
      logger?.debug(`inserted ${words.length} words`);
    }

    // Insert synsets (they also reference lexicons)
    logger?.step(`inserting synsets (referencing lexicons)`);
    if (synsets.length > 0) {
      // Use individual inserts to avoid "too many SQL variables" error
      for (let i = 0; i < synsets.length; i++) {
        const synset = synsets[i];
        if (i % 1000 === 0) {
          logger?.step(`Inserting synset ${i + 1}/${synsets.length}: ${synset.id}`);
        }
        await trx.insertInto('synsets').values(synset as any).onConflict((oc) => oc.column('id').doNothing()).execute();
      }
      logger?.debug(`inserted ${synsets.length} synsets`);
    }

    // Insert senses (they reference words and synsets)
    logger?.step(`inserting senses (referencing words and synsets)`);
    if (senses.length > 0) {
      // Use individual inserts to avoid "too many SQL variables" error
      for (let i = 0; i < senses.length; i++) {
        const sense = senses[i];
        if (i % 1000 === 0) {
          logger?.step(`Inserting sense ${i + 1}/${senses.length}: ${sense.id}`);
        }
        await trx.insertInto('senses').values(sense as any).onConflict((oc) => oc.column('id').doNothing()).execute();
      }
      logger?.debug(`inserted ${senses.length} senses`);
    }

    // Insert definitions (they reference synsets)
    logger?.step(`inserting definitions (referencing synsets)`);
    if (definitions.length > 0) {
      // Use individual inserts to avoid "too many SQL variables" error
      for (let i = 0; i < definitions.length; i++) {
        const definition = definitions[i];
        if (i % 1000 === 0) {
          logger?.step(`Inserting definition ${i + 1}/${definitions.length}: ${definition.id}`);
        }
        await trx.insertInto('definitions').values(definition as any).onConflict((oc) => oc.column('id').doNothing()).execute();
      }
      logger?.debug(`inserted ${definitions.length} definitions`);
    }

    logger?.step(`transaction completed successfully`);
  });
}
