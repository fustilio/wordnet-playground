# WordNet Dictionary API - Next.js Demo

A serverless-optimized multilingual dictionary API built with Next.js 15 and WordNet, featuring **language-pair endpoints** for maximum memory efficiency.

## Features

- 🚀 **Serverless-Ready**: Optimized for edge functions and serverless platforms
- 🌍 **Multilingual**: Support for English, Thai, French, and more
- 🔀 **Language-Pair Endpoints**: Separate endpoints for en-th, en-fr, th-fr (60% memory savings)
- ⚡ **Fast**: O(1) lookups using pre-compiled dictionaries
- 📦 **Compact**: < 100KB per language pair
- 💾 **Memory Efficient**: Each endpoint loads only 2 languages
- 🔗 **ILI-Based**: Cross-language linking via Inter-Lingual Index
- 🔄 **Bidirectional**: en→th and th→en in the same endpoint
- 🎯 **TypeScript**: Fully typed API and frontend

## Quick Start

```bash
# From the root of the monorepo
pnpm install

# Navigate to this example
cd examples/web/nextjs-dictionary-api

# Start the development server (dictionary auto-generated!)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser

> **Note**: The dictionary is automatically generated when you run `pnpm dev` or `pnpm build`. Dictionary generation is **cached** - it only regenerates if files are missing. Use `pnpm run generate-dict:force` to force regeneration.

## API Endpoints

### Language-Pair Translation Endpoints (Memory Optimized)

Each language-pair endpoint imports only its specific 2-language dictionary, reducing memory usage by **60%**.

#### English-Thai Translation

```http
GET /api/translate/en-th?word=computer&from=en&to=th
```

Response:
```json
{
  "word": "computer",
  "from": "en",
  "to": "th",
  "translations": ["คอมพิวเตอร์", "เครื่องคำนวณ"],
  "synsets": [{
    "ili": "i00046516",
    "pos": "n",
    "definition": "a machine for performing calculations automatically"
  }],
  "meta": {
    "languages": ["en", "th"],
    "memoryOptimized": true,
    "dictionaryType": "language-pair"
  }
}
```

**Bidirectional**: Same endpoint works for th→en translation:

```http
GET /api/translate/en-th?word=คอมพิวเตอร์&from=th&to=en
```

#### English-French Translation

```http
GET /api/translate/en-fr?word=computer&from=en&to=fr
```

**Bidirectional**: Also supports fr→en

```http
GET /api/translate/en-fr?word=ordinateur&from=fr&to=en
```

#### Thai-French Translation

```http
GET /api/translate/th-fr?word=คอมพิวเตอร์&from=th&to=fr
```

**Bidirectional**: Also supports fr→th

```http
GET /api/translate/th-fr?word=ordinateur&from=fr&to=th
```

#### Batch Translation (POST)

Translate multiple words at once:

```http
POST /api/translate/en-th
Content-Type: application/json

{
  "words": ["computer", "phone", "book"],
  "from": "en",
  "to": "th"
}
```

### General Dictionary Endpoints

#### Lookup Word

Get all synsets for a word:

```http
GET /api/dictionary?word=computer&lang=en&action=lookup
```

#### Get Definitions

Get only definitions for a word:

```http
GET /api/dictionary?word=computer&action=define
```

## Memory Comparison

| Approach | Memory per Endpoint | 3 Endpoints Total |
|----------|---------------------|-------------------|
| **Multilingual** (all languages) | 200 KB | **600 KB** |
| **Language Pairs** (this approach) | 80 KB | **240 KB** |
| **Savings** | **60%** | **360 KB saved** |

## Why Language Pairs?

**Traditional Multilingual Approach:**
```typescript
// ❌ Loads ALL languages for every endpoint
import dict from './multilingual-dict.json'; // 200KB
// Every endpoint pays the memory cost even if it only uses 2 languages
```

**Language-Pair Approach (This Demo):**
```typescript
// ✅ Each endpoint loads ONLY what it needs
// api/translate/en-th/route.ts
import dict from './dict-en-th.js'; // 80KB - only en & th

// api/translate/en-fr/route.ts
import dict from './dict-en-fr.js'; // 80KB - only en & fr

