# wn-serverless-dict

Serverless-optimized dictionary generation and runtime utilities for WordNet. Create ultra-compact dictionaries perfect for edge functions, AWS Lambda, Cloudflare Workers, and other serverless platforms.

## Features

- 🚀 **Serverless-Optimized**: Dictionaries < 100KB for fast cold starts
- ⚡ **O(1) Lookups**: Constant-time word lookups using hash maps
- 🌍 **Multilingual**: Support for English, French, Spanish, German, Thai, and more
- 🔀 **Language Pairs**: Generate bidirectional dictionaries for specific language pairs (en-th, en-fr, th-fr)
- 💾 **Memory Efficient**: Import only the language pairs you need
- 📦 **Multiple Formats**: JSON, gzipped, and ES modules
- 🎯 **TypeScript**: Full type safety and IntelliSense
- 🔧 **CLI & API**: Use as CLI tool or programmatically
- 🔗 **ILI-Based**: Cross-language linking via Inter-Lingual Index

## Installation

```bash
pnpm add wn-serverless-dict
```

## Quick Start

### CLI Usage

```bash
# Generate a mini dictionary (100 words)
npx wn-dict-export mini

# Generate a small dictionary (500 words)
npx wn-dict-export small my-dict

# Generate bilingual English-French dictionary
npx wn-dict-export bilingual

# See all presets
npx wn-dict-export --presets
```

This creates:
- `serverless-dict.json` - Full JSON dictionary
- `serverless-dict.json.gz` - Compressed version
- `serverless-dict.js` - ES module with utilities

### Programmatic Usage

#### Generate Dictionary

```typescript
import { Wordnet } from 'wn-ts-node';
import { generateDictionary, PRESETS } from 'wn-serverless-dict/generators';

const wordnet = new Wordnet('*', { multilingual: true });
const dictionary = await generateDictionary(wordnet, PRESETS.small);

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('dict.json', JSON.stringify(dictionary));
```

#### Runtime Usage

```typescript
import { createDictionary } from 'wn-serverless-dict';
import dictData from './serverless-dict.json';

const dict = createDictionary(dictData);

// Lookup a word
const results = dict.lookup('computer', 'en');
console.log(results.results[0].definition);

// Translate
const translations = dict.translate('computer', 'en', 'fr');
console.log(translations.translations); // ['ordinateur', 'calculateur']

// Get definitions
const defs = dict.define('computer', 'en');
console.log(defs.definitions);

// Get metadata
const stats = dict.getStats();
console.log(`${stats.synsets} synsets, ${stats.words} words`);
```

#### Serverless Function Example

```typescript
// AWS Lambda / Vercel / Netlify Function
import { lookup } from 'wn-serverless-dict';
import dictData from './serverless-dict.json';

export async function handler(event) {
  const word = event.queryStringParameters.word;
  const result = lookup(dictData, word, 'en');

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
```

## Available Presets

### English-Only Presets
| Preset | Description | Size | Use Case |
|--------|-------------|------|----------|
| `mini` | Top 100 words | ~10-20 KB | Demos, prototypes |
| `small` | Top 500 words | ~50-80 KB | Small apps, chatbots |
| `medium` | Top 2000 words | ~200-400 KB | General applications |

### Language-Pair Presets (Bidirectional)
| Preset | Languages | Words | Size | Use Case |
|--------|-----------|-------|------|----------|
| `en-th` | English ↔ Thai | 1000 | ~80-120 KB | EN-TH translation |
| `en-fr` | English ↔ French | 1000 | ~80-120 KB | EN-FR translation |
| `th-fr` | Thai ↔ French | 1000 | ~80-120 KB | TH-FR translation |
| `en-th-large` | English ↔ Thai | 3000 | ~200-350 KB | Large EN-TH dictionary |
| `en-fr-large` | English ↔ French | 3000 | ~200-350 KB | Large EN-FR dictionary |
| `th-fr-large` | Thai ↔ French | 3000 | ~200-350 KB | Large TH-FR dictionary |

### Multi-Language Presets
| Preset | Description | Size | Use Case |
|--------|-------------|------|----------|
| `bilingual` | EN-FR, 1000 words | ~100-150 KB | Translation apps |
| `multilingual` | 4 languages, 500 words | ~150-200 KB | International apps |

## Language-Pair Dictionaries

Language-pair dictionaries are **optimized for serverless environments** with limited memory. Instead of loading all languages, you generate and import only the specific language pair you need.

### Why Use Language Pairs?

**Memory Efficiency**: Each endpoint imports only what it needs
```typescript
// ❌ Old approach: Load all languages (200KB+)
import allLanguages from './dict-multilingual.js';

// ✅ New approach: Load only en-th (80KB)
import enTh from './dict-en-th.js';
```

**Benefits**:
- 🔽 **Smaller bundles**: 60-70% smaller than multilingual dictionaries
- ⚡ **Faster cold starts**: Less data to parse and load
- 💾 **Lower memory**: Critical for serverless memory limits
- 🎯 **Focused**: Only the languages you need for each endpoint

### Generating Language Pairs

#### Using CLI

```bash
# Generate English-Thai dictionary
npx wn-dict-export en-th

# Generate English-French dictionary
npx wn-dict-export en-fr dict-en-fr

# Generate large Thai-French dictionary (3000 words)
npx wn-dict-export th-fr-large
```

#### Programmatically

