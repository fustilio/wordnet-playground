---
title: Relations Plugin API
description: Complete API reference for the WordNet relations plugin
---

# Relations Plugin API

Complete API reference for the WordNet relations plugin, providing word relationship queries and navigation.

## Quick Start

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';
import { relations } from 'wn-ts-core/plugins';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.loadPlugin(relations);

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

// Get hypernyms for specific lexicon
const hypernyms = await wordnet.getHypernyms(synsetId, 'oewn:2024');
```

### **Hyponyms (More Specific Concepts)**

```typescript
// Get direct hyponyms
const hyponyms = await wordnet.getHyponyms(synsetId);

// Get hyponyms for specific lexicon
const hyponyms = await wordnet.getHyponyms(synsetId, 'oewn:2024');
```

### **Meronyms (Part-of Relationships)**

```typescript
// Get meronyms (all types: part, member, substance)
const meronyms = await wordnet.getMeronyms(synsetId);

// Get meronyms for specific lexicon
const meronyms = await wordnet.getMeronyms(synsetId, 'oewn:2024');
```

### **Holonyms (Contains Relationships)**

```typescript
// Get holonyms (all types: part, member, substance)
const holonyms = await wordnet.getHolonyms(synsetId);

// Get holonyms for specific lexicon
const holonyms = await wordnet.getHolonyms(synsetId, 'oewn:2024');
```

### **Similar-To Relationships**

```typescript
// Get similar-to relations (adjectives)
const similar = await wordnet.getSimilarTos(synsetId);
const similar = await wordnet.getSimilarTos(synsetId, 'oewn:2024');
```

### **Entailments**

```typescript
// Get entailments (verbs)
const entailments = await wordnet.getEntailments(synsetId);
const entailments = await wordnet.getEntailments(synsetId, 'oewn:2024');
```

### **Custom Relation Types**

```typescript
// Get relations by type
const relations = await wordnet.getRelationsByType(synsetId, 'hypernym');
const relations = await wordnet.getRelationsByType(synsetId, 'hypernym', 'oewn:2024');
```

### **All Relations**

```typescript
// Get all relations
const allRelations = await wordnet.getAllRelations(synsetId);
const allRelations = await wordnet.getAllRelations(synsetId, 'oewn:2024');

// Get relation types available for a synset
const types = await wordnet.getRelationTypes(synsetId);

// Get relation statistics
const stats = await wordnet.getRelationStats(synsetId);
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
