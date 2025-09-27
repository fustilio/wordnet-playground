# Unified API Reference

Complete API documentation for the WordNet TypeScript ecosystem.

## Quick Reference

### Core Types
```typescript
interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  ili?: string;
  pos: PartOfSpeech;
  definitions: Definition[];
  examples: Example[];
}

interface Sense {
  id: string;
  word: string;
  synset: string;
  examples: Example[];
}
```

## Platform APIs

### Web (React)
```typescript
import { useWordNet, useWordNetKernel } from 'wn-ts-web';

// Worker-based hook
const { queryWords, loading, error } = useWordNet();

// Kernel-based hook
const { words, synsets, getHypernyms, getPathSimilarity } = useWordNetKernel();
```

### Node.js
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

### CLI
```bash
# Search
wn-cli search "computer" --lexicon oewn:2024

# Relationships
wn-cli relations "computer" --type hypernym

# Translation
wn-cli translate "computer" --from en --to fr
```

## Plugin System

### Relations Plugin
```typescript
// Available in both web and node
const hypernyms = await wordnet.getHypernyms(synsetId);
const hyponyms = await wordnet.getHyponyms(synsetId);
const meronyms = await wordnet.getMeronyms(synsetId);
const holonyms = await wordnet.getHolonyms(synsetId);
```

### Similarity Plugin
```typescript
const similarity = await wordnet.getPathSimilarity(synset1, synset2);
const wupSimilarity = await wordnet.getWuPalmerSimilarity(synset1, synset2);
const lchSimilarity = await wordnet.getLeacockChodorowSimilarity(synset1, synset2);
```

### Translation Plugin
```typescript
const translations = await wordnet.getTranslations(synsetId, 'fr');
const languages = await wordnet.getAvailableLanguages(synsetId);
const confidence = await wordnet.getTranslationConfidence(synset1, synset2);
```

## Common Patterns

### Error Handling
```typescript
try {
  const words = await queryWords('computer');
} catch (error) {
  if (error.message.includes('Worker not available')) {
    console.error('Web Worker not supported');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Data Loading
```typescript
// Web
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');

// Node.js
import { download, add } from 'wn-ts-node';
await download('oewn:2024');
await add('oewn:2024');
```

## Configuration

### Web Options
```typescript
const options = {
  enableWorkers: true,
  workerUrl: '/workers/wordnet-worker.js',
  enableOPFS: true,
  cacheSize: 1000
};
```

### Node.js Options
```typescript
const options = {
  filename: 'wordnet.db',
  enableWAL: true,
  enableForeignKeys: true,
  maxConnections: 10
};
```

## Further Reading

- [Getting Started Guide](../getting-started/README.md) - Quick setup and basic usage
- [Examples](../examples/README.md) - Working code examples
- [Architecture Guide](../architecture/SYSTEM_ARCHITECTURE.md) - System design details
