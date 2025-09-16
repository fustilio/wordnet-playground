import { z } from "zod";

// WordNet-specific data source definitions
export const WordNetDataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  version: z.string(),
  url: z.string().url(),
  format: z.enum(["xml", "tar", "tar.gz", "tar.xz"]),
  description: z.string().optional(),
  size: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export type WordNetDataSource = z.infer<typeof WordNetDataSourceSchema>;

// WordNet project identifiers
export const WordNetProjectSchema = z.object({
  projectId: z.string(),
  language: z.string(),
  version: z.string(),
  source: z.string(),
});

export type WordNetProject = z.infer<typeof WordNetProjectSchema>;

// WordNet-specific content types
export type WordNetContentType = 
  | "lmf"           // Lexical Markup Framework (WordNet LMF)
  | "ili"           // Interlingual Index
  | "omw-package"   // Open Multilingual WordNet package
  | "own-package"   // Open WordNets package
  | "cili-data"     // CILI data format
  | "unknown";

// WordNet data processing result
export interface WordNetProcessingResult {
  success: boolean;
  projectId: string;
  language: string;
  version: string;
  contentType: WordNetContentType;
  confidence: "high" | "medium" | "low";
  xmlContent?: string;
  error?: string;
  processingSteps: string[];
  totalProcessingTime: number;
  originalSize: number;
  finalSize: number;
  extractedFiles?: Array<{name: string, size: number}>;
  wordnetMetadata?: {
    synsetCount?: number;
    lemmaCount?: number;
    language?: string;
    version?: string;
    source?: string;
  };
}

// WordNet data source registry
export interface WordNetDataSourceRegistry {
  [key: string]: WordNetDataSource;
}

// Progress callback type
export type ProgressCallback = (progress: number, message?: string) => void;

// WordNet processing options
export interface WordNetProcessingOptions {
  projectId: string;
  enableTarExtraction?: boolean;
  extractMetadata?: boolean;
  validateLMF?: boolean;
  onProgress?: ProgressCallback;
}
