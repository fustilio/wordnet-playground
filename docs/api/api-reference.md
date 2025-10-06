# API Reference

**Single source of truth** for the WordNet TypeScript API.

> Last updated: 2025-01-27 | Current versions - Independent package evolution

## Core Principle

All platforms share the same **core methods**. The only difference is how you initialize:

```typescript
// Node.js (Recommended)
const wn = createWordnet('oewn:2024');

// Web (React - Recommended)
const { search, loading, error } = useWordNet({ lexicon: 'oewn:2024' });

// Web (Direct)
const wn = createWebWordnet('oewn:2024');

// CLI
wn-cli search "computer"
```

After initialization, **the API is identical**.

---

## Current Package Versions

| Package | Version | Description |
|---------|---------|-------------|
| **wn-ts-core** | v0.5.2 | Foundation library (types and interfaces) |
| **wn-ts-web** | v1.0.0 | Browser implementation |
| **wn-ts-node** | v1.0.0 | Node.js implementation |
| **wn-react** | v1.0.0 | React hooks and components |
| **wn-cli** | v0.5.7 | Command-line interface |
| **wn-data-loader** | v0.1.0 | Data loading utilities |
| **utils** | v0.5.0 | Shared utilities |

## Installation

```bash
# Node.js
npm install wn-ts-node

# Web (React)
npm install wn-react wn-ts-web @sqlite.org/sqlite-wasm

# Web (Direct)
npm install wn-ts-web @sqlite.org/sqlite-wasm

# CLI
npm install -g wn-cli
```

---

## Initialization

### Node.js (Recommended)

```typescript
import { createWordnet } from 'wn-ts-node';

// Simple (recommended) - auto-initializes on first use
const wn = createWordnet('oewn:2024');

// With options
const wn = createWordnet('oewn:2024', {
  filename: '/path/to/wordnet.db',
  mode: 'persistent' // or 'memory'
});

// Multiple lexicons
const wn = createWordnet(['oewn:2024', 'omw-fr:1.4']);

// With plugins
const wn = createWordnet('oewn:2024', {
  plugins: [relationsPlugin, similarityPlugin]
});

// Auto-closes on process exit
```

### Node.js (Advanced - Direct Kernel)

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wn = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db'
});
await wn.initialize();
// ... use wn
await wn.close();
```

### Web (React Hook - Recommended)

```typescript
import { useWordNet } from 'wn-react';

