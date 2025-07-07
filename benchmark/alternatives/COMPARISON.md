# WordNet Library Comparison

This document provides a comprehensive comparison of WordNet libraries available in the JavaScript/TypeScript ecosystem, including the Python reference implementation.

## Quick Comparison Table

| Feature                    | wn-ts | natural | morungos/wordnet | wordpos | words/wordnet | python-wn |
|---------------------------|-------|---------|------------------|---------|---------------|-----------|
| Language Support          | Multi | English | English          | English | English       | Multi     |
| OpenMultilingual Support  | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| API Style                 | Async | Callback| Callback         | Callback| Promise       | Sync      |
| TypeScript Support        | ✅    | ❌      | ❌               | ❌      | ✅            | ❌        |
| Core Operations           | ✅    | ✅      | ✅               | ✅      | ✅            | ✅        |
| Synset Lookup             | ✅    | ✅      | ✅               | ✅      | ✅            | ✅        |
| Word Lookup               | ✅    | ✅      | ✅               | ✅      | ✅            | ✅        |
| Sense Lookup              | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| Hypernym Traversal        | ✅    | ✅      | ✅               | ❌      | ✅            | ✅        |
| Hyponym Traversal         | ✅    | ✅      | ✅               | ❌      | ✅            | ✅        |
| Antonym Lookup            | ✅    | ✅      | ❌               | ❌      | ✅            | ✅        |
| Similarity Metrics        | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| Information Content       | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| POS Tagging               | ❌    | ✅      | ❌               | ✅      | ❌            | ❌        |
| Random Word Generation     | ❌    | ❌      | ❌               | ✅      | ❌            | ❌        |
| LMF Support               | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| Database Export           | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| Project Management        | ✅    | ❌      | ❌               | ❌      | ❌            | ✅        |
| Memory Usage              | Low   | High    | Low              | Low     | Low           | Medium    |
| Performance               | High  | Medium  | High             | High    | Medium        | High      |
| Browser Support           | ❌    | ❌      | ✅               | ✅      | ✅            | ❌        |
| Active Maintenance        | ✅    | ✅      | ❌               | ✅      | ✅            | ✅        |

## Field Coverage Analysis

### Result Object Fields by Library

| Field | wn-ts | natural | morungos/wordnet | wordpos | words/wordnet | python-wn |
|-------|-------|---------|------------------|---------|---------------|-----------|
| **Core Identifiers** |
| id/synsetId | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| synsetOffset | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Word Information** |
| lemma/word | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| pos/partOfSpeech | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Semantic Content** |
| definition/gloss/def | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| examples/exp | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Relationships** |
| synonyms | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| hypernyms | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| hyponyms | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| antonyms | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Metadata** |
| language | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| lexicon | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| ili | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Pointers** |
| ptrs/relations | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |

### Field Details by Library

#### wn-ts (WordNet TypeScript Port)
**Synset Result Fields:**
- `id`: Unique synset identifier
- `partOfSpeech`: Part of speech (n, v, a, r)
- `ili`: Interlingual Index identifier
- `definitions`: Array of definition objects with text
- `examples`: Array of example objects with text
- `relations`: Array of relation objects (type, target)
- `language`: Language code (e.g., 'en')
- `lexicon`: Lexicon identifier
- `members`: Array of member words

**Word Result Fields:**
- `id`: Unique word identifier
- `lemma`: Word form
- `partOfSpeech`: Part of speech
- `language`: Language code
- `lexicon`: Lexicon identifier
- `forms`: Array of word forms
- `tags`: Array of tags
- `pronunciations`: Array of pronunciations
- `counts`: Array of frequency counts

#### Natural Node/natural
**Synset Result Fields:**
- `synsetOffset`: WordNet synset offset
- `pos`: Part of speech (n, v, a, r, s)
- `lemma`: Word form
- `synonyms`: Array of synonyms
- `gloss`: Definition and examples
- `def`: Definition text
- `exp`: Example sentences
- `ptrs`: Array of pointers to other synsets
- `meta`: Metadata information

#### morungos/wordnet
**Synset Result Fields:**
- `synset`: Synset identifier
- `pos`: Part of speech
- `word`: Word form
- `def`: Definition text
- `exp`: Example sentences
- `ptrs`: Array of pointers to other synsets

#### moos/wordpos
**Synset Result Fields:**
- `synsetOffset`: WordNet synset offset
- `pos`: Part of speech
- `lemma`: Word form
- `synonyms`: Array of synonyms
- `gloss`: Definition and examples

**POS Tagging Results:**
- `nouns`: Array of noun strings
- `verbs`: Array of verb strings
- `adjectives`: Array of adjective strings
- `adverbs`: Array of adverb strings

#### words/wordnet
**Synset Result Fields:**
- `id`: Unique synset identifier
- `pos`: Part of speech
- `lemma`: Word form
- `synonyms`: Array of synonyms
- `definition`: Definition text

#### goodmami/wn (Python)
**Synset Result Fields:**
- `id`: Unique synset identifier
- `pos`: Part of speech
- `lemma`: Word form
- `definitions`: Array of definition objects
- `examples`: Array of example objects
- `relations`: Array of relation objects
- `language`: Language code
- `lexicon`: Lexicon identifier
- `ili`: Interlingual Index identifier

