---
title: Web Kernel Usage
description: Complete guide to using WebWordNetKernel in browser applications
---

# Web Kernel Usage

This guide demonstrates how to use the `WebWordNetKernel` in browser applications with React.

## Basic Usage

### Direct Kernel Usage

```typescript
import { WebWordNetKernel } from 'wn-ts-web';

async function initializeWordNet() {
  // Create kernel instance
  const wordnet = new WebWordNetKernel('oewn:2024');
  
  try {
    // Initialize
    await wordnet.initialize();
    console.log('✅ WordNet initialized');
    
    // Basic operations
    const words = await wordnet.words({ form: 'computer' });
    console.log(`Found ${words.length} words`);
    
    // Get synsets
    const synsets = await wordnet.synsets({ form: 'computer' });
    console.log(`Found ${synsets.length} synsets`);
    
    // Relations
    if (synsets.length > 0) {
      const hypernyms = await wordnet.getHypernyms(synsets[0].id);
      const hyponyms = await wordnet.getHyponyms(synsets[0].id);
      console.log(`Hypernyms: ${hypernyms.length}, Hyponyms: ${hyponyms.length}`);
    }
    
    // Similarity
    if (synsets.length > 1) {
      const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
      console.log(`Similarity: ${similarity.toFixed(3)}`);
    }
    
    // Translation
    if (synsets.length > 0) {
      const translations = await wordnet.getTranslations(synsets[0].id);
      console.log(`Translations: ${translations.length} found`);
    }
    
  } finally {
    await wordnet.close();
  }
}
```

## React Integration

### Using the Kernel Hook

```tsx
import React, { useState, useEffect } from 'react';
import { useWordNetKernel } from 'wn-ts-web/react';

function WordNetDemo() {
  const {
    words,
    synsets,
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getTranslations,
    loading,
    error,
    initialized,
    initialize
  } = useWordNetKernel();

  const [searchTerm, setSearchTerm] = useState('computer');
  const [results, setResults] = useState<any[]>([]);

  // Initialize on mount
  useEffect(() => {
    if (!initialized && !loading) {
      initialize('oewn:2024');
    }
  }, [initialized, loading, initialize]);

  // Search handler
  const handleSearch = async () => {
    if (!initialized) return;
    
    try {
      const wordResults = await words({ form: searchTerm });
      setResults(wordResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  if (loading) {
    return <div>Loading WordNet...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>WordNet Search</h2>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter a word"
      />
      <button onClick={handleSearch}>Search</button>
      
      <div>
        {results.map(word => (
          <div key={word.id}>
            {word.lemma} ({word.pos})
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using the Context Provider

```tsx
import React from 'react';
import { WordNetKernelProvider, useWordNetKernelContext } from 'wn-ts-web/react';

function App() {
  return (
    <WordNetKernelProvider>
      <WordNetDemo />
    </WordNetKernelProvider>
  );
}

function WordNetDemo() {
  const { words, synsets, loading, error, initialized } = useWordNetKernelContext();
  
  // Your component logic...
}
```

## Advanced Usage

### Working with Relations

```typescript
async function exploreRelations(wordnet: WebWordNetKernel) {
  const synsets = await wordnet.synsets({ form: 'car' });
  
  if (synsets.length > 0) {
    const synsetId = synsets[0].id;
    
    // Get hypernyms (more general concepts)
    const hypernyms = await wordnet.getHypernyms(synsetId);
    console.log('More general:', hypernyms.map(h => h.lemma));
    
    // Get hyponyms (more specific concepts)
    const hyponyms = await wordnet.getHyponyms(synsetId);
    console.log('More specific:', hyponyms.map(h => h.lemma));
    
    // Get meronyms (parts)
    const meronyms = await wordnet.getMeronyms(synsetId);
    console.log('Parts:', meronyms.map(m => m.lemma));
    
    // Get holonyms (wholes)
    const holonyms = await wordnet.getHolonyms(synsetId);
    console.log('Wholes:', holonyms.map(h => h.lemma));
    
    // Get all relations
    const allRelations = await wordnet.getAllRelations(synsetId);
    console.log(`Total relations: ${allRelations.length}`);
  }
}
```

### Calculating Similarity

```typescript
async function compareSynsets(wordnet: WebWordNetKernel) {
  const synsets1 = await wordnet.synsets({ form: 'car' });
  const synsets2 = await wordnet.synsets({ form: 'vehicle' });
  
  if (synsets1.length > 0 && synsets2.length > 0) {
    // Path similarity
    const pathSim = await wordnet.getPathSimilarity(
      synsets1[0].id, 
      synsets2[0].id
    );
    console.log(`Path similarity: ${pathSim.toFixed(3)}`);
    
    // Wu-Palmer similarity
    const wupSim = await wordnet.getWuPalmerSimilarity(
      synsets1[0].id,
      synsets2[0].id
    );
    console.log(`Wu-Palmer similarity: ${wupSim.toFixed(3)}`);
    
    // Leacock-Chodorow similarity
    const lchSim = await wordnet.getLeacockChodorowSimilarity(
      synsets1[0].id,
      synsets2[0].id
    );
    console.log(`Leacock-Chodorow similarity: ${lchSim.toFixed(3)}`);
  }
}
```

### Cross-Lingual Translation

```typescript
async function translateConcepts(wordnet: WebWordNetKernel) {
  const synsets = await wordnet.synsets({ form: 'computer' });
  
  if (synsets.length > 0) {
    const synsetId = synsets[0].id;
    
    // Get all translations
    const allTranslations = await wordnet.getTranslations(synsetId);
    console.log('All languages:', allTranslations.map(t => t.language));
    
    // Get French translations
    const frenchTranslations = await wordnet.getTranslations(synsetId, 'fr');
    console.log('French:', frenchTranslations.map(t => t.lemma));
    
    // Get available languages
    const languages = await wordnet.getAvailableLanguages(synsetId);
    console.log('Available languages:', languages);
  }
}
```

## Plugin Management

```typescript
// Check available plugins
const plugins = wordnet.getPlugins();
console.log('Available plugins:', plugins);

// Check if specific plugin is loaded
if (wordnet.has('similarity')) {
  console.log('Similarity plugin is available');
}

// Access schema manager
const schemaManager = wordnet.schemaManager;
console.log('Schema manager available:', !!schemaManager);
```

## Error Handling

```typescript
async function safeWordNetOperation() {
  const wordnet = new WebWordNetKernel('oewn:2024');
  
  try {
    await wordnet.initialize();
    
    // Your operations here
    const words = await wordnet.words({ form: 'example' });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('WordNet error:', error.message);
    }
  } finally {
    // Always clean up
    await wordnet.close();
  }
}
```

## Performance Tips

1. **Reuse kernel instances**: Don't create multiple instances
2. **Close when done**: Always call `close()` to free resources
3. **Use specific queries**: Add filters to reduce result sets
4. **Batch operations**: Group multiple queries when possible

## Further Reading

- [Web API Reference](/api/web/)
- [Plugin System](/api/plugins/)
- [Web Examples](/examples/web/)

---

**Ready to build web applications? Check out the [Web Examples](/examples/web/) for complete demos! 🚀**

