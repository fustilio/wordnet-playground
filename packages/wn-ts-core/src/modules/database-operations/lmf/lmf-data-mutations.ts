import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
// import { validateForeignKeyReferences } from './helpers.js';

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
    let synsetsToDelete = [];
    
    // Query synsets one by one to avoid SQL variable limits
    for (const id of lexiconIdsForQuery) {
      logger?.step(`Querying synsets for lexicon: ${id}`);
      const synsets = await db
        .selectFrom('synsets')
        .select('id')
        .where('lexicon', '=', id)
        .execute();
      logger?.step(`Found ${synsets.length} synsets for lexicon: ${id}`);
      synsetsToDelete.push(...synsets);
    }
    
    const synsetIds = synsetsToDelete.map((s: any) => s.id);
    logger?.step(`Found ${synsetIds.length} synsets to delete`);
    
    // Delete related data in the correct order (respecting foreign key constraints)
    if (synsetIds.length > 0) {
      // Delete senses that reference these synsets one by one to avoid SQL variable limits
      for (const synsetId of synsetIds) {
        await db.deleteFrom('senses').where('synset_id', '=', synsetId).execute();
      }
      logger?.step(`Deleted senses for ${synsetIds.length} synsets`);
      
      // Delete definitions that reference these synsets one by one
      for (const synsetId of synsetIds) {
        await db.deleteFrom('definitions').where('synset_id', '=', synsetId).execute();
      }
      logger?.step(`Deleted definitions for ${synsetIds.length} synsets`);
    }
    
    // Delete words and synsets that reference these lexicons
    const lexiconIdsToDelete = baseId ? [lexiconId, baseId] : [lexiconId];

    // First get all word IDs for the lexicons so we can delete their forms
    const wordIdsToDelete: string[] = [];
    for (const lexiconIdToDelete of lexiconIdsToDelete) {
      const words = await db
        .selectFrom('words')
        .select('id')
        .where('lexicon', '=', lexiconIdToDelete)
        .execute();
      wordIdsToDelete.push(...words.map((w: any) => w.id));
    }

    // Delete forms that reference these words
    if (wordIdsToDelete.length > 0) {
      for (const wordId of wordIdsToDelete) {
        await db.deleteFrom('forms').where('word_id', '=', wordId).execute();
      }
      logger?.step(`Deleted forms for ${wordIdsToDelete.length} words`);
    }

    // Delete words one by one to avoid SQL variable limits
    for (const lexiconIdToDelete of lexiconIdsToDelete) {
      await db.deleteFrom('words').where('lexicon', '=', lexiconIdToDelete).execute();
    }
    logger?.step(`Deleted words for lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    // Delete synsets one by one
    for (const lexiconIdToDelete of lexiconIdsToDelete) {
      await db.deleteFrom('synsets').where('lexicon', '=', lexiconIdToDelete).execute();
    }
    logger?.step(`Deleted synsets for lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    // Finally, delete the lexicons themselves
    for (const lexiconIdToDelete of lexiconIdsToDelete) {
      await db.deleteFrom('lexicons').where('id', '=', lexiconIdToDelete).execute();
    }
    logger?.step(`Deleted lexicons: ${lexiconId}, ${baseId || 'N/A'}`);
    
    // Also try to delete any lexicons that might have case variations or whitespace
    if (baseId) {
      await db.deleteFrom('lexicons').where('id', 'like', `%${baseId}%`).execute();
    }
    logger?.step(`Deleted lexicons with pattern: %${baseId}%`);
    
    // Verify deletion worked by checking if any lexicons remain
    let remainingLexicons = [];
    for (const id of lexiconIds) {
      const lexicons = await db
        .selectFrom('lexicons')
        .select('id')
        .where('id', '=', id)
        .execute();
      remainingLexicons.push(...lexicons);
    }
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
      // Delete conflicting lexicons one by one
      for (const conflictingLexicon of conflictingLexicons) {
        await db.deleteFrom('lexicons').where('id', '=', conflictingLexicon.id).execute();
      }
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
    forms?: Database["forms"][];
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
  logger?.debug(`Starting insertLMFDataInTransaction with data:`, {
    lexicons: dataToInsert.lexicons?.length || 0,
    words: dataToInsert.words?.length || 0,
    forms: dataToInsert.forms?.length || 0,
    synsets: dataToInsert.synsets?.length || 0,
    senses: dataToInsert.senses?.length || 0,
    definitions: dataToInsert.definitions?.length || 0
  });

  const { lexicons, words, forms, synsets, senses, definitions } = dataToInsert;

  // Validate foreign key references before starting transaction - TEMPORARILY DISABLED TO ISOLATE ISSUE
  // validateForeignKeyReferences(dataToInsert, logger);

  // Process data in small batches with transactions to avoid SQLite variable limits
  const BATCH_SIZE = 100; // Process 100 records at a time in transactions
  
  // Clear conflicting data first
  if (lexicons.length > 0) {
    const lexiconIds = lexicons.map(l => l.id);
    await clearConflictingLexiconData(db, lexiconIds, logger);
  }

  // Process lexicons first (they're usually small)
  if (lexicons.length > 0) {
    logger?.step(`inserting ${lexicons.length} lexicons`);
    logger?.debug(`About to start lexicon insertion loop`);
    for (let i = 0; i < lexicons.length; i++) {
      const lexicon = lexicons[i];
      if (!lexicon) continue;
      try {
        logger?.debug(`About to insert lexicon ${i + 1}/${lexicons.length}: ${lexicon.id}`);
        const query = db.insertInto('lexicons').values(lexicon as any);
        const compiledQuery = query.compile();
        logger?.debug(`Lexicon SQL: ${compiledQuery.sql}`);
        logger?.debug(`Lexicon Parameters: ${JSON.stringify(compiledQuery.parameters)}`);
        await query.execute();
        logger?.debug(`Successfully inserted lexicon ${i + 1}/${lexicons.length}: ${lexicon.id}`);
      } catch (error) {
        // Ignore duplicate key errors
        if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
          logger?.debug(`Lexicon already exists: ${lexicon.id}`);
          continue;
        }
        logger?.error(`Failed to insert lexicon ${i + 1}/${lexicons.length}: ${lexicon.id}`, error);
        throw error;
      }
    }
    logger?.debug(`inserted ${lexicons.length} lexicons`);
  }

  // Process words in batches
  if (words.length > 0) {
    logger?.step(`inserting ${words.length} words in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(words.length / BATCH_SIZE);
      
      logger?.step(`Processing words batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, words.length)})`);
      
      await db.transaction().execute(async (trx) => {
        for (const word of batch) {
          if (!word) continue;
          try {
            await trx.insertInto('words').values(word as any).execute();
          } catch (error) {
            // Ignore duplicate key errors
            if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
              continue;
            }
            logger?.error(`Failed to insert word: ${word.lemma}`, error);
            throw error;
          }
        }
      });
    }
    logger?.debug(`inserted ${words.length} words`);
  }

  // Process forms in batches (must be after words since forms reference words)
  if (forms && forms.length > 0) {
    logger?.step(`inserting ${forms.length} forms in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < forms.length; i += BATCH_SIZE) {
      const batch = forms.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(forms.length / BATCH_SIZE);

      logger?.step(`Processing forms batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, forms.length)})`);

      await db.transaction().execute(async (trx) => {
        for (const form of batch) {
          if (!form) continue;
          try {
            await trx.insertInto('forms').values(form as any).execute();
          } catch (error) {
            // Ignore duplicate key errors
            if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
              continue;
            }
            logger?.error(`Failed to insert form: ${form.written_form}`, error);
            throw error;
          }
        }
      });
    }
    logger?.debug(`inserted ${forms.length} forms`);
  }

  // Process synsets in batches
  if (synsets.length > 0) {
    logger?.step(`inserting ${synsets.length} synsets in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < synsets.length; i += BATCH_SIZE) {
      const batch = synsets.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(synsets.length / BATCH_SIZE);
      
      logger?.step(`Processing synsets batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, synsets.length)})`);
      
      await db.transaction().execute(async (trx) => {
        for (const synset of batch) {
          if (!synset) continue;
          try {
            await trx.insertInto('synsets').values(synset as any).execute();
          } catch (error) {
            // Ignore duplicate key errors
            if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
              continue;
            }
            logger?.error(`Failed to insert synset: ${synset.id}`, error);
            throw error;
          }
        }
      });
    }
    logger?.debug(`inserted ${synsets.length} synsets`);
  }

  // Process senses in batches
  if (senses.length > 0) {
    logger?.step(`inserting ${senses.length} senses in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < senses.length; i += BATCH_SIZE) {
      const batch = senses.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(senses.length / BATCH_SIZE);
      
      logger?.step(`Processing senses batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, senses.length)})`);
      
      await db.transaction().execute(async (trx) => {
        for (const sense of batch) {
          if (!sense) continue;
          try {
            await trx.insertInto('senses').values(sense as any).execute();
          } catch (error) {
            // Ignore duplicate key errors
            if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
              continue;
            }
            logger?.error(`Failed to insert sense: ${sense.id}`, error);
            throw error;
          }
        }
      });
    }
    logger?.debug(`inserted ${senses.length} senses`);
  }

  // Process definitions in batches
  if (definitions.length > 0) {
    logger?.step(`inserting ${definitions.length} definitions in batches of ${BATCH_SIZE}`);
    for (let i = 0; i < definitions.length; i += BATCH_SIZE) {
      const batch = definitions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(definitions.length / BATCH_SIZE);
      
      logger?.step(`Processing definitions batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, definitions.length)})`);
      
      await db.transaction().execute(async (trx) => {
        for (const definition of batch) {
          if (!definition) continue;
          try {
            await trx.insertInto('definitions').values(definition as any).execute();
          } catch (error) {
            // Ignore duplicate key errors
            if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
              continue;
            }
            logger?.error(`Failed to insert definition: ${definition.id}`, error);
            throw error;
          }
        }
      });
    }
    logger?.debug(`inserted ${definitions.length} definitions`);
  }

  logger?.step(`all data inserted successfully`);
}
