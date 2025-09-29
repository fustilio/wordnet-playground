/**
 * Shared schema utilities to reduce duplication in Zod schema definitions
 * 
 * This file contains common schema patterns and validation utilities that are
 * reused across multiple schema definitions to eliminate duplication.
 */

import { z } from 'zod';
import { PARTS_OF_SPEECH } from './shared-types.js';

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

/**
 * Common string validation patterns with consistent error messages
 */
export const StringValidators = {
  /**
   * Required string with length constraints
   */
  required: (minLength: number = 1, maxLength?: number, fieldName: string = 'Field') => {
    let schema = z.string().min(minLength, `${fieldName} must not be empty`);
    if (maxLength) {
      schema = schema.max(maxLength, `${fieldName} too long`);
    }
    return schema;
  },

  /**
   * Optional string with length constraints
   */
  optional: (minLength: number = 1, maxLength?: number, fieldName: string = 'Field') => {
    let schema = z.string().min(minLength, `${fieldName} must not be empty`);
    if (maxLength) {
      schema = schema.max(maxLength, `${fieldName} too long`);
    }
    return schema.optional();
  },

  /**
   * Language code validation (2-5 characters)
   */
  languageCode: (required: boolean = true) => {
    const schema = z.string()
      .min(2, "Language code must be at least 2 characters")
      .max(5, "Language code too long");
    return required ? schema : schema.optional();
  },

  /**
   * URL validation
   */
  url: (required: boolean = true) => {
    const schema = z.string().url("Invalid URL format");
    return required ? schema : schema.optional();
  },

  /**
   * ID validation (non-empty string)
   */
  id: (fieldName: string = 'ID') => {
    return z.string().min(1, `${fieldName} must not be empty`);
  },

  /**
   * Text content validation with reasonable length limits
   */
  text: (maxLength: number = 1000, fieldName: string = 'Text') => {
    return z.string()
      .min(1, `${fieldName} must not be empty`)
      .max(maxLength, `${fieldName} too long`);
  },

  /**
   * Short text validation (for labels, names, etc.)
   */
  shortText: (maxLength: number = 200, fieldName: string = 'Text') => {
    return z.string()
      .min(1, `${fieldName} must not be empty`)
      .max(maxLength, `${fieldName} too long`);
  },

  /**
   * Medium text validation (for descriptions, etc.)
   */
  mediumText: (maxLength: number = 500, fieldName: string = 'Text') => {
    return z.string()
      .min(1, `${fieldName} must not be empty`)
      .max(maxLength, `${fieldName} too long`);
  },

  /**
   * Long text validation (for definitions, etc.)
   */
  longText: (maxLength: number = 2000, fieldName: string = 'Text') => {
    return z.string()
      .min(1, `${fieldName} must not be empty`)
      .max(maxLength, `${fieldName} too long`);
  }
};

/**
 * Common number validation patterns
 */
export const NumberValidators = {
  /**
   * Positive integer validation
   */
  positiveInt: (fieldName: string = 'Number') => {
    return z.number()
      .int(`${fieldName} must be an integer`)
      .positive(`${fieldName} must be positive`);
  },

  /**
   * Non-negative integer validation
   */
  nonNegativeInt: (fieldName: string = 'Number') => {
    return z.number()
      .int(`${fieldName} must be an integer`)
      .min(0, `${fieldName} must be non-negative`);
  },

  /**
   * Optional positive integer
   */
  optionalPositiveInt: (fieldName: string = 'Number') => {
    return z.number()
      .int(`${fieldName} must be an integer`)
      .positive(`${fieldName} must be positive`)
      .optional();
  }
};

/**
 * Common array validation patterns
 */
