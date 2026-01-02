# wn-serverless-dict

Serverless-optimized dictionary generation and runtime utilities for WordNet. Create ultra-compact dictionaries perfect for edge functions, AWS Lambda, Cloudflare Workers, and other serverless platforms.

## Features

- 🚀 **Serverless-Optimized**: Dictionaries < 100KB for fast cold starts
- ⚡ **O(1) Lookups**: Constant-time word lookups using hash maps
- 🌍 **Multilingual**: Support for English, French, Spanish, German, and more
- 📦 **Multiple Formats**: JSON, gzipped, and ES modules
- 🎯 **TypeScript**: Full type safety and IntelliSense
- 🔧 **CLI & API**: Use as CLI tool or programmatically

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

| Preset | Description | Size | Use Case |
|--------|-------------|------|----------|
| `mini` | Top 100 words | ~10-20 KB | Demos, prototypes |
| `small` | Top 500 words | ~50-80 KB | Small apps, chatbots |
| `medium` | Top 2000 words | ~200-400 KB | General applications |
| `bilingual` | EN-FR, 1000 words | ~100-150 KB | Translation apps |
| `multilingual` | 4 languages, 500 words | ~150-200 KB | International apps |

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