```typescript
import { Wordnet } from 'wn-ts-node';
import { generateLanguagePair, createESModule } from 'wn-serverless-dict/generators';
import { writeFileSync } from 'fs';

const wordnet = new Wordnet('*');

// Generate English-Thai dictionary
const enThDict = await generateLanguagePair(wordnet, 'en', 'th', {
  limit: 1000,
  pos: ['n', 'v', 'a']
});

// Save as ES module
const moduleCode = createESModule(enThDict, 'dict-en-th');
writeFileSync('dict-en-th.js', moduleCode);
```

### Using Language Pairs in Serverless

#### Separate Endpoints for Each Language Pair

```typescript
// api/translate/en-th.ts
import { translate, lookup } from '../../../dict-en-th.js';

export default async function handler(request: Request) {
  const { word, from, to } = await request.json();

  // Bidirectional: works for both en→th and th→en
  const translations = translate(word, from, to);
  const definitions = lookup(word, from);

  return new Response(JSON.stringify({ translations, definitions }));
}
```

```typescript
// api/translate/en-fr.ts
import { translate, lookup } from '../../../dict-en-fr.js';

export default async function handler(request: Request) {
  const { word, from, to } = await request.json();

  // Bidirectional: works for both en→fr and fr→en
  const translations = translate(word, from, to);
  const definitions = lookup(word, from);

  return new Response(JSON.stringify({ translations, definitions }));
}
```

#### Memory Comparison

| Approach | Memory per Endpoint | Total for 3 Endpoints |
|----------|---------------------|----------------------|
| **Multilingual** (all languages) | 200 KB × 3 | **600 KB** |
| **Language Pairs** (specific pairs) | 80 KB × 3 | **240 KB** |
| **Savings** | - | **60% reduction** |

### Bidirectional Translation

All language-pair dictionaries support **bidirectional** translation automatically:

```typescript
import { translate } from './dict-en-th.js';

// English to Thai
translate('computer', 'en', 'th');  // ['คอมพิวเตอร์']

// Thai to English (same file!)
translate('คอมพิวเตอร์', 'th', 'en');  // ['computer']
```

### ILI-Based Linking

Language pairs use the **Inter-Lingual Index (ILI)** to link concepts across languages:

```typescript
import { lookup } from './dict-en-th.js';

const results = lookup('computer', 'en');
// [
//   {
//     ili: 'i00046516',
//     pos: 'n',
//     definition: 'a machine for performing calculations...',
//     translations: {
//       en: ['computer', 'computing machine'],
//       th: ['คอมพิวเตอร์', 'เครื่องคำนวณ']
//     }
//   }
// ]
```

## API Reference

### Generators

#### `generateDictionary(wordnet, options)`

Generate a dictionary from a WordNet instance.

```typescript
interface GeneratorOptions {
  languages: string[];
  pos: string[] | null;  // null = all parts of speech
  limit: number;
  output?: string;
  compress?: boolean;
  format?: 'standard' | 'compact' | 'lookup';
}
```

#### `generateLanguagePair(wordnet, lang1, lang2, options?)`

Generate a language-pair specific dictionary for memory-efficient serverless deployments.

```typescript
async function generateLanguagePair(
  wordnet: Wordnet,
  lang1: string,
  lang2: string,
  options?: Partial<GeneratorOptions>
): Promise<DictionaryData>

// Example
const enThDict = await generateLanguagePair(wordnet, 'en', 'th', {
  limit: 1000,
  pos: ['n', 'v', 'a']
});
```

**Parameters**:
- `wordnet`: WordNet instance
- `lang1`: First language code (e.g., 'en', 'th', 'fr')
- `lang2`: Second language code
- `options`: Optional configuration (limit, pos, etc.)

**Returns**: Dictionary data containing only the two specified languages

#### `createESModule(data, moduleName)`

Create an ES module from dictionary data.

### Runtime Utilities

#### `createDictionary(data)`

Create a dictionary instance with lookup/translate/define methods.

#### `lookup(data, word, lang)`

Standalone lookup function.

#### `translate(data, word, fromLang, toLang)`

Standalone translate function.

#### `define(data, word, lang)`

Standalone define function.

## TypeScript Types

```typescript
import type {
  DictionaryData,
  DictionaryMetadata,
  SynsetResult,
  LookupResult,
  TranslationResult,
  DefinitionResult,
  GeneratorOptions,
  PresetConfig
} from 'wn-serverless-dict/types';
```

## Performance

| Preset | JSON Size | Gzipped | Cold Start | Memory | Lookup Time |
|--------|-----------|---------|------------|--------|-------------|
| mini | ~15 KB | ~5 KB | < 50ms | ~10 MB | < 1ms |
| small | ~70 KB | ~25 KB | < 100ms | ~25 MB | < 1ms |
| medium | ~350 KB | ~120 KB | < 200ms | ~100 MB | < 1ms |

## Deployment

### Vercel

```bash
pnpm build  # Dictionary auto-generated
vercel deploy
```

### AWS Lambda

```javascript
// Include serverless-dict.json in your deployment
import dict from './serverless-dict.json';
import { lookup } from 'wn-serverless-dict';

export const handler = async (event) => {
  const result = lookup(dict, event.word);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

### Cloudflare Workers

```javascript
import { gunzipSync } from 'zlib';
import dictGz from './serverless-dict.json.gz';

const dictData = JSON.parse(gunzipSync(dictGz).toString());

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const word = url.searchParams.get('word');
    const result = lookup(dictData, word);
    return new Response(JSON.stringify(result));
  }
};
```

## License

MIT
