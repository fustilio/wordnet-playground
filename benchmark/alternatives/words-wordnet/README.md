# words/wordnet

**Repository**: https://github.com/words/wordnet  
**Language**: JavaScript  
**Stars**: 200+  
**Last Updated**: 2024  
**Package Name**: `wordnet` (from words organization)  
**Alternative Names**: words-wordnet, @words/wordnet  

## Description
A simple Node.js module for accessing Princeton University's WordNet dictionary, part of the **words** ecosystem. This library provides a straightforward, promise-based API for looking up word definitions and exploring the WordNet database. **Note**: This is different from `node-wordnet` (morungos/wordnet) and other WordNet libraries.

## Key Features
- Simple promise-based API
- Direct access to Princeton WordNet data
- Includes metadata and glossary information
- Supports pointer relationships between synsets
- Lightweight implementation
- Easy to use for basic WordNet operations
- Part of the words ecosystem (alongside words/natural, words/pos, etc.)

## Installation
```bash
npm install wordnet
```

**⚠️ IMPORTANT**: This installs the `wordnet` package from the **words** organization, which is different from:
- `node-wordnet` (morungos/wordnet) - Fast database access library
- `natural` WordNet - Part of the NaturalNode/natural NLP toolkit
- `wordpos` - POS tagging with WordNet integration

## Basic Usage
```javascript
const wordnet = require('wordnet');

// Initialize the WordNet database (required)
await wordnet.init();

// List all available words
let list = await wordnet.list();
console.log(`Total words: ${list.length}`);

// Look up definitions for a word
wordnet.lookup('enlightened')
  .then((definitions) => {
    definitions.forEach((def) => {
      console.log(`type: ${def.meta.synsetType}`);
      console.log(`${def.glossary}\n`);
    });
  })
  .catch((e) => {
    console.error(e);
  });
```

## API Methods

### `wordnet.init([database_dir])`
Loads the WordNet database. Takes an optional folder path (as a `String`) to specify the location of WordNet index and data files.

### `wordnet.lookup(word, [skipPointers])`
Returns definitions (metadata and glossary) for the given word. The definitions include pointers to related words, which can be omitted by passing `skipPointers = true`.

### `wordnet.list()`
Lists all available words in the WordNet database. If called before `wordnet.init()` finishes, it will return an empty array.

## Data Structure
Each definition returned by `lookup()` contains:
- `meta`: Object containing synset metadata
  - `synsetType`: Type of synset (noun, verb, adjective, adverb)
  - `words`: Array of words in the synset with their lexical IDs
  - `pointers`: Array of relationship pointers to other synsets
- `glossary`: String containing the definition and example sentences

## Comparison with Other WordNet Libraries

| Feature | words/wordnet | node-wordnet | natural WordNet | wordpos |
|---------|---------------|--------------|-----------------|---------|
| Package Name | `wordnet` | `node-wordnet` | `natural` | `wordpos` |
| API Style | Promise | Dual (Promise/Callback) | Callback | Callback |
| Initialization | Required (`init()`) | Automatic | Automatic | Automatic |
| Data Access | High-level | Low-level | High-level | High-level |
| Pointer Support | ✅ | ✅ | ✅ | ❌ |
| POS Tagging | ❌ | ❌ | ✅ | ✅ |
| Browser Support | ❌ | ✅ | ❌ | ✅ |

## Performance Characteristics
- Simple file-based implementation
- Promise-based for async operations
- Direct parsing of WordNet data files
- Memory-efficient for basic lookups
- Suitable for Node.js applications
- Requires explicit initialization

## Benchmark Notes
- Basic Node.js implementation
- Good for simple WordNet lookups
- Requires initialization before use
- Includes pointer relationships
- Part of the words ecosystem
- MIT License with Princeton WordNet license compliance
- **Unique**: Only WordNet library requiring explicit `init()` call