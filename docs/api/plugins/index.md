---
title: Plugin System API
description: Complete API reference for the WordNet TypeScript plugin system
---

# Plugin System API

Complete API reference for the WordNet TypeScript plugin system, including built-in plugins and custom plugin development.

## Quick Start

```typescript
import { WordNetKernel } from 'wn-ts-core';
import { relations, similarity, translation } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [relations, similarity, translation]);

await wordnet.initialize();

// Use plugin methods
const hypernyms = await wordnet.getHypernyms(synsetId);
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const translations = await wordnet.getTranslations(synsetId, 'fr');
```

## Plugin Architecture

### **Plugin Interface**

```typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  initialize(kernel: WordNetKernel): Promise<void>;
  destroy(): Promise<void>;
}
```

### **Plugin Lifecycle**

1. **Registration**: Plugin is added to kernel
2. **Initialization**: `initialize()` is called
3. **Usage**: Plugin methods are available
4. **Destruction**: `destroy()` is called on cleanup

## Built-in Plugins

### **Relations Plugin**

Provides WordNet relationship queries and navigation.

```typescript
import { relations } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [relations]);
```

#### **Methods**

```typescript
// Get hypernyms (more general concepts)
const hypernyms = await wordnet.getHypernyms(synsetId);

// Get hyponyms (more specific concepts)
const hyponyms = await wordnet.getHyponyms(synsetId);

// Get meronyms (part-of relationships)
const meronyms = await wordnet.getMeronyms(synsetId);

// Get holonyms (contains relationships)
const holonyms = await wordnet.getHolonyms(synsetId);

// Get antonyms (opposite meanings)
const antonyms = await wordnet.getAntonyms(synsetId);

// Get all relations
const allRelations = await wordnet.getAllRelations(synsetId);

// Get relations by type
const relations = await wordnet.getRelations(synsetId, 'hypernym');
```

#### **Configuration**

```typescript
const relationsPlugin = relations({
  maxDepth: 10,
  includeIndirect: true,
  cacheResults: true
});
```

### **Similarity Plugin**

Provides semantic similarity calculations and metrics.

```typescript
import { similarity } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [similarity]);
```

#### **Methods**

```typescript
// Path similarity
const pathSim = await wordnet.getPathSimilarity(synset1, synset2);

// Wu-Palmer similarity
const wuPalmerSim = await wordnet.getWuPalmerSimilarity(synset1, synset2);

// Leacock-Chodorow similarity
const lcSim = await wordnet.getLeacockChodorowSimilarity(synset1, synset2);

// Jaccard similarity
const jaccardSim = await wordnet.getJaccardSimilarity(synset1, synset2);

// Lin similarity
const linSim = await wordnet.getLinSimilarity(synset1, synset2);

// Resnik similarity
const resnikSim = await wordnet.getResnikSimilarity(synset1, synset2);

// Jiang-Conrath similarity
const jcSim = await wordnet.getJiangConrathSimilarity(synset1, synset2);
```

#### **Configuration**

```typescript
const similarityPlugin = similarity({
  cacheResults: true,
  maxCacheSize: 1000,
  defaultSimilarity: 'path'
});
```

### **Translation Plugin**

Provides cross-lingual translation and mapping.

```typescript
import { translation } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [translation]);
```

#### **Methods**

```typescript
// Get translations for a synset
const translations = await wordnet.getTranslations(synsetId, 'fr');

// Get translations by word
const wordTranslations = await wordnet.getTranslationsByWord(wordId, 'fr');

// Get available languages
const languages = await wordnet.getAvailableLanguages();

// Get translation confidence
const confidence = await wordnet.getTranslationConfidence(synsetId, 'fr');

// Get translation suggestions
const suggestions = await wordnet.getTranslationSuggestions(word, 'en', 'fr');
```

#### **Configuration**

```typescript
const translationPlugin = translation({
  enableConfidence: true,
  minConfidence: 0.5,
  maxSuggestions: 10,
  cacheTranslations: true
});
```

## Custom Plugin Development

### **Basic Plugin Structure**

```typescript
class MyCustomPlugin implements Plugin {
  name = 'my-custom';
  version = '1.0.0';
  dependencies = ['relations']; // Optional
  
  private kernel: WordNetKernel;
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    this.kernel = kernel;
    // Initialize plugin
  }
  
  async destroy(): Promise<void> {
    // Cleanup plugin
  }
  
  // Custom methods
  async myCustomMethod(): Promise<any> {
    // Implementation
  }
}
```

### **Plugin with Dependencies**

```typescript
class AdvancedPlugin implements Plugin {
  name = 'advanced';
  version = '1.0.0';
  dependencies = ['relations', 'similarity'];
  
  private relationsPlugin: RelationsPlugin;
  private similarityPlugin: SimilarityPlugin;
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    this.relationsPlugin = kernel.getPlugin<RelationsPlugin>('relations');
    this.similarityPlugin = kernel.getPlugin<SimilarityPlugin>('similarity');
  }
  
  async destroy(): Promise<void> {
    // Cleanup
  }
  
  async findSimilarConcepts(synsetId: string): Promise<Synset[]> {
    const hypernyms = await this.relationsPlugin.getHypernyms(synsetId);
    const similarities = await Promise.all(
      hypernyms.map(h => this.similarityPlugin.getPathSimilarity(synsetId, h.id))
    );
    
    return hypernyms.filter((_, i) => similarities[i] > 0.5);
  }
}
```

