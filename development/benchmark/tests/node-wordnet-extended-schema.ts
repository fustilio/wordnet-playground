import { z } from "zod";

// Base schemas from the main schema file
export const WordNetPointerSchema = z.object({
  pointerSymbol: z.string(),
  synsetOffset: z.number(),
  pos: z.string(),
  sourceTarget: z.string(),
});

export const WordNetExampleSchema = z.string();
export const WordNetSynonymsSchema = z.array(z.string());

// Main synset schema
export const WordNetSynsetSchema = z.object({
  synsetOffset: z.number(),
  lexFilenum: z.number(),
  pos: z.string(),
  wCnt: z.number(),
  lemma: z.string(),
  synonyms: WordNetSynonymsSchema,
  lexId: z.string(),
  ptrs: z.array(WordNetPointerSchema),
  gloss: z.string(),
  def: z.string(),
  exp: z.array(WordNetExampleSchema),
});

// Schema for findSense method (single synset)
export const WordNetSenseSchema = WordNetSynsetSchema;

// Schema for validForms method (array of strings)
export const WordNetValidFormsSchema = z.array(z.string());

// Schema for lookup method (array of synsets)
export const WordNetLookupSchema = z.array(WordNetSynsetSchema);

// Schema for get method (single synset by offset)
export const WordNetGetSchema = WordNetSynsetSchema;

// Schema for random word generation
export const WordNetRandomWordSchema = z.object({
  word: z.string(),
  pos: z.string().optional(),
  synsetOffset: z.number().optional(),
});

export const WordNetRandomWordsSchema = z.array(WordNetRandomWordSchema);

// Schema for database status/info
export const WordNetDatabaseInfoSchema = z.object({
  isOpen: z.boolean(),
  dataPath: z.string().optional(),
  version: z.string().optional(),
});

// Schema for morphological analysis
export const WordNetMorphySchema = z.object({
  baseForm: z.string(),
  pos: z.string(),
  confidence: z.number().optional(),
});

// Extended schemas for different POS types
export const WordNetPOSSchema = z.enum(["n", "v", "a", "s", "r"]);

// Schema for hypernym/hyponym traversal
export const WordNetHierarchySchema = z.object({
  synset: WordNetSynsetSchema,
  level: z.number(),
  path: z.array(z.number()),
});

// Schema for similarity calculations
export const WordNetSimilaritySchema = z.object({
  similarity: z.number(),
  path: z.array(z.number()).optional(),
  lcs: WordNetSynsetSchema.optional(), // Least Common Subsumer
});

// Schema for antonym relationships
export const WordNetAntonymSchema = z.object({
  word: z.string(),
  pos: z.string(),
  synsetOffset: z.number(),
  antonymWord: z.string(),
  antonymPos: z.string(),
  antonymSynsetOffset: z.number(),
});

// Schema for all possible node-wordnet responses
export const WordNetResponseSchema = z.union([
  WordNetLookupSchema,
  WordNetSenseSchema,
  WordNetValidFormsSchema,
  WordNetRandomWordsSchema,
  WordNetDatabaseInfoSchema,
  WordNetMorphySchema,
  WordNetHierarchySchema,
  WordNetSimilaritySchema,
  WordNetAntonymSchema,
  z.array(WordNetAntonymSchema),
]);

// Type exports
export type WordNetPointer = z.infer<typeof WordNetPointerSchema>;
export type WordNetSynset = z.infer<typeof WordNetSynsetSchema>;
export type WordNetSense = z.infer<typeof WordNetSenseSchema>;
export type WordNetValidForms = z.infer<typeof WordNetValidFormsSchema>;
export type WordNetLookup = z.infer<typeof WordNetLookupSchema>;
export type WordNetGet = z.infer<typeof WordNetGetSchema>;
export type WordNetRandomWord = z.infer<typeof WordNetRandomWordSchema>;
export type WordNetRandomWords = z.infer<typeof WordNetRandomWordsSchema>;
export type WordNetDatabaseInfo = z.infer<typeof WordNetDatabaseInfoSchema>;
export type WordNetMorphy = z.infer<typeof WordNetMorphySchema>;
export type WordNetHierarchy = z.infer<typeof WordNetHierarchySchema>;
export type WordNetSimilarity = z.infer<typeof WordNetSimilaritySchema>;
export type WordNetAntonym = z.infer<typeof WordNetAntonymSchema>;
export type WordNetResponse = z.infer<typeof WordNetResponseSchema>;
export type WordNetPOS = z.infer<typeof WordNetPOSSchema>;