## Usage Ergonomics Comparison

### API Style and Patterns

#### Async/Await (Modern)
```typescript
// wn-ts
const synsets = await wn.synsets('run', 'v');
const words = await wn.words('computer');
const senses = await wn.senses('happy');

// words/wordnet
const synsets = await wordnet.synsets('run', 'v');
const hypernyms = await wordnet.hypernyms('dog');
```

#### Promise-based
```typescript
// words/wordnet
wordnet.synsets('run', 'v').then(synsets => {
  console.log(synsets);
});
```

#### Callback-based (Legacy)
```javascript
// natural
wordnet.lookup('run', (results) => {
  console.log(results);
});

// morungos/wordnet
wn.lookup('run', 'v', (result) => {
  console.log(result);
});

// wordpos
wordpos.lookup('run', (result) => {
  console.log(result);
});
```

### Error Handling Patterns

#### wn-ts (Graceful)
```typescript
const synsets = await wn.synsets('nonexistent', 'n');
// Returns empty array, no error thrown
```

#### natural (Callback with Error)
```javascript
wordnet.lookup('nonexistent', (results, error) => {
  if (error) {
    console.error('Word not found');
  }
});
```

#### words/wordnet (Promise Rejection)
```typescript
try {
  const synsets = await wordnet.synsets('nonexistent', 'n');
} catch (error) {
  console.error('Word not found');
}
```

### Result Structure Consistency

| Library | Array Results | Object Results | Nested Objects | Type Safety |
|---------|---------------|----------------|----------------|-------------|
| wn-ts | ✅ | ✅ | ✅ | ✅ |
| natural | ✅ | ❌ | ❌ | ❌ |
| morungos/wordnet | ✅ | ❌ | ❌ | ❌ |
| wordpos | ✅ | ✅ | ❌ | ❌ |
| words/wordnet | ✅ | ❌ | ❌ | ✅ |
| python-wn | ✅ | ✅ | ✅ | ❌ |

## Benchmark Methodology

### Performance Metrics

1. **Initialization Time**: Time to load and prepare the library
2. **Lookup Time**: Time to perform common operations
3. **Memory Usage**: Peak memory consumption during operations
4. **Throughput**: Operations per second for bulk processing

### Test Operations

1. **Synset Lookup**: Find all synsets for common words
2. **Word Lookup**: Find all words matching a pattern
3. **Sense Lookup**: Find all senses for a word (where supported)
4. **Relationship Traversal**: Find hypernyms/hyponyms
5. **POS Tagging**: Extract parts of speech from text (where supported)
6. **Random Generation**: Generate random words (where supported)

### Benchmark Environment

- **Platform**: Node.js 18+
- **Memory**: 8GB+ available
- **CPU**: Multi-core processor
- **Warm-up**: 3 iterations before measurement
- **Measurement**: 10 iterations, median reported
- **Test Data**: Common English words, varied POS tags

### Benchmark Results

*[Benchmark results will be populated after running the benchmark suite]*

## Recommendations

### For Full WordNet Functionality
**Choose**: wn-ts or python-wn
- wn-ts for TypeScript/Node.js applications
- python-wn for Python applications

### For Multi-language Support
**Choose**: wn-ts or python-wn
- Both support OpenMultilingual WordNet
- wn-ts has better TypeScript integration

### For Browser Applications
**Choose**: morungos/wordnet, wordpos, or words/wordnet
- morungos/wordnet for performance
- wordpos for POS utilities
- words/wordnet for clean API

### For NLP Pipelines
**Choose**: natural
- Comprehensive NLP toolkit
- Built-in POS tagging, stemming, etc.

### For Performance-Critical Applications
**Choose**: morungos/wordnet or wn-ts
- morungos/wordnet for simple lookups
- wn-ts for full functionality with good performance

### For Modern JavaScript/TypeScript
**Choose**: wn-ts or words/wordnet
- wn-ts for full features
- words/wordnet for clean, simple API

## Migration Paths

### From natural to wn-ts
- Replace callback APIs with async/await
- Use wn-ts for WordNet operations
- Keep natural for other NLP features

### From morungos/wordnet to wn-ts
- Replace callbacks with async/await
- Gain access to full WordNet features
- Maintain good performance

### From wordpos to wn-ts
- Replace POS utilities with dedicated POS library
- Use wn-ts for WordNet operations
- Consider combining with natural for full NLP

### From words/wordnet to wn-ts
- Similar API style (both modern)
- Gain access to full WordNet features
- Maintain TypeScript support

## Conclusion

Each library serves different use cases:

- **wn-ts**: Best for applications requiring full WordNet functionality with modern TypeScript
- **natural**: Best for comprehensive NLP pipelines
- **morungos/wordnet**: Best for performance-critical, simple lookups
- **wordpos**: Best for POS-focused text analysis
- **words/wordnet**: Best for clean, modern APIs with basic WordNet needs
- **python-wn**: Best for Python applications and reference implementation

The choice depends on your specific requirements for features, performance, platform support, and development preferences. 