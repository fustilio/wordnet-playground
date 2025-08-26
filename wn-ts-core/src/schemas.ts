import { z } from 'zod';

// Base schemas with enhanced validation
export const PartOfSpeechSchema = z.enum(['n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x', 'u']);

export const FormSchema = z.object({
  id: z.string().min(1, "Form ID must not be empty"),
  writtenForm: z.string().min(1, "Written form must not be empty").max(200, "Written form too long"),
  script: z.string().optional(),
  tag: z.string().optional(),
});

export const PronunciationSchema = z.object({
  id: z.string().min(1, "Pronunciation ID must not be empty"),
  value: z.string().min(1, "Pronunciation value must not be empty").max(100, "Pronunciation value too long"),
  variety: z.string().optional(),
  notation: z.string().optional(),
  geographic: z.string().optional(),
});

export const TagSchema = z.object({
  id: z.string().min(1, "Tag ID must not be empty"),
  category: z.string().min(1, "Tag category must not be empty").max(50, "Tag category too long"),
  value: z.string().min(1, "Tag value must not be empty").max(100, "Tag value too long"),
});

export const CountSchema = z.object({
  id: z.string().min(1, "Count ID must not be empty"),
  value: z.number().int("Count must be an integer").min(0, "Count must be non-negative"),
  writtenForm: z.string().min(1, "Written form must not be empty"),
  pos: PartOfSpeechSchema,
});

export const ExampleSchema = z.object({
  id: z.string().min(1, "Example ID must not be empty"),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long"),
  text: z.string().min(1, "Example text must not be empty").max(1000, "Example text too long"),
  source: z.string().optional(),
});

export const DefinitionSchema = z.object({
  id: z.string().min(1, "Definition ID must not be empty"),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long"),
  text: z.string().min(1, "Definition text must not be empty").max(2000, "Definition text too long"),
  source: z.string().optional(),
});

export const RelationSchema = z.object({
  id: z.string().min(1, "Relation ID must not be empty"),
  type: z.string().min(1, "Relation type must not be empty").max(50, "Relation type too long"),
  target: z.string().min(1, "Relation target must not be empty"),
  source: z.string().optional(),
  dcType: z.string().optional(), // Changed from snake_case to camelCase
}).refine(
  (relation) => relation.id !== relation.target,
  {
    message: "Relation cannot reference itself",
    path: ["target"]
  }
);

export const SyntacticBehaviourSchema = z.object({
  id: z.string().min(1, "Syntactic behaviour ID must not be empty"),
  subcategorizationFrame: z.string().min(1, "Subcategorization frame must not be empty").max(500, "Frame too long"),
  source: z.string().optional(),
  senseIds: z.array(z.string().min(1, "Sense ID must not be empty")).min(1, "Must have at least one sense ID"),
});

export const WordSchema = z.object({
  id: z.string().min(1, "Word ID must not be empty"),
  lemma: z.string().min(1, "Lemma must not be empty").max(100, "Lemma too long"),
  pos: PartOfSpeechSchema,
  forms: z.array(FormSchema).min(1, "Word must have at least one form"),
  pronunciations: z.array(PronunciationSchema),
  tags: z.array(TagSchema),
  counts: z.array(CountSchema),
  syntacticBehaviours: z.array(SyntacticBehaviourSchema).optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long"),
  lexicon: z.string().min(1, "Lexicon must not be empty"),
}).refine(
  (word) => word.forms.some(form => form.writtenForm === word.lemma),
  {
    message: "Word should have a form matching its lemma for consistency",
    path: ["forms"]
  }
);

export const SenseSchema = z.object({
  id: z.string().min(1, "Sense ID must not be empty"),
  wordId: z.string().min(1, "Word ID must not be empty"),
  synsetId: z.string().min(1, "Synset ID must not be empty"),
  examples: z.array(ExampleSchema),
  counts: z.array(CountSchema),
  tags: z.array(TagSchema),
  relations: z.array(RelationSchema).optional(),
  source: z.string().optional(),
  sensekey: z.string().optional(),
  adjposition: z.string().optional(),
  subcategory: z.string().optional(),
  domain: z.string().optional(),
  register: z.string().optional(),
}).refine(
  (sense) => sense.wordId !== sense.synsetId,
  {
    message: "Sense word ID cannot be the same as synset ID",
    path: ["synsetId"]
  }
);

