# goodmami/wn (Python)

**Repository**: https://github.com/goodmami/wn  
**Language**: Python  
**Stars**: 200+  
**Last Updated**: 2024  
**Package Name**: `wn`  
**Alternative Names**: python-wn, goodmami-wn  

## Description
A comprehensive Python library for working with WordNet data. This is the reference implementation that provides a complete interface to WordNet databases, supporting multiple formats, languages, and advanced features like similarity calculations, morphological analysis, and database management. The library is designed to be a modern, feature-rich alternative to NLTK's WordNet interface.

## Key Features
- **Multi-format Support**: WN-LMF, WNDB, and other WordNet formats
- **Multi-language Support**: English and other languages via Open Multilingual WordNet
- **Advanced Queries**: Synsets, words, senses, and complex relationships
- **Similarity Metrics**: Path similarity, Leacock-Chodorow, Wu-Palmer, and more
- **Morphological Analysis**: Lemmatization and morphological forms
- **Database Management**: Download, add, and manage WordNet lexicons
- **Information Content**: Calculate information content for similarity measures
- **Project Management**: Create and manage custom WordNet projects
- **Validation**: Validate WordNet data against schemas
- **Export Capabilities**: Export to various formats
- **CLI Interface**: Command-line tools for data management
- **Progress Tracking**: Built-in progress handlers for long-running operations
- **Comprehensive Testing**: Extensive test suite with real WordNet data

## Installation
```bash
pip install wn
```

## Basic Usage
```python
import wn

# Download and add WordNet data
wn.download('oewn:2024')  # Open English WordNet
wn.add('path/to/custom-wordnet.xml')

# Look up synsets
synsets = wn.synsets('run', pos='v')
for synset in synsets:
    print(f"Synset: {synset.id}")
    print(f"Definition: {synset.definition()}")
    print(f"Examples: {synset.examples()}")

# Get words and senses
words = wn.words('information')
senses = wn.senses('happy')

# Similarity calculations
synset1 = wn.synset('oewn-00001174-n')  # dog.n.01
synset2 = wn.synset('oewn-00001384-n')  # cat.n.01
similarity = wn.path_similarity(synset1, synset2)
print(f"Similarity: {similarity}")

# Morphological analysis
lemmas = wn.morphy('running', pos='v')
print(f"Lemmas: {lemmas}")

# Information content
ic = wn.ic('oewn:2024')
content = ic.information_content(synset1)
print(f"Information content: {content}")
```

## CLI Usage
The library provides a comprehensive command-line interface:

```bash
# Check version
python -m wn --version

# List available lexicons
python -m wn lexicons

# Download a lexicon
python -m wn download oewn:2024

# Add a custom lexicon
python -m wn add path/to/lexicon.xml

# Query synsets
python -m wn synsets run --pos v

# Query words
python -m wn words information

# Query senses
python -m wn senses happy

# Calculate similarity
python -m wn similarity oewn-00001174-n oewn-00001384-n

# Export data
python -m wn export oewn:2024 --format json
```

## API Methods

### Core Query Functions
- `synsets(word, pos=None, lang='en')` - Get synsets for a word
- `words(form, pos=None, lang='en')` - Get words by form
- `senses(word, pos=None, lang='en')` - Get senses for a word
- `synset(id)` - Get a specific synset by ID
- `word(id)` - Get a specific word by ID
- `sense(id)` - Get a specific sense by ID

### Similarity Functions
- `path_similarity(synset1, synset2)` - Path-based similarity
- `lch_similarity(synset1, synset2)` - Leacock-Chodorow similarity
- `wup_similarity(synset1, synset2)` - Wu-Palmer similarity
- `res_similarity(synset1, synset2, ic)` - Resnik similarity
- `lin_similarity(synset1, synset2, ic)` - Lin similarity
- `jiang_conrath_similarity(synset1, synset2, ic)` - Jiang-Conrath similarity

