/**
 * Shared Kysely-based implementations for wn-ts ecosystem
 */

import type { Kysely } from 'kysely';
import type { Database, LexiconTable } from '../types/database.js';

export { BaseKyselyQueryService } from './base-query-service.js';
export { batchInsert } from './batch-insert.js';
export { SchemaBuilder } from './schema-builder.js';
export { DatabaseUtils } from './database-utils.js';
export type { 
  Database,
  LexiconTable, 
  WordTable, 
  SynsetTable, 
  SenseTable, 
  DefinitionTable, 
  RelationTable, 
  ExampleTable, 
  IliTable, 
  FormTable,
  NewLexicon,
  NewWord,
  NewSynset,
  NewSense,
  NewDefinition,
  NewExample,
  NewRelation,
  NewILI,
  NewForm
} from '../types/database.js';
export type { 
  BaseDatabaseConfig,
  NodeDatabaseConfig,
  WebDatabaseConfig,
  DatabaseStats,
  DatabaseConnectionState
} from './database-config.js';

// Data manager interfaces
export type { 
  DataManagerOptions,
  DataManagerLogger,
  DataManagerAdapter,
  DataManagerProjectInfo
} from '../modules/data-management/shared-data-manager.js';

// Common query service interface
export interface QueryService {
  database: Kysely<Database>;
  getLexicons(): Promise<LexiconTable[]>;
}

// Query strategy types
export type { 
  QueryStrategy, 
  QueryOptions 
} from './base-query-service.js';

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