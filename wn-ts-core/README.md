# WordNet TypeScript Core

## 🎯 Core Package - Database-Agnostic Implementation

`wn-ts-core` is the foundational package that provides all database-agnostic functionality, algorithms, parsers, and utilities. This package contains the pure logic that can be shared across different platforms (Node.js, browser, etc.) without any platform-specific dependencies.

### Key Characteristics
- **Database-Agnostic**: No direct database dependencies
- **Platform-Independent**: Pure TypeScript with no Node.js or browser APIs
- **Reusable**: Core logic used by `wn-ts-node` and future `wn-ts-web`
- **Testable**: Comprehensive unit tests for all core functionality
- **Explicit Client Passing**: All module functions explicitly receive `BaseWordnet` instances

## 🌐 Browser Support & Node-to-Browser Strategy

A major goal for `wn-ts` is seamless support for both Node.js and browser environments, following the proven strategy of `wordpos` and `wordpos-web`. The plan includes:

- **Data Conversion Script:** Convert WordNet data to browser-optimized modules (see Implementation Plan in [wn-ts-web/README.md](../wn-ts-web/README.md)).
- **Dynamic Data Loader:** Load data modules on demand in the browser, minimizing memory and bandwidth usage.
- **API Parity:** Expose the same API in both environments, with any browser-specific differences clearly documented.
- **Documentation & Checklist:** Track all progress and rationale in this README and in `wn-ts-web/README.md`.

> **Note:** Tool-specific tests for browser tooling (such as the data conversion script) are colocated in `wn-ts/tools/tests/` rather than the main `tests/` directory. This keeps the core test suite focused on the library itself and clarifies the external/plugin nature of these tools.

**See the Implementation Plan & Checklist in [wn-ts-web/README.md](../wn-ts-web/README.md) for detailed progress and technical steps.**

---

