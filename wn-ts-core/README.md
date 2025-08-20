# wn-ts-core

Core TypeScript interfaces and abstract classes for the WordNet TypeScript ecosystem. This package provides environment-agnostic definitions that concrete implementations (wn-ts-web, wn-ts-node) must implement.

## Features

- **Complete Python Wn API Compatibility**: Implements all query methods from the Python Wn library
- **Environment Agnostic**: Works in browsers, Node.js, and other JavaScript environments
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Enhanced Querying**: Advanced filtering, fuzzy search, and cross-lingual capabilities
- **Morphological Analysis**: Built-in lemmatization and normalization support
- **Interlingual Queries**: Cross-language concept mapping via ILI (Interlingual Index)

## Installation

```bash
pnpm add wn-ts-core
```

## Quick Start

```typescript
import { BaseWordnet } from 'wn-ts-core';

// Create a concrete implementation (e.g., from wn-ts-web or wn-ts-node)
const wordnet = new ConcreteWordnet({
  lexicon: 'oewn',
  lang: 'en'
});

// Basic queries (Python Wn compatible)
const words = await wordnet.words('pike');
const synsets = await wordnet.synsets('hound', { pos: 'n' });
const senses = await wordnet.senses('chat');

// Advanced queries
const hypernyms = await wordnet.getHypernyms(synsetId);
const translations = await wordnet.translateWord(wordId, 'fr');
const morphy = await wordnet.morphy('running', 'v');
```

## API Reference

### Primary Queries

These methods provide the core querying functionality, matching the Python Wn API exactly:

#### `words(query?: WordQuery): Promise<Word[]>`
Get words matching the query criteria. Equivalent to `wn.words()` in Python Wn.

```typescript
// Get all words for 'pike'
const words = await wordnet.words('pike');

// Filter by part of speech
const verbs = await wordnet.words('pencil', { pos: 'v' });

// Filter by lexicon
const ewnWords = await wordnet.words('chat', { lexicon: 'ewn' });

// Filter by language
const frenchWords = await wordnet.words('chat', { lang: 'fr' });
```

#### `word(wordId: string): Promise<Word>`
Get a specific word by ID. Equivalent to `wn.word()` in Python Wn.

```typescript
const word = await wordnet.word('ewn-pencil-n');
```

#### `synsets(query?: SynsetQuery): Promise<Synset[]>`
Get synsets matching the query criteria. Equivalent to `wn.synsets()` in Python Wn.

```typescript
// Get all synsets for 'hound'
const synsets = await wordnet.synsets('hound');

// Filter by part of speech
const nounSynsets = await wordnet.synsets('hound', { pos: 'n' });

// Filter by ILI
const iliSynsets = await wordnet.synsets({ ili: 'i74874' });
```

#### `synset(synsetId: string): Promise<Synset>`
Get a specific synset by ID. Equivalent to `wn.synset()` in Python Wn.

```typescript
const synset = await wordnet.synset('ewn-02090203-n');
```

#### `senses(query?: SenseQuery): Promise<Sense[]>`
Get senses matching the query criteria. Equivalent to `wn.senses()` in Python Wn.

```typescript
const senses = await wordnet.senses('dark', { pos: 'n' });
```

#### `sense(senseId: string): Promise<Sense>`
Get a specific sense by ID. Equivalent to `wn.sense()` in Python Wn.

```typescript
const sense = await wordnet.sense('ewn-dark-n-14007000-01');
```

### Enhanced Query Methods

Advanced querying capabilities beyond the basic Python Wn API:

#### `searchWords(query): Promise<Word[]>`
Enhanced word search with fuzzy matching and advanced filtering.

```typescript
const results = await wordnet.searchWords({
  form: 'penc',
  fuzzy: true,
  maxResults: 10,
  includeForms: true
});
```

#### `searchSynsets(query): Promise<Synset[]>`
Enhanced synset search with advanced filtering options.

```typescript
const results = await wordnet.searchSynsets({
  form: 'hound',
  pos: 'n',
  includeDefinitions: true,
  includeExamples: true
});
```

#### `wordsByForm(form, options): Promise<Word[]>`
Get words by form, including inflected forms.

```typescript
const words = await wordnet.wordsByForm('running', {
  pos: 'v',
  includeInflected: true
});
```

#### `synsetsByForm(form, options): Promise<Synset[]>`
Get synsets by word form.

```typescript
const synsets = await wordnet.synsetsByForm('hound', { pos: 'n' });
```

### Lemmatization and Normalization

Morphological analysis capabilities matching Python Wn's lemmatization features:

#### `morphy(form, pos?): Promise<Record<PartOfSpeech, Set<string>>>`
Find base forms of a word using morphological analysis. Equivalent to `wn.morphy()` in Python Wn.

