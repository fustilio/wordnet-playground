import { z } from "zod";

// Schema for pointer relationships in synsets
export const WordNetPointerSchema = z.object({
  pointerSymbol: z.string(),
  synsetOffset: z.number(),
  pos: z.string(),
  sourceTarget: z.string(),
});

// Schema for examples in gloss
export const WordNetExampleSchema = z.string();

// Schema for synonyms array
export const WordNetSynonymsSchema = z.array(z.string());

// Main WordNet synset schema
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

// Schema for the complete result array
export const WordNetResultSchema = z.array(WordNetSynsetSchema);

// Type exports for TypeScript usage
export type WordNetPointer = z.infer<typeof WordNetPointerSchema>;
export type WordNetSynset = z.infer<typeof WordNetSynsetSchema>;
export type WordNetResult = z.infer<typeof WordNetResultSchema>;

// Validation function
export function validateWordNetResult(data: unknown): WordNetResult {
  return WordNetResultSchema.parse(data);
}

// Safe validation function that returns success/error
export function safeValidateWordNetResult(data: unknown) {
  return WordNetResultSchema.safeParse(data);
}

// Example usage and validation helpers
export const WordNetSchemas = {
  pointer: WordNetPointerSchema,
  synset: WordNetSynsetSchema,
  result: WordNetResultSchema,
  synonyms: WordNetSynonymsSchema,
  examples: z.array(WordNetExampleSchema),
} as const; 