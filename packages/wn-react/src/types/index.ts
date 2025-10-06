/**
 * Types for WordNet React
 */

// Re-export core types
export type {
  Word,
  Sense,
  Synset,
  Lexicon,
  ILI,
  PartOfSpeech,
} from 'wn-ts-core';

// Hook types
export type { UseWordNetReturn, UseWordNetOptions } from '../hooks/useWordNet.js';
export type { UseSearchReturn, UseSearchOptions } from '../hooks/useSearch.js';
export type { UseDefinitionsReturn, UseDefinitionsOptions } from '../hooks/useDefinitions.js';
export type { UseRelationsReturn, UseRelationsOptions } from '../hooks/useRelations.js';

// Provider types
export type { WordNetProviderProps, WordNetContextValue } from '../providers/WordNetProvider.js';

// Component types
export type { SearchInputProps } from '../components/SearchInput.js';
export type { ResultsListProps } from '../components/ResultsList.js';

// Result types
export interface SearchResult {
  id: string;
  word: string;
  definition: string;
  pos: string;
  examples?: string[];
}

export interface DefinitionResult {
  text: string;
  pos: string;
  synsetId: string;
}

export interface TranslationResult {
  term: string;
  translations: string[];
  fromLang: string;
  toLang: string;
}
