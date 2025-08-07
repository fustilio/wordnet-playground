/**
 * Abstract database interfaces for WordNet TypeScript ecosystem
 * 
 * This file defines the abstract interfaces that database clients must implement.
 * Environment-specific packages (wn-ts-web, wn-ts-node) implement these interfaces
 * using their preferred database technology (SQLite WASM, better-sqlite3, Kysely, etc.)
 */

/**
 * Main database interface defining all tables
 */
export interface DatabaseSchema {
  lexicons: LexiconTable;
  words: WordTable;
  synsets: SynsetTable;
  senses: SenseTable;
  definitions: DefinitionTable;
  relations: RelationTable;
  examples: ExampleTable;
  ilis: IliTable;
}

/**
 * Lexicon table - represents WordNet projects/lexicons
 */
export interface LexiconTable {
  id: string;
  label: string;
  language: string;
  email?: string;
  license?: string;
  version?: string;
  url?: string;
  citation?: string;
  logo?: string;
  metadata?: string;
}

/**
 * Word table - represents individual words/lemmas
 */
export interface WordTable {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}

/**
 * Synset table - represents sets of synonymous words
 */
export interface SynsetTable {
  id: string;
  ili?: string;
  pos: string;
  language: string;
  lexicon: string;
}

/**
 * Sense table - represents the relationship between words and synsets
 */
export interface SenseTable {
  id: string;
  word_id: string;
  synset_id: string;
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}

/**
 * Definition table - represents definitions for synsets
 */
export interface DefinitionTable {
  id: string;
  synset_id: string;
  language: string;
  text: string;
  source?: string;
}

/**
 * Relation table - represents relationships between synsets
 */
export interface RelationTable {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  source?: string;
}

/**
 * Example table - represents example sentences
 */
export interface ExampleTable {
  id: string;
  synset_id?: string;
  sense_id?: string;
  language: string;
  text: string;
  source?: string;
}

/**
 * ILI table - represents Interlingual Index entries
 */
export interface IliTable {
  id: string;
  definition?: string;
  status: string;
  superseded_by?: string;
  note?: string;
  meta?: string;
}

/**
 * Type aliases for common operations
 */
export type WordRecord = WordTable;
export type SynsetRecord = SynsetTable;
export type SenseRecord = SenseTable;
export type DefinitionRecord = DefinitionTable;
export type RelationRecord = RelationTable;
export type ExampleRecord = ExampleTable;
export type IliRecord = IliTable;
export type LexiconRecord = LexiconTable;

/**
 * Query result types for common operations
 */
export interface WordWithSenses extends WordRecord {
  senses: SenseRecord[];
}

export interface SynsetWithWords extends SynsetRecord {
  words: WordRecord[];
  definitions: DefinitionRecord[];
}

export interface SenseWithWord extends SenseRecord {
  word: WordRecord;
  synset: SynsetRecord;
}

/**
 * Abstract database client interface
 * 
 * This interface defines what any database client must implement,
 * regardless of the underlying technology (SQLite, PostgreSQL, etc.)
 */
export interface DatabaseClient {
  /**
   * Initialize the database connection
   */
  initialize(): Promise<void>;
  
  /**
   * Close the database connection
   */
  close(): Promise<void>;
  
  /**
   * Execute a query and return all results
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  
  /**
   * Execute a query and return the first result
   */
  queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
  
  /**
   * Execute a query and return a single value
   */
  queryValue<T = any>(sql: string, params?: any[]): Promise<T | null>;
  
  /**
   * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: any[]): Promise<void>;
  
  /**
   * Begin a transaction
   */
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;
  
  /**
   * Check if the database is healthy
   */
  healthCheck(): Promise<{ healthy: boolean; error?: string }>;
}

/**
 * Abstract query builder interface
 * 
 * This interface defines what a query builder should look like,
 * allowing different implementations (Kysely, raw SQL, etc.)
 */
export interface QueryBuilder<T = any> {
  select(columns?: string[]): QueryBuilder<T>;
  from(table: string): QueryBuilder<T>;
  where(column: string, operator: string, value: any): QueryBuilder<T>;
  whereIn(column: string, values: any[]): QueryBuilder<T>;
  innerJoin(table: string, on: string): QueryBuilder<T>;
  leftJoin(table: string, on: string): QueryBuilder<T>;
  groupBy(columns: string[]): QueryBuilder<T>;
  orderBy(column: string, direction?: 'asc' | 'desc'): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
  executeFirst(): Promise<T | null>;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql';
  connection: any;
  debug?: boolean;
}

/**
 * Query options for common operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  language?: string;
  lexicon?: string;
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  includeRelations?: boolean;
}

/**
 * Search options for word lookup
 */
export interface WordSearchOptions extends QueryOptions {
  exact?: boolean;
  caseSensitive?: boolean;
  pos?: string;
}

/**
 * Search options for synset lookup
 */
export interface SynsetSearchOptions extends QueryOptions {
  includeHyponyms?: boolean;
  includeHypernyms?: boolean;
  includeSynonyms?: boolean;
  maxDepth?: number;
}

/**
 * Abstract database factory interface
 * 
 * Environment-specific packages implement this to create their preferred
 * database client (SQLite WASM, better-sqlite3, Kysely, etc.)
 */
export interface DatabaseFactory {
  /**
   * Create a new database client
   */
  createClient(config: DatabaseConfig): Promise<DatabaseClient>;
  
  /**
   * Create a query builder for the given table
   */
  createQueryBuilder<T = any>(table: string): QueryBuilder<T>;
  
  /**
   * Get database statistics
   */
  getStatistics(client: DatabaseClient): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalDefinitions: number;
    totalRelations: number;
    totalLexicons: number;
  }>;
} 
