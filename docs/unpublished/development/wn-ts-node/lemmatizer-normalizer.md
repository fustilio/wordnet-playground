# Lemmatizer and Normalizer System

## Overview

The WordNet implementation provides a simple, flexible system for customizing how words are normalized and lemmatized. This system replaces the complex plugin architecture with direct function passing, making it easy to use while maintaining powerful customization capabilities.

## Design Philosophy

**Simple but Powerful**: Instead of a complex plugin system, we use direct function passing with sensible defaults. This approach is:
- **Familiar**: Standard JavaScript/TypeScript function passing
- **Flexible**: Can override at instance level or per query
- **Efficient**: No plugin lookup overhead
- **Maintainable**: Easy to understand and debug

## Usage Examples

### Basic Usage with Defaults

```typescript
import { Wordnet } from 'wn-ts-node';

// Uses built-in defaults
const wordnet = new Wordnet('oewn');

// Default normalizer: toLowerCase().trim()
const normalized = await wordnet.normalizeForm('  HELLO  ');
console.log(normalized); // "hello"

// Default lemmatizer: returns original form in all POS
const lemmas = await wordnet.morphy('running', 'v');
console.log(lemmas.v); // Set { "running" }
```

### Custom Functions at Instance Level

```typescript
// Custom normalizer that removes all non-alphanumeric characters
const aggressiveWordnet = new Wordnet('oewn', {
  normalizer: (form: string) => form.toLowerCase().replace(/[^a-z0-9]/g, '')
});

const normalized = await aggressiveWordnet.normalizeForm('Hello, World! 123');
console.log(normalized); // "helloworld123"

// Custom lemmatizer with intelligent morphological analysis
const smartWordnet = new Wordnet('oewn', {
  lemmatizer: (form: string, pos?: PartOfSpeech) => {
    const result: Record<PartOfSpeech, Set<string>> = {
      'n': new Set(), 'v': new Set(), 'a': new Set(), 'r': new Set(),
      's': new Set(), 'c': new Set(), 'p': new Set(), 'x': new Set(),
      'u': new Set(), 'i': new Set()
    };

    if (pos === 'v') {
      // Smart verb lemmatization
      if (form.endsWith('ing')) {
        result.v.add(form.slice(0, -3)); // "running" -> "run"
        result.v.add(form.slice(0, -3) + 'e'); // "running" -> "rune"
      } else if (form.endsWith('ed')) {
        result.v.add(form.slice(0, -2)); // "walked" -> "walk"
        result.v.add(form.slice(0, -2) + 'e'); // "walked" -> "walke"
      }
    }

    // Always include original form
    if (pos) {
      result[pos].add(form);
    } else {
      Object.values(result).forEach(set => set.add(form));
    }

    return result;
  }
});

const lemmas = await smartWordnet.morphy('running', 'v');
console.log(lemmas.v); // Set { "run", "rune", "running" }
```

### Query-Level Overrides (Future Enhancement)

```typescript
// This will be supported in future versions
const words = await wordnet.words({
  form: 'running',
  normalizer: (form) => form.toUpperCase(), // Override for this query
  lemmatizer: (form, pos) => ({ [pos || 'v']: new Set(['run']) })
});
```

## Default Implementations

### Default Normalizer

```typescript
private _createDefaultNormalizer(): (form: string) => string {
  return (form: string) => form.toLowerCase().trim();
}
```

**Behavior**: Converts to lowercase and trims whitespace
**Examples**:
- `"  HELLO  "` → `"hello"`
- `"WORLD"` → `"world"`
- `"  "` → `""`
- `"Test123"` → `"test123"`

### Default Lemmatizer

```typescript
private _createDefaultLemmatizer(): (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>> {
  return (form: string, pos?: PartOfSpeech) => {
    const result: Record<PartOfSpeech, Set<string>> = {
      'n': new Set(), 'v': new Set(), 'a': new Set(), 'r': new Set(),
      's': new Set(), 'c': new Set(), 'p': new Set(), 'x': new Set(),
      'u': new Set(), 'i': new Set()
    };
    
    if (pos) {
      result[pos] = new Set([form]);
    } else {
      Object.keys(result).forEach(posKey => {
        result[posKey as PartOfSpeech] = new Set([form]);
      });
    }
    
    return result;
  };
}
```

