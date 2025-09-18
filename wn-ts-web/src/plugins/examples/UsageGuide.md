# Dead Simple Plugin System - Usage Guide

Just like **Jotai atoms** or **Jest matchers** - dead simple, composable, and works everywhere.

## 🚀 **Quick Start**

```typescript
import { createWordNet } from 'wn-ts-core/plugins';
import { relations, similarity, translation } from 'wn-ts-core/plugins';

// Create WordNet with plugins - just like Jotai
const wordnet = createWordNet({
  core: yourCore,
  plugins: [relations, similarity, translation]
});

// Use it - plugins just work
const parents = await wordnet.getHypernyms('computer');
const sim = await wordnet.getPathSimilarity('car', 'vehicle');
const translations = await wordnet.getTranslations('computer', 'fr');
```

## 🎯 **Core Philosophy**

> **"Just add it"** - Like Jotai atoms or Jest matchers, plugins are simple objects that add methods.

## 📦 **Available Plugins**

### **Relations Plugin**
```typescript
import { relations } from 'wn-ts-core/plugins';

wordnet.use(relations);

// Now available:
await wordnet.getHypernyms('computer-synset');
await wordnet.getHyponyms('computer-synset');
await wordnet.getMeronyms('computer-synset');
await wordnet.getHolonyms('computer-synset');
await wordnet.getEntailments('computer-synset');
await wordnet.getSimilarTos('computer-synset');
```

### **Similarity Plugin**
```typescript
import { similarity } from 'wn-ts-core/plugins';

wordnet.use(similarity);

// Now available:
await wordnet.getPathSimilarity('car', 'vehicle');
await wordnet.getWuPalmerSimilarity('car', 'vehicle');
await wordnet.getLeacockChodorowSimilarity('car', 'vehicle');
await wordnet.getJaccardSimilarity('car', 'vehicle');
await wordnet.getBestSimilarity('car', 'vehicle');
await wordnet.findMostSimilar('car', 10);
```

### **Translation Plugin**
```typescript
import { translation } from 'wn-ts-core/plugins';

wordnet.use(translation);

// Now available:
await wordnet.getTranslations('computer-synset', 'fr');
await wordnet.getTranslationsByWord('computer', 'en', 'fr');
await wordnet.getAvailableLanguages('computer-synset');
await wordnet.getSynsetsByIli('i12345');
await wordnet.getTranslationConfidence('synset1', 'synset2');
```

## 🔧 **Usage Patterns**

### **1. Basic Usage**
```typescript
// Add all plugins at once
const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation]
});
```

### **2. Lazy Loading**
```typescript
// Start with no plugins
const wordnet = createWordNet({ core: myCore });

// Add only what you need
wordnet.use(relations);
wordnet.use(similarity);
```

### **3. Conditional Loading**
```typescript
const wordnet = createWordNet({ core: myCore });

if (userNeedsSimilarity) {
  wordnet.use(similarity);
}

if (userNeedsTranslation) {
  wordnet.use(translation);
}
```

### **4. Plugin Composition**
```typescript
// Create custom plugin that uses others
const advancedSimilarity = {
  name: 'advanced-similarity',
  methods: {
    getBestSimilarity: async (core, synset1, synset2) => {
      const pathSim = await core.getPathSimilarity(synset1, synset2);
      const wuPalmerSim = await core.getWuPalmerSimilarity(synset1, synset2);
      return Math.max(pathSim, wuPalmerSim);
    }
  }
};

wordnet.use(similarity);
wordnet.use(advancedSimilarity);
```

### **5. Plugin Management**
```typescript
// Check if plugin is loaded
if (wordnet.has('similarity')) {
  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
}

// Get all loaded plugins
console.log(wordnet.getPlugins()); // ['relations', 'similarity']

// Remove a plugin
wordnet.remove('translation');
```

## 🧪 **Testing**

```typescript
import { createWordNet } from 'wn-ts-core/plugins';
import { relations } from 'wn-ts-core/plugins';

describe('My Plugin', () => {
  it('should work', () => {
    const wordnet = createWordNet({ core: mockCore });
    wordnet.use(relations);
    
    expect(wordnet.has('relations')).toBe(true);
    expect(typeof wordnet.getHypernyms).toBe('function');
  });
});
```

## 🎨 **Creating Your Own Plugins**

```typescript
const myPlugin = {
  name: 'my-plugin',
  methods: {
    myMethod: async (core, input) => {
      // Your implementation
      return core.query('SELECT * FROM my_table WHERE id = ?', [input]);
    },
    
    anotherMethod: async (core, a, b) => {
      // Use other plugins
      const sim = await core.getPathSimilarity(a, b);
      return sim * 2;
    }
  }
};

wordnet.use(myPlugin);
await wordnet.myMethod('test');
```

## 🚀 **Migration from Complex System**

```typescript
// OLD (complex)
const smartDB = new SmartDatabaseManager({
  enableLazyLoading: true,
  enableAutoPatching: true,
  enableHealthMonitoring: true,
  patchOnDemand: true,
  healthCheckInterval: 300000,
  maxDatabaseSize: 100 * 1024 * 1024,
  performanceThreshold: 1000
});

// NEW (simple)
const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation]
});
```

## 🎉 **Benefits**

- **Dead Simple**: Just objects with methods
- **Composable**: Mix and match plugins
- **Lazy Loading**: Add only what you need
- **Type Safe**: Full TypeScript support
- **Tree Shakeable**: Only bundle what you use
- **Testable**: Easy to mock and test
- **Extensible**: Add your own plugins easily

## 🏗️ **Architecture**

```
┌─────────────────────────────────────┐
│           Core Kernel               │
│    (Minimal, stable, fast)         │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│         Plugin Registry             │
│    (Simple add/remove/use)         │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│           Plugins                   │
│  (relations, similarity, etc.)     │
└─────────────────────────────────────┘
```

This is **much simpler** than the complex system and follows the Jotai/Jest philosophy of "just add what you need"!

