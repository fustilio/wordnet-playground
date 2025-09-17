# Bilingual Translation in wn-ts-web-demo

This document explains how to use the translation utilities in the wn-ts-web-demo application for easy bilingual queries between different languages.

## Overview

The translation utilities provide convenient functions for translating words and concepts between different languages using the WordNet database. These utilities are available in both `wn-ts-node` and `wn-ts-web`, making them perfect for both server-side and browser-based applications.

## Features

- **Easy Translation**: Simple functions to translate words between languages
- **Bidirectional Translation**: Get translations in both directions
- **Rich Results**: Include definitions, examples, and metadata
- **Language Detection**: Check available languages and validate language codes
- **Flexible Options**: Customize translation behavior with various options
- **React Components**: Ready-to-use React components for UI integration

## Quick Start

### Basic Usage

```typescript
import { createWordNetInstance, quickTranslate } from 'wn-ts-web';

// Initialize WordNet
const wordnet = await createWordNetInstance({
  lexicons: ['oewn:2024', 'omw-fr:1.4'], // English and French
});

// Quick translation
const translations = await quickTranslate(wordnet, 'computer', 'en', 'fr');
console.log(translations); // ['ordinateur']
```

### Detailed Translation

```typescript
import { createWordNetInstance, TranslationHelper } from 'wn-ts-web';

const wordnet = await createWordNetInstance({
  lexicons: ['oewn:2024', 'omw-fr:1.4'],
});

const translator = new TranslationHelper(wordnet);
const result = await translator.translateWord('computer', {
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  includeDefinitions: true,
  includeExamples: true
});

console.log(result.translations.fr.words); // ['ordinateur']
console.log(result.translations.fr.definitions); // ['A machine for performing calculations...']
```

## React Components

### BilingualTranslationExample

A complete React component that provides a user interface for translation:

```tsx
import { BilingualTranslationExample } from './examples/BilingualTranslationExample';

function App() {
  return (
    <div>
      <BilingualTranslationExample />
    </div>
  );
}
```

**Features:**
- Input field for words to translate
- Language selection dropdowns
- Quick and detailed translation results
- Loading states and error handling
- Responsive design

### Simple Translation Functions

For non-React usage or custom implementations:

```typescript
import { 
  translateWord, 
  translateWordDetailed, 
  getAvailableLanguages 
} from './examples/SimpleTranslationExample';

// Quick translation
const translations = await translateWord('computer', 'en', 'fr');

// Detailed translation
const detailed = await translateWordDetailed('house', 'en', 'fr');

// Get available languages
const languages = await getAvailableLanguages();
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
- `options`: Translation options

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

##### `isLanguageAvailable(language: string): Promise<boolean>`

Checks if a specific language is available.

### Utility Functions

#### `quickTranslate(wordnetClient: Wordnet, word: string, fromLang: string, toLang: string): Promise<string[]>`

Simple function for quick translations.

#### `createTranslationHelper(wordnetClient: Wordnet): TranslationHelper`

Factory function to create a TranslationHelper instance.

## Examples

### Basic Translation

```typescript
import { createWordNetInstance, quickTranslate } from 'wn-ts-web';

const wordnet = await createWordNetInstance({
  lexicons: ['oewn:2024', 'omw-fr:1.4'],
});

const translations = await quickTranslate(wordnet, 'love', 'en', 'fr');
console.log(translations); // ['amour', 'aimer', ...]
```

### Translation with Definitions

```typescript
import { createWordNetInstance, TranslationHelper } from 'wn-ts-web';

const wordnet = await createWordNetInstance({
  lexicons: ['oewn:2024', 'omw-fr:1.4'],
});

const translator = new TranslationHelper(wordnet);
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

### Language Detection

```typescript
const translator = new TranslationHelper(wordnet);

// Get all available languages
const languages = await translator.getAvailableLanguages();
console.log('Available languages:', languages);

// Check if a specific language is available
const isFrenchAvailable = await translator.isLanguageAvailable('fr');
console.log('French available:', isFrenchAvailable);
```

## Integration in wn-ts-web-demo

The translation utilities are designed to be easily integrated into the wn-ts-web-demo application. Here are some common integration patterns:

### 1. Standalone Translation Page

Create a dedicated page for translation functionality:

```tsx
// pages/TranslationPage.tsx
import { BilingualTranslationExample } from '../examples/BilingualTranslationExample';

export default function TranslationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Translation Tool</h1>
      <BilingualTranslationExample />
    </div>
  );
}
```

### 2. Embedded Translation Widget

Add translation functionality to existing pages:

```tsx
// components/TranslationWidget.tsx
import { useState } from 'react';
import { createWordNetInstance, quickTranslate } from 'wn-ts-web';

export function TranslationWidget() {
  const [word, setWord] = useState('');
  const [translations, setTranslations] = useState<string[]>([]);

  const handleTranslate = async () => {
    const wordnet = await createWordNetInstance({
      lexicons: ['oewn:2024', 'omw-fr:1.4'],
    });
    const results = await quickTranslate(wordnet, word, 'en', 'fr');
    setTranslations(results);
  };

  return (
    <div className="p-4 border rounded">
      <input 
        value={word} 
        onChange={(e) => setWord(e.target.value)}
        placeholder="Enter word..."
        className="mr-2 px-2 py-1 border rounded"
      />
      <button onClick={handleTranslate} className="px-4 py-1 bg-blue-500 text-white rounded">
        Translate
      </button>
      {translations.length > 0 && (
        <div className="mt-2">
          <strong>French:</strong> {translations.join(', ')}
        </div>
      )}
    </div>
  );
}
```

### 3. Translation API Endpoint

Create an API endpoint for server-side translation:

```typescript
// pages/api/translate.ts
import { createWordNetInstance, quickTranslate } from 'wn-ts-web';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word, fromLang, toLang } = req.body;

  try {
    const wordnet = await createWordNetInstance({
      lexicons: ['oewn:2024', 'omw-fr:1.4'],
    });
    
    const translations = await quickTranslate(wordnet, word, fromLang, toLang);
    
    res.status(200).json({ translations });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
}
```

## Configuration

### Required Lexicons

To use translation functionality, you need to load multiple language lexicons:

```typescript
const wordnet = await createWordNetInstance({
  lexicons: [
    'oewn:2024',    // English
    'omw-fr:1.4',   // French
    'omw-es:1.4',   // Spanish (if available)
    // Add more languages as needed
  ],
});
```

### Performance Considerations

- **Caching**: Consider caching translation results for frequently translated words
- **Lazy Loading**: Load lexicons only when needed
- **Batch Operations**: Use batch translation for multiple words
- **Error Handling**: Always handle translation failures gracefully

## Troubleshooting

### Common Issues

1. **No translations found**: Ensure both source and target language lexicons are loaded
2. **Slow performance**: Consider using quickTranslate for simple use cases
3. **Memory issues**: Limit the number of concurrent translations
4. **Language not available**: Check available languages before attempting translation

### Debug Tips

```typescript
// Check available languages
const translator = new TranslationHelper(wordnet);
const languages = await translator.getAvailableLanguages();
console.log('Available languages:', languages);

// Check if specific language is available
const isAvailable = await translator.isLanguageAvailable('fr');
console.log('French available:', isAvailable);
```

## Next Steps

1. **Add More Languages**: Extend the lexicon configuration to include more languages
2. **Improve UI**: Enhance the React components with better styling and UX
3. **Add Caching**: Implement caching for better performance
4. **Add History**: Track translation history for users
5. **Add Favorites**: Allow users to save favorite translations