A modern TypeScript implementation of the [wn library](https://github.com/goodmami/wn) for accessing WordNet data. This port provides full API parity with the Python `wn` library while leveraging TypeScript's type safety and modern JavaScript features.

## 🎯 Status: ✅ PRODUCTION READY

**Major Features Implemented:**
- ✅ **Core API**: Complete parity with Python wn library
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

## 🚀 Quick Start

### Installation

```bash
npm install wn-ts-core
# or
pnpm add wn-ts-core
```

### Basic Usage

```typescript
import { words, synsets, lexicons } from 'wn-ts-core';
import { BaseWordnet } from 'wn-ts-core';

// Core functions require explicit client passing
const wordnetClient = new BaseWordnet(); // From platform-specific package
const wordResults = await words(wordnetClient, 'run', 'v');
const synsetResults = await synsets(wordnetClient, 'run', 'v');
const lexiconResults = await lexicons(wordnetClient);

// Note: These functions require a database implementation to be provided
// by the platform-specific package (wn-ts-node, wn-ts-web, etc.)
```

## 📚 API Reference

### Core Module Functions

All module functions explicitly receive a `BaseWordnet` instance as their first parameter:

#### `projects(): Promise<Project[]>`
Returns a list of all available projects from the project index.

**Returns:** Promise resolving to array of project objects

**Example:**
```typescript
import { projects } from 'wn-ts-core';

const allProjects = await projects();
console.log(allProjects); // [{ id: 'oewn', versions: ['2024', '2023'] }, ...]
```

#### `lexicons(client: BaseWordnet): Promise<Lexicon[]>`
Returns lexicons available in the database.

**Parameters:**
- `client`: BaseWordnet instance to query

**Returns:** Promise resolving to array of lexicon objects

**Example:**
```typescript
import { lexicons } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024'); // From wn-ts-node
const availableLexicons = await lexicons(wordnetClient);
console.log(availableLexicons); // [{ id: 'oewn', label: 'Open English WordNet' }, ...]
```

#### `words(client: BaseWordnet, form?: string, pos?: PartOfSpeech): Promise<Word[]>`
Get words matching form and part of speech.

**Parameters:**
- `client`: BaseWordnet instance to query
- `form`: Word form to search for (optional)
- `pos`: Part of speech to filter by (optional)

**Returns:** Promise resolving to array of word objects

**Example:**
```typescript
import { words } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runWords = await words(wordnetClient, 'run', 'v');
console.log(runWords); // [{ id: 'oewn-2024-run-v', forms: ['run'], ... }, ...]
```

#### `synsets(client: BaseWordnet, form?: string, pos?: PartOfSpeech): Promise<Synset[]>`
Get synsets matching form and part of speech.

**Parameters:**
- `client`: BaseWordnet instance to query
- `form`: Word form to search for (optional)
- `pos`: Part of speech to filter by (optional)

**Returns:** Promise resolving to array of synset objects

**Example:**
```typescript
import { synsets } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runSynsets = await synsets(wordnetClient, 'run', 'v');
console.log(runSynsets); // [{ id: 'ss_2024_00000001-v', members: ['run'], ... }, ...]
```

#### `senses(client: BaseWordnet, form?: string, pos?: PartOfSpeech): Promise<Sense[]>`
Get senses matching form and part of speech.

**Parameters:**
- `client`: BaseWordnet instance to query
- `form`: Word form to search for (optional)
- `pos`: Part of speech to filter by (optional)

**Returns:** Promise resolving to array of sense objects

**Example:**
```typescript
import { senses } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runSenses = await senses(wordnetClient, 'run', 'v');
console.log(runSenses); // [{ id: 'oewn-2024-run-v-1', synset: 'ss_2024_00000001-v', ... }, ...]
```

#### `word(client: BaseWordnet, id: string): Promise<Word>`
Get a specific word by ID.

**Parameters:**
- `client`: BaseWordnet instance to query
- `id`: Word ID

**Returns:** Promise resolving to word object

**Example:**
```typescript
import { word } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runWord = await word(wordnetClient, 'oewn-2024-run-v');
console.log(runWord); // { id: 'oewn-2024-run-v', forms: ['run'], ... }
```

#### `synset(client: BaseWordnet, id: string): Promise<Synset>`
Get a specific synset by ID.

**Parameters:**
- `client`: BaseWordnet instance to query
- `id`: Synset ID

**Returns:** Promise resolving to synset object

**Example:**
```typescript
import { synset } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runSynset = await synset(wordnetClient, 'ss_2024_00000001-v');
console.log(runSynset); // { id: 'ss_2024_00000001-v', members: ['run'], ... }
```

#### `sense(client: BaseWordnet, id: string): Promise<Sense>`
Get a specific sense by ID.

**Parameters:**
- `client`: BaseWordnet instance to query
- `id`: Sense ID

**Returns:** Promise resolving to sense object

**Example:**
```typescript
import { sense } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const runSense = await sense(wordnetClient, 'oewn-2024-run-v-1');
console.log(runSense); // { id: 'oewn-2024-run-v-1', synset: 'ss_2024_00000001-v', ... }
```

#### `ili(client: BaseWordnet, id: string): Promise<ILI>`
Get a specific ILI by ID.

**Parameters:**
- `client`: BaseWordnet instance to query
- `id`: ILI ID

**Returns:** Promise resolving to ILI object

**Example:**
```typescript
import { ili } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const iliEntry = await ili(wordnetClient, 'i12345');
console.log(iliEntry); // { id: 'i12345', definition: '...', ... }
```

#### `ilis(client: BaseWordnet, status?: string): Promise<ILI[]>`
Get ILIs with optional status filtering.

**Parameters:**
- `client`: BaseWordnet instance to query
- `status`: Status to filter by (optional)

**Returns:** Promise resolving to array of ILI objects

**Example:**
```typescript
import { ilis } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024');
const allIlis = await ilis(wordnetClient);
console.log(allIlis); // [{ id: 'i12345', status: 'standard', ... }, ...]
```

### BaseWordnet Class

The `BaseWordnet` abstract class provides convenience methods that delegate to module functions:

```typescript
import { BaseWordnet } from 'wn-ts-core';

// Convenience methods (recommended for most use cases)
const wn = new Wordnet('oewn:2024'); // From wn-ts-node
const synsets = await wn.synsets('run', 'v');
const words = await wn.words('run', 'v');
const lexicons = await wn.lexicons();

// These internally call the module functions with 'this' as the client
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
import { getProjects, getProject, getProjectVersions } from 'wn-ts-core';

// Get all available projects
const projects = getProjects();

// Get specific project
const project = getProject('oewn');

// Get available versions
const versions = getProjectVersions('oewn');
```

### Information Content

```typescript
import { compute, information_content } from 'wn-ts-core';

// Compute IC from corpus
const corpus = ['run', 'running', 'runner', 'runs'];
const freq = await compute(corpus, wn);

// Calculate IC for a synset
const ic = information_content(synset, freq);
```

### Similarity Metrics

```typescript
import { path, wup, lch, res, jcn, lin } from 'wn-ts-core';

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

### Lexicon Listing

```typescript
import { LexiconHelper } from 'wn-cli/src/utils/lexicon-helpers';

// List all lexicons available for download (online)
const downloadableLexicons = LexiconHelper.getDownloadableLexicons();
console.log(downloadableLexicons);

// List installed lexicons (offline)
import { lexicons } from 'wn-ts-core';
const wordnetClient = new Wordnet('oewn:2024');
const installedLexicons = await lexicons(wordnetClient);
console.log(installedLexicons);
```

## 🎯 Configuration

```typescript
import { config } from 'wn-ts-core';

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

### Test Organization

The test suite is organized to focus on core, database-agnostic functionality:

```bash
# Run all tests with verbose output
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

### Test Strategy

- **Core Functionality**: Algorithms, parsers, utilities
- **Database-Agnostic**: No database dependencies
- **Unit Tests**: Focus on pure functions and logic
- **Type Safety**: Comprehensive TypeScript testing
- **No Platform Dependencies**: Tests run in any environment
- **Explicit Client Testing**: Tests verify explicit client passing pattern

### Test Files

For a complete overview of the testing strategy and files, see [TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md).

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

1. **Module Functions**: Explicit client-passing functions like `words(client, form, pos)`, `synsets(client, form, pos)`, etc.
2. **BaseWordnet Convenience Methods**: Use `new Wordnet()` for convenience methods that delegate to module functions
3. **Submodule Exports**: Advanced features via `wn-ts-core/similarity`, `wn-ts-core/taxonomy`, etc.

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
- ✅ **Test Organization**: Clear separation between core and platform-specific tests
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
- ✅ **Test Reorganization**: Clear separation between core and platform-specific tests
- ✅ **Explicit Client Passing**: All module functions now explicitly receive `BaseWordnet` instances
- ✅ **Decoupled Architecture**: Eliminated internal client instantiation in module functions

## 🌐 Node-to-Browser Strategy: Enabling Full Browser Support

A major goal for `wn-ts` is to provide seamless support for both Node.js and browser environments, following the proven strategy of `wordpos` and `wordpos-web`. Here's how this will be achieved:

### Lessons from wordpos/wordpos-web
- **Dual Environment Support:** `wordpos` uses a single codebase with separate entry points for Node.js and browser, exposing the same API in both environments.
- **Browser Data Preparation:** For browser use, WordNet data is preprocessed into JSON/JS modules, which are loaded dynamically in the browser, avoiding filesystem access.
- **Consistent API:** Both builds offer the same API, so code and tests are portable across environments.
- **Web Demo:** `wordpos-web` provides a static demo and distribution, bundling the browser build and data files for easy deployment.

### Planned Approach for wn-ts and wn-ts-web
- **Unified TypeScript Codebase:** `wn-ts` will maintain a single codebase with environment-specific entry points (using the `browser` field in `package.json`).
- **Browser Data Bundling:** A build process will convert WordNet data into browser-usable formats (JSON or JS modules), loaded dynamically or statically in the browser.
- **API Parity:** The same API will be exposed in both Node.js and browser builds.
- **Web Demo & Distribution:** `wn-ts-web` will serve as a static demo and distribution, bundling the browser build and data files, and providing example usage.
- **Comprehensive Testing:** Tests will ensure feature parity and correctness across both environments.

### Benefits
- **Universal Access:** Enables WordNet-powered apps to run in browsers, Node.js, and serverless platforms.
- **Performance:** Preprocessing and bundling data for the browser enables fast, interactive web experiences.
- **Modern Standards:** Leverages ES modules, bundlers, and static hosting for compatibility and performance.

**Next Steps:**
- Implement the browser build and data pipeline for `wn-ts`.
- Develop the `wn-ts-web` demo and static distribution.
- Ensure all APIs are available and tested in both environments.

For more, see the [wordpos README](../wordpos/README.md) and [wordpos-web](../wordpos-web/README.md) for a working example of this strategy.

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
