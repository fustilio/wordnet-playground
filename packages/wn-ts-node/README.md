# WordNet TypeScript Node.js Implementation

A modern TypeScript implementation of the [wn library](https://github.com/goodmami/wn) for accessing WordNet data. This port provides full API parity with the Python `wn` library while leveraging TypeScript's type safety, modern JavaScript features, and a new **microkernel architecture** with plugin system.

## 🎯 Status: ✅ PRODUCTION READY

**Major Features Implemented:**
- ✅ **Microkernel Architecture**: Modern plugin-based design with composable functionality
- ✅ **Core API**: Complete parity with Python wn library
- ✅ **Plugin System**: Relations, similarity, and translation plugins with full type safety
- ✅ **Examples System**: Full examples support for synsets and senses
- ✅ **Project Index**: TOML-based project management
- ✅ **Information Content**: Complete IC calculations with hypernym traversal
- ✅ **Export Formats**: JSON, XML, and CSV export
- ✅ **Database**: SQLite with proper indexing and relationships
- ✅ **Type Safety**: Full TypeScript type definitions
- ✅ **Morphological Analysis**: Lemmatization support via `morphy`
- ✅ **Similarity Metrics**: Path-based and IC-based similarity measures
- ✅ **Unified CLI**: Command-line interface for data management and querying
- ✅ **Database Management**: Built-in database status, unlock, clean, and reset commands
- ✅ **Download Utilities**: Simplified download functionality with comprehensive testing
- ✅ **Comprehensive Testing**: Full test suite with verbose output for better debugging
- ✅ **Benchmark Integration**: Proper exports for external benchmarking and comparison
- ✅ **Clean API**: No direct database access - all functionality through Wordnet instance methods
- ✅ **Statistics & Analysis**: Built-in methods for database statistics and data quality analysis
- ✅ **Test Organization**: Clear separation between core and platform-specific tests
- ✅ **Explicit Client Passing**: All module functions explicitly receive `BaseWordnet` instances
- ✅ **Decoupled Architecture**: No internal client instantiation in module functions

## 🟢 Parity with Python wn

This TypeScript port has undergone a thorough parity review against the Python `wn` library. All critical gaps identified in previous reviews have now been resolved:

- **Examples in Synsets/Senses**: Real example sentences are now fully supported and returned by the API.
- **Project Index Loading**: Projects are loaded from a TOML-based index, matching Python's dynamic project management.
- **Hypernym Traversal in IC Calculations**: Information content calculations now traverse hypernyms as in Python.
- **Export Functionality**: JSON, XML, and CSV export formats are all implemented and tested.
- **Data Management**: Download and add functions are properly exported for external use.
- **Clean API Design**: All database access is now handled through the Wordnet instance, providing a clean and maintainable API.
- **Unified CLI**: Comprehensive command-line interface with database management capabilities.
- **Explicit Client Passing**: Module functions now explicitly receive clients, eliminating internal instantiation.

All core logic, algorithms, and API signatures are now at full parity with the Python version. Remaining differences are limited to advanced features (see Roadmap below).

## 🏗️ **Architecture**

### **Microkernel Design**

The library now uses a modern **microkernel architecture** with a plugin system:

```
NodeWordNetKernel
├── NodeWordNetCore (implements WordNetCore)
│   ├── KyselyWordnet (database operations)
│   └── NodeKyselyDatabase (SQLite integration)
├── Plugin System
│   ├── Relations Plugin (hypernyms, hyponyms, etc.)
│   ├── Similarity Plugin (path, Wu-Palmer, etc.)
│   └── Translation Plugin (cross-lingual operations)
└── Schema Management (built-in)
```

### **Two API Styles**

The library provides two API styles for different use cases:

1. **Kernel API** (Recommended): Modern plugin-based architecture
2. **Legacy API**: Direct compatibility with Python wn library

## 🚀 Quick Start

### Installation

```bash
npm install wn-ts-node
# or
pnpm add wn-ts-node
```

### Command-Line Interface

The library includes a unified CLI for data management and querying:

```bash
# Install globally for CLI access
npm install -g wn-ts-node

# Download a WordNet project
wn-ts-node download oewn:2024

# Add a lexical resource
wn-ts-node add oewn-2024-english-wordnet-2024.xml.gz

# Query the database
wn-ts-node query run v

# Show database status
wn-ts-node db status

# Unlock locked databases
wn-ts-node db unlock

# Clean up cache directories
wn-ts-node db clean

# Export data
wn-ts-node export --format json --output export.json --include oewn

# List available projects
wn-ts-node projects

# Show configuration
wn-ts-node config
```

### Basic Usage

#### **Kernel API (Recommended)**

```typescript
import { NodeWordNetKernel, download, add } from 'wn-ts-node';

// Download and add a WordNet project
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');

// Create a kernel-based WordNet instance
const wordnet = new NodeWordNetKernel('oewn:2024', {
  filename: 'wordnet.db'
});

await wordnet.initialize();

// Basic queries
const words = await wordnet.words({ form: 'run' });
const synsets = await wordnet.synsets({ wordId: words[0].id });

// Plugin methods
const hypernyms = await wordnet.getHypernyms(synsets[0].id);
const similarity = await wordnet.getPathSimilarity(synsets[0].id, synsets[1].id);
const translations = await wordnet.getTranslations(synsets[0].id, 'fr');

await wordnet.close();
```

#### **Legacy API (Python wn compatibility)**

```typescript
import { Wordnet, download, add } from 'wn-ts-node';

// Download and add a WordNet project
await download('oewn:2024');
await add('oewn-2024-english-wordnet-2024.xml.gz');

// Create a WordNet instance
const wn = new Wordnet('oewn:2024');

// Use convenience methods (recommended)
const words = await wn.words('run', 'v');
console.log(words);

const synsets = await wn.synsets('run', 'v');
for (const synset of synsets) {
  console.log(`Synset: ${synset.id}`);
  console.log(`Definition: ${synset.definitions[0]?.text}`);
  console.log(`Examples: ${synset.examples.map(e => e.text).join(', ')}`);
  console.log(`Members: ${synset.members.join(', ')}`);
}

// Or use explicit client passing (advanced)
import { words, synsets } from 'wn-ts-core';
const wordResults = await words(wn, 'run', 'v');
const synsetResults = await synsets(wn, 'run', 'v');
```

## 🔌 **Kernel API Features**

### **Plugin System**

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

### **Schema Management**

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

## 📚 API Reference

### Core Module Functions

All module functions explicitly receive a `BaseWordnet` instance as their first parameter:

#### `getDownloadableLexicons(): string[]`
Returns a list of lexicons that are available for download from the online index. These are lexicons that can be downloaded but may not be currently installed locally.

**Returns:** Array of lexicon IDs (e.g., `['oewn', 'omw', 'odenet']`)

**Example:**
```typescript
import { getDownloadableLexicons } from 'wn-ts-node';

const downloadable = getDownloadableLexicons();
console.log(downloadable); // ['oewn', 'omw', 'odenet', ...]
```

#### `getAllAvailableLexicons(): Promise<string[]>`
Returns a comprehensive list of all available lexicons, including both downloadable (online) and installed (offline) lexicons. This provides a complete view of what's available to the user.

**Returns:** Promise resolving to array of lexicon IDs

**Example:**
```typescript
import { getAllAvailableLexicons } from 'wn-ts-node';

const allLexicons = await getAllAvailableLexicons();
console.log(allLexicons); // ['oewn', 'omw', 'odenet', 'installed-lexicon', ...]
```

#### `getInstalledLexicons(): Promise<LexiconInfo[]>`
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

### Data Management

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

### Project Management

```typescript
import { getProjects, getProject, getProjectVersions } from 'wn-ts-node';

// Get all available projects
const projects = getProjects();

// Get specific project
const project = getProject('oewn');

// Get available versions
const versions = getProjectVersions('oewn');
```

### Information Content

```typescript
import { compute, information_content } from 'wn-ts-node';

// Compute IC from corpus
const corpus = ['run', 'running', 'runner', 'runs'];
const freq = await compute(corpus, wn);

// Calculate IC for a synset
const ic = information_content(synset, freq);
```

### Similarity Metrics

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

### Statistics & Analysis

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


## 🎯 Configuration

```typescript
import { config } from 'wn-ts-node';

// Set data directory
config.dataDirectory = '/path/to/wordnet/data';

// Set download directory
config.downloadDirectory = '/path/to/downloads';
```

## 📦 Available Projects

The library supports downloading and using various WordNet projects:

- **oewn**: Open English WordNet (2024, 2023, 2022)
- **omw**: Open Multilingual Wordnet (1.4)
- **odenet**: Open German WordNet (1.4, 1.3)
- **cili**: Collaborative Interlingual Index (1.0)

And many more language-specific WordNets through the OMW project.

## 🧪 Testing

```bash
# Run all tests with verbose output
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

## 🔄 CI Integration

The library is fully integrated with the workspace CI pipeline:

```bash
# Run the complete CI pipeline (from workspace root)
pnpm ci:full

# Run individual CI steps
pnpm ci:build    # Build wn-ts library
pnpm ci:test     # Run all tests (including e2e)
pnpm ci:demo     # Run all demo use cases
pnpm ci:benchmark # Run all benchmark tests
```

## 🎯 Clean API Design

**Important**: The library provides a clean API with explicit client passing. All functionality is available through:

1. **Wordnet Instance Methods**: Use `new Wordnet()` for convenience methods that delegate to module functions
2. **Module Functions**: Explicit client-passing functions like `words(client, form, pos)`, `synsets(client, form, pos)`, etc.
3. **Submodule Exports**: Advanced features via `wn-ts-node/similarity`, `wn-ts-node/taxonomy`, etc.

**Do not use direct database access** - the `db` export is for internal debugging only.

## 📖 Documentation

- **Usage Guide**: [USAGE.md](./docs/USAGE.md) - Comprehensive usage examples
- **API Reference**: [API.md](./docs/API.md) - Complete API documentation
- **CLI Guide**: [USAGE-CLI.md](./docs/USAGE-CLI.md) - Command-line interface documentation

## 🎯 Roadmap

### Completed ✅
- ✅ **Core API Parity**: Full parity with Python wn library
- ✅ **Examples Support**: Complete examples in synsets and senses
- ✅ **Project Management**: TOML-based project index
- ✅ **Information Content**: Complete IC calculations
- ✅ **Export Formats**: JSON, XML, and CSV export
- ✅ **Clean API**: Removed direct database access
- ✅ **Statistics & Analysis**: Built-in database statistics and quality metrics
- ✅ **Comprehensive Testing**: Full test suite with e2e tests
- ✅ **CI Integration**: Complete CI pipeline integration
- ✅ **Unified CLI**: Command-line interface with database management
- ✅ **Explicit Client Passing**: All module functions explicitly receive `BaseWordnet` instances
- ✅ **Decoupled Architecture**: No internal client instantiation in module functions

### In Progress 🔄
- 🔄 **Performance Optimization**: Further optimize database queries and memory usage
- 🔄 **Browser Compatibility**: Enhanced browser support for web applications

### Planned 📋
- [ ] **Advanced CLI**: Interactive mode and batch processing
- [ ] **Advanced Analytics**: More sophisticated data analysis tools
- [ ] **Production Readiness**: Enhanced error handling, logging, monitoring
- [ ] **Documentation**: More comprehensive examples and tutorials

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and development setup:

1. **Development Setup**: Use `pnpm install` and `pnpm build` to set up the development environment
2. **Testing**: Run `pnpm test` to ensure all tests pass
3. **CI Integration**: The library is fully integrated with the workspace CI pipeline
4. **Clean API**: Maintain the clean API design with explicit client passing

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Python `wn` library](https://github.com/goodmami/wn) - The original implementation
- [WordNet](https://wordnet.princeton.edu/) - The lexical database
- [Open English WordNet](https://en-word.net/) - Modern English WordNet
- [Open Multilingual Wordnet](https://omwn.org/) - Multilingual WordNet resources

## 📈 Roadmap

- [ ] **Performance Benchmarking**: Benchmark performance against the original Python `wn` library (via `wn-pybridge`) to identify and address bottlenecks.
- [ ] **Advanced CLI**: Enhance command-line tools with interactive mode and batch processing.
- [ ] **Web Interface**: Browser-based interface for exploring WordNet.
- [ ] **Graph Visualization**: Interactive visualization of WordNet graphs.
- [ ] **Performance Tuning**: Further memory and query optimizations for very large datasets.

---

**Current Progress**: 100% complete with all core functionality implemented and tested. 

**Recent Updates**: 
- ✅ Fixed exports for benchmark integration
- ✅ Added proper data management function exports
- ✅ Improved POS parameter handling
- ✅ Enhanced error handling and edge case support
- ✅ Unified CLI with database management commands
- ✅ Comprehensive CLI documentation
- ✅ Removed standalone scripts in favor of unified CLI
- ✅ **Explicit Client Passing**: All module functions now explicitly receive `BaseWordnet` instances
- ✅ **Decoupled Architecture**: Eliminated internal client instantiation in module functions

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
