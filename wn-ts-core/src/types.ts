/**
 * Core types and interfaces for the wn-ts library
 * 
 * These types are inferred from Zod schemas to ensure consistency
 * between runtime validation and TypeScript types.
 */

import type { z } from 'zod';
import {
  FormSchema,
  PronunciationSchema,
  TagSchema,
  CountSchema,
  ExampleSchema,
  DefinitionSchema,
  RelationSchema,
  SyntacticBehaviourSchema,
  WordSchema,
  SenseSchema,
  SynsetSchema,
  ILISchema,
  LexiconSchema,
  ProjectSchema,
  WordQuerySchema,
  SynsetQuerySchema,
  SenseQuerySchema,
  WordnetConfigSchema,
  WordnetOptionsSchema,
  DownloadOptionsSchema,
  AddOptionsSchema,
  ExportOptionsSchema,
} from './schemas.js';

export type PartOfSpeech = 'n' | 'v' | 'a' | 'r' | 's' | 'c' | 'p' | 'i' | 'x' | 'u';

// Re-export the PartOfSpeech schema for backward compatibility
export { PartOfSpeechSchema } from './schemas.js';

// Export all the inferred types from schemas
export type Form = z.infer<typeof FormSchema>;
export type Pronunciation = z.infer<typeof PronunciationSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Count = z.infer<typeof CountSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type Definition = z.infer<typeof DefinitionSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type SyntacticBehaviour = z.infer<typeof SyntacticBehaviourSchema>;
export type Word = z.infer<typeof WordSchema>;
export type Sense = z.infer<typeof SenseSchema>;
export type Synset = z.infer<typeof SynsetSchema>;
export type ILI = z.infer<typeof ILISchema>;
export type Lexicon = z.infer<typeof LexiconSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type WordQuery = z.infer<typeof WordQuerySchema>;
export type SynsetQuery = z.infer<typeof SynsetQuerySchema>;
export type SenseQuery = z.infer<typeof SenseQuerySchema>;
export type WordnetConfig = z.infer<typeof WordnetConfigSchema>;
export type WordnetOptions = z.infer<typeof WordnetOptionsSchema>;
export type DownloadOptions = z.infer<typeof DownloadOptionsSchema>;
export type AddOptions = z.infer<typeof AddOptionsSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

// Error types
export class WnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnError';
  }
}

export class DatabaseError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProjectError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class WnWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnWarning';
  }
} 