```typescript
const baseForms = await wordnet.morphy('running', 'v');
// Returns: { 'v': Set { 'run' } }

const allForms = await wordnet.morphy('running');
// Returns: { 'v': Set { 'run' }, 'n': Set { 'run' } }
```

#### `getWordForms(wordId): Promise<string[]>`
Get all forms of a word (including inflections). Equivalent to `Word.forms()` in Python Wn.

```typescript
const forms = await wordnet.getWordForms('ewn-goose-n');
// Returns: ['goose', 'geese']
```

#### `getWordLemma(wordId): Promise<string>`
Get the canonical form (lemma) of a word. Equivalent to `Word.lemma()` in Python Wn.

```typescript
const lemma = await wordnet.getWordLemma('ewn-goose-n');
// Returns: 'goose'
```

#### `getDerivedWords(wordId): Promise<Word[]>`
Get derived words (morphologically related). Equivalent to `Word.derived_words()` in Python Wn.

```typescript
const derived = await wordnet.getDerivedWords('ewn-goose-n');
// Returns: [Word('ewn-gosling-n'), Word('ewn-goosy-s')]
```

#### `normalizeForm(form): Promise<string>`
Normalize a word form using the configured normalizer.

```typescript
const normalized = await wordnet.normalizeForm('RUNNING');
// Returns: 'running'
```

### Relationship Queries

Hierarchical and semantic relationship queries:

#### `getHypernyms(synsetId): Promise<Synset[]>`
Get hypernyms (more general concepts). Equivalent to `Synset.hypernyms()` in Python Wn.

```typescript
const hypernyms = await wordnet.getHypernyms('ewn-hound-n-02090203-n');
// Returns: [Synset('ewn-hunting_dog-n-02089774-n')]
```

#### `getHyponyms(synsetId): Promise<Synset[]>`
Get hyponyms (more specific concepts). Equivalent to `Synset.hyponyms()` in Python Wn.

```typescript
const hyponyms = await wordnet.getHyponyms('ewn-hound-n-02090203-n');
// Returns: [Synset('ewn-afghan-n-02090379-n'), ...]
```

#### `getRelatedSynsets(synsetId, relationType): Promise<Synset[]>`
Get all related synsets by relation type. Equivalent to `Synset.get_related()` in Python Wn.

```typescript
const antonyms = await wordnet.getRelatedSynsets(synsetId, 'antonym');
const meronyms = await wordnet.getRelatedSynsets(synsetId, 'part_meronym');
```

#### `getRelatedSenses(senseId, relationType): Promise<Sense[]>`
Get all related senses by relation type. Equivalent to `Sense.get_related()` in Python Wn.

```typescript
const antonyms = await wordnet.getRelatedSenses(senseId, 'antonym');
const derivations = await wordnet.getRelatedSenses(senseId, 'derivation');
```

#### `getShortestPath(synsetId1, synsetId2): Promise<Synset[]>`
Get the shortest path between two synsets. Equivalent to `Synset.shortest_path()` in Python Wn.

```typescript
const path = await wordnet.getShortestPath(
  'ewn-hound-n-02090203-n',
  'ewn-dog-n-02086723-n'
);
// Returns: [hound_synset, hunting_dog_synset, dog_synset]
```

#### `getSynsetDepth(synsetId): Promise<number>`
Get the depth of a synset in the hierarchy. Equivalent to `Synset.max_depth()` in Python Wn.

```typescript
const depth = await wordnet.getSynsetDepth('ewn-hound-n-02090203-n');
// Returns: 15
```

### Translation and Cross-Lingual Queries

Interlingual capabilities for multilingual WordNet projects:

#### `translateWord(wordId, targetLang): Promise<Record<string, Word[]>>`
Translate a word to target language(s). Equivalent to `Word.translate()` in Python Wn.

```typescript
const translations = await wordnet.translateWord('ewn-goose-n', 'ja');
// Returns: { 'ewn-goose-n-01858313-01': [Word('wnja-n-1254'), ...] }
```

#### `translateSynset(synsetId, targetLang): Promise<Synset[]>`
Translate a synset to target language(s). Equivalent to `Synset.translate()` in Python Wn.

```typescript
const translations = await wordnet.translateSynset('ewn-hound-n-02090203-n', 'fr');
// Returns: [Synset('frawn-02087551-n')]
```

#### `translateSense(senseId, targetLang): Promise<Sense[]>`
Translate a sense to target language(s). Equivalent to `Sense.translate()` in Python Wn.

```typescript
const translations = await wordnet.translateSense(senseId, 'fr');
// Returns: [Sense('frawn-lex52992--13983515-n')]
```

