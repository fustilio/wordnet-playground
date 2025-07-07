# Node WordNet Zod Schemas

This directory contains comprehensive Zod schemas for validating data structures returned by the `node-wordnet` library (morungos/wordnet).

## Files

- `node-wordnet-schema.ts` - Basic schemas for core WordNet data structures
- `node-wordnet-extended-schema.ts` - Extended schemas with additional features and utilities

## Basic Usage

### Import the schemas

```typescript
import { 
  WordNetSynsetSchema, 
  WordNetResultSchema,
  validateWordNetResult,
  safeValidateWordNetResult 
} from './node-wordnet-schema.js';
```

### Validate node-wordnet lookup results

```typescript
import NodeWordNet from 'node-wordnet';

const wn = new NodeWordNet();
await wn.open();

// Get lookup results
const results = await wn.lookup('happy#a');

// Validate the results
const validatedResults = validateWordNetResult(results);

// Or use safe validation
const validation = safeValidateWordNetResult(results);
if (validation.success) {
  const validatedResults = validation.data;
  // Process validated data
} else {
  console.error('Validation failed:', validation.error);
}
```

## Schema Structure

### WordNetSynsetSchema

The main schema for a WordNet synset:

```typescript
{
  synsetOffset: number,      // Unique identifier for the synset
  lexFilenum: number,        // Lexicographer file number
  pos: string,               // Part of speech (n, v, a, s, r)
  wCnt: number,              // Word count
  lemma: string,             // Base form of the word
  synonyms: string[],        // Array of synonyms in this synset
  lexId: string,             // Lexicographer ID
  ptrs: WordNetPointer[],    // Pointer relationships
  gloss: string,             // Full gloss with examples
  def: string,               // Definition only
  exp: string[]              // Examples array
}
```

### WordNetPointerSchema

Schema for pointer relationships:

```typescript
{
  pointerSymbol: string,     // Relationship type (&, @, etc.)
  synsetOffset: number,      // Target synset offset
  pos: string,               // Target part of speech
  sourceTarget: string       // Source/target indicator
}
```

## Extended Features

### Different Operation Schemas

The extended schema provides specific schemas for different node-wordnet operations:

- `WordNetLookupSchema` - For `lookup()` method results
- `WordNetSenseSchema` - For `findSense()` method results
- `WordNetValidFormsSchema` - For `validForms()` method results
- `WordNetRandomWordsSchema` - For random word generation
- `WordNetDatabaseInfoSchema` - For database status information

### Utility Functions

```typescript
import { WordNetUtils } from './node-wordnet-extended-schema.js';

const results = await wn.lookup('computer#n');

// Extract all unique words
const allWords = WordNetUtils.extractAllWords(results);

// Filter by part of speech
const nouns = WordNetUtils.filterByPOS(results, 'n');

// Check if a word exists
const hasWord = WordNetUtils.hasWord(results, 'computer');

// Get synset by offset
const synset = WordNetUtils.getSynsetByOffset(results, 1000442);
```

### Safe Validation

All schemas provide both strict and safe validation:

```typescript
// Strict validation (throws on error)
const validated = WordNetValidators.validateLookup(data);

// Safe validation (returns success/error)
const result = WordNetSafeValidators.safeValidateLookup(data);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Example Integration

Here's how to integrate the schemas with your node-wordnet usage:

```typescript
import NodeWordNet from 'node-wordnet';
import { 
  WordNetSafeValidators, 
  WordNetUtils,
  type WordNetLookup 
} from './node-wordnet-extended-schema.js';

class ValidatedWordNet {
  private wn: NodeWordNet;

  constructor() {
    this.wn = new NodeWordNet();
  }

  async open() {
    await this.wn.open();
  }

  async close() {
    await this.wn.close();
  }

  async lookup(word: string): Promise<WordNetLookup | null> {
    try {
      const results = await this.wn.lookup(word);
      const validation = WordNetSafeValidators.safeValidateLookup(results);
      
      if (validation.success) {
        return validation.data;
      } else {
        console.error('Invalid lookup results:', validation.error);
        return null;
      }
    } catch (error) {
      console.error('Lookup failed:', error);
      return null;
    }
  }

  async findSynonyms(word: string): Promise<string[]> {
    const results = await this.lookup(word);
    if (results) {
      return WordNetUtils.extractAllWords(results);
    }
    return [];
  }

  async findNouns(word: string): Promise<WordNetLookup> {
    const results = await this.lookup(word);
    if (results) {
      return WordNetUtils.filterByPOS(results, 'n');
    }
    return [];
  }
}
```

## Testing

Run the schema tests:

```bash
npm test node-wordnet-schema.test.ts
```

The tests demonstrate:
- Basic validation of synset data
- Array validation for lookup results
- Error handling for invalid data
- Multiple synset validation
- Pointer relationship validation
- Empty array handling

## TypeScript Support

All schemas include TypeScript type exports:

```typescript
import type { 
  WordNetSynset, 
  WordNetLookup, 
  WordNetPointer,
  WordNetPOS 
} from './node-wordnet-schema.js';

function processSynset(synset: WordNetSynset) {
  // TypeScript will provide full type safety
  console.log(synset.lemma, synset.synonyms);
}
```

## Error Handling

The schemas provide detailed error information:

```typescript
const validation = safeValidateWordNetResult(invalidData);
if (!validation.success) {
  validation.error.issues.forEach(issue => {
    console.error(`Error at ${issue.path.join('.')}: ${issue.message}`);
  });
}
```

This helps identify exactly which fields are invalid and why. 