# moos/wordpos

**Repository**: https://github.com/moos/wordpos  
**Language**: JavaScript  
**Stars**: 500+  
**Last Updated**: 2024  

## Description
wordpos is a set of fast part-of-speech (POS) utilities for Node.js and browser using fast lookup in the WordNet database. Version 2.x is totally refactored and works in browsers with roughly 5x speed improvement over previous versions.

## Key Features
- Fast part-of-speech utilities
- Works in both Node.js and browser environments
- Optimized WordNet database lookups
- Promise-based API
- Command-line interface
- Random word generation
- Stopword filtering

## Installation
```bash
npm install wordpos
```

## Basic Usage
```javascript
const WordPOS = require('wordpos');
const wordpos = new WordPOS();

// Get all parts of speech for text
wordpos.getPOS('The angry bear chased the frightened little squirrel.', (result) => {
  console.log(result);
  // { nouns: ['bear', 'squirrel'], adjectives: ['angry', 'frightened', 'little'], verbs: ['chased'] }
});

// Get specific POS
wordpos.getNouns('The angry bear chased the frightened little squirrel.', (nouns) => {
  console.log(nouns); // ['bear', 'squirrel']
});

// Look up word definitions
wordpos.lookup('run', (result) => {
  console.log(result);
});
```

## API Methods
- `getPOS(text, callback)` - Get all parts of speech from text
- `getNouns(text, callback)` - Extract nouns from text
- `getVerbs(text, callback)` - Extract verbs from text
- `getAdjectives(text, callback)` - Extract adjectives from text
- `getAdverbs(text, callback)` - Extract adverbs from text
- `lookup(word, callback)` - Look up WordNet definitions
- `lookupNoun(word, callback)` - Look up noun definitions
- `rand(options, callback)` - Get random words

## Performance Characteristics
- 5x speed improvement over previous versions
- Fast index-based lookups
- Memory-efficient for large datasets
- Browser-compatible with wordpos-web
- Optimized for text processing workflows

## Benchmark Notes
- Specialized for part-of-speech tagging
- Excellent performance for text analysis
- Lightweight compared to full NLP libraries
- Good for applications focused on POS extraction
- Includes built-in benchmarking tools