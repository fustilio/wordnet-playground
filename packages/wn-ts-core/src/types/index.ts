/**
 * Types-only exports from wn-ts-core
 * 
 * This file exports only the types and interfaces needed by consumers
 * without including test utilities or other heavy dependencies.
 */

// Core types from core/types.js
export type {
  Word,
  Sense,
  Synset,
  Lexicon,
  Definition,
  Example,
  Relation,
  Form,
  Pronunciation,
  Tag,
  Count,
  ILI,
  PartOfSpeech,
  WordQuery,
  SenseQuery,
  SynsetQuery,
  WordnetConfig,
  WordnetOptions,
  DownloadOptions,
  AddOptions,
  ExportOptions,
} from '../core/types.js';

// Database types from types/database.js
export type {
  Database,
  LexiconTable,
  WordTable,
  SynsetTable,
  SenseTable,
  FormTable,
  DefinitionTable,
  ExampleTable,
  RelationTable,
  IliTable,
  // Kysely-generated types
  Lexicon as DatabaseLexicon,
  NewLexicon,
  LexiconUpdate,
  Word as DatabaseWord,
  NewWord,
  WordUpdate,
  Synset as DatabaseSynset,
  NewSynset,
  SynsetUpdate,
  Sense as DatabaseSense,
  NewSense,
  SenseUpdate,
  Form as DatabaseForm,
  NewForm,
  FormUpdate,
  Definition as DatabaseDefinition,
  NewDefinition,
  DefinitionUpdate,
  Example as DatabaseExample,
  NewExample,
  ExampleUpdate,
  Relation as DatabaseRelation,
  NewRelation,
  RelationUpdate,
  ILI as DatabaseILI,
  NewILI,
  ILIUpdate,
} from './database.js';

// Error types from core/errors.js
export {
  WnError,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning
} from '../core/errors.js';

// Query strategy types from shared/base-query-service.js
export type { QueryStrategy, QueryOptions } from '../shared/base-query-service.js';

// LMF types from lmf/shared-parser.js
export type {
  LMFDocument,
  LMFLoadOptions,
  LMFParseError,
  DuplicateHandlingConfig,
  DuplicateHandler
} from '../lmf/shared-parser.js';

// LMF parser from lmf.js
export type { LMFParser } from '../lmf.js';