/**
 * Kysely database schema types for wn-ts-web
 * 
 * This file re-exports the shared database types from wn-ts-core.
 */

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
  FormTable
} from 'wn-ts-core';

// DatabaseSchema is an alias for Database
import type { Database } from 'wn-ts-core';
export type DatabaseSchema = Database;

