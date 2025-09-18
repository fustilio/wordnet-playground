# Plugin System Type Extension Patterns

This guide covers the most common and effective patterns for extending types in plugin systems, with examples specific to our WordNet plugin architecture.

## 1. Intersection Types (Our Current Pattern)

**Best for**: Static plugin loading with compile-time type safety

```typescript
// Core interface
interface WordNetCore {
  query(sql: string, params?: any[]): Promise<any[]>;
  getWord(form: string): Promise<any[]>;
  // ... other core methods
}

// Plugin method signature
type PluginMethod<TCore, TArgs extends any[], TReturn> = 
  (core: TCore, ...args: TArgs) => TReturn;

// Plugin interface
interface Plugin<TMethods = Record<string, PluginMethod>> {
  name: string;
  methods: TMethods;
}

// Extended WordNet with plugin methods
type WordNetWithPlugins<TPlugins extends readonly Plugin[]> = 
  WordNetCore & {
    // Plugin methods merged from all plugins
    [K in TPlugins[number] extends infer P 
      ? P extends Plugin 
        ? keyof P['methods'] 
        : never 
      : never]: TPlugins[number] extends infer P
        ? P extends Plugin
          ? P['methods'][K] extends PluginMethod<infer _TCore, infer TArgs, infer TReturn>
            ? (...args: TArgs) => TReturn
            : never
          : never
        : never;
  };
```

**Advantages:**
- ✅ Full compile-time type safety
- ✅ IntelliSense support
- ✅ No runtime overhead
- ✅ Type errors caught at compile time

**Usage:**
```typescript
const wordnet = createWordNet({
  core: mockCore,
  plugins: [relations, similarity, translation] as const
});

// TypeScript knows all methods are available
const hypernyms = await wordnet.getHypernyms('synset-id');
const sim = await wordnet.getPathSimilarity('a', 'b');
```

## 2. Module Augmentation

**Best for**: Extending existing interfaces globally

```typescript
// Extend the core interface globally
declare module 'wn-ts-core/plugins' {
  interface WordNetCore {
    getPathSimilarity(synset1: string, synset2: string): Promise<number>;
    getWuPalmerSimilarity(synset1: string, synset2: string): Promise<number>;
  }
}

// Now all WordNetCore instances have these methods
const core: WordNetCore = getCore();
await core.getPathSimilarity('a', 'b'); // ✅ TypeScript knows this exists
```

**Advantages:**
- ✅ Global type extensions
- ✅ Works with existing code
- ✅ Simple to implement

**Disadvantages:**
- ❌ Global namespace pollution
- ❌ Can cause conflicts
- ❌ Hard to track where extensions come from

## 3. Conditional Types with Mapped Types

**Best for**: Dynamic plugin loading with type safety

```typescript
// Conditional type for plugin methods
type PluginMethods<T> = T extends Plugin<infer M> ? M : never;

// Extended WordNet based on plugin type
type ExtendedWordNet<T extends Plugin> = 
  WordNetCore & {
    [K in keyof PluginMethods<T>]: PluginMethods<T>[K] extends PluginMethod<
      infer _TCore, 
      infer TArgs, 
      infer TReturn
    > ? (...args: TArgs) => TReturn : never;
  };

// Usage with single plugin
const wordnet: ExtendedWordNet<typeof relations> = createWordNet({
  core: mockCore,
  plugins: [relations]
});
```

## 4. Generic Constraints with Type Parameters

**Best for**: Plugin factories and advanced composition

```typescript
// Generic plugin factory
function createPlugin<TMethods extends Record<string, PluginMethod>>(
  name: string,
  methods: TMethods
): Plugin<TMethods> {
  return { name, methods };
}

// Type-safe plugin creation
const customPlugin = createPlugin('analytics', {
  trackEvent: async (core: WordNetCore, event: string, data: any) => {
    // Implementation
  },
  getAnalytics: async (core: WordNetCore, eventType?: string) => {
    // Implementation
  }
});

// TypeScript infers the exact method signatures
type CustomPluginMethods = typeof customPlugin['methods'];
// ^? { trackEvent: (core: WordNetCore, event: string, data: any) => Promise<void>; ... }
```

## 5. Discriminated Unions for Plugin Variants

**Best for**: Plugins with different configurations

```typescript
// Plugin configuration variants
type PluginConfig = 
  | { type: 'relations'; options: { includeHyponyms: boolean } }
  | { type: 'similarity'; options: { algorithm: 'path' | 'wupalmer' } }
  | { type: 'translation'; options: { targetLanguage: string } };

// Type-safe plugin creation based on config
function createTypedPlugin(config: PluginConfig) {
  switch (config.type) {
    case 'relations':
      return {
        name: 'relations',
        methods: {
          getHypernyms: async (core: WordNetCore, synsetId: string) => {
            // Implementation with config.options.includeHyponyms
          }
        }
      } as const;
    case 'similarity':
      return {
        name: 'similarity',
        methods: {
          getSimilarity: async (core: WordNetCore, synset1: string, synset2: string) => {
            // Implementation with config.options.algorithm
          }
        }
      } as const;
    // ... other cases
  }
}
```

## 6. Template Literal Types for Method Names

**Best for**: Plugin methods with consistent naming patterns

