# Type-Safe Plugin System - Usage Guide

A **fully type-safe** microkernel plugin system with TypeScript generics, type inference, and compile-time safety.

## 🎯 **Type Safety Features**

- **Full TypeScript Support**: Complete type checking and inference
- **Autocomplete**: IntelliSense for all methods and parameters
- **Compile-time Safety**: Catch errors before runtime
- **Type Inference**: Automatic type deduction from plugins
- **Generic Types**: Flexible plugin composition with type safety

## 🚀 **Type-Safe Usage**

```typescript
import { createWordNet } from 'wn-ts-core/plugins';
import { relations, similarity, translation } from 'wn-ts-core/plugins';
import type { WordNetCore, WordNetWithPlugins } from 'wn-ts-core/plugins';

// Create WordNet with plugins - fully type-safe
const wordnet = createWordNet({
  core: myCore,
  plugins: [relations, similarity, translation] as const // 'as const' preserves exact types
});

// TypeScript knows all available methods and their signatures
const hypernyms = await wordnet.getHypernyms('computer-synset');
//    ^? Array<{ id: string; lemma: string; pos: string; language: string; }>

const sim = await wordnet.getPathSimilarity('car', 'vehicle');
//    ^? number

const translations = await wordnet.getTranslations('computer-synset', 'fr');
//    ^? Array<{ id: string; language: string; lexicon: string; lemma: string; pos: string; }>
```

## 🔧 **Type-Safe Plugin Definition**

```typescript
import type { Plugin, PluginMethod, WordNetCore } from 'wn-ts-core/plugins';

// Define method signatures with proper types
interface MyPluginMethods {
  myMethod: PluginMethod<WordNetCore, [input: string], Promise<string>>;
  anotherMethod: PluginMethod<WordNetCore, [a: string, b: string], Promise<number>>;
}

// Create type-safe plugin
const myPlugin: Plugin<MyPluginMethods> = {
  name: 'my-plugin',
  methods: {
    myMethod: async (core: WordNetCore, input: string) => {
      // TypeScript knows 'core' is WordNetCore
      const result = await core.query('SELECT * FROM table WHERE id = ?', [input]);
      return result[0]?.value || '';
    },
    
    anotherMethod: async (core: WordNetCore, a: string, b: string) => {
      // TypeScript knows parameter types
      return a.length + b.length;
    }
  }
};
```

## 🎨 **Type-Safe Plugin Composition**

```typescript
// Create custom plugin that uses other plugins
const advancedSimilarity = {
  name: 'advanced-similarity',
  methods: {
    getBestSimilarity: async (core: WordNetCore, synset1: string, synset2: string): Promise<number> => {
      // TypeScript knows core methods are available
      const pathSim = await core.getPathSimilarity(synset1, synset2);
      const wuPalmerSim = await core.getWuPalmerSimilarity(synset1, synset2);
      return Math.max(pathSim, wuPalmerSim);
    }
  }
} as const;

// Use with other plugins
let wordnet = createWordNet({
  core: myCore,
  plugins: [similarity] as const
});

// Add custom plugin - TypeScript updates the type
wordnet = wordnet.use(advancedSimilarity);
//    ^? WordNetWithPlugins<readonly [Plugin<SimilarityMethods>, Plugin<AdvancedSimilarityMethods>]>

// TypeScript knows all methods are available
const bestSim = await wordnet.getBestSimilarity('car', 'vehicle');
//    ^? number
```

## 🔄 **Type-Safe Lazy Loading**

```typescript
// Start with no plugins - only core methods available
let wordnet = createWordNet({ core: myCore });
//    ^? WordNetWithPlugins<readonly []>

// TypeScript knows only core methods are available
const words = await wordnet.getWord('computer');
// const hypernyms = await wordnet.getHypernyms('test'); // ❌ Error: Property 'getHypernyms' does not exist

// Add relations plugin - TypeScript updates the type
wordnet = wordnet.use(relations);
//    ^? WordNetWithPlugins<readonly [Plugin<RelationsMethods>]>

// Now TypeScript knows relations methods are available
const hypernyms = await wordnet.getHypernyms('computer-synset');
//    ^? Array<{ id: string; lemma: string; pos: string; language: string; }>

// Add similarity plugin - TypeScript updates the type again
wordnet = wordnet.use(similarity);
//    ^? WordNetWithPlugins<readonly [Plugin<RelationsMethods>, Plugin<SimilarityMethods>]>

// Now TypeScript knows both relations and similarity methods are available
const sim = await wordnet.getPathSimilarity('car', 'vehicle');
//    ^? number
```

## 🎯 **Type-Safe Conditional Loading**

```typescript
let wordnet = createWordNet({ core: myCore });

// Conditional loading with proper types
const userPrefs = {
  needsSimilarity: true,
  needsTranslation: false,
  needsRelations: true
};

if (userPrefs.needsRelations) {
  wordnet = wordnet.use(relations);
  // TypeScript now knows relations methods are available
}

if (userPrefs.needsSimilarity) {
  wordnet = wordnet.use(similarity);
  // TypeScript now knows similarity methods are available
}

if (userPrefs.needsTranslation) {
  wordnet = wordnet.use(translation);
  // TypeScript now knows translation methods are available
}

// TypeScript knows exactly which methods are available based on loaded plugins
const hypernyms = await wordnet.getHypernyms('computer-synset');
const sim = await wordnet.getPathSimilarity('car', 'vehicle');
// const translations = await wordnet.getTranslations('test'); // ❌ Error: translation plugin not loaded
```