// api/translate/th-fr/route.ts
import dict from './dict-th-fr.js'; // 80KB - only th & fr
```

**Benefits:**
- 🔽 **60-70% smaller** bundles per endpoint
- ⚡ **Faster cold starts** in serverless environments
- 💾 **Lower memory** consumption
- 🎯 **Import only what you need**
- 🚀 **Better performance** on memory-constrained platforms

## Dictionary Presets

### Language-Pair Presets (Used in This Demo)

| Preset | Languages | Words | Size | Memory/Endpoint |
|--------|-----------|-------|------|-----------------|
| `en-th` | English ↔ Thai | 1000 | ~80-120 KB | **80 KB** |
| `en-fr` | English ↔ French | 1000 | ~80-120 KB | **80 KB** |
| `th-fr` | Thai ↔ French | 1000 | ~80-120 KB | **80 KB** |
| `en-th-large` | English ↔ Thai | 3000 | ~200-350 KB | **200 KB** |
| `en-fr-large` | English ↔ French | 3000 | ~200-350 KB | **200 KB** |
| `th-fr-large` | Thai ↔ French | 3000 | ~200-350 KB | **200 KB** |

### General Presets

| Preset | Description | Size | Use Case |
|--------|-------------|------|----------|
| `mini` | Top 100 words | ~10-20 KB | Demos, prototypes |
| `small` | Top 500 words | ~50-80 KB | Small apps, chatbots |
| `medium` | Top 2000 words | ~200-400 KB | General applications |

Generate different presets:

```bash
# Language pairs (memory optimized)
wn-dict-export en-th dict-en-th
wn-dict-export en-fr dict-en-fr
wn-dict-export th-fr dict-th-fr

# General dictionaries
wn-dict-export small serverless-dict
wn-dict-export medium serverless-dict
```

## Deployment

### Vercel

```bash
pnpm build
vercel deploy
```

### Netlify

```bash
pnpm build
netlify deploy --prod
```

### AWS Lambda (with SST or Serverless Framework)

The compact dictionary format is optimized for Lambda's 50MB deployment size limit.

```bash
pnpm build
# Use your preferred Lambda deployment tool
```

### Cloudflare Workers

For Cloudflare Workers, use the gzipped version for even smaller bundle size:

```typescript
// In your worker
import dictGz from './serverless-dict.json.gz';
import { gunzipSync } from 'zlib';

const dictData = JSON.parse(gunzipSync(dictGz).toString());
```

## Performance

- **Cold Start**: < 100ms (with mini/small presets)
- **Memory Usage**: 10-50 MB (depending on preset)
- **Lookup Time**: < 1ms (O(1) hash lookup)
- **Bundle Size**: 10-400 KB (uncompressed)

## Customization

### Create Custom Presets

You can create custom dictionaries programmatically using the `wn-serverless-dict` package:

```typescript
import { Wordnet } from 'wn-ts-node';
import { generateDictionary } from 'wn-serverless-dict/generators';

const wordnet = new Wordnet('*');

// Custom preset
const dictionary = await generateDictionary(wordnet, {
  languages: ['en', 'fr', 'es', 'de', 'it', 'pt'],
  pos: ['n', 'v'],  // nouns and verbs only
  limit: 5000       // top 5000 concepts
});

// Save dictionary
import { writeFileSync } from 'fs';
writeFileSync('custom-dict.json', JSON.stringify(dictionary));
```

See the [wn-serverless-dict README](../../../packages/wn-serverless-dict/README.md) for more details.

## Project Structure

```
nextjs-dictionary-api/
├── app/
│   ├── api/
│   │   ├── dictionary/
│   │   │   └── route.ts                # General dictionary endpoint
│   │   └── translate/
│   │       ├── en-th/
│   │       │   └── route.ts            # EN-TH language pair endpoint
│   │       ├── en-fr/
│   │       │   └── route.ts            # EN-FR language pair endpoint
│   │       └── th-fr/
│   │           └── route.ts            # TH-FR language pair endpoint
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Demo UI with language pair selector
│   └── globals.css                     # Styles
├── dict-en-th.js                       # Generated EN-TH dictionary (80KB)
├── dict-en-fr.js                       # Generated EN-FR dictionary (80KB)
├── dict-th-fr.js                       # Generated TH-FR dictionary (80KB)
├── serverless-dict.json                # Generated general dictionary
├── package.json
├── tsconfig.json
└── next.config.ts
```

**Key Architecture:**
- Each `/api/translate/{pair}` endpoint dynamically imports only its dictionary
- 60% memory reduction compared to loading all languages
- Bidirectional support (e.g., en→th and th→en in same endpoint)
- Perfect for serverless platforms with memory limits

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [WordNet Documentation](../../../docs/)
- [wn-serverless-dict Package](../../../packages/wn-serverless-dict/README.md)

## License

MIT