export const ArrayValidators = {
  /**
   * Non-empty string array
   */
  nonEmptyStrings: (fieldName: string = 'Array') => {
    return z.array(z.string().min(1, "Array item must not be empty"))
      .min(1, `${fieldName} must not be empty`);
  },

  /**
   * Optional non-empty string array
   */
  optionalNonEmptyStrings: (_fieldName: string = 'Array') => {
    return z.array(z.string().min(1, "Array item must not be empty"))
      .optional();
  }
};

/**
 * Common object validation patterns
 */
export const ObjectValidators = {
  /**
   * Metadata object (record of string keys to unknown values)
   */
  metadata: () => {
    return z.record(z.string(), z.unknown()).optional();
  },

  /**
   * Union of string or string array
   */
  stringOrStringArray: () => {
    return z.union([z.string(), z.array(z.string())]).optional();
  }
};

// ============================================================================
// COMMON SCHEMA BUILDERS
// ============================================================================

/**
 * Build a common entity schema with standard fields
 */
export function createEntitySchema(fields: Record<string, z.ZodTypeAny>) {
  return z.object({
    id: StringValidators.id('ID'),
    ...fields
  });
}

  /**
   * Build a common query schema with standard query fields
   */
  export function createQuerySchema(fields: Record<string, z.ZodTypeAny>) {
    return z.object({
      form: z.string().optional(),
      pos: z.enum(PARTS_OF_SPEECH).optional(),
      lexicon: ObjectValidators.stringOrStringArray(),
      language: StringValidators.languageCode(false),
      searchAllForms: z.boolean().optional(),
      fuzzy: z.boolean().optional(),
      maxResults: NumberValidators.optionalPositiveInt('Max results'),
      strategy: z.string().optional(),
      ...fields
    });
  }

/**
 * Build a common content schema with standard content fields
 */
export function createContentSchema(fields: Record<string, z.ZodTypeAny>) {
  return z.object({
    id: StringValidators.id('ID'),
    language: StringValidators.languageCode(),
    text: StringValidators.longText(2000, 'Text'),
    source: z.string().optional(),
    ...fields
  });
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Create a validation function for a schema with consistent error handling
 */
export function createValidator<T>(schema: z.ZodSchema<T>, _entityName: string) {
  return function validate(entity: unknown): entity is T {
    return schema.safeParse(entity).success;
  };
}

/**
 * Create a parser function for a schema with detailed error messages
 */
export function createParser<T>(schema: z.ZodSchema<T>, entityName: string) {
  return function parse(entity: unknown): T {
    try {
      return schema.parse(entity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const errorMessages = zodError.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`Invalid ${entityName}: ${errorMessages}`);
      }
      throw error;
    }
  };
}

/**
 * Create both validator and parser for a schema
 */
export function createValidationHelpers<T>(schema: z.ZodSchema<T>, entityName: string) {
  return {
    validate: createValidator(schema, entityName),
    parse: createParser(schema, entityName)
  };
}

// ============================================================================
// COMMON SCHEMA CONSTANTS
// ============================================================================

/**
 * Part of speech enum schema using shared constants
 */
export const PartOfSpeechSchema = z.enum(PARTS_OF_SPEECH);

/**
 * Common field schemas that are reused across multiple entities
 */
export const CommonFields = {
  id: StringValidators.id('ID'),
  language: StringValidators.languageCode(),
  metadata: ObjectValidators.metadata(),
  source: z.string().optional(),
  url: StringValidators.url(false),
  license: z.string().optional(),
  citation: z.string().optional(),
  label: StringValidators.shortText(200, 'Label'),
  description: StringValidators.mediumText(500, 'Description'),
  text: StringValidators.longText(2000, 'Text'),
  lemma: StringValidators.shortText(100, 'Lemma'),
  type: StringValidators.shortText(50, 'Type'),
  writtenForm: StringValidators.shortText(200, 'Written form'),
  value: StringValidators.shortText(100, 'Value'),
  category: StringValidators.shortText(50, 'Category'),
  subcategorizationFrame: StringValidators.mediumText(500, 'Subcategorization frame')
};
