# Kysely Typing Example

This example demonstrates proper Kysely typing in the relations plugin, showing how Kysely provides full type safety for database queries and eliminates the need for 'any' types.

## Code Example

```typescript
import { relations } from '../src/plugins/relations.js';
import type { WordNetKernel } from '../src/wordnet-kernel.js';

// Example function that demonstrates proper typing
async function demonstrateKyselyTyping(kernel: WordNetKernel, synsetId: string) {
  // The result is now properly typed - no more 'any'!
  const hypernyms = await relations.methods.getHypernyms(kernel, synsetId);
  
  // TypeScript now knows the exact shape of each hypernym
  hypernyms.forEach(hypernym => {
    // All these properties are properly typed:
    console.log(`ID: ${hypernym.id}`);           // string
    console.log(`Lemma: ${hypernym.lemma}`);     // string  
    console.log(`POS: ${hypernym.pos}`);         // string
    console.log(`Language: ${hypernym.language}`); // string
    console.log(`Lexicon: ${hypernym.lexicon}`);   // string
    
    // TypeScript will catch typos at compile time:
    // console.log(hypernym.lemmma); // ❌ Error: Property 'lemmma' does not exist
  });
  
  // Get relations by type - also properly typed
  const relationsByType = await relations.methods.getRelationsByType(kernel, synsetId, 'hypernym');
  
  relationsByType.forEach(relation => {
    // TypeScript knows this has all the above properties PLUS 'type'
    console.log(`Type: ${relation.type}`); // string
  });
  
  // Get all relations - complex but properly typed
  const allRelations = await relations.methods.getAllRelations(kernel, synsetId);
  
  allRelations.forEach(relation => {
    // TypeScript knows the exact shape of the complex relation object
    console.log(`Source: ${relation.sourceLemma} -> Target: ${relation.targetLemma}`);
    console.log(`Direction: ${relation.direction}`); // 'incoming' | 'outgoing'
  });
  
  // Get relation statistics - properly typed arrays
  const stats = await relations.methods.getRelationStats(kernel, synsetId);
  
  stats.forEach(stat => {
    // TypeScript knows the exact shape of statistics
    console.log(`${stat.type}: ${stat.count} (${stat.direction})`);
  });
}

export { demonstrateKyselyTyping };
```

## Key Benefits

- **Full Type Safety**: No more 'any' types in database queries
- **Compile-time Error Detection**: TypeScript catches typos and type mismatches
- **IntelliSense Support**: Full autocomplete and documentation in IDEs
- **Refactoring Safety**: Changes to database schema are caught at compile time

## Usage

This example shows how the relations plugin provides type-safe access to WordNet relationship data, making the code more maintainable and less error-prone.
