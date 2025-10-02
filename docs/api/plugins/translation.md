---
title: Translation Plugin API
description: Complete API reference for the WordNet translation plugin
---

# Translation Plugin API

Complete API reference for the WordNet translation plugin, providing cross-lingual translation and mapping capabilities.

## Quick Start

```typescript
import { translation } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [translation]);

// Translate synset
const translations = await wordnet.getTranslations(synsetId, 'fr');
```

## API Reference

### **Synset Translation**

```typescript
// Get translations for a synset
const translations = await wordnet.getTranslations(synsetId, 'fr');

// Get translations with confidence scores
const translations = await wordnet.getTranslations(synsetId, 'fr', { 
  includeConfidence: true 
});

// Get translations with filters
const translations = await wordnet.getTranslations(synsetId, 'fr', {
  minConfidence: 0.5,
  maxResults: 10
});
```

### **Word Translation**

```typescript
// Get translations by word
const translations = await wordnet.getTranslationsByWord(wordId, 'fr');

// Get translations with confidence
const translations = await wordnet.getTranslationsByWord(wordId, 'fr', {
  includeConfidence: true
});
```

### **Available Languages**

```typescript
// Get all available languages
const languages = await wordnet.getAvailableLanguages();

// Get languages for specific synset
const languages = await wordnet.getAvailableLanguages(synsetId);

// Get languages with statistics
const languages = await wordnet.getAvailableLanguages(synsetId, {
  includeStats: true
});
```

### **Translation Confidence**

```typescript
// Get translation confidence
const confidence = await wordnet.getTranslationConfidence(synsetId, 'fr');

// Get confidence for multiple languages
const confidences = await wordnet.getTranslationConfidence(synsetId, ['fr', 'es', 'de']);
```

### **Translation Suggestions**

```typescript
// Get translation suggestions
const suggestions = await wordnet.getTranslationSuggestions(word, 'en', 'fr');

// Get suggestions with options
const suggestions = await wordnet.getTranslationSuggestions(word, 'en', 'fr', {
  maxSuggestions: 5,
  minConfidence: 0.3
});
```

## Configuration Options

```typescript
const translationPlugin = translation({
  enableConfidence: true,     // Enable confidence scoring
  minConfidence: 0.5,         // Minimum confidence threshold
  maxSuggestions: 10,         // Maximum suggestions
  cacheTranslations: true,    // Cache translation results
  maxCacheSize: 1000,         // Maximum cache size
  enableFuzzy: true,          // Enable fuzzy matching
  fuzzyThreshold: 0.8         // Fuzzy matching threshold
});
```

## Supported Languages

| Language | Code | Lexicon | Status |
|----------|------|---------|--------|
| English | en | OEWN | ✅ Full Support |
| French | fr | WOLF | ✅ Full Support |
| Thai | th | Thai WordNet | ✅ Full Support |
| German | de | German WordNet | 🟡 Partial |
| Spanish | es | Spanish WordNet | 🟡 Partial |
| Italian | it | Italian WordNet | 🟡 Partial |

## Usage Examples

### **Basic Translation**

```typescript
// Translate a synset to French
const synsetId = 'synset-car-1';
const translations = await wordnet.getTranslations(synsetId, 'fr');

console.log('French translations:', translations);
// Output: [{ id: 'synset-voiture-1', lemma: 'voiture', ... }]
```

### **Translation with Confidence**

```typescript
// Get translations with confidence scores
const translations = await wordnet.getTranslations(synsetId, 'fr', {
  includeConfidence: true
});

translations.forEach(translation => {
  console.log(`${translation.lemma}: ${translation.confidence}`);
});
```

### **Multi-language Translation**

```typescript
// Translate to multiple languages
const languages = ['fr', 'es', 'de'];
const translations = await Promise.all(
  languages.map(async (lang) => {
    const trans = await wordnet.getTranslations(synsetId, lang);
    return { language: lang, translations: trans };
  })
);

console.log('Multi-language translations:', translations);
```

### **Word-level Translation**

