import type {
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  lexicons: LexiconTable;
  words: WordTable;
  synsets: SynsetTable;
  senses: SenseTable;
  forms: FormTable;
  definitions: DefinitionTable;
  examples: ExampleTable;
  relations: RelationTable;
  ilis: IliTable;
  sqlite_master: SqliteMasterTable;
}

// ============================================================================
// SQLITE_MASTER TABLE (for database introspection)
// ============================================================================

export interface SqliteMasterTable {
  type: string;
  name: string;
  tbl_name: string;
  rootpage: number;
  sql: string;
}

// ============================================================================
// LEXICONS TABLE
// ============================================================================

export interface LexiconTable {
  id: string;
  label: string | null;
  language: string | null;
  email: string | null;
  license: string | null;
  version: string | null;
  url: string | null;
  citation: string | null;
  logo: string | null;
  metadata: JSONColumnType<Record<string, any>> | null;
}

export type Lexicon = Selectable<LexiconTable>;
export type NewLexicon = Insertable<LexiconTable>;
export type LexiconUpdate = Updateable<LexiconTable>;

// ============================================================================
// WORDS TABLE
// ============================================================================

export interface WordTable {
  id: string;
  lemma: string;
  pos: string;
  language: string | null;
  lexicon: string;
}

export type Word = Selectable<WordTable>;
export type NewWord = Insertable<WordTable>;
export type WordUpdate = Updateable<WordTable>;

// ============================================================================
// SYNSETS TABLE
// ============================================================================

export interface SynsetTable {
  id: string;
  pos: string;
  ili: string | null;
  language: string | null;
  lexicon: string;
}

export type Synset = Selectable<SynsetTable>;
export type NewSynset = Insertable<SynsetTable>;
export type SynsetUpdate = Updateable<SynsetTable>;

// ============================================================================
// SENSES TABLE
// ============================================================================

export interface SenseTable {
  id: string;
  word_id: string;
  synset_id: string;
  source: string | null;
  sensekey: string | null;
  adjposition: string | null;
  subcategory: string | null;
  domain: string | null;
  register: string | null;
}

export type Sense = Selectable<SenseTable>;
export type NewSense = Insertable<SenseTable>;
export type SenseUpdate = Updateable<SenseTable>;

// ============================================================================
// FORMS TABLE
// ============================================================================

export interface FormTable {
  id: string;
  word_id: string;
  written_form: string;
  script: string | null;
  tag: string | null;
}

export type Form = Selectable<FormTable>;
export type NewForm = Insertable<FormTable>;
export type FormUpdate = Updateable<FormTable>;

// ============================================================================
// DEFINITIONS TABLE
// ============================================================================

export interface DefinitionTable {
  id: string;
  synset_id: string;
  language: string;
  text: string;
  source: string | null;
}

export type Definition = Selectable<DefinitionTable>;
export type NewDefinition = Insertable<DefinitionTable>;
export type DefinitionUpdate = Updateable<DefinitionTable>;

// ============================================================================
// EXAMPLES TABLE
// ============================================================================

export interface ExampleTable {
  id: string;
  synset_id: string | null;
  sense_id: string | null;
  language: string;
  text: string;
  source: string | null;
}

export type Example = Selectable<ExampleTable>;
export type NewExample = Insertable<ExampleTable>;
export type ExampleUpdate = Updateable<ExampleTable>;

// ============================================================================
// RELATIONS TABLE
// ============================================================================

export interface RelationTable {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  source: string | null;
}

export type Relation = Selectable<RelationTable>;
export type NewRelation = Insertable<RelationTable>;
export type RelationUpdate = Updateable<RelationTable>;

// ============================================================================
// ILIS TABLE
// ============================================================================

export interface IliTable {
  id: string;
  definition: string | null;
  status: string | null;
  meta: JSONColumnType<Record<string, any>> | null;
}

export type ILI = Selectable<IliTable>;
export type NewILI = Insertable<IliTable>;
export type ILIUpdate = Updateable<IliTable>; 
