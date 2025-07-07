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
    - [Module Functions](#module-functions)
    - [Project Management](#project-management)
    - [Data Management](#data-management)
    - [Similarity \& Information Content](#similarity--information-content)
  - [Command-Line Interface (CLI)](#command-line-interface-cli)
  - [Advanced Features](#advanced-features)
    - [Browser Usage](#browser-usage)
    - [Custom Queries & Filtering](#custom-queries--filtering)
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
import { path, wup, lch, res, jcn, lin, compute, information_content } from 'wn-ts';

// Compute Information Content (IC) from a corpus
const freq = await compute(['run', 'running', 'runner'], wn);

// Calculate IC for a synset
const ic = information_content(synsets[0], freq);

// Path similarity
const sim = await path(synsets[0], synsets[1], wn);
```

---

## Command-Line Interface (CLI)

wn-ts provides a CLI for common operations. Run from your project root:

```bash
pnpm exec wn-ts download oewn:2024
pnpm exec wn-ts add oewn-2024-english-wordnet-2024.xml.gz
pnpm exec wn-ts projects
pnpm exec wn-ts query run --pos v
```

See all commands:
```bash
pnpm exec wn-ts --help
```

---

## Advanced Features

### Browser Usage

`wn-ts` is designed to be browser-compatible (with some limitations):
- Use a bundler like Webpack, Vite, or Rollup.
- You may need to polyfill Node.js modules (e.g., `fs`, `path`) for full compatibility.
- For browser-only use, focus on querying pre-loaded data or using a REST API backend.

### Custom Queries & Filtering

You can filter by part of speech, language, or custom criteria:

```typescript
// Get all verbs for a word
const verbs = await wn.words('run', 'v');

// Get all synsets for a word in French
const wnFr = new Wordnet('omw-fr:1.4');
const synsetsFr = await wnFr.synsets('ordinateur', 'n');

// Filter synsets by custom logic
const filtered = synsets.filter(s => s.definitions.some(d => d.text.includes('financial')));
```

### Working with Multiple Languages

`wn-ts` supports multilingual WordNets via OMW:

```typescript
const wnDe = new Wordnet('odenet:1.4'); // German
const wnFr = new Wordnet('omw-fr:1.4'); // French
const wnEs = new Wordnet('omw-es:1.4'); // Spanish
```

### Exporting Data

Export data in JSON, XML, or CSV formats:

```typescript
import { exportData } from 'wn-ts';
await exportData({ format: 'json', output: 'wn-export.json', include: ['oewn'] });
await exportData({ format: 'xml', output: 'wn-export.xml', include: ['oewn'] });
await exportData({ format: 'csv', output: 'wn-export.csv', include: ['oewn'] });
```

### Error Handling

All API methods throw errors for invalid input or database issues. Use try/catch for robust scripts:

```typescript
try {
  const words = await wn.words('nonexistentword');
  if (words.length === 0) {
    console.log('No words found.');
  }
} catch (err) {
  console.error('Error querying WordNet:', err);
}
```

---

## Testing & Examples

- See [tests/e2e.test.ts](../tests/e2e.test.ts) for end-to-end usage examples.
- See [tests/](../tests/) for more API and edge case tests.
- See [README.md](../README.md) for a feature overview and more code samples.
- See [src/cli.ts](../src/cli.ts) for CLI command examples.

---

## Troubleshooting

- **Database is locked:**
  - Make sure no other process is using the database file.
  - Delete the data directory and re-run if needed.
- **No results found:**
  - Ensure you have downloaded and added the correct project/version.
  - Check your query spelling and part of speech.
- **Native errors or crashes:**
  - Always close the database with `await db.close()` in scripts.
  - Update dependencies if you see native stack traces.
- **Project listing shows 'unknown':**
  - Some project metadata may be missing; check the TOML index or use `getProjectVersions` for details.
- **Browser build errors:**
  - Use a bundler and polyfills for Node.js modules as needed.

---

## Glossary

- **WordNet**: A large lexical database of English (or other languages), grouping words into sets of synonyms (synsets).
- **Synset**: A set of synonymous words or phrases representing a single concept.
- **Sense**: A specific meaning of a word, linked to a synset.
- **Lexicon**: A collection of words and their properties for a particular language or project.
- **LMF (Lexical Markup Framework)**: An ISO standard for representing lexical resources in XML.
- **ILI (Interlingual Index)**: A mapping between synsets across different languages, enabling multilingual WordNet alignment.
- **POS (Part of Speech)**: The grammatical category of a word (e.g., noun, verb, adjective, adverb).
- **OMW (Open Multilingual Wordnet)**: A project providing multilingual WordNet resources.
- **IC (Information Content)**: A measure of the specificity of a synset, often used in similarity calculations.
- **LMF Parser**: A module or function that parses LMF XML files into usable data structures.
- **CLI (Command-Line Interface)**: A tool for interacting with wn-ts from the terminal.
- **Project**: A WordNet resource, such as OEWN, OMW, or a language-specific WordNet.
- **Database**: The local SQLite database where wn-ts stores parsed WordNet data.
- **TOML**: A configuration file format used for the project index.

---

## Further Reading

- [Main README](../README.md)
- [API Reference](../README.md#api-reference)
- [Parsers Guide](../src/parsers/README.md)
- [wn-ts CLI](../src/cli.ts)
- [Project Management](../src/project.ts)
- [End-to-End Tests](../tests/e2e.test.ts)

---

**wn-ts** aims to provide a modern, TypeScript-first, and Python-wn-compatible WordNet API for Node.js and browser environments. For more details, see the main README and the source code in `/src`.
