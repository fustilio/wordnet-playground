// Insert mutations
export {
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

// LMF data mutations
export {
  clearConflictingLexiconData,
  insertLMFDataInTransaction
} from '../lmf/lmf-data-mutations.js';

// LMF data helpers
export {
  prepareLexiconData,
  prepareWordData,
  prepareSynsetData,
  prepareSenseData,
  prepareDefinitionData,
  validateForeignKeyReferences
} from '../lmf/helpers.js';

// Schema mutations
export {
  createTables,
  createIndexes
} from './schema-mutations.js';