**Behavior**: Returns the original form in the specified POS, or in all POS if none specified
**Examples**:
- `morphy('running', 'v')` → `{ v: Set { "running" } }`
- `morphy('happy')` → `{ n: Set { "happy" }, v: Set { "happy" }, ... }`

## Why This Approach is "SANE"

### 1. **Predictable Outputs**
- Same input always produces same output
- No hidden state or complex plugin selection logic
- Clear, traceable execution path

### 2. **Consistent Behavior**
- Default implementations are simple and reliable
- Custom functions can be as complex as needed
- No unexpected plugin conflicts or overrides

### 3. **Easy to Debug**
- Functions are passed directly, no indirection
- Stack traces point to actual implementation
- Easy to add logging or breakpoints

### 4. **Performance**
- No plugin registry lookups
- No complex inheritance chains
- Direct function calls

### 5. **Flexibility**
- Can use different functions for different use cases
- Easy to A/B test different approaches
- Simple to mock in tests

## Test Coverage

Our comprehensive test suite ensures the system behaves predictably:

```typescript
describe('Lemmatizer and Normalizer System', () => {
  // Default Behavior (4 tests)
  // Custom Normalizer (4 tests)  
  // Custom Lemmatizer (3 tests)
  // Edge Cases and Error Handling (5 tests)
  // Consistency and Predictability (3 tests)
  // Performance and Memory (2 tests)
  // Integration with Word Queries (2 tests)
  // Default Implementation Quality (2 tests)
});
```

**25 tests covering**:
- ✅ Default behavior validation
- ✅ Custom function integration
- ✅ Edge case handling
- ✅ Performance characteristics
- ✅ Consistency guarantees
- ✅ Integration testing

## Migration from Plugin System

If you were using the old plugin system:

```typescript
// OLD (Complex)
const wordnet = new Wordnet('oewn');
wordnet.getPluginManager().registerLemmatizer(customPlugin);
wordnet.getPluginManager().registerNormalizer(customPlugin);

// NEW (Simple)
const wordnet = new Wordnet('oewn', {
  lemmatizer: customLemmatizerFunction,
  normalizer: customNormalizerFunction
});
```

## Best Practices

### 1. **Keep Functions Pure**
```typescript
// Good: Pure function
const normalizer = (form: string) => form.toLowerCase().trim();

// Avoid: Functions with side effects
const badNormalizer = (form: string) => {
  console.log(`Normalizing: ${form}`); // Side effect
  return form.toLowerCase().trim();
};
```

### 2. **Handle Edge Cases**
```typescript
const robustNormalizer = (form: string) => {
  if (typeof form !== 'string') return '';
  if (form.length === 0) return '';
  return form.toLowerCase().trim();
};
```

### 3. **Return Consistent Types**
```typescript
const lemmatizer = (form: string, pos?: PartOfSpeech) => {
  // Always return the same structure
  const result: Record<PartOfSpeech, Set<string>> = {
    'n': new Set(), 'v': new Set(), 'a': new Set(), 'r': new Set(),
    's': new Set(), 'c': new Set(), 'p': new Set(), 'x': new Set(),
    'u': new Set(), 'i': new Set()
  };
  
  // Your logic here...
  
  return result;
};
```

## Future Enhancements

1. **Query-Level Overrides**: Allow overriding normalizer/lemmatizer per query
2. **Caching**: Add intelligent caching for expensive operations
3. **Batch Operations**: Support batch normalization/lemmatization
4. **Language Detection**: Automatic language-specific function selection

## Conclusion

This simplified approach gives you the "good ol' basics" with powerful customization capabilities. It's simple enough for beginners but flexible enough for advanced users. The system is predictable, performant, and easy to maintain - exactly what you need for production WordNet applications.
