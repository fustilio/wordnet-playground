/**
 * TypeScript types for serverless dictionary format
 */

/**
 * Compact dictionary metadata
 */
export interface DictionaryMetadata {
  /** Version number */
  v: number;
  /** Timestamp when generated */
  t: number;
  /** Number of synsets */
  c: number;
  /** Number of words */
  w: number;
  /** Languages included */
  langs?: string[];
  /** Parts of speech included */
  pos?: string[];
  /** Cache configuration (for runtime) */
  cache?: {
    enabled: boolean;
    multiLevel?: boolean;
    maxSize?: number;
    ttl?: number;
  };
}

/**
 * Synset data in compact format: [pos, definition, translations]
 */
export type CompactSynset = [
  string,                           // pos (part of speech)
  string,                           // definition
  Record<string, string[]>          // translations by language
];

/**
 * Dictionary data structure (compact format)
 */
export interface DictionaryData {
  /** Version */
  v: number;
  /** Metadata */
  m: DictionaryMetadata;
  /** Word index: "word:lang" -> [ili_refs] */
  w: Record<string, string[]>;
  /** Synsets: ili -> [pos, definition, translations] */
  s: Record<string, CompactSynset>;
}

/**
 * Synset result (expanded format for API responses)
 */
export interface SynsetResult {
  /** ILI identifier */
  ili: string;
  /** Part of speech */
  pos: string;
  /** Definition */
  definition: string;
  /** Translations by language */
  translations: Record<string, string[]>;
}

/**
 * Progress information for batch processing
 */
export interface ProgressInfo {
  /** Current step description */
  step: string;
  /** Current progress (0-100) */
  progress: number;
  /** Items processed */
  processed: number;
  /** Total items */
  total: number;
  /** Elapsed time in ms */
  elapsed: number;
}

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
  /** Chunk size for batch processing (default: 100) */
  chunkSize?: number;
  /** Maximum timeout per chunk in ms (default: 120000 = 2min) */
  chunkTimeout?: number;
  /** Progress callback function */
  onProgress?: (info: ProgressInfo) => void;
}

/**
 * Word frequency data for scoring
 * Maps word (lowercase) to frequency rank (lower = more common)
 */
export type WordFrequencyData = Map<string, number> | Record<string, number>;

/**
 * Dictionary generation options
 */
export interface GeneratorOptions {
  /** Languages to include */
  languages: string[];
  /** Parts of speech to include (null = all) */
  pos: string[] | null;
  /** Maximum number of synsets */
  limit: number;
  /** Output file path */
  output?: string;
  /** Create compressed version */
  compress?: boolean;
  /** Output format */
  format?: 'standard' | 'compact' | 'lookup';
  /** Batch processing options */
  batch?: BatchProcessingOptions;
  /** Optional external word frequency data (e.g., from A1-C2 word lists) */
  wordFrequencyData?: WordFrequencyData;
}

/**
 * Preset configurations
 */
export interface PresetConfig {
  /** Description of the preset */
  description: string;
  /** Number of synsets to include */
  limit: number;
  /** Parts of speech filter */
  pos: string[] | null;
  /** Languages to include */
  languages: string[];
}

/**
 * Presets collection
 */
export type Presets = Record<string, PresetConfig>;

/**
 * Lookup result
 */
export interface LookupResult {
  /** The queried word */
  word: string;
  /** Language code */
  lang: string;
  /** Matching synsets */
  results: SynsetResult[];
  /** Number of results */
  count: number;
}

/**
 * Translation result
 */
export interface TranslationResult {
  /** The queried word */
  word: string;
  /** Source language */
  from: string;
  /** Target language */
  to: string;
  /** Translated words */
  translations: string[];
  /** Number of translations */
  count: number;
}

/**
 * Definition result
 */
export interface DefinitionResult {
  /** The queried word */
  word: string;
  /** Language code */
  lang: string;
  /** Definitions */
  definitions: string[];
  /** Number of definitions */
  count: number;
}
