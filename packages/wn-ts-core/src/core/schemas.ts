import { z } from 'zod';
import { 
  StringValidators, 
  NumberValidators, 
  CommonFields, 
  PartOfSpeechSchema,
  ObjectValidators,
  createQuerySchema,
  createValidationHelpers
} from './schema-utils.js';

// Base schemas with enhanced validation using shared utilities
export { PartOfSpeechSchema };

export const FormSchema = z.object({
  id: CommonFields.id,
  writtenForm: CommonFields.writtenForm,
  script: z.string().optional(),
  tag: z.string().optional(),
});

export const PronunciationSchema = z.object({
  id: CommonFields.id,
  value: StringValidators.shortText(100, 'Pronunciation value'),
  variety: z.string().optional(),
  notation: z.string().optional(),
  geographic: z.string().optional(),
});

export const TagSchema = z.object({
  id: CommonFields.id,
  category: StringValidators.shortText(50, 'Tag category'),
  value: StringValidators.shortText(100, 'Tag value'),
});

export const CountSchema = z.object({
  id: CommonFields.id,
  value: NumberValidators.nonNegativeInt('Count'),
  writtenForm: CommonFields.writtenForm,
  pos: PartOfSpeechSchema,
});

export const ExampleSchema = z.object({
  id: CommonFields.id,
  language: CommonFields.language,
  text: StringValidators.longText(1000, 'Example text'),
  source: CommonFields.source,
});

export const DefinitionSchema = z.object({
  id: CommonFields.id,
  language: CommonFields.language,
  text: StringValidators.longText(2000, 'Definition text'),
  source: CommonFields.source,
});

export const RelationSchema = z.object({
  id: CommonFields.id,
  type: StringValidators.shortText(50, 'Relation type'),
  target: StringValidators.id('Relation target'),
  source: CommonFields.source,
  dcType: z.string().optional(), // Changed from snake_case to camelCase
}).refine(
  (relation) => relation.id !== relation.target,
  {
    message: "Relation cannot reference itself",
    path: ["target"]
  }
);

export const SyntacticBehaviourSchema = z.object({
  id: CommonFields.id,
  subcategorizationFrame: CommonFields.subcategorizationFrame,
  source: CommonFields.source,
  senseIds: z.array(StringValidators.id('Sense ID')).min(1, "Must have at least one sense ID"),
});

export const WordSchema = z.object({
  id: CommonFields.id,
  lemma: CommonFields.lemma,
  pos: PartOfSpeechSchema,
  forms: z.array(FormSchema).min(1, "Word must have at least one form"),
  pronunciations: z.array(PronunciationSchema),
  tags: z.array(TagSchema),
  counts: z.array(CountSchema),
  syntacticBehaviours: z.array(SyntacticBehaviourSchema).optional(),
  language: CommonFields.language,
  lexicon: StringValidators.id('Lexicon'),
}).refine(
  (word) => word.forms.some(form => form.writtenForm === word.lemma),
  {
    message: "Word should have a form matching its lemma for consistency",
    path: ["forms"]
  }
);

export const SenseSchema = z.object({
  id: CommonFields.id,
  wordId: StringValidators.id('Word ID'),
  synsetId: StringValidators.id('Synset ID'),
  examples: z.array(ExampleSchema),
  counts: z.array(CountSchema),
  tags: z.array(TagSchema),
  relations: z.array(RelationSchema).optional(),
  source: CommonFields.source,
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
  id: CommonFields.id,
  ili: z.string().optional(),
  pos: PartOfSpeechSchema,
  definitions: z.array(DefinitionSchema).min(1, "Synset must have at least one definition"),
  examples: z.array(ExampleSchema),
  relations: z.array(RelationSchema),
  iliDefinitions: z.array(DefinitionSchema).optional(),
  language: CommonFields.language,
  lexicon: StringValidators.id('Lexicon'),
  memberIds: z.array(StringValidators.id('Member ID')),
  senseIds: z.array(StringValidators.id('Sense ID')),
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
  id: CommonFields.id,
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
  id: CommonFields.id,
  label: CommonFields.label,
  language: CommonFields.language,
  email: z.string().email("Invalid email format").optional(),
  license: CommonFields.license,
  version: z.string().optional(),
  url: CommonFields.url,
  citation: CommonFields.citation,
  logo: z.string().optional(),
  requires: z.array(StringValidators.id('Required lexicon ID')).optional(),
  metadata: CommonFields.metadata,
});

export const ProjectSchema = z.object({
  id: CommonFields.id,
  label: CommonFields.label,
  description: CommonFields.description,
  url: CommonFields.url,
  license: CommonFields.license,
  citation: CommonFields.citation,
  metadata: CommonFields.metadata,
});

// Query schemas with enhanced validation using shared utilities
export const WordQuerySchema = createQuerySchema({
  includeInflected: z.boolean().optional(),
});

export const SynsetQuerySchema = createQuerySchema({
  ili: z.string().optional(),
  includeDefinitions: z.boolean().optional(),
  includeExamples: z.boolean().optional(),
  includeRelations: z.boolean().optional(),
});

export const SenseQuerySchema = createQuerySchema({
  wordIdOrForm: z.string().optional(),
});

// Configuration schemas using shared utilities
export const WordnetConfigSchema = z.object({
  dataDirectory: StringValidators.id('Data directory'),
  downloadDirectory: z.string().optional(),
  cacheDirectory: z.string().optional(),
});

export const WordnetOptionsSchema = z.object({
  lexicon: ObjectValidators.stringOrStringArray(),
  version: z.string().optional(),
  expand: ObjectValidators.stringOrStringArray(),
  normalizer: z.any().optional(), // Function type
  lemmatizer: z.any().optional(), // Function type
  searchAllForms: z.boolean().optional(),
  language: StringValidators.languageCode(false),
  strategy: z.string().optional(),
});

export const DownloadOptionsSchema = z.object({
  force: z.boolean().optional(),
  progress: z.any().optional(), // Function type
  timeout: NumberValidators.optionalPositiveInt('Timeout'),
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

// Enhanced validation functions using shared utilities
export const { validate: validateSynset, parse: parseSynset } = createValidationHelpers(SynsetSchema, 'synset');
export const { validate: validateWord, parse: parseWord } = createValidationHelpers(WordSchema, 'word');
export const { validate: validateSense, parse: parseSense } = createValidationHelpers(SenseSchema, 'sense');

export function validateWordnet(synsets: unknown): synsets is z.infer<typeof SynsetArraySchema> {
  return SynsetArraySchema.safeParse(synsets).success;
}

export const { parse: parseWordnet } = createValidationHelpers(SynsetArraySchema, 'WordNet data');

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
