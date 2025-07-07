# morungos/wordnet

**Repository**: https://github.com/morungos/wordnet  
**Language**: JavaScript  
**Stars**: 100+  
**Last Updated**: 2024  
**Version**: 0.1.12  
**Package Name**: `node-wordnet`  
**Alternative Names**: morungos-wordnet, morungos/node-wordnet  

## Description
A pure JavaScript implementation of a WordNet API that provides a simple set of query functions for lookups against a WordNet database. This library was initially written as a replacement for the WordNet code in NaturalNode/natural, providing better usability for higher-level tasks.

**⚠️ IMPORTANT**: This is different from other WordNet libraries:
- `wordnet` (words/wordnet) - Promise-based API, requires `init()` call
- `natural` WordNet - Part of the NaturalNode/natural NLP toolkit
- `wordpos` - POS tagging with WordNet integration

## Key Features
- Pure JavaScript implementation with no native dependencies
- Simple and intuitive API for WordNet queries
- Support for morphological exceptions (with `wndb-with-exceptions`)
- LRU caching support for improved performance
- Promise-based and callback-based APIs
- Support for all parts of speech (nouns, verbs, adjectives, adverbs)

## Installation
```bash
npm install node-wordnet
npm install wndb-with-exceptions  # For full functionality including exceptions
```

**⚠️ NOTE**: The package name is `node-wordnet`, not `wordnet`. This helps distinguish it from the words/wordnet library.

## Basic Usage
```javascript
const WordNet = require('node-wordnet');

// Initialize WordNet with default data directory
const wn = new WordNet();

// Look up synsets for a word (Promise-based)
wn.lookup('run#v')
  .then(result => console.log(result))
  .catch(err => console.error(err));

// Look up synsets for a word (callback-based)
wn.lookup('run#v', (err, result) => {
  if (err) console.error(err);
  else console.log(result);
});

// Find a specific sense
wn.findSense('run#v#1')
  .then(sense => console.log(sense));

// Get valid forms (morphological variations)
wn.validForms('running#v')
  .then(forms => console.log(forms));
```

## API Methods

### Core Lookup Methods
- `lookup(input)` - Find synsets for a word (format: "word#pos")
- `findSense(input)` - Find a specific sense (format: "word#pos#senseNumber")
- `querySense(input)` - Get sense keys for a word (format: "word#pos")

### Morphological Methods
- `validForms(string)` - Get valid morphological forms of a word
- `loadExceptions()` - Load morphological exception files

### Synset Navigation
- `getSynonyms(synsetOffset, pos)` - Get synonyms for a synset
- `get(synsetOffset, pos)` - Get synset data by offset and POS

## Constructor Options
```javascript
const wn = new WordNet({
  dataDir: '/path/to/wordnet/data',  // Custom data directory
  cache: true                        // Enable LRU cache
});
```

## Data Requirements
This module requires WordNet data files. Recommended options:
- **`wndb-with-exceptions`** - Full functionality including morphological exceptions
- **`wndb`** - Basic WordNet data without exceptions
- **Direct WordNet download** - Manual installation

## Comparison with Other WordNet Libraries

| Feature | node-wordnet | words/wordnet | natural WordNet | wordpos |
|---------|--------------|---------------|-----------------|---------|
| Package Name | `node-wordnet` | `wordnet` | `natural` | `wordpos` |
| API Style | Dual (Promise/Callback) | Promise | Callback | Callback |
| Initialization | Automatic | Required (`init()`) | Automatic | Automatic |
| Data Access | Low-level | High-level | High-level | High-level |
| Morphological Forms | ✅ | ❌ | ❌ | ❌ |
| Sense Lookup | ✅ | ❌ | ❌ | ❌ |
| Browser Support | ✅ | ❌ | ❌ | ✅ |

## Performance Characteristics
- Fast database lookups using optimized file indexing
- Memory-efficient with optional LRU caching
- Pure JavaScript implementation for cross-platform compatibility
- Supports both synchronous and asynchronous operations
- Minimal memory footprint for large WordNet datasets

## Error Handling
The library provides comprehensive error handling:
- Invalid sense numbers throw descriptive errors
- Missing data files are handled gracefully
- Promise rejections for async operations
- Error flags in callback functions

## Benchmark Notes
- Uses direct database file access for maximum performance
- Minimal memory footprint compared to in-memory solutions
- Good for applications requiring fast WordNet lookups
- Caching support improves repeated query performance
- Pure JavaScript implementation ensures broad compatibility
- **Unique**: Only library with dual Promise/Callback API and morphological forms support

## Real-World Usage & Tests
For real-world usage examples, feature comparisons, and integration tests, see:
- [alternatives.test.ts](../../tests/alternatives.test.ts): Comprehensive cross-library tests and usage patterns for node-wordnet and other WordNet libraries. 