# Translation Examples

Comprehensive examples demonstrating cross-lingual translation capabilities using the WordNet TypeScript ecosystem.

## 🎯 **Overview**

This guide showcases how to implement cross-lingual translation workflows using the ILI (Interlingual Index) system and the translation plugin. Learn how to translate words and concepts between different languages.

## 🚀 **Features**

- **ILI-based Translation** - Using the Interlingual Index for accurate translations
- **Multi-language Support** - English, French, Thai, and more
- **Translation Confidence** - Scoring and validation of translations
- **Batch Translation** - Efficient translation of multiple terms
- **Fallback Strategies** - Handling cases where direct translation isn't available

## 📚 **Translation Concepts**

### **How Cross-Lingual Translation Works**

1. **Word Lookup** - Find the word in the source language
2. **Synset Resolution** - Get the synset(s) containing the word
3. **ILI Mapping** - Use the Interlingual Index to find equivalent concepts
4. **Target Language Lookup** - Find words in the target language for the same concept
5. **Confidence Scoring** - Evaluate translation quality and reliability

### **Supported Languages**

- **English (en)** - Open English WordNet (OEWN)
- **French (fr)** - WOLF (Wordnet Libre du Français)
- **Thai (th)** - Thai WordNet
- **More languages** - As supported by the loaded lexicons

## 🎯 **Basic Translation Examples**

### **1. Simple Word Translation**

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';
import { translation } from 'wn-ts-core/plugins';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();

// Add translation plugin
const wordnetWithTranslation = wordnet.use(translation);

// Translate a word
const translations = await wordnetWithTranslation.getTranslations(
  'synset-id', 
  'fr'
);

console.log('French translations:', translations);
```

### **2. Cross-Lingual Word Search**

```typescript
const translateWord = async (word: string, fromLang: string, toLang: string) => {
  // 1. Find word in source language
  const sourceWords = await wordnet.words({ 
    form: word, 
    language: fromLang 
  });
  
  if (sourceWords.length === 0) {
    throw new Error(`Word "${word}" not found in ${fromLang}`);
  }
  
  // 2. Get synsets for the word
  const synsets = await wordnet.synsets({ 
    wordId: sourceWords[0].id 
  });
  
  if (synsets.length === 0) {
    throw new Error(`No synsets found for "${word}"`);
  }
  
  // 3. Translate using ILI
  const translations = await wordnetWithTranslation.getTranslations(
    synsets[0].id, 
    toLang
  );
  
  return translations;
};

// Usage
const frenchTranslations = await translateWord('computer', 'en', 'fr');
console.log('French translations of "computer":', frenchTranslations);
```

### **3. Translation with Confidence Scoring**

```typescript
const translateWithConfidence = async (word: string, fromLang: string, toLang: string) => {
  const sourceWords = await wordnet.words({ form: word, language: fromLang });
  const synsets = await wordnet.synsets({ wordId: sourceWords[0].id });
  
  const results = [];
  
  for (const synset of synsets) {
    const translations = await wordnetWithTranslation.getTranslations(synset.id, toLang);
    const confidence = await wordnetWithTranslation.getTranslationConfidence(
      synset.id, 
      toLang
    );
    
    results.push({
      synset: synset.id,
      translations,
      confidence,
      definition: synset.definitions[0]?.text
    });
  }
  
  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
};

