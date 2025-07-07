# wn-ts Usage Guide

This guide provides a comprehensive overview of how to use the `wn-ts` TypeScript library for working with WordNet data. It covers installation, basic and advanced usage, CLI commands, project management, troubleshooting, and a glossary of key terms.

---

## Table of Contents
- [wn-ts Usage Guide](#wn-ts-usage-guide)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API Usage](#api-usage)
    - [Wordnet Class](#wordnet-class)
      - [Common Methods](#common-methods)
      - [Example: Get all nouns for a word](#example-get-all-nouns-for-a-word)
      - [Example: Get all synsets for a word in a specific language](#example-get-all-synsets-for-a-word-in-a-specific-language)
    - [Module Functions](#module-functions)
    - [Project Management](#project-management)
    - [Data Management](#data-management)
    - [Similarity \& Information Content](#similarity--information-content)
  - [Advanced API: Submodule Exports](#advanced-api-submodule-exports)
    - [Similarity Metrics](#similarity-metrics)
    - [Taxonomy Utilities](#taxonomy-utilities)
    - [Morphological Analysis](#morphological-analysis)
    - [Information Content (IC)](#information-content-ic)
  - [Command-Line Interface (CLI)](#command-line-interface-cli)
  - [Advanced Features](#advanced-features)
    - [Browser Usage](#browser-usage)
    - [Custom Queries \& Filtering](#custom-queries--filtering)
    - [Working with Multiple Languages](#working-with-multiple-languages)
    - [Exporting Data](#exporting-data)
    - [Error Handling](#error-handling)
  - [Testing \& Examples](#testing--examples)
  - [Troubleshooting](#troubleshooting)
  - [Glossary](#glossary)
  - [Further Reading](#further-reading)

---

## Installation

Install the published package from npm:

```bash
npm install wn-ts
# or
pnpm add wn-ts
```

---

## Quick Start

```typescript
import { Wordnet, download, add } from 'wn-ts';

// Download and add a WordNet project
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');

// Create a WordNet instance
const wn = new Wordnet('oewn');

// Look up words
const words = await wn.words('run', 'v');
console.log(words);

// Get synsets
const synsets = await wn.synsets('run', 'v');
synsets.forEach(synset => {
  console.log(`Synset: ${synset.id}`);
  console.log(`Definition: ${synset.definitions[0]?.text}`);
});
```

---

## API Usage

> **Note:** As of v0.1.1, advanced features are available via submodule exports. You can now import similarity, taxonomy, morphy, and information content utilities directly from submodules, e.g. `import { path } from 'wn-ts/similarity'`.

> **Important:** The database (`db`) export is for internal debugging only and should not be used directly in applications. Always use the Wordnet instance methods or module functions for data access.

### Wordnet Class

The main entry point for querying WordNet data is the `Wordnet` class:

```typescript
import { Wordnet } from 'wn-ts';
const wn = new Wordnet('oewn');
```

#### Common Methods
- `wn.words(form: string, pos?: string)` — Find words by form and part of speech
- `wn.synsets(form: string, pos?: string)` — Find synsets by form and part of speech
- `wn.senses(form: string, pos?: string)` — Find senses by form and part of speech
- `wn.word(id: string)` — Get a word by ID
- `wn.synset(id: string)` — Get a synset by ID
- `wn.sense(id: string)` — Get a sense by ID
- `wn.lexicons()` — List available lexicons

#### Example: Get all nouns for a word
```typescript
const nouns = await wn.words('bank', 'n');
console.log(nouns.map(w => w.lemma));
```

#### Example: Get all synsets for a word in a specific language
```typescript
const wnFr = new Wordnet('omw-fr:1.4');
const synsetsFr = await wnFr.synsets('ordinateur', 'n');
console.log(synsetsFr);
```

### Module Functions

For convenience, you can use top-level functions:

```typescript
import { words, synsets, senses, projects } from 'wn-ts';

const ws = await words('run', 'v');
const ss = await synsets('run', 'v');
const sensesList = await senses('run', 'v');
const allProjects = await projects();
```

### Project Management

Manage available projects and versions:

```typescript
import { getProjects, getProject, getProjectVersions } from 'wn-ts';

const projects = getProjects();
const oewn = getProject('oewn');
const oewnVersions = getProjectVersions('oewn');
```

### Data Management

- **Download a project:**
  ```typescript
  import { download } from 'wn-ts';
  await download('oewn:2024');
  ```
- **Add a lexical resource:**
  ```typescript
  import { add } from 'wn-ts';
  await add('oewn-2024-english-wordnet-2024.xml.gz');
  ```
- **Remove a lexicon:**
  ```typescript
  import { remove } from 'wn-ts';
  await remove('oewn');
  ```
- **Export data:**
  ```typescript
  import { exportData } from 'wn-ts';
  await exportData({ format: 'json', output: 'wn-export.json', include: ['oewn'] });
  ```

### Similarity & Information Content

```typescript
// For advanced similarity and IC, see the submodule section below!
import { path, wup, lch, res, jcn, lin } from 'wn-ts/similarity';
import { compute, information_content } from 'wn-ts/ic';

// Compute Information Content (IC) from a corpus
const freq = await compute(['run', 'running', 'runner'], wn);

// Calculate IC for a synset
const ic = information_content(synsets[0], freq);

// Path similarity
const sim = await path(synsets[0], synsets[1], wn);
```

### Statistics & Analysis

The library provides built-in methods for database statistics and data quality analysis:

```typescript
// Get overall database statistics
const stats = await wn.getStatistics();
console.log(`Total words: ${stats.totalWords}`);
console.log(`Total synsets: ${stats.totalSynsets}`);
console.log(`Total senses: ${stats.totalSenses}`);
console.log(`Total ILI entries: ${stats.totalILIs}`);
console.log(`Total lexicons: ${stats.totalLexicons}`);

// Get lexicon-specific statistics
const lexiconStats = await wn.getLexiconStatistics();
lexiconStats.forEach(stat => {
  console.log(`${stat.lexiconId}: ${stat.wordCount} words, ${stat.synsetCount} synsets`);
});

// Analyze data quality
const quality = await wn.getDataQualityMetrics();
console.log(`Synsets with ILI: ${quality.synsetsWithILI}`);
console.log(`Synsets without ILI: ${quality.synsetsWithoutILI}`);
console.log(`ILI coverage: ${quality.iliCoveragePercentage}%`);
console.log(`Empty synsets: ${quality.emptySynsets}`);
console.log(`Synsets with definitions: ${quality.synsetsWithDefinitions}`);

// Get part-of-speech distribution
const posDist = await wn.getPartOfSpeechDistribution();
Object.entries(posDist).forEach(([pos, count]) => {
  const percentage = ((count / stats.totalSynsets) * 100).toFixed(2);
  console.log(`${pos.toUpperCase()}: ${count} synsets (${percentage}%)`);
});

// Get synset size analysis (for smaller databases)
const sizeAnalysis = await wn.getSynsetSizeAnalysis();
console.log(`Average synset size: ${sizeAnalysis.averageSize.toFixed(2)} words`);
console.log(`Largest synset: ${sizeAnalysis.maxSize} words`);
console.log(`Smallest synset: ${sizeAnalysis.minSize} words`);
```

---

## Advanced API: Submodule Exports

For advanced features, import from specific submodules:

### Similarity Metrics

```typescript
import { path, wup, lch, res, jcn, lin } from 'wn-ts/similarity';

// Path similarity
const pathSim = await path(synset1, synset2, wn);

// Wu-Palmer similarity
const wupSim = await wup(synset1, synset2, wn);

// Leacock-Chodorow similarity
const maxDepth = await taxonomyDepth(wn, 'n');
const lchSim = await lch(synset1, synset2, maxDepth, wn);

// Information Content-based metrics
const freq = await compute(corpus, wn);
const resSim = await res(synset1, synset2, freq, wn);
const jcnSim = await jcn(synset1, synset2, freq, wn);
const linSim = await lin(synset1, synset2, freq, wn);
```

### Taxonomy Utilities

```typescript
import { 
  roots, 
  leaves, 
  taxonomyDepth, 
  hypernymPaths, 
  taxonomyShortestPath 
} from 'wn-ts/taxonomy';

// Find root synsets
const rootSynsets = await roots(wn, 'n');

// Find leaf synsets
const leafSynsets = await leaves(wn, 'n');

// Calculate taxonomy depth
const depth = await taxonomyDepth(wn, 'n');

// Get hypernym paths
const paths = await hypernymPaths(synset, wn);

// Find shortest path between synsets
const path = await taxonomyShortestPath(synset1, synset2, wn);
```

### Morphological Analysis

```typescript
import { createMorphy } from 'wn-ts/morphy';

// Create a morphological analyzer
const morphy = createMorphy(wn);

// Analyze word forms
const forms = await morphy.analyze('running', 'v');
console.log(forms); // ['run', 'running']
```

### Information Content (IC)

```typescript
import { compute, information_content } from 'wn-ts/ic';

// Compute IC from corpus
const corpus = ['run', 'running', 'runner', 'runs'];
const freq = await compute(corpus, wn);

// Calculate IC for a synset
const ic = information_content(synset, freq);
```

---

## Command-Line Interface (CLI)

The library includes a command-line interface for data management:

```bash
# Install globally
npm install -g wn-ts

# Download a project
wn-ts download oewn:2024

# Add a lexical resource
wn-ts add oewn-2024-english-wordnet-2024.xml.gz

# Query the database
wn-ts query run v

# Export data
wn-ts export --format json --output export.json --include oewn
```

---

## Advanced Features

### Browser Usage

The library is designed to work in browser environments:

```typescript
// In a browser environment
import { Wordnet } from 'wn-ts';

// Create instance with browser-compatible options
const wn = new Wordnet('oewn', {
  dataDirectory: '/path/to/data',
  downloadDirectory: '/path/to/downloads'
});
```

### Custom Queries & Filtering

```typescript
// Custom filtering options
const synsets = await wn.synsets('run', 'v', {
  lang: 'en',
  lexicon: 'oewn'
});

// Advanced word lookup
const words = await wn.words('run', 'v', {
  searchAllForms: true,
  normalize: true
});
```

### Working with Multiple Languages

```typescript
// English WordNet
const wnEn = new Wordnet('oewn');

// French WordNet
const wnFr = new Wordnet('omw-fr:1.4');

// Compare across languages
const enSynsets = await wnEn.synsets('computer', 'n');
const frSynsets = await wnFr.synsets('ordinateur', 'n');
```

### Exporting Data

```typescript
// Export to JSON
await exportData({
  format: 'json',
  output: 'export.json',
  include: ['oewn']
});

// Export to XML
await exportData({
  format: 'xml',
  output: 'export.xml',
  include: ['oewn', 'omw-fr']
});

// Export to CSV
await exportData({
  format: 'csv',
  output: 'export.csv',
  include: ['oewn'],
  exclude: ['test']
});
```

### Error Handling

```typescript
try {
  const synsets = await wn.synsets('nonexistentword', 'n');
  if (synsets.length === 0) {
    console.log('No synsets found');
  }
} catch (error) {
  console.error('Error querying synsets:', error.message);
}

// Handle download errors
try {
  await download('invalid-project:1.0');
} catch (error) {
  console.error('Download failed:', error.message);
}
```

---

## Testing & Examples

The library includes comprehensive tests and examples:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

### Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { Wordnet } from 'wn-ts';

describe('Wordnet Class', () => {
  it('should find words', async () => {
    const wn = new Wordnet('oewn');
    const words = await wn.words('run', 'v');
    expect(words.length).toBeGreaterThan(0);
  });
});
```

---

## Troubleshooting

### Common Issues

**1. Database not initialized**
```bash
# Solution: Download and add a project first
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');
```

**2. No results found**
```typescript
// Check if the word exists in the specified part of speech
const words = await wn.words('word', 'n');
if (words.length === 0) {
  // Try without part of speech
  const allWords = await wn.words('word');
}
```

**3. Performance issues**
```typescript
// Use specific lexicons to improve performance
const wn = new Wordnet('oewn'); // Instead of '*'
```

### Debug Mode

Enable debug logging:

```typescript
import { logger } from 'wn-ts/utils/logger';

// Set log level
logger.setLevel('debug');
```

---

## Glossary

- **Synset**: A set of cognitive synonyms (words with the same meaning)
- **Sense**: A specific meaning of a word
- **Word**: A lexical item with its part of speech
- **ILI**: Interlingual Index - cross-language concept mapping
- **Lexicon**: A collection of words for a specific language
- **Project**: A WordNet resource (e.g., oewn, omw)
- **Corpus**: A collection of text used for frequency analysis
- **Information Content**: A measure of word specificity based on frequency

---

## Further Reading

- **Python wn Library**: [wn.readthedocs.io](https://wn.readthedocs.io/)
- **WordNet**: [wordnet.princeton.edu](https://wordnet.princeton.edu/)
- **Open English WordNet**: [github.com/globalwordnet/english-wordnet](https://github.com/globalwordnet/english-wordnet)
- **Open Multilingual Wordnet**: [github.com/omwn/omw](https://github.com/omwn/omw)

---

**Remember**: Always use the clean API through Wordnet instance methods or module functions. Do not access the database directly for application development.