// Validation functions
export const WordNetValidators = {
  validateLookup: (data: unknown): WordNetLookup => WordNetLookupSchema.parse(data),
  validateSense: (data: unknown): WordNetSense => WordNetSenseSchema.parse(data),
  validateValidForms: (data: unknown): WordNetValidForms => WordNetValidFormsSchema.parse(data),
  validateRandomWords: (data: unknown): WordNetRandomWords => WordNetRandomWordsSchema.parse(data),
  validateDatabaseInfo: (data: unknown): WordNetDatabaseInfo => WordNetDatabaseInfoSchema.parse(data),
  validateMorphy: (data: unknown): WordNetMorphy => WordNetMorphySchema.parse(data),
  validateHierarchy: (data: unknown): WordNetHierarchy => WordNetHierarchySchema.parse(data),
  validateSimilarity: (data: unknown): WordNetSimilarity => WordNetSimilaritySchema.parse(data),
  validateAntonym: (data: unknown): WordNetAntonym => WordNetAntonymSchema.parse(data),
  validateResponse: (data: unknown): WordNetResponse => WordNetResponseSchema.parse(data),
} as const;

// Safe validation functions
export const WordNetSafeValidators = {
  safeValidateLookup: (data: unknown) => WordNetLookupSchema.safeParse(data),
  safeValidateSense: (data: unknown) => WordNetSenseSchema.safeParse(data),
  safeValidateValidForms: (data: unknown) => WordNetValidFormsSchema.safeParse(data),
  safeValidateRandomWords: (data: unknown) => WordNetRandomWordsSchema.safeParse(data),
  safeValidateDatabaseInfo: (data: unknown) => WordNetDatabaseInfoSchema.safeParse(data),
  safeValidateMorphy: (data: unknown) => WordNetMorphySchema.safeParse(data),
  safeValidateHierarchy: (data: unknown) => WordNetHierarchySchema.safeParse(data),
  safeValidateSimilarity: (data: unknown) => WordNetSimilaritySchema.safeParse(data),
  safeValidateAntonym: (data: unknown) => WordNetAntonymSchema.safeParse(data),
  safeValidateResponse: (data: unknown) => WordNetResponseSchema.safeParse(data),
} as const;

// Utility functions for working with node-wordnet data
export const WordNetUtils = {
  // Extract all unique words from a lookup result
  extractAllWords: (lookup: WordNetLookup): string[] => {
    const words = new Set<string>();
    lookup.forEach(synset => {
      synset.synonyms.forEach(word => words.add(word));
    });
    return Array.from(words);
  },

  // Find synsets by POS
  filterByPOS: (lookup: WordNetLookup, pos: WordNetPOS): WordNetLookup => {
    return lookup.filter(synset => synset.pos === pos);
  },

  // Get all pointer relationships
  getAllPointers: (lookup: WordNetLookup): WordNetPointer[] => {
    const pointers: WordNetPointer[] = [];
    lookup.forEach(synset => {
      pointers.push(...synset.ptrs);
    });
    return pointers;
  },

  // Check if a word exists in the lookup result
  hasWord: (lookup: WordNetLookup, word: string): boolean => {
    return lookup.some(synset => 
      synset.synonyms.some(synonym => 
        synonym.toLowerCase() === word.toLowerCase()
      )
    );
  },

  // Get synset by offset
  getSynsetByOffset: (lookup: WordNetLookup, offset: number): WordNetSynset | undefined => {
    return lookup.find(synset => synset.synsetOffset === offset);
  },
} as const; 