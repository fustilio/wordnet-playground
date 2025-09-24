// Insert mutations
export {
  batchInsert,
  insertRecord,
  insertRecords
} from './insert-mutations.js';

// Update mutations
export {
  updateRecordById,
  updateRecordsByCondition,
  upsertRecord,
  upsertRecords
} from './update-mutations.js';

// Delete mutations
export {
  deleteLexicon,
  deleteWordsByLexicon,
  deleteSynsetsByLexicon,
  deleteAllData,
  deleteRecordById,
  deleteRecordsByCondition
} from './delete-mutations.js';

// Schema mutations
export {
  createTables,
  createIndexes
} from './schema-mutations.js';
