/**
 * Shared database types for wn-ts ecosystem
 * 
 * This file defines the common database schema types that both Node.js and Web
 * implementations can use, eliminating duplication across packages.
 */

export interface Database {
  lexicons: LexiconTable;
  words: WordTable;
  synsets: SynsetTable;
  senses: SenseTable;
  definitions: DefinitionTable;
  relations: RelationTable;
  examples: ExampleTable;
  ilis: IliTable;
  forms: FormTable;
}

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

export interface WordTable {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}

export interface SynsetTable {
  id: string;
  ili?: string;
  pos: string;
  language: string;
  lexicon: string;
}

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

export interface DefinitionTable {
  id: string;
  synset_id: string;
  language: string;
  text: string;
  source?: string;
}

export interface RelationTable {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  source?: string;
}

export interface ExampleTable {
  id: string;
  synset_id?: string;
  sense_id?: string;
  language: string;
  text: string;
  source?: string;
}

export interface IliTable {
  id: string;
  definition?: string;
  status: string;
  superseded_by?: string;
  note?: string;
  meta?: string;
}

export interface FormTable {
  id: string;
  word_id: string;
  written_form: string;
  script?: string;
  tag?: string;
}

// Type aliases for better readability
export type DatabaseSchema = Database;
export type LexiconRecord = LexiconTable;
export type WordRecord = WordTable;
export type SynsetRecord = SynsetTable;
export type SenseRecord = SenseTable;
export type DefinitionRecord = DefinitionTable;
export type RelationRecord = RelationTable;
export type ExampleRecord = ExampleTable;
export type IliRecord = IliTable;