#### `getCrossLingualSynsets(iliId, targetLangs?): Promise<Record<string, Synset[]>>`
Get cross-lingual synsets by ILI.

```typescript
const crossLingual = await wordnet.getCrossLingualSynsets('i74874', ['en', 'ja', 'fr']);
// Returns: { 'en': [...], 'ja': [...], 'fr': [...] }
```

### Interlingual Queries

Cross-language concept mapping via ILI:

#### `ili(iliId): Promise<ILI>`
Get ILI by ID. Equivalent to `wn.ili()` in Python Wn.

```typescript
const ili = await wordnet.ili('i74874');
```

#### `ilis(status?): Promise<ILI[]>`
Get all ILIs, optionally filtered by status. Equivalent to `wn.ilis()` in Python Wn.

```typescript
const allILIs = await wordnet.ilis();
const standardILIs = await wordnet.ilis('standard');
```

#### `synsetsByILI(iliId): Promise<Synset[]>`
Get synsets by ILI (cross-language concept lookup). Equivalent to `wn.synsets(ili='...')` in Python Wn.

```typescript
const synsets = await wordnet.synsetsByILI('i74874');
// Returns synsets from all languages for the same concept
```

### Content and Metadata Queries

Access to definitions, examples, and other content:

#### `getDefinitions(synsetId): Promise<string[]>`
Get definitions for a synset. Equivalent to `Synset.definition()` in Python Wn.

```typescript
const definitions = await wordnet.getDefinitions('ewn-hound-n-02090203-n');
// Returns: ['any of several breeds of dog used for hunting...']
```

#### `getExamples(synsetId): Promise<string[]>`
Get examples for a synset. Equivalent to `Synset.examples()` in Python Wn.

```typescript
const examples = await wordnet.getExamples('ewn-hound-n-02090203-n');
```

#### `getSenseExamples(senseId): Promise<string[]>`
Get examples for a sense. Equivalent to `Sense.examples()` in Python Wn.

```typescript
const examples = await wordnet.getSenseExamples(senseId);
```

#### `getSynsetWords(synsetId): Promise<Word[]>`
Get all words in a synset. Equivalent to `Synset.words()` in Python Wn.

```typescript
const words = await wordnet.getSynsetWords('ewn-hound-n-02090203-n');
// Returns: [Word('ewn-hound-n'), Word('ewn-hound_dog-n')]
```

#### `getSynsetLemmas(synsetId): Promise<string[]>`
Get all lemmas in a synset. Equivalent to `Synset.lemmas()` in Python Wn.

```typescript
const lemmas = await wordnet.getSynsetLemmas('ewn-hound-n-02090203-n');
// Returns: ['hound', 'hound dog']
```

#### `getSynsetSenses(synsetId): Promise<Sense[]>`
Get all senses in a synset. Equivalent to `Synset.senses()` in Python Wn.

```typescript
const senses = await wordnet.getSynsetSenses('ewn-hound-n-02090203-n');
```

### Lexicon Management

Working with multiple WordNet projects:

#### `lexicons(): Promise<Lexicon[]>`
Get all available lexicons. Equivalent to `wn.lexicons()` in Python Wn.

```typescript
const lexicons = await wordnet.lexicons();
// Returns: [Lexicon('oewn'), Lexicon('wnja'), ...]
```

#### `expandedLexicons(): Promise<Lexicon[]>`
Get expanded lexicons (dependencies). Equivalent to `wn.expanded_lexicons()` in Python Wn.

```typescript
const expanded = await wordnet.expandedLexicons();
```

#### `getProjects(): Promise<Project[]>`
Get projects (metadata about WordNet projects). Equivalent to `wn.projects()` in Python Wn.

```typescript
const projects = await wordnet.getProjects();
```

#### `hasLexicon(lexiconId): Promise<boolean>`
Check if a lexicon is available.

```typescript
const hasEwn = await wordnet.hasLexicon('ewn');
```

#### `getSupportedLanguages(): Promise<string[]>`
Get supported languages.

```typescript
const languages = await wordnet.getSupportedLanguages();
// Returns: ['en', 'ja', 'fr', ...]
```

#### `getLexiconDependencies(lexiconId): Promise<string[]>`
Get lexicon dependencies.

```typescript
const deps = await wordnet.getLexiconDependencies('ewn');
```

### Statistics and Analytics

Data quality and usage metrics:

#### `getStatistics(): Promise<Statistics>`
Get overall statistics. Equivalent to `wn.statistics()` in Python Wn.

```typescript
const stats = await wordnet.getStatistics();
// Returns: { totalWords: 311711, totalSynsets: 117659, ... }
```

#### `getLexiconStatistics(lexiconId?): Promise<LexiconStats[]>`
Get lexicon-specific statistics.