function MyComponent() {
  const { 
    search,
    loading,
    error,
    initialized
  } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  const handleSearch = async () => {
    const results = await search('computer');
    console.log(results);
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <button onClick={handleSearch}>Search</button>;
}

// No providers needed - auto-initializes
```

### Web (Direct Kernel)

```typescript
import { createWebWordnet } from 'wn-ts-web';

// Auto-initializes on first use
const wn = createWebWordnet('oewn:2024');

// Simple search
const results = await wn.search('computer');

// Advanced operations
const synsets = await wn.synsets('computer');
const hypernyms = await wn.getHypernyms(synsets[0].id);

// Auto-closes on page unload
```

---

## Core Methods

These methods work **identically** on all platforms.

### search(term)

**NEW in v1.0.0** - Simple search that returns synsets (most common use case).

```typescript
// Simple search - returns synsets
const results = await wn.search('computer');

// With part of speech filter
const nouns = await wn.search('bank', { pos: 'n' });

// With language filter
const french = await wn.search('ordinateur', { language: 'fr' });
```

**Returns**: `Synset[]` - Array of synsets containing the search term

### words(query)

Search for words by form, lemma, or other criteria.

```typescript
// Simple search
const words = await wn.words({ form: 'computer' });

// With part of speech
const nouns = await wn.words({ form: 'bank', pos: 'n' });

// With language
const french = await wn.words({ form: 'ordinateur', language: 'fr' });

// Pagination
const page1 = await wn.words({ form: 'run', limit: 10, offset: 0 });
const page2 = await wn.words({ form: 'run', limit: 10, offset: 10 });
```

**Returns**: `Word[]`
```typescript
interface Word {
  id: string;
  lemma: string;
  pos: 'n' | 'v' | 'a' | 'r' | 's';
  language: string;
  lexicon: string;
}
```

### synsets(query)

Get concept groupings (sets of synonyms).

```typescript
// By word form
const synsets = await wn.synsets({ form: 'computer' });

// By word ID
const synsets = await wn.synsets({ wordId: 'oewn-computer-n' });

// By ILI (cross-lingual)
const synsets = await wn.synsets({ iliId: 'i00001' });

// Filter by POS
const nounSynsets = await wn.synsets({ form: 'bank', pos: 'n' });
```

**Returns**: `Synset[]`
```typescript
interface Synset {
  id: string;
  ili?: string;
  pos: 'n' | 'v' | 'a' | 'r' | 's';
  language: string;
  lexicon: string;
  definitions: Definition[];
  examples: Example[];
  words?: Word[];
}
```

### senses(query)

Get word-to-synset connections.

```typescript
// By word form
const senses = await wn.senses({ form: 'computer' });

// By word ID
const senses = await wn.senses({ wordId: 'oewn-computer-n' });

// By synset ID
const senses = await wn.senses({ synsetId: 'oewn-computer-n-01' });
```

**Returns**: `Sense[]`
```typescript
interface Sense {
  id: string;
  wordId: string;
  synsetId: string;
  language: string;
  lexicon: string;
}
```

### lexicons()

Get loaded lexicon information.

```typescript
const lexicons = await wn.lexicons();

// Returns:
[{
  id: 'oewn',
  label: 'Open English WordNet',
  version: '2024',
  language: 'en',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  url: 'https://en-word.net'
}]
```

### getStatistics()

Get database statistics.

```typescript
const stats = await wn.getStatistics();

// Returns:
{
  totalWords: 161532,
  totalSynsets: 120514,
  totalSenses: 206938,
  totalILIs: 117659,
  totalLexicons: 1
}
```

---

## Plugin Methods

Load plugins for extended functionality.

### Relations Plugin

```typescript
// Get broader terms (is-a)
const hypernyms = await wn.getHypernyms(synsetId);

// Get narrower terms
const hyponyms = await wn.getHyponyms(synsetId);

// Get part-of relationships
const meronyms = await wn.getMeronyms(synsetId);

// Get whole-of relationships
const holonyms = await wn.getHolonyms(synsetId);
```

**Returns**: `RelationResult[]`
```typescript
interface RelationResult {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  relationType: string;
}
```

### Similarity Plugin

```typescript
// Path-based similarity (0-1)
const sim = await wn.getPathSimilarity(synset1Id, synset2Id);

// Wu-Palmer similarity (0-1)
const wup = await wn.getWuPalmerSimilarity(synset1Id, synset2Id);

// Leacock-Chodorow similarity
const lch = await wn.getLeacockChodorowSimilarity(synset1Id, synset2Id);
```

**Returns**: `number` (0-1, where 1 is identical)

### Translation Plugin

```typescript
// Get translations
const translations = await wn.getTranslations(synsetId, 'fr');

// Get available languages
const languages = await wn.getAvailableLanguages();

// Check if translation available
const available = await wn.isTranslationAvailable('en', 'fr');
```

---

## React-Specific API

### useWordNet()

**Main hook** for React applications (v1.0.0).

```typescript
import { useWordNet } from 'wn-react';

function MyComponent() {
  const {
    // Core methods
    search,
    words,
    synsets,
    senses,
    
    // Plugin methods (if enabled)
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getTranslations,
    
    // State
    loading,
    error,
    initialized,
    
    // Advanced (if needed)
    lexicons,
    getStatistics
  } = useWordNet({ 
    lexicon: 'oewn:2024',
    autoInitialize: true 
  });
  
  // Use the methods
}
```

### useWordNetContext()

**Advanced hook** for complex applications.

```typescript
import { useWordNetContext } from 'wn-react';

function MyComponent() {
  const {
    // All methods from useWordNet() plus:
    query: { words, synsets, senses },
    plugins: { getHypernyms, getHyponyms, ... },
    packages: { load, unload, refresh },
    admin: { introspect, validate, analyze },
    state: { loadedPackages, statistics, workerReady }
  } = useWordNetContext();
  
  // Use the methods
}
```

### WordNetProvider Props

```typescript
interface WordNetProviderProps {
  children: React.ReactNode;
  lexiconId?: string;        // Default: 'oewn:2024'
  options?: {
    enableWorkers?: boolean;  // Default: true
    fallbackToMainThread?: boolean; // Default: true
  };
}
```

---

## Query Parameters

All query methods accept an object with these optional fields:

```typescript
interface QueryOptions {
  // Filters
  form?: string;           // Word form to search
  lemma?: string;          // Base form
  pos?: 'n' | 'v' | 'a' | 'r' | 's'; // Part of speech
  language?: string;       // ISO 639-1 code
  lexicon?: string;        // Lexicon ID
  
  // Relations
  wordId?: string;         // Specific word ID
  synsetId?: string;       // Specific synset ID
  iliId?: string;          // Interlingual index ID
  
  // Pagination
  limit?: number;          // Max results (default: 100)
  offset?: number;         // Skip N results (default: 0)
}
```

---

## Data Types

### Word

```typescript
interface Word {
  id: string;              // Unique identifier
  lemma: string;           // Base form
  pos: 'n'|'v'|'a'|'r'|'s'; // Part of speech
  language: string;        // ISO 639-1 code
  lexicon: string;         // Source lexicon
}
```

### Synset

```typescript
interface Synset {
  id: string;              // Unique identifier
  ili?: string;            // Interlingual index
  pos: 'n'|'v'|'a'|'r'|'s'; // Part of speech
  language: string;        // ISO 639-1 code
  lexicon: string;         // Source lexicon
  definitions: Definition[];
  examples: Example[];
  words?: Word[];          // Words in this synset
  relations?: Relation[];  // Related synsets
}
```

### Sense

```typescript
interface Sense {
  id: string;              // Unique identifier
  wordId: string;          // Reference to word
  synsetId: string;        // Reference to synset
  language: string;        // ISO 639-1 code
  lexicon: string;         // Source lexicon
}
```

### Definition

```typescript
interface Definition {
  text: string;            // Definition text
  language: string;        // Definition language
  source?: string;         // Attribution
}
```

### Example

```typescript
interface Example {
  text: string;            // Example sentence
  language: string;        // Example language
}
```

---

## Part of Speech Codes

```typescript
type PartOfSpeech = 
  | 'n'  // Noun
  | 'v'  // Verb
  | 'a'  // Adjective
  | 'r'  // Adverb
  | 's'; // Adjective satellite
```

---

## Error Handling

All methods can throw errors. Always use try-catch:

```typescript
try {
  const words = await wn.words({ form: 'computer' });
  console.log('Found', words.length, 'words');
} catch (error) {
  console.error('Search failed:', error.message);
}
```

Common errors:
- `DatabaseNotInitializedError` - Call `initialize()` first
- `LexiconNotFoundError` - Lexicon not downloaded
- `InvalidQueryError` - Invalid query parameters
- `NetworkError` - Download failed (web only)

---

## Cleanup

Always close connections when done:

```typescript
// Node.js
await wn.close();

// Web (React) - handled automatically by provider

// Web (Direct)
await wn.close();
```

---

## Examples

### Complete Node.js Example

```typescript
import { createWordnet } from 'wn-ts-node';

async function main() {
  const wn = createWordnet('oewn:2024');
  await wn.initialize();
  
  try {
    // Search
    const words = await wn.words({ form: 'computer' });
    console.log('Words:', words.map(w => w.lemma));
    
    // Get synsets
    const synsets = await wn.synsets({ wordId: words[0].id });
    console.log('Synsets:', synsets.length);
    
    // Get relations
    const hypernyms = await wn.getHypernyms(synsets[0].id);
    console.log('Hypernyms:', hypernyms.map(h => h.lemma));
    
  } finally {
    await wn.close();
  }
}

main().catch(console.error);
```

### Complete React Example

```typescript
import { useWordNetContext } from 'wn-ts-web/react';
import { useState } from 'react';

export default function WordNetSearch() {
  const { querySynsets, loading, error } = useWordNetContext();
  const [results, setResults] = useState<any[]>([]);

  const search = async (term: string) => {
    const synsets = await querySynsets(term);
    setResults(synsets);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => search('computer')}>Search</button>
      {results.map(s => (
        <div key={s.id}>
          <strong>{s.id}</strong>: {s.definitions[0]?.text}
        </div>
      ))}
    </div>
  );
}
```

---

## Platform Differences

### Method Names

| Operation | Node.js | Web (Hook) | Web (Kernel) | CLI |
|-----------|---------|------------|--------------|-----|
| Search words | `wn.words()` | `queryWords()` | `wn.words()` | `wn-cli search` |
| Get synsets | `wn.synsets()` | `querySynsets()` | `wn.synsets()` | `wn-cli define` |
| Get senses | `wn.senses()` | `querySenses()` | `wn.senses()` | N/A |

**Note**: React hooks prefix with `query*` to avoid naming conflicts. The underlying API is the same.

### Data Loading

| Platform | Data Location | How to Load |
|----------|---------------|-------------|
| Node.js | `~/.wn_data/` | Auto-downloads on first `initialize()` |
| Web | OPFS/IndexedDB | Auto-downloads on first `loadPackageData()` |
| CLI | `~/.wn_data/` | Auto-downloads on first command |

---

## Deprecated APIs

These APIs still work but are not recommended:

```typescript
// ❌ Old (still works, but don't use)
import { Wordnet } from 'wn-ts-node';
const wn = new Wordnet('oewn:2024', { /* config */ });