// Usage
const results = await translateWithConfidence('happy', 'en', 'fr');
console.log('Translation results with confidence:', results);
```

## 🔧 **Advanced Translation Examples**

### **1. Batch Translation**

```typescript
const translateBatch = async (words: string[], fromLang: string, toLang: string) => {
  const results = [];
  
  for (const word of words) {
    try {
      const translations = await translateWord(word, fromLang, toLang);
      results.push({
        word,
        translations,
        success: true
      });
    } catch (error) {
      results.push({
        word,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

// Usage
const words = ['computer', 'happy', 'run', 'beautiful'];
const batchResults = await translateBatch(words, 'en', 'fr');
console.log('Batch translation results:', batchResults);
```

### **2. Translation with Fallback Strategies**

```typescript
const translateWithFallback = async (word: string, fromLang: string, toLang: string) => {
  try {
    // Try direct ILI-based translation
    return await translateWord(word, fromLang, toLang);
  } catch (error) {
    console.log(`Direct translation failed for "${word}":`, error.message);
    
    try {
      // Fallback: Try fuzzy matching
      const fuzzyTranslations = await wordnetWithTranslation.getTranslationSuggestions(
        word, 
        fromLang, 
        toLang
      );
      
      if (fuzzyTranslations.length > 0) {
        return fuzzyTranslations;
      }
    } catch (fuzzyError) {
      console.log(`Fuzzy translation failed for "${word}":`, fuzzyError.message);
    }
    
    // Final fallback: Return empty result
    return [];
  }
};
```

### **3. Multi-language Translation Matrix**

```typescript
const createTranslationMatrix = async (word: string, sourceLang: string, targetLanguages: string[]) => {
  const matrix = {};
  
  for (const targetLang of targetLanguages) {
    try {
      const translations = await translateWord(word, sourceLang, targetLang);
      matrix[targetLang] = translations;
    } catch (error) {
      matrix[targetLang] = { error: error.message };
    }
  }
  
  return matrix;
};

// Usage
const languages = ['fr', 'th', 'de', 'es'];
const matrix = await createTranslationMatrix('computer', 'en', languages);
console.log('Translation matrix:', matrix);
```

## 🌐 **Web Integration Examples**

### **1. React Translation Component**

```tsx
import React, { useState } from 'react';
import { useWordNet } from 'wn-ts-web';

const TranslationComponent: React.FC = () => {
  const { wordnet } = useWordNet();
  const [word, setWord] = useState('');
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!wordnet || !word) return;
    
    setLoading(true);
    try {
      const results = await translateWord(word, 'en', 'fr');
      setTranslations(results);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Enter word to translate"
      />
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? 'Translating...' : 'Translate'}
      </button>
      
      {translations.length > 0 && (
        <div>
          <h3>French Translations:</h3>
          <ul>
            {translations.map((translation, index) => (
              <li key={index}>{translation.lemma}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### **2. Translation API Endpoint**

```typescript
import express from 'express';
import { NodeWordNetKernel } from 'wn-ts-node';
import { translation } from 'wn-ts-core/plugins';

const app = express();
const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const wordnetWithTranslation = wordnet.use(translation);

app.post('/translate', async (req, res) => {
  try {
    const { word, from, to } = req.body;
    
    const translations = await translateWord(word, from, to);
    
    res.json({
      success: true,
      word,
      from,
      to,
      translations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

## 🧪 **Testing Translation**

### **Unit Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { NodeWordNetKernel } from 'wn-ts-node';
import { translation } from 'wn-ts-core/plugins';

describe('Translation', () => {
  let wordnet: any;

  beforeEach(async () => {
    wordnet = new NodeWordNetKernel('oewn:2024');
    await wordnet.initialize();
    wordnet = wordnet.use(translation);
  });

  it('should translate English to French', async () => {
    const translations = await translateWord('computer', 'en', 'fr');
    expect(translations).toBeDefined();
    expect(translations.length).toBeGreaterThan(0);
  });

  it('should handle translation errors gracefully', async () => {
    await expect(translateWord('nonexistent', 'en', 'fr'))
      .rejects.toThrow();
  });
});
```

## 🚀 **Performance Optimization**

### **1. Caching Translations**

```typescript
class TranslationCache {
  private cache = new Map<string, any>();

  async translate(word: string, fromLang: string, toLang: string) {
    const key = `${word}:${fromLang}:${toLang}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await translateWord(word, fromLang, toLang);
    this.cache.set(key, result);
    
    return result;
  }
}
```

### **2. Parallel Translation**

```typescript
const translateParallel = async (words: string[], fromLang: string, toLang: string) => {
  const promises = words.map(word => 
    translateWord(word, fromLang, toLang).catch(error => ({
      word,
      error: error.message
    }))
  );
  
  return Promise.all(promises);
};
```

## 🆘 **Troubleshooting**

### **Common Issues**

#### **No ILI Data Loaded**
```typescript
// Check if ILI data is available
const ilis = await wordnet.ilis();
if (ilis.length === 0) {
  console.warn('No ILI data loaded. Translation may not work.');
}
```

#### **Language Not Supported**
```typescript
// Check available languages
const languages = await wordnet.getAvailableLanguages();
console.log('Supported languages:', languages);
```

#### **Translation Confidence Low**
```typescript
// Use confidence scoring to filter results
const results = await translateWithConfidence('word', 'en', 'fr');
const highConfidence = results.filter(r => r.confidence > 0.8);
```

## 📚 **Further Reading**

- **[Plugin API Guide](../../api/PLUGIN_API.md)** - Learn about the translation plugin
- **[Cross-Lingual Dependencies](../../standards/CROSS_LINGUAL_DEPENDENCIES.md)** - Understanding multi-language support
- **[Performance Examples](./performance.md)** - Optimization techniques

---

**Ready to build your own translation system? Check out the [Plugin Development](./plugin-development.md) guide! 🚀**
