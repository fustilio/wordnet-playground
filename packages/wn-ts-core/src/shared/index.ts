/**
 * Shared Kysely-based implementations for wn-ts ecosystem
 */

export { BaseKyselyQueryService } from './base-query-service.js';
export { batchInsert } from './batch-insert.js';
export { SchemaBuilder } from './schema-builder.js';
export { DatabaseUtils } from './database-utils.js';
export type { 
  Database, 
  DatabaseSchema, 
  LexiconTable, 
  WordTable, 
  SynsetTable, 
  SenseTable, 
  DefinitionTable, 
  RelationTable, 
  ExampleTable, 
  IliTable, 
  FormTable 
} from './database-types.js';
export type { 
  BaseDatabaseConfig,
  NodeDatabaseConfig,
  WebDatabaseConfig,
  DatabaseStats,
  DatabaseConnectionState
} from './database-config.js';

// Translation utilities
export {
  TranslationHelper,
  createTranslationHelper,
  quickTranslate,
} from './translation-utils.js';
export type {
  TranslationResult,
  BilingualQueryOptions,
} from './translation-utils.js';