```typescript
// Template literal for method names
type PluginMethodName<T extends string> = `get${Capitalize<T>}`;

// Plugin with generated method names
type RelationsPlugin = {
  name: 'relations';
  methods: {
    [K in 'hypernyms' | 'hyponyms' | 'meronyms' as PluginMethodName<K>]: 
      (core: WordNetCore, synsetId: string) => Promise<any[]>;
  };
};

// Results in:
// {
//   name: 'relations';
//   methods: {
//     getHypernyms: (core: WordNetCore, synsetId: string) => Promise<any[]>;
//     getHyponyms: (core: WordNetCore, synsetId: string) => Promise<any[]>;
//     getMeronyms: (core: WordNetCore, synsetId: string) => Promise<any[]>;
//   };
// }
```

## 7. Branded Types for Plugin Identification

**Best for**: Type-safe plugin identification and validation

```typescript
// Branded type for plugin names
type PluginName = string & { readonly __brand: 'PluginName' };

// Plugin with branded name
interface BrandedPlugin<TMethods = Record<string, PluginMethod>> {
  name: PluginName;
  methods: TMethods;
}

// Type-safe plugin name creation
function createPluginName(name: string): PluginName {
  return name as PluginName;
}

// Usage
const relationsPlugin: BrandedPlugin = {
  name: createPluginName('relations'),
  methods: { /* ... */ }
};
```

## 8. Recursive Types for Plugin Dependencies

**Best for**: Plugins with dependencies on other plugins

```typescript
// Plugin dependency type
type PluginDependency<T extends Plugin> = {
  plugin: T;
  required: boolean;
  version?: string;
};

// Plugin with dependencies
interface PluginWithDependencies<TMethods, TDeps extends readonly PluginDependency<any>[]> {
  name: string;
  methods: TMethods;
  dependencies: TDeps;
}

// Type-safe dependency resolution
type ResolveDependencies<T extends readonly PluginDependency<any>[]> = 
  T extends readonly PluginDependency<infer P>[] ? P : never;

// Usage
const advancedPlugin: PluginWithDependencies<
  { getAdvancedSimilarity: PluginMethod<WordNetCore, [string, string], Promise<number>> },
  [PluginDependency<typeof similarity>]
> = {
  name: 'advanced-similarity',
  methods: {
    getAdvancedSimilarity: async (core, synset1, synset2) => {
      // Implementation that depends on similarity plugin
    }
  },
  dependencies: [{ plugin: similarity, required: true }]
};
```

## Best Practices

### 1. Use `as const` for Plugin Arrays
```typescript
// ✅ Good - preserves literal types
const plugins = [relations, similarity, translation] as const;

// ❌ Bad - loses literal types
const plugins = [relations, similarity, translation];
```

### 2. Prefer Intersection Types for Static Loading
```typescript
// ✅ Good - compile-time type safety
const wordnet = createWordNet({ core, plugins: [relations] });

// ❌ Avoid - runtime type checking
const wordnet = createWordNet({ core });
if (wordnet.hasPlugin('relations')) {
  await wordnet.getHypernyms('id'); // TypeScript doesn't know this exists
}
```

### 3. Use Generic Constraints for Plugin Factories
```typescript
// ✅ Good - type-safe plugin creation
function createPlugin<T extends Record<string, PluginMethod>>(
  name: string,
  methods: T
): Plugin<T> {
  return { name, methods };
}
```

### 4. Leverage Type Inference
```typescript
// ✅ Good - let TypeScript infer types
const wordnet = createWordNet({ core, plugins: [relations, similarity] });
// TypeScript automatically knows the available methods

// ❌ Avoid - explicit typing when not needed
const wordnet: WordNetWithPlugins<[typeof relations, typeof similarity]> = 
  createWordNet({ core, plugins: [relations, similarity] });
```

## Common Pitfalls

### 1. Forgetting `as const`
```typescript
// ❌ Problem - loses literal types
const plugins = [relations, similarity];
const wordnet = createWordNet({ core, plugins });
// TypeScript sees plugins as Plugin[] instead of [typeof relations, typeof similarity]

// ✅ Solution
const plugins = [relations, similarity] as const;
```

### 2. Mixing Static and Dynamic Patterns
```typescript
// ❌ Problem - inconsistent patterns
let wordnet = createWordNet({ core });
wordnet = wordnet.use(relations); // Dynamic pattern
const result = await wordnet.getHypernyms('id'); // May not work with static types

// ✅ Solution - choose one pattern
const wordnet = createWordNet({ core, plugins: [relations] as const });
```

### 3. Not Using Proper Generic Constraints
```typescript
// ❌ Problem - too permissive
interface Plugin<T = any> {
  name: string;
  methods: T;
}

// ✅ Solution - proper constraints
interface Plugin<T extends Record<string, PluginMethod> = Record<string, PluginMethod>> {
  name: string;
  methods: T;
}
```

## Conclusion

Our WordNet plugin system uses **Intersection Types** (Pattern #1) because it provides:

- **Maximum type safety** at compile time
- **Zero runtime overhead** for type checking
- **Excellent IntelliSense** support
- **Simple mental model** - plugins add methods to the core

This pattern is perfect for our use case where plugins are loaded statically and we want the strongest possible type safety. The TypeScript compiler does all the heavy lifting of merging the plugin methods into the core interface, giving us a seamless developer experience.