```typescript
const stats = await wordnet.getLexiconStatistics();
// Returns statistics for each lexicon
```

#### `getDataQualityMetrics(): Promise<QualityMetrics>`
Get data quality metrics.

```typescript
const quality = await wordnet.getDataQualityMetrics();
// Returns: { synsetsWithILI: 117659, iliCoveragePercentage: 100, ... }
```

#### `getPartOfSpeechDistribution(): Promise<Record<string, number>>`
Get part of speech distribution.

```typescript
const posDist = await wordnet.getPartOfSpeechDistribution();
// Returns: { 'n': 117659, 'v': 11595, 'a': 22547, 'r': 5581 }
```

#### `getSynsetSizeAnalysis(): Promise<SizeAnalysis>`
Get synset size analysis.

```typescript
const sizeAnalysis = await wordnet.getSynsetSizeAnalysis();
// Returns: { averageSize: 1.23, maxSize: 8, minSize: 1, ... }
```

### Configuration Options

The `WordnetOptions` interface supports advanced configuration:

```typescript
interface WordnetOptions {
  lexicon?: string | string[];        // Single lexicon or array of lexicons
  version?: string;                   // Specific version
  expand?: string | string[];         // Expand dependencies
  normalizer?: (form: string) => string;  // Custom normalizer function
  lemmatizer?: (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>;  // Custom lemmatizer
  searchAllForms?: boolean;           // Search inflected forms (default: true)
  lang?: string;                      // Language filter
}
```

#### Custom Normalizer

```typescript
const wordnet = new ConcreteWordnet({
  normalizer: (form: string) => form.toLowerCase().trim()
});
```

#### Custom Lemmatizer

```typescript
const wordnet = new ConcreteWordnet({
  lemmatizer: (form: string, pos?: PartOfSpeech) => {
    // Custom lemmatization logic
    return { 'n': new Set(['custom_lemma']) };
  }
});
```

### Convenience Methods

Python Wn compatibility helpers:

```typescript
// These methods provide direct Python Wn API compatibility
await wordnet.wn_words('pike');      // Alias for words()
await wordnet.wn_synsets('hound');   // Alias for synsets()
await wordnet.wn_senses('chat');     // Alias for senses()
await wordnet.wn_word('ewn-pike-n'); // Alias for word()
await wordnet.wn_synset('ewn-03311555-n'); // Alias for synset()
await wordnet.wn_sense('ewn-pike-n-03311555-01'); // Alias for sense()
```

## Type Definitions

### Core Types

```typescript
interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  forms: Form[];
  pronunciations: Pronunciation[];
  tags: Tag[];
  counts: Count[];
  frames?: SyntacticBehaviour[];
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  ili?: string;
  pos: PartOfSpeech;
  definitions: Definition[];
  examples: Example[];
  relations: Relation[];
  iliDefinitions?: Definition[];
  language: string;
  lexicon: string;
  members: string[];
  senses: string[];
}

interface Sense {
  id: string;
  word: string;
  synset: string;
  examples: Example[];
  counts: Count[];
  tags: Tag[];
  relations?: Relation[];
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}
```

### Query Types

```typescript
interface WordQuery {
  form?: string;
  pos?: PartOfSpeech;
  lexicon?: string | string[];
  lang?: string;
}

interface SynsetQuery {
  form?: string;
  pos?: PartOfSpeech;
  ili?: string | ILI;
  lexicon?: string | string[];
  lang?: string;
}

interface SenseQuery {
  form?: string;
  pos?: PartOfSpeech;
  lexicon?: string | string[];
  lang?: string;
  wordIdOrForm?: string;
}
```

## Implementation Notes

### Abstract Class

`BaseWordnet` is an abstract class that defines the complete interface. Concrete implementations must provide:

1. **Database Connectivity**: Environment-specific database access
2. **Query Implementation**: All abstract methods must be implemented
3. **Performance Optimization**: Efficient query execution
4. **Error Handling**: Proper error handling and validation

### Environment Support

- **Browser**: Use `wn-ts-web` for SQLite WASM-based implementation
- **Node.js**: Use `wn-ts-node` for better-sqlite3-based implementation
- **Other**: Implement the abstract interface for your environment

### Performance Considerations

- **Lazy Loading**: Implement lazy loading for large datasets
- **Caching**: Add appropriate caching for frequently accessed data
- **Indexing**: Ensure proper database indexing for query performance
- **Batch Operations**: Support batch queries for bulk operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement the required abstract methods
4. Add comprehensive tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Packages

- **wn-ts-web**: Browser-based implementation using SQLite WASM
- **wn-ts-node**: Node.js implementation using better-sqlite3
- **wn-ts-cli**: Command-line interface for WordNet operations
