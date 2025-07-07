# Natural Node/natural

**Repository**: https://github.com/NaturalNode/natural  
**Language**: JavaScript  
**Stars**: 10,000+  
**Last Updated**: 2024  

## Description
Natural is a natural language processing library for Node.js that includes comprehensive WordNet functionality along with many other NLP tools like tokenization, stemming, classification, and more.

## Key Features
- Complete WordNet integration
- Part-of-speech tagging
- Tokenization and stemming
- Classification algorithms
- Phonetic matching
- Sentiment analysis
- Extensive NLP toolkit

## Installation
```bash
npm install natural
```

## Basic Usage
```javascript
const natural = require('natural');
const wordnet = new natural.WordNet();

// Look up synsets
wordnet.lookup('run', (results) => {
  console.log(results);
});

// Get synonyms
wordnet.getSynonyms('happy', (synonyms) => {
  console.log(synonyms);
});

// Get hypernyms
wordnet.getHypernyms('dog', (hypernyms) => {
  console.log(hypernyms);
});
```

## API Methods
- `lookup(word, callback)` - Find synsets for a word
- `getSynonyms(word, callback)` - Get synonyms for a word
- `getHypernyms(word, callback)` - Get hypernyms
- `getHyponyms(word, callback)` - Get hyponyms
- `getAntonyms(word, callback)` - Get antonyms
- `getDefinitions(word, callback)` - Get definitions

## Performance Characteristics
- Comprehensive NLP library with WordNet as one component
- Good for applications needing multiple NLP features
- Moderate memory usage due to full feature set
- Well-maintained and widely used

## Benchmark Notes
- Part of a larger NLP ecosystem
- May have overhead from additional features
- Good for applications requiring multiple NLP capabilities
- Mature and stable implementation