export const SynsetSchema = z.object({
  id: z.string().min(1, "Synset ID must not be empty"),
  ili: z.string().optional(),
  pos: PartOfSpeechSchema,
  definitions: z.array(DefinitionSchema).min(1, "Synset must have at least one definition"),
  examples: z.array(ExampleSchema),
  relations: z.array(RelationSchema),
  iliDefinitions: z.array(DefinitionSchema).optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long"),
  lexicon: z.string().min(1, "Lexicon must not be empty"),
  memberIds: z.array(z.string().min(1, "Member ID must not be empty")),
  senseIds: z.array(z.string().min(1, "Sense ID must not be empty")),
}).superRefine((synset, ctx) => {
  // Validate ID format consistency - make this a warning
  if (synset.id && !synset.id.match(/^[a-z]+-[a-z]+-\d+$/)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Synset ID should follow format: language-pos-number (e.g., en-n-0001)",
      path: ["id"]
    });
  }

  // Validate that all definitions are in the same language as the synset
  synset.definitions.forEach((def, index) => {
    if (def.language !== synset.language) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Definition language (${def.language}) should match synset language (${synset.language})`,
        path: ["definitions", index, "language"]
      });
    }
  });

  // Validate that all examples are in the same language as the synset
  synset.examples.forEach((ex, index) => {
    if (ex.language !== synset.language) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Example language (${ex.language}) should match synset language (${synset.language})`,
        path: ["examples", index, "language"]
      });
    }
  });

  // Validate part of speech consistency with definitions - make this a warning
  if (synset.pos === 'n' && synset.definitions.some(def => 
    def.text.toLowerCase().includes('verb') || def.text.toLowerCase().includes('action')
  )) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Noun synset contains verb-like definitions - consider reviewing",
      path: ["pos"]
    });
  }

  if (synset.pos === 'v' && synset.definitions.some(def => 
    def.text.toLowerCase().includes('thing') || def.text.toLowerCase().includes('object')
  )) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Verb synset contains noun-like definitions - consider reviewing",
      path: ["pos"]
    });
  }
});

export const ILISchema = z.object({
  id: z.string().min(1, "ILI ID must not be empty"),
  definition: z.string().optional(),
  status: z.enum(['standard', 'proposed', 'deprecated']),
  supersededBy: z.string().optional(),
  note: z.string().optional(),
}).refine(
  (ili) => !ili.supersededBy || ili.supersededBy !== ili.id,
  {
    message: "ILI cannot supersede itself",
    path: ["supersededBy"]
  }
);