```typescript
// Translate a specific word
const wordId = 'word-computer-1';
const translations = await wordnet.getTranslationsByWord(wordId, 'fr');

console.log('Word translations:', translations);
```

### **Translation Suggestions**

```typescript
// Get translation suggestions for unknown words
const suggestions = await wordnet.getTranslationSuggestions('computr', 'en', 'fr');

console.log('Translation suggestions:', suggestions);
// Output: [{ word: 'computer', confidence: 0.9, translations: [...] }]
```

### **Language Detection**

```typescript
// Get available languages for a synset
const languages = await wordnet.getAvailableLanguages(synsetId);

console.log('Available languages:', languages);
// Output: ['en', 'fr', 'es', 'de']
```

### **Confidence-based Filtering**

```typescript
// Filter translations by confidence
const translations = await wordnet.getTranslations(synsetId, 'fr', {
  minConfidence: 0.7,
  maxResults: 5
});

const highConfidence = translations.filter(t => t.confidence > 0.8);
console.log('High confidence translations:', highConfidence);
```

## Translation Workflow

### **Complete Translation Pipeline**

```typescript
async function translateWord(word: string, fromLang: string, toLang: string) {
  // 1. Find word in source language
  const sourceWords = await wordnet.words({ form: word, language: fromLang });
  
  if (sourceWords.length === 0) {
    throw new Error(`Word "${word}" not found in ${fromLang}`);
  }
  
  // 2. Get synsets for the word
  const synsets = await wordnet.synsets({ wordId: sourceWords[0].id });
  
  if (synsets.length === 0) {
    throw new Error(`No synsets found for "${word}"`);
  }
  
  // 3. Translate each synset
  const translations = await Promise.all(
    synsets.map(async (synset) => {
      const trans = await wordnet.getTranslations(synset.id, toLang);
      return {
        synset: synset.id,
        translations: trans,
        confidence: await wordnet.getTranslationConfidence(synset.id, toLang)
      };
    })
  );
  
  return translations;
}

// Usage
const results = await translateWord('computer', 'en', 'fr');
console.log('Translation results:', results);
```

### **Batch Translation**

```typescript
async function translateBatch(words: string[], fromLang: string, toLang: string) {
  const results = await Promise.all(
    words.map(async (word) => {
      try {
        const translations = await translateWord(word, fromLang, toLang);
        return { word, translations, success: true };
      } catch (error) {
        return { word, error: error.message, success: false };
      }
    })
  );
  
  return results;
}

// Usage
const words = ['computer', 'program', 'algorithm'];
const batchResults = await translateBatch(words, 'en', 'fr');
```

## Testing

### **Unit Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { translation } from 'wn-ts-core/plugins';

describe('Translation Plugin', () => {
  let wordnet: WordNetKernel;
  
  beforeEach(async () => {
    wordnet = new WordNetKernel(mockCore, [translation]);
    await wordnet.initialize();
  });
  
  it('should translate synset', async () => {
    const translations = await wordnet.getTranslations('synset-1', 'fr');
    expect(translations).toBeDefined();
    expect(Array.isArray(translations)).toBe(true);
  });
  
  it('should get available languages', async () => {
    const languages = await wordnet.getAvailableLanguages();
    expect(languages).toContain('en');
    expect(languages).toContain('fr');
  });
});
```

### **Translation Quality Tests**

```typescript
describe('Translation Quality', () => {
  it('should provide high confidence translations', async () => {
    const translations = await wordnet.getTranslations('synset-car-1', 'fr', {
      includeConfidence: true
    });
    
    const highConfidence = translations.filter(t => t.confidence > 0.8);
    expect(highConfidence.length).toBeGreaterThan(0);
  });
});
```

## Further Reading

- **[Plugin System API](/api/plugins/)** - Complete plugin system reference
- **[Core API](/api/core/)** - Core library API reference
- **[Translation Examples](/examples/translation/)** - Working translation examples

---

**Ready to build cross-lingual applications? Check out the [Translation Examples](/examples/translation/) to see it in action! 🚀**
