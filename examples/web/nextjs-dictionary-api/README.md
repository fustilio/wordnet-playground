# WordNet Dictionary API - Next.js Demo

A serverless-optimized multilingual dictionary API built with Next.js 15 and WordNet.

## Features

- 🚀 **Serverless-Ready**: Optimized for edge functions and serverless platforms
- 🌍 **Multilingual**: Support for English, French, Spanish, German, and more
- ⚡ **Fast**: O(1) lookups using pre-compiled dictionary
- 📦 **Compact**: < 100KB dictionary size for common words
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

> **Note**: The dictionary is automatically generated when you run `pnpm dev` or `pnpm build`. This builds the required packages (`wn-ts-core` and `wn-ts-node`) and creates `serverless-dict.json` and `serverless-dict.js` files.

## API Endpoints

### Lookup Word

Get all synsets for a word:

```http
GET /api/dictionary?word=computer&lang=en&action=lookup
```

Response:
```json
{
  "word": "computer",
  "lang": "en",
  "results": [
    {
      "ili": "i02201",
      "pos": "n",
      "definition": "a machine for performing calculations automatically",
      "translations": {
        "en": ["computer", "computing machine", "data processor"],
        "fr": ["ordinateur", "calculateur"]
      }
    }
  ],
  "count": 1
}
```

### Get Definitions

Get only definitions for a word:

```http
GET /api/dictionary?word=computer&action=define
```

Response:
```json
{
  "word": "computer",
  "lang": "en",
  "definitions": [
    "a machine for performing calculations automatically"
  ],
  "count": 1
}
```

### Translate Word

Translate a word to another language:

```http
GET /api/dictionary?word=computer&action=translate&fromLang=en&toLang=fr
```

Response:
```json
{
  "word": "computer",
  "from": "en",
  "to": "fr",
  "translations": ["ordinateur", "calculateur"],
  "count": 2
}
```

## Dictionary Presets

When generating the dictionary, you can choose different presets:

| Preset | Description | Size | Use Case |
|--------|-------------|------|----------|
| `mini` | Top 100 words | ~10-20 KB | Demos, prototypes |
| `small` | Top 500 words | ~50-80 KB | Small apps, chatbots |
| `medium` | Top 2000 words | ~200-400 KB | General applications |
| `bilingual` | EN-FR, 1000 words | ~100-150 KB | Translation apps |
| `multilingual` | 4 languages, 500 words | ~150-200 KB | International apps |

Generate different presets:

```bash
# Small preset
wn-dict-export small serverless-dict

# Bilingual English-French
wn-dict-export bilingual serverless-dict

# Medium size for production
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
│   │   └── dictionary/
│   │       └── route.ts          # API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Demo UI
│   └── globals.css               # Styles
├── package.json
├── tsconfig.json
├── next.config.ts
└── serverless-dict.json          # Generated dictionary
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [WordNet Documentation](../../../docs/)
- [wn-serverless-dict Package](../../../packages/wn-serverless-dict/README.md)

## License

MIT