### Morphological Functions
- `morphy(form, pos=None)` - Get lemmas for a form
- `valid_forms(lemma, pos=None)` - Get valid forms for a lemma

### Database Management
- `download(lexicon_id)` - Download a lexicon
- `add(path)` - Add a lexicon from file
- `remove(lexicon_id)` - Remove a lexicon
- `lexicons()` - List available lexicons

### Project Management
- `create_project(name, path)` - Create a new project
- `add_project(path)` - Add an existing project

### Information Content
- `ic(lexicon_id)` - Create information content calculator
- `ic.information_content(synset)` - Calculate IC for a synset
- `ic.resnik_similarity(synset1, synset2)` - Resnik similarity with IC

### Validation
- `validate(path)` - Validate WordNet data against schemas
- `validate_lexicon(lexicon_id)` - Validate a specific lexicon

### Export
- `export(lexicon_id, format='xml')` - Export lexicon data
- `export_project(project_id, format='xml')` - Export project data

## Data Structure
The library provides rich data structures:
- **Synset**: Contains definition, examples, relations, members
- **Word**: Contains lemma, forms, pronunciations, counts
- **Sense**: Links words to synsets with metadata
- **Relation**: Represents semantic relationships between synsets

## Progress Handling
The library includes built-in progress tracking for long-running operations:

```python
from wn.util import ProgressBar

# Custom progress handler
progress = ProgressBar(message='Downloading: ', total=100, unit='MB')
wn.download('oewn:2024', progress_handler=progress)

# Or use the default progress bar
wn.download('oewn:2024')  # Shows progress automatically
```

## Configuration
The library supports configuration through environment variables and config files:

```python
import wn

# Set data directory
wn.config.data_directory = '/path/to/wordnet/data'

# Configure logging
wn.config.log_level = 'INFO'

# Set default language
wn.config.default_language = 'en'
```

## Performance Characteristics
- Native Python implementation with optimized data structures
- Efficient indexing for fast lookups
- Memory-efficient for large WordNet datasets
- Support for streaming and lazy loading
- Comprehensive caching mechanisms
- SQLite-based storage for fast queries
- Parallel processing support for large operations

## Benchmark Notes
- Used as reference implementation for wn-ts
- Provides baseline performance for comparison
- Full feature parity target for wn-ts
- Supports advanced NLP tasks beyond basic WordNet lookups
- Mature and well-tested codebase with extensive documentation
- Comprehensive test suite with real WordNet data
- Active development with regular updates

## Pythonia Bridge Integration

The Python wn library can be used in Node.js environments through the [pythonia](https://github.com/extremeheat/JSPyBridge) bridge:

```javascript
import { python } from 'pythonia';

// Import the wn module
const wn = await python('wn');

// Download and use WordNet data
await wn.download('oewn:2024');

// Use wn functions
const synsets = await wn.synsets('run', { pos: 'v' });
console.log(synsets);

// Similarity calculations
const synset1 = await wn.synset('oewn-00001174-n');
const synset2 = await wn.synset('oewn-00001384-n');
const similarity = await wn.path_similarity(synset1, synset2);
console.log(`Similarity: ${similarity}`);
```

This allows direct comparison between the Python reference implementation and the TypeScript port.

## Real-World Usage & Tests
For real-world usage examples, feature comparisons, and integration tests, see:
- [alternatives.test.ts](../../tests/alternatives.test.ts): Comprehensive cross-library tests and usage patterns for python-wn and other WordNet libraries.

## Contributing
The library welcomes contributions and has comprehensive documentation for developers:
- [Contributing Guide](https://github.com/goodmami/wn/blob/main/CONTRIBUTING.md)
- [API Documentation](https://wn.readthedocs.io/)
- [Issue Templates](https://github.com/goodmami/wn/tree/main/.github/ISSUE_TEMPLATE) for bug reports and feature requests 


---
my notes:

python -m wn download oewn:2024 
https://wn.readthedocs.io/en/latest/index.html