// ✅ New (recommended)
import { createWordnet } from 'wn-ts-node';
const wn = createWordnet('oewn:2024');
```

```typescript
// ❌ Old web hook
import { useWordNet } from 'wn-ts-web/react';

// ✅ New web hook
import { useWordNetContext } from 'wn-ts-web/react';
```

See [Migration Guide](../getting-started/migration-guide.md) for full transition path.

---

## Advanced Features

### Custom Query Strategies

```typescript
// Node.js only - different query optimization strategies
const wn = createWordnet('oewn:2024', {
  strategy: 'cached' // 'default' | 'cached' | 'memory-optimized'
});
```

### Transaction Support

```typescript
// Node.js only
await wn.transaction(async (trx) => {
  await trx.words({ form: 'computer' });
  await trx.synsets({ form: 'laptop' });
  // All queries in one transaction
});
```

### Batch Operations

```typescript
// Search multiple words efficiently
const terms = ['computer', 'laptop', 'desktop'];
const results = await Promise.all(
  terms.map(term => wn.words({ form: term }))
);
```

---

## Version Compatibility

### Current Package Versions (2025-01-27)

| Package | Version | Status | Key Features |
|---------|---------|--------|--------------|
| **wn-ts-core** | v0.5.2 | Stable | Foundation types, microkernel architecture |
| **wn-ts-web** | v1.0.0 | Latest | Browser implementation, React integration |
| **wn-ts-node** | v1.0.0 | Latest | Node.js implementation, SQLite integration |
| **wn-react** | v1.0.0 | Latest | React hooks and components |
| **wn-cli** | v0.5.7 | Stable | Command-line interface and TUI |
| **wn-data-loader** | v0.1.0 | Early | Data loading utilities |
| **utils** | v0.5.0 | Stable | Shared utilities and logging |

### API Compatibility Matrix

| Feature | wn-ts-core | wn-ts-web | wn-ts-node | wn-react |
|---------|------------|-----------|------------|----------|
| Basic Search | v0.5.2+ | v1.0.0+ | v1.0.0+ | v1.0.0+ |
| Plugin System | v0.5.2+ | v1.0.0+ | v1.0.0+ | v1.0.0+ |
| Worker Support | N/A | v1.0.0+ | N/A | v1.0.0+ |
| React Hooks | N/A | N/A | N/A | v1.0.0+ |
| CLI Interface | N/A | N/A | N/A | N/A |

### Recent Changes

**wn-ts-web v1.0.0** (Latest)
- Simplified APIs with auto-initialization
- New `search()` method for simple synset queries
- React hooks separation to `wn-react` package
- Enhanced error handling and user experience

**wn-ts-node v1.0.0** (Latest)
- Unified API with web platform
- Improved SQLite integration
- Better performance optimizations

**wn-ts-core v0.5.2** (Stable)
- Microkernel architecture with plugin system
- Comprehensive type definitions
- Schema management system

---

## Further Reading

- [Node.js Platform Guide](../platforms/node/)
- [Web Platform Guide](../platforms/web/)
- [Plugin System](./plugins/)
- [Examples](../examples/)

---

**This is the definitive API reference. When docs and code conflict, this document is correct.**

