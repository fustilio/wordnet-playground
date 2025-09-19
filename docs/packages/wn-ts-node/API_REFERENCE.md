# wn-ts-node API Reference

## Core Module Functions

All module functions explicitly receive a `BaseWordnet` instance as their first parameter:

### `getDownloadableLexicons(): string[]`

Returns a list of lexicons that are available for download from the online index. These are lexicons that can be downloaded but may not be currently installed locally.

**Returns:** Array of lexicon IDs (e.g., `['oewn', 'omw', 'odenet']`)

**Example:**
```typescript
import { getDownloadableLexicons } from 'wn-ts-node';

const downloadable = getDownloadableLexicons();
console.log(downloadable); // ['oewn', 'omw', 'odenet', ...]
```

### `getAllAvailableLexicons(): Promise<string[]>`

Returns a comprehensive list of all available lexicons, including both downloadable (online) and installed (offline) lexicons. This provides a complete view of what's available to the user.

**Returns:** Promise resolving to array of lexicon IDs

**Example:**
```typescript
import { getAllAvailableLexicons } from 'wn-ts-node';

const allLexicons = await getAllAvailableLexicons();
console.log(allLexicons); // ['oewn', 'omw', 'odenet', 'installed-lexicon', ...]
```

### `getInstalledLexicons(): Promise<LexiconInfo[]>`

Returns detailed information about lexicons currently installed in the local database.

**Returns:** Promise resolving to array of lexicon information objects

**Example:**
```typescript
import { getInstalledLexicons } from 'wn-ts-node';

const installed = await getInstalledLexicons();
console.log(installed);
// [
//   { id: 'oewn', label: 'Open English WordNet', language: 'en', license: 'MIT' },
//   { id: 'omw', label: 'Open Multilingual WordNet', language: 'mul', license: 'CC BY 3.0' }
// ]
```

## Data Management

```typescript
// Download projects
await download('oewn:2024');
await download('omw:1.4');

// Add lexical resources
await add('path/to/lexical-resource.xml');

// Remove lexicons
await remove('lexicon-id');

// Export data
await exportData({
  format: 'json',
  output: 'export.json',
  include: ['oewn']
});
```

## Project Management

```typescript
import { getProjects, getProject, getProjectVersions } from 'wn-ts-node';

// Get all available projects
const projects = getProjects();

// Get specific project
const project = getProject('oewn');

// Get available versions
const versions = getProjectVersions('oewn');
```

## Information Content

```typescript
import { compute, information_content } from 'wn-ts-node';

// Compute IC from corpus
const corpus = ['run', 'running', 'runner', 'runs'];
const freq = await compute(corpus, wn);

// Calculate IC for a synset
const ic = information_content(synset, freq);
```

## Similarity Metrics

```typescript
import { path, wup, lch, res, jcn, lin } from 'wn-ts-node';

// Path similarity
const pathSim = await path(synset1, synset2, wn);

// Wu-Palmer similarity
const wupSim = await wup(synset1, synset2, wn);

// Leacock-Chodorow similarity
// Note: You need to calculate maxTaxonomyDepth for the relevant POS first.
// const maxDepth = await taxonomyDepth(wn, 'n');
// const lchSim = await lch(synset1, synset2, maxDepth, wn);

// Information Content-based metrics
// const ic = await compute(corpus, wn);
// const resSim = await res(synset1, synset2, ic, wn);
// const jcnSim = await jcn(synset1, synset2, ic, wn);
// const linSim = await lin(synset1, synset2, ic, wn);
```

## Statistics & Analysis

```typescript
// Get overall database statistics
const stats = await wn.getStatistics();
console.log(`Total words: ${stats.totalWords}`);
console.log(`Total synsets: ${stats.totalSynsets}`);

// Get lexicon-specific statistics
const lexiconStats = await wn.getLexiconStatistics();
lexiconStats.forEach(stat => {
  console.log(`${stat.lexiconId}: ${stat.wordCount} words, ${stat.synsetCount} synsets`);
});

// Analyze data quality
const quality = await wn.getDataQualityMetrics();
console.log(`ILI coverage: ${quality.iliCoveragePercentage}%`);

// Get part-of-speech distribution
const posDist = await wn.getPartOfSpeechDistribution();
Object.entries(posDist).forEach(([pos, count]) => {
  console.log(`${pos}: ${count} synsets`);
});
```

