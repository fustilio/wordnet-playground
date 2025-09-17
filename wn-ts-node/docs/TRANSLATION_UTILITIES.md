# Translation Utilities

This document describes the translation utilities available in wn-ts-node for easy bilingual queries and translation between different languages.

## Overview

The translation utilities provide convenient functions for translating words and concepts between different languages using the WordNet database. These utilities are designed to be used in applications like the bilingual demo in wn-ts-web-demo.

## Features

- **Easy Translation**: Simple functions to translate words between languages
- **Bidirectional Translation**: Get translations in both directions
- **Rich Results**: Include definitions, examples, and metadata
- **Language Detection**: Check available languages and validate language codes
- **Flexible Options**: Customize translation behavior with various options

## Quick Start

```typescript
import { Wordnet, TranslationHelper, quickTranslate } from 'wn-ts-node';

// Initialize WordNet client
const wordnet = new Wordnet('*');

// Method 1: Using TranslationHelper for detailed results
const translator = new TranslationHelper(wordnet);
const result = await translator.translateWord('computer', {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  includeDefinitions: true,
  includeExamples: true
});

console.log(result.translations.fr.words); // ['ordinateur']

// Method 2: Using quickTranslate for simple results
const translations = await quickTranslate(wordnet, 'computer', 'en', 'fr');
console.log(translations); // ['ordinateur']
```

## API Reference

### TranslationHelper Class

The main class for translation operations.

#### Constructor

```typescript
new TranslationHelper(wordnetClient: Wordnet)
```

#### Methods

##### `translateWord(word: string, options: BilingualQueryOptions): Promise<TranslationResult>`

Translates a word from one language to another.

**Parameters:**
- `word`: The word to translate
- `options`: Translation options (see BilingualQueryOptions interface)

**Returns:** Promise<TranslationResult>

**Example:**
```typescript
const result = await translator.translateWord('house', {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  includeDefinitions: true,
  includeExamples: true,
  maxTranslations: 5
});
```

##### `getBidirectionalTranslations(word: string, language1: string, language2: string, options?): Promise<{ [language1]: TranslationResult, [language2]: TranslationResult }>`

Gets translations in both directions between two languages.

**Example:**
```typescript
const result = await translator.getBidirectionalTranslations('house', 'en', 'fr');
console.log(result.en.translations.fr.words); // French translations
console.log(result.fr.translations.en.words); // English translations
```

##### `getAvailableLanguages(): Promise<string[]>`

Gets all available languages in the database.

**Example:**
```typescript
const languages = await translator.getAvailableLanguages();
console.log(languages); // ['en', 'fr', 'es', ...]
```

##### `isLanguageAvailable(language: string): Promise<boolean>`

Checks if a specific language is available.

**Example:**
```typescript
const isFrenchAvailable = await translator.isLanguageAvailable('fr');
```

### Utility Functions

#### `quickTranslate(wordnetClient: Wordnet, word: string, fromLang: string, toLang: string): Promise<string[]>`

Simple function for quick translations.

**Example:**
```typescript
const translations = await quickTranslate(wordnet, 'computer', 'en', 'fr');
console.log(translations); // ['ordinateur']
```

#### `createTranslationHelper(wordnetClient: Wordnet): TranslationHelper`

Factory function to create a TranslationHelper instance.

**Example:**
```typescript
const translator = createTranslationHelper(wordnet);
```

## Interfaces

### TranslationResult

```typescript
interface TranslationResult {
  sourceWord: string;
  sourceLanguage: string;
  translations: Record<string, {
    words: string[];
    definitions: string[];
    examples: string[];
  }>;
}
```

### BilingualQueryOptions

```typescript
interface BilingualQueryOptions {
  sourceLanguage: string;
  targetLanguage: string;
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  maxTranslations?: number;
}
```

## Examples

### Basic Translation

```typescript
import { Wordnet, TranslationHelper } from 'wn-ts-node';

const wordnet = new Wordnet('*');
const translator = new TranslationHelper(wordnet);

// Translate a word
const result = await translator.translateWord('love', {
  sourceLanguage: 'en',
  targetLanguage: 'fr'
});

console.log(`English: ${result.sourceWord}`);
console.log(`French: ${result.translations.fr.words.join(', ')}`);
```

### Translation with Definitions

```typescript
const result = await translator.translateWord('computer', {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  includeDefinitions: true,
  includeExamples: true
});

console.log('Words:', result.translations.fr.words);
console.log('Definitions:', result.translations.fr.definitions);
console.log('Examples:', result.translations.fr.examples);
```

### Bidirectional Translation

```typescript
const result = await translator.getBidirectionalTranslations('house', 'en', 'fr');

console.log('EN → FR:', result.en.translations.fr.words);
console.log('FR → EN:', result.fr.translations.en.words);
```

### Batch Translation

```typescript
const words = ['computer', 'house', 'water', 'love', 'book'];
const translations = await Promise.all(
  words.map(word => quickTranslate(wordnet, word, 'en', 'fr'))
);

words.forEach((word, index) => {
  console.log(`${word} → ${translations[index].join(', ')}`);
});
```

## Integration with wn-ts-web-demo

These translation utilities are designed to be easily integrated into the bilingual demo in wn-ts-web-demo. The simple API makes it easy to create translation interfaces and bilingual applications.

### Example Integration

```typescript
// In a React component for wn-ts-web-demo
import { TranslationHelper } from 'wn-ts-node';

const BilingualDemo = () => {
  const [translator, setTranslator] = useState<TranslationHelper | null>(null);
  const [translations, setTranslations] = useState<string[]>([]);

  useEffect(() => {
    // Initialize translator when WordNet client is ready
    if (wordnetClient) {
      setTranslator(new TranslationHelper(wordnetClient));
    }
  }, [wordnetClient]);

  const handleTranslate = async (word: string) => {
    if (translator) {
      const result = await translator.translateWord(word, {
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        includeDefinitions: true
      });
      setTranslations(result.translations.fr.words);
    }
  };

  return (
    <div>
      <input onChange={(e) => handleTranslate(e.target.value)} />
      <div>Translations: {translations.join(', ')}</div>
    </div>
  );
};
```

## Notes

- The translation utilities rely on the WordNet database being properly loaded with multiple language lexicons
- For best results, ensure that both source and target language lexicons are available
- The fuzzy matching feature helps find approximate translations when exact matches aren't available
- Performance can be improved by caching translation results for frequently translated words
