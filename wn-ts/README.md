# WordNet TypeScript Port

A modern TypeScript implementation of the [wn library](https://github.com/goodmami/wn) for accessing WordNet data. This port provides full API parity with the Python `wn` library while leveraging TypeScript's type safety and modern JavaScript features.

## 🎯 Status: 95% Complete

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
- ✅ **CLI Interface**: Basic command-line tools for data management and querying
- ✅ **Download Utilities**: Simplified download functionality with comprehensive testing
- ✅ **Comprehensive Testing**: Full test suite with verbose output for better debugging
- ✅ **Benchmark Integration**: Proper exports for external benchmarking and comparison
- ✅ **Clean API**: No direct database access - all functionality through Wordnet instance methods
- ✅ **Statistics & Analysis**: Built-in methods for database statistics and data quality analysis

## 🟢 Parity with Python wn

This TypeScript port has undergone a thorough parity review against the Python `wn` library. All critical gaps identified in previous reviews have now been resolved:

- **Examples in Synsets/Senses**: Real example sentences are now fully supported and returned by the API.
- **Project Index Loading**: Projects are loaded from a TOML-based index, matching Python's dynamic project management.
- **Hypernym Traversal in IC Calculations**: Information content calculations now traverse hypernyms as in Python.
- **Export Functionality**: JSON, XML, and CSV export formats are all implemented and tested.
- **Data Management**: Download and add functions are properly exported for external use.
- **Clean API Design**: All database access is now handled through the Wordnet instance, providing a clean and maintainable API.

All core logic, algorithms, and API signatures are now at full parity with the Python version. Remaining differences are limited to advanced features (see Roadmap below).

## 🚀 Quick Start

### Installation

```bash
npm install wn-ts
# or
pnpm add wn-ts
```

### Basic Usage

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
for (const synset of synsets) {
  console.log(`Synset: ${synset.id}`);
  console.log(`Definition: ${synset.definitions[0]?.text}`);
  console.log(`Examples: ${synset.examples.map(e => e.text).join(', ')}`);
  console.log(`Members: ${synset.members.join(', ')}`);
}

// Get senses
const senses = await wn.senses('run', 'v');
for (const sense of senses) {
  console.log(`Sense: ${sense.id}`);
  console.log(`Examples: ${sense.examples.map(e => e.text).join(', ')}`);
}
```

## 📚 API Reference

### Core Functions

```typescript
// Word lookup
const words = await wn.words('run', 'v');

// Synset lookup
const synsets = await wn.synsets('run', 'v');

// Sense lookup
const senses = await wn.senses('run', 'v');

// Individual objects
const word = await wn.word('word-id');
const synset = await wn.synset('synset-id');
const sense = await wn.sense('sense-id');
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
import { getProjects, getProject, getProjectVersions } from 'wn-ts';

// Get all available projects
const projects = getProjects();

// Get specific project
const project = getProject('oewn');

// Get available versions
const versions = getProjectVersions('oewn');
```

### Information Content

```typescript
import { compute, information_content } from 'wn-ts';

// Compute IC from corpus
const corpus = ['run', 'running', 'runner', 'runs'];
const freq = await compute(corpus, wn);

// Calculate IC for a synset
const ic = information_content(synset, freq);
```

### Similarity Metrics

```typescript
import { path, wup, lch, res, jcn, lin } from 'wn-ts';

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

## 🔧 Configuration

```typescript
import { config } from 'wn-ts';

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

**Important**: The library provides a clean API without direct database access. All functionality is available through:

1. **Wordnet Instance Methods**: Use `new Wordnet()` for all data access
2. **Module Functions**: Top-level functions like `words()`, `synsets()`, etc.
3. **Submodule Exports**: Advanced features via `wn-ts/similarity`, `wn-ts/taxonomy`, etc.

**Do not use direct database access** - the `db` export is for internal debugging only.

## 📖 Documentation

- **Usage Guide**: [USAGE.md](./docs/USAGE.md) - Comprehensive usage examples
- **API Reference**: [API.md](./docs/API.md) - Complete API documentation
- **CLI Guide**: [CLI.md](./docs/CLI.md) - Command-line interface documentation

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

### In Progress 🔄
- 🔄 **Performance Optimization**: Further optimize database queries and memory usage
- 🔄 **Browser Compatibility**: Enhanced browser support for web applications

### Planned 📋
- [ ] **CLI Interface**: Enhanced command-line tools for data management
- [ ] **Advanced Analytics**: More sophisticated data analysis tools
- [ ] **Production Readiness**: Enhanced error handling, logging, monitoring
- [ ] **Documentation**: More comprehensive examples and tutorials

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and development setup:

1. **Development Setup**: Use `pnpm install` and `pnpm build` to set up the development environment
2. **Testing**: Run `pnpm test` to ensure all tests pass
3. **CI Integration**: The library is fully integrated with the workspace CI pipeline
4. **Clean API**: Maintain the clean API design without direct database access

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

**Current Progress**: 95% complete with all core functionality implemented and tested. 

**Recent Updates**: 
- ✅ Fixed exports for benchmark integration
- ✅ Added proper data management function exports
- ✅ Improved POS parameter handling
- ✅ Enhanced error handling and edge case support