## Configuration

```typescript
import { config } from 'wn-ts-node';

// Set data directory
config.dataDirectory = '/path/to/wordnet/data';

// Set download directory
config.downloadDirectory = '/path/to/downloads';
```

## Kernel API Features

### Plugin System

The kernel API provides a modern plugin system with full type safety:

```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');

// Relations plugin
const hypernyms = await wordnet.getHypernyms(synsetId);
const hyponyms = await wordnet.getHyponyms(synsetId);
const meronyms = await wordnet.getMeronyms(synsetId);
const holonyms = await wordnet.getHolonyms(synsetId);

// Similarity plugin
const pathSim = await wordnet.getPathSimilarity(synset1, synset2);
const wuPalmerSim = await wordnet.getWuPalmerSimilarity(synset1, synset2);
const lchSim = await wordnet.getLeacockChodorowSimilarity(synset1, synset2);
const jaccardSim = await wordnet.getJaccardSimilarity(synset1, synset2);

// Translation plugin
const translations = await wordnet.getTranslations(synsetId, 'fr');
const availableLangs = await wordnet.getAvailableLanguages(synsetId);
const crossLingualSim = await wordnet.getCrossLingualSimilarity(synset1, synset2);
```

### Schema Management

Built-in database schema management and health checking:

```typescript
// Get schema manager
const schemaManager = wordnet.schemaManager;

// Check database health
const health = await schemaManager.checkHealth();
console.log('Database health:', health);

// Get database statistics
const stats = await schemaManager.getStatistics();
console.log('Database stats:', stats);
```

## Dry Run and Upsert Support

### Dry Run Mode

The library supports a **dry run** mode for data management operations (download, add) via the `dryRun` option in the API and the `--dry-run` flag in the CLI. In dry run mode, the system reports what actions would be performed (such as which files would be downloaded or which lexicons would be added/updated), but **no changes are made to the database**. This is useful for previewing the impact of an operation before making changes.

**API Example:**
```typescript
await download('oewn:2024', { dryRun: true });
await add('oewn-2024-english-wordnet-2024.xml.gz', { dryRun: true });
```

**CLI Example:**
```bash
wn-cli data download oewn:2024 --dry-run
wn-cli data add oewn-2024-english-wordnet-2024.xml.gz --dry-run
```

### Upsert (Update or Insert) Behavior

When adding a lexicon, the library performs an **upsert** by default:
- If the lexicon does not exist, it is inserted.
- If the lexicon already exists, it is updated (replaced) with the new data. If the `force` option/flag is used, the existing data is removed and replaced.

This ensures that repeated add operations are safe and idempotent.

**API Example:**
```typescript
await add('oewn-2024-english-wordnet-2024.xml.gz'); // Upsert by default
await add('oewn-2024-english-wordnet-2024.xml.gz', { force: true }); // Force replace
```

**CLI Example:**
```bash
wn-cli data add oewn-2024-english-wordnet-2024.xml.gz
wn-cli data add oewn-2024-english-wordnet-2024.xml.gz --force
```

## Database Lock Handling and Robust Shutdown

wn-ts is designed to minimize persistent SQLite database lock issues, especially on Windows:

- The library closes all DB connections on process exit, SIGINT, SIGTERM, uncaught exceptions, and unhandled rejections.
- On Windows, a short delay is added after closing the DB to help the OS release file handles.
- If you encounter a 'database is locked' error:
  - Wait a few seconds and try again.
  - Ensure no other CLI, GUI, or test is using the database.
  - On Windows, if the problem persists, try restarting your computer.
- You can programmatically check for a lock using the exported `isDatabaseLocked()` function.

This makes wn-ts robust even if a command is cancelled or interrupted halfway.
