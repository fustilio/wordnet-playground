# Similarity Methods Lexicon Context Fix

## Problem

The original similarity methods had a critical flaw: they only accepted synset IDs without specifying which lexicon the synsets belonged to. This caused several issues:

1. **Synset IDs are not globally unique** - they're only unique within a specific lexicon
2. **Cross-lingual comparisons were impossible** - you couldn't compare synsets from different lexicons
3. **Ambiguous comparisons** - `synset1` and `synset2` could be from completely different lexicons, making similarity meaningless
4. **No validation** - the system didn't check if synsets were compatible for comparison

## Solution

### 1. Updated Similarity Plugin Methods

The similarity plugin now:
- **Accepts both synset objects and synset IDs** - automatically resolves IDs to objects
- **Validates lexicon compatibility** - ensures synsets are from the same lexicon for direct comparison
- **Provides cross-lingual methods** - uses ILI (Inter-Lingual Index) for cross-lingual comparisons
- **Includes proper error messages** - guides users to the correct methods

### 2. New Method Signatures

```typescript
// Direct similarity (same lexicon only)
getPathSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>
getWuPalmerSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>
getLeacockChodorowSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>
getJaccardSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>
getBestSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>

// Cross-lingual similarity (different lexicons)
getCrossLingualSimilarity(synset1: string | Synset, synset2: string | Synset): Promise<number>

// Utility methods
findMostSimilar(synsetId: string, limit?: number): Promise<Array<{id: string; similarity: number}>>
```

### 3. Validation Logic

The system now includes proper validation:

```typescript
function _checkIfLexiconCompatible(synset1: Synset, synset2: Synset): void {
  if (synset1.lexicon !== synset2.lexicon) {
    throw new WnError(
      `Synsets must be from the same lexicon for direct similarity comparison. ` +
      `Synset1: ${synset1.id} (${synset1.lexicon}), Synset2: ${synset2.id} (${synset2.lexicon}). ` +
      `Use getCrossLingualSimilarity() for cross-lingual comparisons.`
    );
  }
}
```

### 4. Cross-Lingual Similarity

For comparing synsets across different lexicons, the system can use **CILI (Conceptual Interlingual Index)**, which is optional but required for the translation plugin:

1. **CILI is optional** - English-only users don't need CILI for same-lexicon similarity
2. **CILI required for translation plugin** - multilingual functionality requires CILI installation
3. **Checks for ILI mappings** - both synsets must have ILI identifiers from CILI for cross-lingual operations
4. **Handles identical concepts** - returns 1.0 if synsets have the same ILI
5. **Finds comparable synsets** - looks for synsets with the same ILI in the same lexicon
6. **Performs comparison** - uses regular similarity methods on comparable synsets

## Usage Examples

### Same Lexicon Comparison

```typescript
// These work the same as before
const similarity1 = await wordnet.getPathSimilarity('en-n-0001', 'en-n-0002');
const similarity2 = await wordnet.getPathSimilarity(synset1, synset2);
```

### Cross-Lingual Comparison

```typescript
// Compare synsets from different lexicons using CILI
// Note: CILI is optional but required for cross-lingual operations
const crossLingualSim = await wordnet.getCrossLingualSimilarity(
  'en-n-0001',  // English synset
  'fr-n-0001'   // French synset
);
```

### Error Handling

```typescript
try {
  const similarity = await wordnet.getPathSimilarity('en-n-0001', 'fr-n-0001');
} catch (error) {
  // Error: Synsets must be from the same lexicon for direct similarity comparison.
  // Synset1: en-n-0001 (omw-en), Synset2: fr-n-0001 (omw-fr).
  // Use getCrossLingualSimilarity() for cross-lingual comparisons.
}

try {
  const crossLingualSim = await wordnet.getCrossLingualSimilarity('en-n-0001', 'fr-n-0001');
} catch (error) {
  // Error: Cross-lingual similarity requires CILI to be installed and ILI mappings
  // This means CILI is not installed or synsets don't have ILI mappings
  // For English-only similarity, use same-lexicon methods instead
}
```

## Impact on Other Methods

This fix also affects other methods that compare synsets:

- **Relation methods** - should also validate lexicon compatibility
- **Translation methods** - already use ILI for cross-lingual operations
- **Query methods** - may need similar validation

## Migration Guide

### For Users

1. **No breaking changes** - existing code continues to work
2. **New capabilities** - can now do cross-lingual comparisons
3. **Better error messages** - clearer guidance when things go wrong

### For Developers

1. **Update method calls** - use `getCrossLingualSimilarity()` for cross-lingual comparisons
2. **Handle errors** - catch `WnError` for lexicon compatibility issues
3. **Consider ILI mappings** - ensure synsets have ILI identifiers for cross-lingual operations

## Future Improvements

1. **Implement Jaccard similarity** - currently a placeholder
2. **Add more cross-lingual metrics** - beyond path similarity
3. **Optimize ILI lookups** - cache frequently used mappings
4. **Add batch operations** - compare multiple synsets at once
5. **Extend to other plugins** - apply similar validation to relations, etc.

## Technical Details

### Files Modified

- `wn-ts-core/src/plugins/similarity/index.ts` - Main similarity plugin
- `wn-ts-core/src/plugins/similarity/path-similarity.ts` - Path similarity with validation
- `wn-ts-core/src/plugins/similarity/wu-palmer.ts` - Wu-Palmer similarity with validation
- `wn-ts-node/src/wordnet-kernel.ts` - Node.js kernel wrapper

### Type Safety

All methods maintain full TypeScript type safety while supporting both string IDs and synset objects.

### Performance

- **Minimal overhead** - ID resolution only happens when needed
- **Caching friendly** - synset objects can be cached and reused
- **Error early** - validation happens before expensive operations