## 🧪 **Type-Safe Testing**

```typescript
import { describe, it, expect } from 'vitest';
import { createWordNet } from 'wn-ts-core/plugins';
import { relations } from 'wn-ts-core/plugins';
import type { WordNetCore, WordNetWithPlugins } from 'wn-ts-core/plugins';

describe('Type-Safe Plugin System', () => {
  const mockCore: WordNetCore = {
    query: async (sql: string, params?: any[]) => [],
    getWord: async (form: string) => [],
    getSynset: async (id: string) => ({ id, lemma: 'test' }),
    getSenses: async (wordId: string) => [],
    getDefinitions: async (synsetId: string) => [],
    getRelations: async (synsetId: string, type?: string) => []
  };

  it('should be type-safe', () => {
    const wordnet = createWordNet({ core: mockCore });
    wordnet.use(relations);
    
    // TypeScript knows the method exists and its signature
    expect(typeof wordnet.getHypernyms).toBe('function');
    
    // TypeScript knows the return type
    const result = wordnet.getHypernyms('test');
    //    ^? Promise<Array<{ id: string; lemma: string; pos: string; language: string; }>>
  });
});
```

## 🎉 **Type Safety Benefits**

### **Compile-time Safety**
```typescript
// ❌ These errors are caught at compile time
const wordnet = createWordNet({ core: myCore, plugins: [relations] });

// Wrong number of arguments
await wordnet.getHypernyms(); // Error: Expected 1 argument, but got 0

// Wrong argument types
await wordnet.getPathSimilarity(123, 'vehicle'); // Error: Argument of type 'number' is not assignable to parameter of type 'string'

// Non-existent methods
await wordnet.nonExistentMethod(); // Error: Property 'nonExistentMethod' does not exist
```

### **Autocomplete and IntelliSense**
```typescript
const wordnet = createWordNet({ core: myCore, plugins: [relations, similarity, translation] });

// Type: wordnet.get
// Shows: getHypernyms, getHyponyms, getMeronyms, getHolonyms, getEntailments, getSimilarTos, getRelationsByType, getAllRelations, getPathSimilarity, getWuPalmerSimilarity, getLeacockChodorowSimilarity, getJaccardSimilarity, getBestSimilarity, findMostSimilar, getTranslations, getTranslationsByWord, getAvailableLanguages, getSynsetsByIli, getTranslationConfidence, getTranslationSuggestions

// Type: wordnet.getPathSimilarity(
// Shows: (synset1: string, synset2: string) => Promise<number>
```

### **Type Inference**
```typescript
const wordnet = createWordNet({ core: myCore, plugins: [relations] });

// TypeScript automatically infers the return type
const result = await wordnet.getHypernyms('computer-synset');
// TypeScript knows: result is Array<{ id: string; lemma: string; pos: string; language: string; }>

// You get full autocomplete on the result
result.forEach(item => {
  console.log(item.id);      // ✅ TypeScript knows this exists
  console.log(item.lemma);   // ✅ TypeScript knows this exists
  console.log(item.invalid); // ❌ TypeScript error: Property 'invalid' does not exist
});
```

## 🏗️ **Type System Architecture**

```typescript
// Core types
interface WordNetCore {
  query(sql: string, params?: any[]): Promise<any[]>;
  getWord(form: string): Promise<any[]>;
  getSynset(id: string): Promise<any>;
  // ... other core methods
}

// Plugin method signature
type PluginMethod<TCore, TArgs extends any[], TReturn> = 
  (core: TCore, ...args: TArgs) => TReturn;

// Plugin definition
interface Plugin<TMethods extends Record<string, PluginMethod> = Record<string, PluginMethod>> {
  name: string;
  methods: TMethods;
}

// Type-safe WordNet with plugins
type WordNetWithPlugins<TPlugins extends readonly Plugin[]> = 
  WordNetCore & {
    // Core methods
    query: WordNetCore['query'];
    getWord: WordNetCore['getWord'];
    // ... other core methods
    
    // Plugin management
    use: <TNewPlugin extends Plugin>(plugin: TNewPlugin) => WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
    remove: (name: string) => WordNetWithPlugins<TPlugins>;
    has: (name: string) => boolean;
    getPlugins: () => string[];
    getCore: () => WordNetCore;
  } & {
    // Plugin methods - merged from all plugins
    [K in TPlugins[number] extends infer P 
      ? P extends Plugin 
        ? keyof P['methods'] 
        : never 
      : never]: TPlugins[number] extends infer P
        ? P extends Plugin
          ? P['methods'][K] extends PluginMethod<infer TCore, infer TArgs, infer TReturn>
            ? (...args: TArgs) => TReturn
            : never
          : never
        : never;
  };
```

## 🚀 **Migration from Non-Type-Safe**

```typescript
// OLD (not type-safe)
const wordnet = createWordNet({ core: myCore, plugins: [relations] });
const result = await wordnet.getHypernyms('test'); // any type

// NEW (fully type-safe)
const wordnet = createWordNet({ core: myCore, plugins: [relations] as const });
const result = await wordnet.getHypernyms('test'); // Array<{ id: string; lemma: string; pos: string; language: string; }>
```

This type-safe system gives you **full IntelliSense**, **compile-time error checking**, and **automatic type inference** while maintaining the simple Jotai/Jest-like API!

