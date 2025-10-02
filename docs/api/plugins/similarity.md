---
title: Similarity Plugin API
description: Complete API reference for the WordNet similarity plugin
---

# Similarity Plugin API

Complete API reference for the WordNet similarity plugin, providing semantic similarity calculations and metrics.

## Quick Start

```typescript
import { similarity } from 'wn-ts-core/plugins';

const wordnet = new WordNetKernel(core, [similarity]);

// Calculate path similarity
const sim = await wordnet.getPathSimilarity(synset1, synset2);
```

## API Reference

### **Path Similarity**

```typescript
// Calculate path similarity
const similarity = await wordnet.getPathSimilarity(synset1, synset2);

// Path similarity returns a value between 0 and 1
// 1 = identical, 0 = no similarity
```

### **Wu-Palmer Similarity**

```typescript
// Calculate Wu-Palmer similarity
const similarity = await wordnet.getWuPalmerSimilarity(synset1, synset2);

// Wu-Palmer similarity considers the depth of the LCS
// and the depth of the two synsets
```

### **Leacock-Chodorow Similarity**

```typescript
// Calculate Leacock-Chodorow similarity
const similarity = await wordnet.getLeacockChodorowSimilarity(synset1, synset2);

// Leacock-Chodorow similarity uses the shortest path
// and the maximum depth in the taxonomy
```

### **Jaccard Similarity**

```typescript
// Calculate Jaccard similarity
const similarity = await wordnet.getJaccardSimilarity(synset1, synset2);

// Jaccard similarity measures the overlap between
// the sets of hypernyms of the two synsets
```

### **Lin Similarity**

```typescript
// Calculate Lin similarity
const similarity = await wordnet.getLinSimilarity(synset1, synset2);

// Lin similarity uses information content
// and the LCS (Lowest Common Subsumer)
```

### **Resnik Similarity**

```typescript
// Calculate Resnik similarity
const similarity = await wordnet.getResnikSimilarity(synset1, synset2);

// Resnik similarity is based on the information content
// of the LCS (Lowest Common Subsumer)
```

### **Jiang-Conrath Similarity**

```typescript
// Calculate Jiang-Conrath similarity
const similarity = await wordnet.getJiangConrathSimilarity(synset1, synset2);

// Jiang-Conrath similarity combines information content
// of the LCS and the two synsets
```

## Configuration Options

```typescript
const similarityPlugin = similarity({
  cacheResults: true,     // Cache similarity calculations
  maxCacheSize: 1000,     // Maximum cache size
  defaultSimilarity: 'path', // Default similarity method
  enableVerbose: false    // Enable verbose logging
});
```

## Similarity Metrics Comparison

| Metric | Range | Description | Use Case |
|--------|-------|-------------|----------|
| Path | 0-1 | Shortest path between synsets | General similarity |
| Wu-Palmer | 0-1 | Depth of LCS relative to synsets | Hierarchical similarity |
| Leacock-Chodorow | 0-∞ | Log of shortest path | Taxonomy-based similarity |
| Jaccard | 0-1 | Overlap of hypernym sets | Set-based similarity |
| Lin | 0-1 | Information content of LCS | Information-theoretic |
| Resnik | 0-∞ | Information content of LCS | Information-theoretic |
| Jiang-Conrath | 0-∞ | Combined information content | Information-theoretic |

## Usage Examples

### **Basic Similarity Calculation**

```typescript
// Calculate similarity between two synsets
const synset1 = 'synset-car-1';
const synset2 = 'synset-vehicle-1';

const pathSim = await wordnet.getPathSimilarity(synset1, synset2);
console.log('Path similarity:', pathSim);

const wupSim = await wordnet.getWuPalmerSimilarity(synset1, synset2);
console.log('Wu-Palmer similarity:', wupSim);
```

### **Similarity Comparison**

```typescript
// Compare multiple similarity metrics
const synset1 = 'synset-car-1';
const synset2 = 'synset-truck-1';

const similarities = {
  path: await wordnet.getPathSimilarity(synset1, synset2),
  wuPalmer: await wordnet.getWuPalmerSimilarity(synset1, synset2),
  leacockChodorow: await wordnet.getLeacockChodorowSimilarity(synset1, synset2),
  jaccard: await wordnet.getJaccardSimilarity(synset1, synset2)
};

console.log('Similarities:', similarities);
```

### **Find Most Similar Synsets**

```typescript
// Find the most similar synsets to a given synset
async function findMostSimilar(targetSynset: string, candidateSynsets: string[]) {
  const similarities = await Promise.all(
    candidateSynsets.map(async (candidate) => {
      const similarity = await wordnet.getPathSimilarity(targetSynset, candidate);
      return { synset: candidate, similarity };
    })
  );
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 most similar
}

const mostSimilar = await findMostSimilar('synset-car-1', [
  'synset-truck-1',
  'synset-bus-1',
  'synset-bicycle-1',
  'synset-airplane-1'
]);
```

### **Similarity Threshold Filtering**

```typescript
// Filter synsets by similarity threshold
async function filterBySimilarity(
  targetSynset: string, 
  candidateSynsets: string[], 
  threshold: number = 0.5
) {
  const similarities = await Promise.all(
    candidateSynsets.map(async (candidate) => {
      const similarity = await wordnet.getPathSimilarity(targetSynset, candidate);
      return { synset: candidate, similarity };
    })
  );
  
  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

const similarSynsets = await filterBySimilarity(
  'synset-car-1', 
  candidateSynsets, 
  0.3
);
```

## Testing

### **Unit Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WordNetKernel } from 'wn-ts-core';
import { similarity } from 'wn-ts-core/plugins';

describe('Similarity Plugin', () => {
  let wordnet: WordNetKernel;
  
  beforeEach(async () => {
    wordnet = new WordNetKernel(mockCore, [similarity]);
    await wordnet.initialize();
  });
  
  it('should calculate path similarity', async () => {
    const sim = await wordnet.getPathSimilarity('synset-1', 'synset-2');
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
  
  it('should calculate Wu-Palmer similarity', async () => {
    const sim = await wordnet.getWuPalmerSimilarity('synset-1', 'synset-2');
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});
```

### **Performance Tests**

```typescript
import { describe, it, expect } from 'vitest';

describe('Similarity Performance', () => {
  it('should cache similarity calculations', async () => {
    const start = performance.now();
    
    // First calculation
    await wordnet.getPathSimilarity('synset-1', 'synset-2');
    
    // Second calculation (should be cached)
    await wordnet.getPathSimilarity('synset-1', 'synset-2');
    
    const end = performance.now();
    const duration = end - start;
    
    // Should be fast due to caching
    expect(duration).toBeLessThan(100);
  });
});
```

## Further Reading

- **[Plugin System API](/api/plugins/)** - Complete plugin system reference
- **[Core API](/api/core/)** - Core library API reference
- **[Examples](/examples/)** - Working examples

---

**Ready to calculate semantic similarity? Check out the [Examples](/examples/) to see it in action! 🚀**
