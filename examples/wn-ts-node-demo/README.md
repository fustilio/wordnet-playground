# WordNet Demo

This directory contains comprehensive demonstrations of the `wn-ts` library capabilities through practical use cases and examples.

## 🎯 Overview

The demo showcases real-world applications of WordNet data processing using the clean API approach. All examples use the `Wordnet` instance methods and helper functions rather than direct database access, ensuring maintainable and robust code.

## 📁 Structure

```
demo/
├── src/
│   ├── demo.js                 # Basic demo with core functionality
│   ├── kitchen-sink-demo.js    # Comprehensive feature showcase
│   ├── run-all-use-cases.js   # Runner for all use cases
│   └── use-cases/             # Individual use case demonstrations
│       ├── 01-multilingual-linking.js
│       ├── 02-word-sense-disambiguation.js
│       ├── 03-lexical-database-exploration.js
│       └── 04-database-statistics.js
├── package.json
└── README.md
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run basic demo
pnpm demo

# Run kitchen sink demo
pnpm kitchen-sink

# Run all use cases
pnpm use-cases
```

## 📚 Use Cases

### 1. Multilingual Linking (`01-multilingual-linking.js`)

**Problem**: You need to find equivalent concepts across different languages.

**Solution**: Use the Interlingual Index (ILI) to map concepts between languages.

**Real-world application**: Machine translation, cross-language information retrieval, multilingual NLP

**Key Features**:
- Cross-language concept mapping
- ILI-based alignment
- Language-specific synset lookup
- Concept equivalence analysis

### 2. Word Sense Disambiguation (`02-word-sense-disambiguation.js`)

**Problem**: You need to determine the correct meaning of ambiguous words in context.

**Solution**: Analyze different senses of a word and their relationships.

**Real-world application**: Natural language processing, text analysis, semantic understanding

**Key Features**:
- Multiple sense analysis
- Sense relationship exploration
- Context-based disambiguation
- Semantic similarity assessment

### 3. Lexical Database Exploration (`03-lexical-database-exploration.js`)

**Problem**: You need to explore and understand the structure of lexical data.

**Solution**: Navigate through synsets, senses, and their relationships.

**Real-world application**: Linguistic research, vocabulary analysis, semantic network exploration

**Key Features**:
- Hierarchical relationship traversal
- Synset member analysis
- Definition and example exploration
- Lexical relationship mapping

### 4. Database Statistics (`04-database-statistics.js`)

**Problem**: You need to understand the scope and quality of the WordNet database.

**Solution**: Analyze database statistics and content coverage using built-in methods.

**Real-world application**: Data quality assessment, research planning, system design

**Key Features**:
- Overall database statistics
- Lexicon breakdown and analysis
- Data quality metrics
- Part-of-speech distribution
- ILI database analysis

## 🎯 Clean API Design

All demos use the clean API approach:

```javascript
// ✅ Good: Use Wordnet instance methods
const wordnet = new Wordnet('*');
const stats = await wordnet.getStatistics();
const quality = await wordnet.getDataQualityMetrics();

// ✅ Good: Use module functions
const words = await words('run', 'v');
const synsets = await synsets('run', 'v');

// ❌ Avoid: Direct database access
// const db = require('wn-ts').db; // Internal only
```

## 🔧 Configuration

The demos use dedicated data directories to avoid conflicts:

```javascript
const dataDirectory = join(homedir(), '.wn_demo');
const wordnet = new Wordnet('*', {
  dataDirectory,
  downloadDirectory: join(dataDirectory, 'downloads'),
  extractDirectory: join(dataDirectory, 'extracted'),
  databasePath: join(dataDirectory, 'wordnet.db')
});
```

## 📊 Statistics & Analysis

The demos showcase the built-in statistics and analysis capabilities:

```javascript
// Get overall statistics
const stats = await wordnet.getStatistics();
console.log(`Total words: ${stats.totalWords}`);
console.log(`Total synsets: ${stats.totalSynsets}`);

// Analyze data quality
const quality = await wordnet.getDataQualityMetrics();
console.log(`ILI coverage: ${quality.iliCoveragePercentage}%`);

// Get part-of-speech distribution
const posDist = await wordnet.getPartOfSpeechDistribution();
Object.entries(posDist).forEach(([pos, count]) => {
  console.log(`${pos}: ${count} synsets`);
});
```

## 🧪 Testing

The demos are integrated with the workspace CI pipeline:

```bash
# Run all demos as part of CI
pnpm ci:demo

# Run individual demos
pnpm demo
pnpm kitchen-sink
pnpm use-cases
```

## 🎯 Key Features Demonstrated

### Core Functionality
- **Word Lookup**: Finding words by form and part of speech
- **Synset Exploration**: Analyzing sets of synonymous words
- **Sense Analysis**: Understanding different meanings of words
- **Relationship Traversal**: Navigating lexical hierarchies

### Advanced Features
- **Multilingual Support**: Cross-language concept mapping
- **Statistics & Analysis**: Database coverage and quality metrics
- **Data Export**: JSON, XML, and CSV export capabilities
- **Error Handling**: Robust error handling and recovery

### Real-world Applications
- **Machine Translation**: Cross-language concept alignment
- **Text Analysis**: Word sense disambiguation
- **Research**: Linguistic data exploration
- **System Design**: Database assessment and planning

## 📖 Examples

### Basic Word Lookup
```javascript
const words = await words('run', 'v');
console.log(`Found ${words.length} verb forms of 'run'`);
```

### Synset Analysis
```javascript
const synsets = await synsets('bank', 'n');
for (const synset of synsets) {
  console.log(`Synset: ${synset.id}`);
  console.log(`Definition: ${synset.definitions[0]?.text}`);
  console.log(`Members: ${synset.members.join(', ')}`);
}
```

### Multilingual Linking
```javascript
const enSynsets = await wnEn.synsets('computer', 'n');
const frSynsets = await wnFr.synsets('ordinateur', 'n');
// Compare concepts across languages
```

### Database Statistics
```javascript
const stats = await wordnet.getStatistics();
const quality = await wordnet.getDataQualityMetrics();
console.log(`Database contains ${stats.totalWords} words`);
console.log(`ILI coverage: ${quality.iliCoveragePercentage}%`);
```

## 🚀 Performance Notes

- **Large Databases**: Some analysis features may be temporarily disabled for very large databases due to performance considerations
- **Memory Usage**: The demos use efficient data structures and proper cleanup
- **Async Operations**: All database operations are asynchronous for better performance

## 📚 Further Reading

- **Main Library**: [wn-ts README](../wn-ts/README.md)
- **Usage Guide**: [wn-ts USAGE.md](../wn-ts/docs/USAGE.md)
- **API Reference**: [wn-ts API.md](../wn-ts/docs/API.md)
- **Workspace CI**: [Main README](../README.md#development--ci)

## 🤝 Contributing

When adding new demos:

1. **Use Clean API**: Always use Wordnet instance methods or module functions
2. **Include Error Handling**: Add proper try/catch blocks and error recovery
3. **Add Documentation**: Include clear problem/solution descriptions
4. **Test Integration**: Ensure demos work with the CI pipeline
5. **Follow Patterns**: Use the existing demo structure and patterns

---

**Remember**: The demos showcase the clean API approach without direct database access, ensuring maintainable and robust code for real-world applications. 