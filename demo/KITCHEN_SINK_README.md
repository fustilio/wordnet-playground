# 🚀 WordNet Kitchen Sink Demo

A comprehensive demonstration of all major features in the WordNet TypeScript library.

## 🎯 What This Demo Shows

The Kitchen Sink Demo showcases **13 major sections** covering every aspect of the WordNet library:

### 📋 Section 1: Project Management
- Lists all available WordNet projects
- Shows project metadata (version, language, license)
- Demonstrates project discovery capabilities

### 📥 Section 2: Data Download & Management
- Downloads multiple WordNet projects (CILI, OEWN, OMW)
- Shows data import and database management
- Demonstrates error handling for downloads

### 📚 Section 3: Lexicon Exploration
- Explores available lexicons in downloaded projects
- Shows lexicon metadata (license, URL, language)
- Demonstrates lexicon filtering and querying

### 🔍 Section 4: Word Queries
- Searches for words across multiple parts of speech
- Shows word metadata (lemma, POS, lexicon)
- Demonstrates word search capabilities

### 📚 Section 5: Synset Exploration
- Retrieves synsets for given words
- Shows synset metadata (definitions, members, relations)
- Demonstrates synset querying capabilities

### 🎯 Section 6: Sense Exploration
- Explores individual word senses
- Shows sense metadata and relations
- Demonstrates sense-level analysis

### 🌳 Section 7: Taxonomy Analysis
- **Roots**: Finds top-level synsets in the hierarchy
- **Leaves**: Finds bottom-level synsets in the hierarchy
- **Taxonomy Depth**: Calculates maximum depth for each POS
- **Hypernym Paths**: Finds all paths from synset to root
- Demonstrates hierarchical analysis capabilities

### 📊 Section 8: Similarity Metrics
- **Path Similarity**: Distance-based similarity
- **Wu-Palmer Similarity**: Information content based
- **Leacock-Chodorow**: Log-based similarity
- **Resnik Similarity**: Information content based
- **Jiang-Conrath**: Information content based
- **Lin Similarity**: Information content based
- Demonstrates semantic similarity calculations

### 🔤 Section 9: Morphological Analysis
- **Lemmatization**: Finds base forms of words
- **Morphological Rules**: Applies linguistic rules
- **Exception Handling**: Handles irregular forms
- Demonstrates morphological analysis capabilities

### 🌍 Section 10: Interlingual Index (ILI)
- Explores cross-lingual synset mappings
- Shows ILI metadata and definitions
- Demonstrates multilingual capabilities

### 🔬 Section 11: Advanced Queries
- **Word by ID**: Retrieves specific words by identifier
- **Synset by ID**: Retrieves specific synsets by identifier
- **Sense by ID**: Retrieves specific senses by identifier
- Demonstrates precise querying capabilities

### 🛤️ Section 12: Shortest Path Analysis
- **Shortest Path**: Finds shortest path between synsets
- **Minimum Depth**: Calculates minimum depth of synsets
- **Path Visualization**: Shows step-by-step paths
- Demonstrates graph analysis capabilities

### ⚡ Section 13: Performance Metrics
- **Search Performance**: Measures query response times
- **Taxonomy Performance**: Measures depth calculation speed
- **Benchmark Results**: Shows performance characteristics
- Demonstrates performance monitoring capabilities

## 🚀 How to Run

### Prerequisites
```bash
# Install dependencies
pnpm install

# Build the library
pnpm build
```

### Run the Demo
```bash
# Run the kitchen sink demo
pnpm demo:kitchen-sink

# Or run from the demo directory
cd demo
pnpm kitchen-sink
```

### Alternative Commands
```bash
# Run from workspace root
pnpm demo:kitchen-sink

# Run directly with node
node demo/src/kitchen-sink-demo.js
```

## 📊 Expected Output

The demo will show:

1. **Project Discovery**: Lists available WordNet projects
2. **Data Downloads**: Downloads and imports multiple projects
3. **Lexicon Exploration**: Shows available lexicons
4. **Word Searches**: Finds words across different POS
5. **Synset Analysis**: Explores synset structures
6. **Sense Exploration**: Shows individual word senses
7. **Taxonomy Analysis**: Analyzes hierarchical structures
8. **Similarity Calculations**: Computes semantic similarities
9. **Morphological Analysis**: Performs lemmatization
10. **ILI Exploration**: Shows cross-lingual mappings
11. **Advanced Queries**: Demonstrates precise querying
12. **Path Analysis**: Shows shortest paths between synsets
13. **Performance Metrics**: Measures system performance

## 🔧 Customization

You can modify the demo by:

### Adding More Projects
```javascript
const projectsToDownload = [
  { id: 'cili:1.0', name: 'CILI (Collaborative Interlingual Index)' },
  { id: 'oewn:2024', name: 'Open English WordNet 2024' },
  { id: 'omw-en:1.4', name: 'OMW English WordNet 1.4' },
  // Add more projects here
  { id: 'odenet:1.4', name: 'Open German WordNet 1.4' },
  { id: 'omw-fr:1.4', name: 'French WordNet 1.4' }
];
```

### Testing Different Words
```javascript
const testWords = [
  'information', 'computer', 'happy', 'run', 'quickly',
  // Add more words here
  'artificial', 'intelligence', 'machine', 'learning'
];
```

### Exploring Different Similarity Metrics
```javascript
// Add more similarity calculations
const customSimilarity = await customSimilarityFunction(synset1, synset2, wordnet);
console.log(`Custom Similarity: ${customSimilarity.toFixed(4)}`);
```

## 🎯 Learning Objectives

After running this demo, you'll understand:

1. **Data Management**: How to download and import WordNet data
2. **Query Patterns**: How to search for words, synsets, and senses
3. **Taxonomy Analysis**: How to analyze hierarchical structures
4. **Similarity Metrics**: How to calculate semantic similarities
5. **Morphological Analysis**: How to perform lemmatization
6. **Performance Optimization**: How to monitor and optimize queries
7. **Error Handling**: How to handle various error conditions
8. **API Usage**: How to use all major library functions

## 🔍 Troubleshooting

### Common Issues

1. **Download Failures**: Check internet connection and project availability
2. **Database Errors**: Ensure sufficient disk space and permissions
3. **Memory Issues**: Large projects may require significant memory
4. **Timeout Errors**: Some operations may take time with large datasets

### Debug Mode
```bash
# Run with verbose logging
DEBUG=* node src/kitchen-sink-demo.js
```

### Performance Tuning
```javascript
// Adjust timeouts for large datasets
config.timeout = 300000; // 5 minutes
config.maxMemory = 1024 * 1024 * 1024; // 1GB
```

## 📚 Related Documentation

- [Main Library Documentation](../wn-ts/README.md)
- [API Reference](../wn-ts/docs/USAGE.md)
- [Benchmark Results](../benchmark/README.md)
- [Strategic Approach](../STRATEGIC_APPROACH.md)

## 🎉 Next Steps

After running the kitchen sink demo:

1. **Explore Specific Features**: Focus on areas that interest you
2. **Build Custom Applications**: Use the library in your own projects
3. **Contribute**: Help improve the library and documentation
4. **Benchmark**: Compare performance with other WordNet libraries
5. **Extend**: Add new features or support for additional languages

---

**Happy WordNetting! 🌐📚** 