export const LexiconSchema = z.object({
  id: z.string().min(1, "Lexicon ID must not be empty"),
  label: z.string().min(1, "Lexicon label must not be empty").max(200, "Label too long"),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long"),
  email: z.string().email("Invalid email format").optional(),
  license: z.string().optional(),
  version: z.string().optional(),
  url: z.string().url("Invalid URL format").optional(),
  citation: z.string().optional(),
  logo: z.string().optional(),
  requires: z.array(z.string().min(1, "Required lexicon ID must not be empty")).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ProjectSchema = z.object({
  id: z.string().min(1, "Project ID must not be empty"),
  label: z.string().min(1, "Project label must not be empty").max(200, "Label too long"),
  description: z.string().optional(),
  url: z.string().url("Invalid URL format").optional(),
  license: z.string().optional(),
  citation: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Query schemas with enhanced validation
export const WordQuerySchema = z.object({
  form: z.string().optional(),
  pos: PartOfSpeechSchema.optional(),
  lexicon: z.union([z.string(), z.array(z.string())]).optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long").optional(),
  searchAllForms: z.boolean().optional(),
  fuzzy: z.boolean().optional(),
  maxResults: z.number().positive("Max results must be positive").optional(),
  includeInflected: z.boolean().optional(),
});

export const SynsetQuerySchema = z.object({
  form: z.string().optional(),
  pos: PartOfSpeechSchema.optional(),
  ili: z.string().optional(),
  lexicon: z.union([z.string(), z.array(z.string())]).optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long").optional(),
  searchAllForms: z.boolean().optional(),
  fuzzy: z.boolean().optional(),
  maxResults: z.number().positive("Max results must be positive").optional(),
  includeDefinitions: z.boolean().optional(),
  includeExamples: z.boolean().optional(),
  includeRelations: z.boolean().optional(),
});

export const SenseQuerySchema = z.object({
  wordIdOrForm: z.string().optional(),
  pos: PartOfSpeechSchema.optional(),
  lexicon: z.string().optional(),
});

// Configuration schemas
export const WordnetConfigSchema = z.object({
  dataDirectory: z.string().min(1, "Data directory must not be empty"),
  downloadDirectory: z.string().optional(),
  cacheDirectory: z.string().optional(),
});

export const WordnetOptionsSchema = z.object({
  lexicon: z.union([z.string(), z.array(z.string())]).optional(),
  version: z.string().optional(),
  expand: z.union([z.string(), z.array(z.string())]).optional(),
  normalizer: z.any().optional(), // Function type
  lemmatizer: z.any().optional(), // Function type
  searchAllForms: z.boolean().optional(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(5, "Language code too long").optional(),
});

export const DownloadOptionsSchema = z.object({
  force: z.boolean().optional(),
  progress: z.any().optional(), // Function type
  timeout: z.number().positive("Timeout must be positive").optional(),
});

export const AddOptionsSchema = z.object({
  force: z.boolean().optional(),
  progress: z.any().optional(), // Function type
  parser: z.string().optional(),
});

export const ExportOptionsSchema = z.object({
  format: z.enum(['json', 'xml', 'csv']),
  output: z.string().optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

// Array schemas for validation
export const SynsetArraySchema = z.array(SynsetSchema).min(1, "WordNet must contain at least one synset");
export const WordArraySchema = z.array(WordSchema);
export const SenseArraySchema = z.array(SenseSchema);

// Enhanced validation functions with better error handling
export function validateSynset(synset: unknown): synset is z.infer<typeof SynsetSchema> {
  return SynsetSchema.safeParse(synset).success;
}

export function validateWord(word: unknown): word is z.infer<typeof WordSchema> {
  return WordSchema.safeParse(word).success;
}

export function validateSense(sense: unknown): sense is z.infer<typeof SenseSchema> {
  return SenseSchema.safeParse(sense).success;
}

export function validateWordnet(synsets: unknown): synsets is z.infer<typeof SynsetArraySchema> {
  return SynsetArraySchema.safeParse(synsets).success;
}

// Parse and validate functions that throw on error with detailed messages
export function parseSynset(synset: unknown): z.infer<typeof SynsetSchema> {
  try {
    return SynsetSchema.parse(synset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Invalid synset: ${errorMessages}`);
    }
    throw error;
  }
}

export function parseWord(word: unknown): z.infer<typeof WordSchema> {
  try {
    return WordSchema.parse(word);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Invalid word: ${errorMessages}`);
    }
    throw error;
  }
}

export function parseSense(sense: unknown): z.infer<typeof SenseSchema> {
  try {
    return SenseSchema.parse(sense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Invalid sense: ${errorMessages}`);
    }
    throw error;
  }
}

export function parseWordnet(synsets: unknown): z.infer<typeof SynsetArraySchema> {
  try {
    return SynsetArraySchema.parse(synsets);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Invalid WordNet data: ${errorMessages}`);
    }
    throw error;
  }
}

// Advanced validation functions
export function validateCrossReferences(
  synsets: z.infer<typeof SynsetArraySchema>,
  words: z.infer<typeof WordArraySchema>,
  senses: z.infer<typeof SenseArraySchema>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const wordIds = new Set(words.map(w => w.id));
  const synsetIds = new Set(synsets.map(s => s.id));
  const senseIds = new Set(senses.map(s => s.id));

  // Check that all synset memberIds reference actual words
  for (const synset of synsets) {
    for (const memberId of synset.memberIds) {
      if (!wordIds.has(memberId)) {
        errors.push(`Synset ${synset.id} references non-existent word: ${memberId}`);
      }
    }
  }

  // Check that all synset senseIds reference actual senses
  for (const synset of synsets) {
    for (const senseId of synset.senseIds) {
      if (!senseIds.has(senseId)) {
        errors.push(`Synset ${synset.id} references non-existent sense: ${senseId}`);
      }
    }
  }

  // Check that all sense wordIds reference actual words
  for (const sense of senses) {
    if (!wordIds.has(sense.wordId)) {
      errors.push(`Sense ${sense.id} references non-existent word: ${sense.wordId}`);
    }
  }

  // Check that all sense synsetIds reference actual synsets
  for (const sense of senses) {
    if (!synsetIds.has(sense.synsetId)) {
      errors.push(`Sense ${sense.id} references non-existent synset: ${sense.synsetId}`);
    }
  }

  // Check that all relation targets reference actual synsets
  for (const synset of synsets) {
    for (const relation of synset.relations) {
      if (!synsetIds.has(relation.target)) {
        errors.push(`Synset ${synset.id} has relation targeting non-existent synset: ${relation.target}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
