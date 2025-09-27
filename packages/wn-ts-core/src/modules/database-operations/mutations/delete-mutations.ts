import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import type { DataManagerLogger } from '../../data-management/shared-data-manager.js';

/**
 * Delete a lexicon and all its related data
 * Deletes in order to respect foreign key constraints
 */
export async function deleteLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
  // Delete in order to respect foreign key constraints
  await db.deleteFrom('forms').where('word_id', 'in', 
    db.selectFrom('words').select('id').where('lexicon', '=', lexiconId)
  ).execute();

  await db.deleteFrom('definitions').where('synset_id', 'in',
    db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)
  ).execute();

  await db.deleteFrom('relations').where((eb) => 
    eb.or([
      eb('source_id', 'in', db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)),
      eb('target_id', 'in', db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId))
    ])
  ).execute();

  await db.deleteFrom('examples').where('synset_id', 'in',
    db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)
  ).execute();

  await db.deleteFrom('senses').where('word_id', 'in',
    db.selectFrom('words').select('id').where('lexicon', '=', lexiconId)
  ).execute();

  await db.deleteFrom('words').where('lexicon', '=', lexiconId).execute();
  await db.deleteFrom('synsets').where('lexicon', '=', lexiconId).execute();
  await db.deleteFrom('lexicons').where('id', '=', lexiconId).execute();
}

/**
 * Clear conflicting lexicon data before insertion
 * Handles both base ID and full project ID conflicts
 */
export async function clearConflictingLexiconData(
  db: Kysely<Database>,
  baseId: string,
  projectId: string,
  logger: DataManagerLogger
): Promise<void> {
  logger.debug(`🧹 Clearing conflicting data for baseId: ${baseId}, projectId: ${projectId}`);

  try {
    // Get all lexicons that might conflict (base ID or full project ID)
    const conflictingLexicons = await db
      .selectFrom('lexicons')
      .select(['id', 'label'])
      .where((eb) => 
        eb.or([
          eb('id', '=', baseId),
          eb('id', '=', projectId),
          eb('id', 'like', `${baseId}:%`),
        ])
      )
      .execute();

    logger.debug(`Found ${conflictingLexicons.length} conflicting lexicons to delete`);

    if (conflictingLexicons.length === 0) {
      logger.debug('No conflicting data found');
      return;
    }

    const lexiconIds = conflictingLexicons.map(l => l.id);
    logger.debug(`Deleting lexicons: ${lexiconIds.join(', ')}`);

    // Delete in order to respect foreign key constraints
    // First, get all synset IDs for these lexicons
    const synsetIds = await db
      .selectFrom('synsets')
      .select('id')
      .where('lexicon', 'in', lexiconIds)
      .execute();

    const synsetIdList = synsetIds.map(s => s.id);
    logger.debug(`Found ${synsetIdList.length} synsets to delete`);

    if (synsetIdList.length > 0) {
      // Delete related data for these synsets
      await db.deleteFrom('forms').where('word_id', 'in', 
        db.selectFrom('words').select('id').where('lexicon', 'in', lexiconIds)
      ).execute();

      await db.deleteFrom('definitions').where('synset_id', 'in', synsetIdList).execute();

      await db.deleteFrom('relations').where((eb) => 
        eb.or([
          eb('source_id', 'in', synsetIdList),
          eb('target_id', 'in', synsetIdList)
        ])
      ).execute();

      await db.deleteFrom('examples').where('synset_id', 'in', synsetIdList).execute();

      await db.deleteFrom('senses').where('word_id', 'in',
        db.selectFrom('words').select('id').where('lexicon', 'in', lexiconIds)
      ).execute();

      await db.deleteFrom('words').where('lexicon', 'in', lexiconIds).execute();
      await db.deleteFrom('synsets').where('lexicon', 'in', lexiconIds).execute();
    }

    // Delete ILI data for these lexicons
    await db.deleteFrom('ilis').where('id', 'like', `${baseId}%`).execute();

    // Finally, delete the lexicons themselves
    await db.deleteFrom('lexicons').where('id', 'in', lexiconIds).execute();

    logger.debug(`✅ Successfully cleared ${conflictingLexicons.length} conflicting lexicons`);
  } catch (error) {
    logger.error(`❌ Failed to clear conflicting data:`, error);
    throw error;
  }
}

/**
 * Delete all words and their related data for a specific lexicon
 */
export async function deleteWordsByLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
  const wordIds = await db.selectFrom('words').select('id').where('lexicon', '=', lexiconId).execute();
  const wordIdList = wordIds.map(w => w.id);

  if (wordIdList.length > 0) {
    await db.deleteFrom('forms').where('word_id', 'in', wordIdList).execute();
    await db.deleteFrom('senses').where('word_id', 'in', wordIdList).execute();
    await db.deleteFrom('words').where('id', 'in', wordIdList).execute();
  }
}

/**
 * Delete all synsets and their related data for a specific lexicon
 */
export async function deleteSynsetsByLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
  const synsetIds = await db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId).execute();
  const synsetIdList = synsetIds.map(w => w.id);

  if (synsetIdList.length > 0) {
    await db.deleteFrom('definitions').where('synset_id', 'in', synsetIdList).execute();
    await db.deleteFrom('relations').where((eb) => 
      eb.or([
        eb('source_id', 'in', synsetIdList),
        eb('target_id', 'in', synsetIdList)
      ])
    ).execute();
    await db.deleteFrom('examples').where('synset_id', 'in', synsetIdList).execute();
    await db.deleteFrom('senses').where('synset_id', 'in', synsetIdList).execute();
    await db.deleteFrom('synsets').where('id', 'in', synsetIdList).execute();
  }
}

/**
 * Delete all data from all tables
 * We must delete in an order that respects foreign key constraints,
 * as relying on `ON DELETE CASCADE` can be fragile in some environments.
 */
export async function deleteAllData(db: Kysely<Database>): Promise<void> {
  const tables: (keyof Database)[] = [
    'forms',
    'definitions', 
    'relations',
    'examples',
    'senses',
    'words',
    'synsets',
    'ilis',
    'lexicons'
  ];

  for (const table of tables) {
    try {
      await db.deleteFrom(table).execute();
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

/**
 * Delete a single record by ID
 */
export function deleteRecordById<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  id: string
) {
  return (db as any)
    .deleteFrom(tableName)
    .where('id', '=', id)
    .execute();
}

/**
 * Delete records by a specific condition
 */
export function deleteRecordsByCondition<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  condition: (eb: any) => any
) {
  return (db as any)
    .deleteFrom(tableName)
    .where(condition)
    .execute();
}
