# Similarity Methods with Lexicon Context

This example demonstrates the fixed similarity methods that properly handle lexicon context and support cross-lingual comparisons.

## Overview

The similarity methods now properly handle lexicon context, supporting both same-lexicon and cross-lingual comparisons with appropriate error handling.

## Code Examples

### 1. Same Lexicon Comparison

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

async function demonstrateSimilarityMethods() {
  // Initialize WordNet with multiple lexicons
  const wordnet = new NodeWordNetKernel(['omw-en', 'omw-fr'], {
    filename: 'wordnet.db'
  });
  
  await wordnet.initialize();

  // Same lexicon comparison (works as before)
  const synset1 = await wordnet.synset('en-n-0001'); // English synset
  const synset2 = await wordnet.synset('en-n-0002'); // English synset
  
  // These work with both synset objects and IDs
  const pathSim = await wordnet.getPathSimilarity(synset1, synset2);
  const wupSim = await wordnet.getWuPalmerSimilarity(synset1.id, synset2.id);
  
  console.log(`Path Similarity: ${pathSim.toFixed(3)}`);
  console.log(`Wu-Palmer Similarity: ${wupSim.toFixed(3)}`);
}
```

### 2. Cross-Lingual Comparison

```typescript
// Cross-lingual comparison using CILI (optional)
const enSynset = await wordnet.synset('en-n-0001'); // English synset
const frSynset = await wordnet.synset('fr-n-0001'); // French synset

console.log(`English Synset: ${enSynset.id} (${enSynset.lexicon}) - ILI: ${enSynset.ili || 'none'}`);
console.log(`French Synset: ${frSynset.id} (${frSynset.lexicon}) - ILI: ${frSynset.ili || 'none'}`);

// Use cross-lingual similarity method (requires CILI for multilingual operations)
const crossLingualSim = await wordnet.getCrossLingualSimilarity(enSynset, frSynset);
console.log(`Cross-Lingual Similarity: ${crossLingualSim.toFixed(3)}`);
```

### 3. Error Handling

```typescript
try {
  const enSynset = await wordnet.synset('en-n-0001');
  const frSynset = await wordnet.synset('fr-n-0001');
  
  // This will throw an error because synsets are from different lexicons
  const invalidSim = await wordnet.getPathSimilarity(enSynset, frSynset);
} catch (error) {
  console.log(`Caught expected error: ${error.message}`);
}
```

### 4. Best Similarity Method

```typescript
// This method tries multiple similarity metrics and returns the best one
const bestSim = await wordnet.getBestSimilarity(synset1, synset2);
console.log(`Best Similarity: ${bestSim.toFixed(3)}`);
```

### 5. Finding Most Similar Synsets

```typescript
const synsetId = 'en-n-0001';
const similarSynsets = await wordnet.findMostSimilar(synsetId, 5);

console.log(`Most similar to ${synsetId}:`);
similarSynsets.forEach((result, index) => {
  console.log(`${index + 1}. ${result.id} (similarity: ${result.similarity.toFixed(3)})`);
});
```

### 6. Performance Considerations

```typescript
// Method 1: Resolve synsets once and reuse (more efficient)
const synsetObjects = await Promise.all(
  synsets.map(s => wordnet.synset(s.id))
);

const comparisons = [];
for (let i = 0; i < synsetObjects.length; i++) {
  for (let j = i + 1; j < synsetObjects.length; j++) {
    const sim = await wordnet.getPathSimilarity(synsetObjects[i], synsetObjects[j]);
    comparisons.push(sim);
  }
}

// Method 2: Use IDs (less efficient due to repeated resolution)
for (let i = 0; i < synsets.length; i++) {
  for (let j = i + 1; j < synsets.length; j++) {
    const sim = await wordnet.getPathSimilarity(synsets[i].id, synsets[j].id);
    comparisons.push(sim);
  }
}
```

## Key Features

- **Lexicon-Aware**: Properly handles different lexicons and cross-lingual comparisons
- **Type-Safe**: Full TypeScript support with proper typing
- **Error Handling**: Graceful handling of incompatible lexicons and missing data
- **Performance Optimized**: Efficient synset resolution and comparison
- **CILI Support**: Optional support for cross-lingual index mappings

## Best Practices

1. **Use synset objects when possible** for better performance
2. **Use `getCrossLingualSimilarity()`** for different lexicons
3. **Handle errors gracefully** for missing ILI mappings
4. **Validate lexicon compatibility** before comparison
5. **Resolve synsets once** and reuse objects for multiple comparisons

## Error Scenarios

- **Incompatible Lexicons**: Use cross-lingual methods for different lexicons
- **Missing ILI Mappings**: CILI is optional but required for translation plugin
- **Invalid Synset IDs**: Proper error handling for non-existent synsets
- **Performance Issues**: Use object reuse for multiple comparisons
