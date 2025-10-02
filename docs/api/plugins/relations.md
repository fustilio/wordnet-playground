---
title: Relations Plugin API
description: Complete API reference for the WordNet relations plugin
---

# Relations Plugin API

Complete API reference for the WordNet relations plugin, providing word relationship queries and navigation.

## Quick Start

```typescript
import { relations } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [relations]);

// Get hypernyms
const hypernyms = await wordnet.getHypernyms(synsetId);

// Get hyponyms
const hyponyms = await wordnet.getHyponyms(synsetId);
```

## API Reference

### **Hypernyms (More General Concepts)**

```typescript
// Get direct hypernyms
const hypernyms = await wordnet.getHypernyms(synsetId);

// Get hypernyms with depth
const hypernyms = await wordnet.getHypernyms(synsetId, { depth: 3 });

// Get all hypernyms (transitive closure)
const allHypernyms = await wordnet.getHypernyms(synsetId, { depth: -1 });
```

### **Hyponyms (More Specific Concepts)**

```typescript
// Get direct hyponyms
const hyponyms = await wordnet.getHyponyms(synsetId);

// Get hyponyms with depth
const hyponyms = await wordnet.getHyponyms(synsetId, { depth: 2 });

// Get all hyponyms (transitive closure)
const allHyponyms = await wordnet.getHyponyms(synsetId, { depth: -1 });
```

### **Meronyms (Part-of Relationships)**

```typescript
// Get meronyms
const meronyms = await wordnet.getMeronyms(synsetId);

// Get specific meronym types
const memberMeronyms = await wordnet.getMeronyms(synsetId, { type: 'member' });
const partMeronyms = await wordnet.getMeronyms(synsetId, { type: 'part' });
const substanceMeronyms = await wordnet.getMeronyms(synsetId, { type: 'substance' });
```

### **Holonyms (Contains Relationships)**

```typescript
// Get holonyms
const holonyms = await wordnet.getHolonyms(synsetId);

// Get specific holonym types
const memberHolonyms = await wordnet.getHolonyms(synsetId, { type: 'member' });
const partHolonyms = await wordnet.getHolonyms(synsetId, { type: 'part' });
const substanceHolonyms = await wordnet.getHolonyms(synsetId, { type: 'substance' });
```

### **Antonyms (Opposite Meanings)**

```typescript
// Get antonyms
const antonyms = await wordnet.getAntonyms(synsetId);

// Get antonyms for specific word
const wordAntonyms = await wordnet.getAntonyms(synsetId, { wordId: wordId });
```

### **All Relations**

```typescript
// Get all relations
const allRelations = await wordnet.getAllRelations(synsetId);

// Get relations by type
const relations = await wordnet.getRelations(synsetId, 'hypernym');

// Get multiple relation types
const relations = await wordnet.getRelations(synsetId, ['hypernym', 'hyponym']);
```

## Configuration Options

```typescript
const relationsPlugin = relations({
  maxDepth: 10,           // Maximum traversal depth
  includeIndirect: true,  // Include indirect relations
  cacheResults: true,     // Cache query results
  maxCacheSize: 1000      // Maximum cache size
});
```

## Relation Types

| Type | Description | Example |
|------|-------------|---------|
| `hypernym` | More general concept | car → vehicle |
| `hyponym` | More specific concept | vehicle → car |
| `meronym` | Part of | car → wheel |
| `holonym` | Contains | wheel → car |
| `antonym` | Opposite meaning | hot → cold |
| `similar` | Similar meaning | car → automobile |
| `causes` | Causes | rain → wet |
| `entails` | Entails | snore → sleep |

## Usage Examples

### **Word Hierarchy Navigation**

```typescript
// Navigate up the hierarchy
const hypernyms = await wordnet.getHypernyms(synsetId);
console.log('More general concepts:', hypernyms);

// Navigate down the hierarchy
const hyponyms = await wordnet.getHyponyms(synsetId);
console.log('More specific concepts:', hyponyms);
```

### **Part-Whole Relationships**

```typescript
// Find parts of a concept
const parts = await wordnet.getMeronyms(synsetId);
console.log('Parts:', parts);

// Find what contains a concept
const wholes = await wordnet.getHolonyms(synsetId);
console.log('Contained in:', wholes);
```

### **Opposite Meanings**

```typescript
// Find antonyms
const opposites = await wordnet.getAntonyms(synsetId);
console.log('Opposite meanings:', opposites);
```

### **Complete Relationship Map**

```typescript
// Get all relationships
const allRelations = await wordnet.getAllRelations(synsetId);

// Group by type
const relationsByType = allRelations.reduce((acc, rel) => {
  if (!acc[rel.type]) acc[rel.type] = [];
  acc[rel.type].push(rel);
  return acc;
}, {});

console.log('Relations by type:', relationsByType);
```

## Testing

### **Unit Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { relations } from 'wn-ts-core/plugins';

describe('Relations Plugin', () => {
  let wordnet: WordNetKernel;
  
  beforeEach(async () => {
    wordnet = new WordNetKernel(mockCore, [relations]);
    await wordnet.initialize();
  });
  
  it('should get hypernyms', async () => {
    const hypernyms = await wordnet.getHypernyms('synset-1');
    expect(hypernyms).toBeDefined();
    expect(Array.isArray(hypernyms)).toBe(true);
  });
  
  it('should get hyponyms', async () => {
    const hyponyms = await wordnet.getHyponyms('synset-1');
    expect(hyponyms).toBeDefined();
    expect(Array.isArray(hyponyms)).toBe(true);
  });
});
```

## Further Reading

- **[Plugin System API](/api/plugins/)** - Complete plugin system reference
- **[Core API](/api/core/)** - Core library API reference
- **[Examples](/examples/)** - Working examples

---

**Ready to explore word relationships? Check out the [Examples](/examples/) to see it in action! 🚀**