### **Plugin with Configuration**

```typescript
interface MyPluginConfig {
  option1: string;
  option2: number;
  option3: boolean;
}

class ConfigurablePlugin implements Plugin {
  name = 'configurable';
  version = '1.0.0';
  
  private config: MyPluginConfig;
  
  constructor(config: MyPluginConfig) {
    this.config = config;
  }
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Use this.config
  }
  
  async destroy(): Promise<void> {
    // Cleanup
  }
}

// Usage
const plugin = new ConfigurablePlugin({
  option1: 'value',
  option2: 42,
  option3: true
});
```

## Plugin Management

### **Adding Plugins**

```typescript
// Add single plugin
const wordnetWithRelations = wordnet.use(relations);

// Add multiple plugins
const wordnetWithPlugins = wordnet.use(relations).use(similarity).use(translation);

// Add custom plugin
const wordnetWithCustom = wordnet.use(new MyCustomPlugin());
```

### **Checking Plugin Availability**

```typescript
// Check if plugin is loaded
if (wordnet.has('relations')) {
  const relations = wordnet.getPlugin<RelationsPlugin>('relations');
  // Use relations plugin
}

// Get all plugin names
const pluginNames = wordnet.getPlugins();
console.log('Loaded plugins:', pluginNames);
```

### **Plugin Dependencies**

```typescript
// Plugin with dependencies
class DependentPlugin implements Plugin {
  name = 'dependent';
  version = '1.0.0';
  dependencies = ['relations', 'similarity'];
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Dependencies are automatically loaded
    const relations = kernel.getPlugin<RelationsPlugin>('relations');
    const similarity = kernel.getPlugin<SimilarityPlugin>('similarity');
  }
}
```

## Testing Plugins

### **Unit Tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { relations } from 'wn-ts-core/plugins';
import { MockWordNetCore } from './mocks';

describe('Relations Plugin', () => {
  let wordnet: WordNetKernel;
  let mockCore: MockWordNetCore;

  beforeEach(async () => {
    mockCore = new MockWordNetCore();
    wordnet = new WordNetKernel(mockCore, [relations]);
    await wordnet.initialize();
  });

  afterEach(async () => {
    await wordnet.close();
  });

  it('should add relations methods', () => {
    expect(wordnet.has('relations')).toBe(true);
    expect(typeof wordnet.getHypernyms).toBe('function');
  });

  it('should get hypernyms', async () => {
    const hypernyms = await wordnet.getHypernyms('synset-1');
    expect(hypernyms).toBeDefined();
  });
});
```

### **Integration Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { relations, similarity } from 'wn-ts-core/plugins';

describe('Plugin Integration', () => {
  it('should work with multiple plugins', async () => {
    const wordnet = new WordNetKernel(mockCore, [relations, similarity]);
    await wordnet.initialize();
    
    expect(wordnet.has('relations')).toBe(true);
    expect(wordnet.has('similarity')).toBe(true);
    
    await wordnet.close();
  });
});
```

## Plugin Best Practices

### **1. Error Handling**

```typescript
class RobustPlugin implements Plugin {
  async myMethod(): Promise<any> {
    try {
      // Plugin logic
    } catch (error) {
      console.error(`Plugin ${this.name} error:`, error);
      throw error;
    }
  }
}
```

### **2. Resource Management**

```typescript
class ResourcePlugin implements Plugin {
  private resources: any[] = [];
  
  async initialize(kernel: WordNetKernel): Promise<void> {
    // Allocate resources
    this.resources.push(/* resource */);
  }
  
  async destroy(): Promise<void> {
    // Cleanup resources
    this.resources.forEach(resource => resource.cleanup());
    this.resources = [];
  }
}
```

### **3. Configuration Validation**

```typescript
class ValidatedPlugin implements Plugin {
  constructor(private config: PluginConfig) {
    this.validateConfig();
  }
  
  private validateConfig(): void {
    if (!this.config.requiredOption) {
      throw new Error('requiredOption is required');
    }
  }
}
```

## Troubleshooting

### **Common Issues**

#### **Plugin Not Found**
```typescript
// Check if plugin is loaded
if (!wordnet.has('my-plugin')) {
  throw new Error('Plugin not loaded');
}
```

#### **Dependency Not Available**
```typescript
// Check dependencies
const dependencies = ['relations', 'similarity'];
for (const dep of dependencies) {
  if (!wordnet.has(dep)) {
    throw new Error(`Dependency ${dep} not available`);
  }
}
```

## Further Reading

- **[Core API](/api/core/)** - Core library API reference
- **[Platform APIs](/api/)** - Platform-specific implementations
- **[Examples](/examples/)** - Working plugin examples

---

**Ready to build custom plugins? Check out the [Examples](/examples/) to see plugins in action! 🚀**
