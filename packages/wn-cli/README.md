# wn-cli

Command-line interface for the WordNet TypeScript ecosystem with interactive TUI and comprehensive data management.

## Features

- **Interactive TUI** - Modern text-based user interface for guided exploration
- **Advanced Querying** - Powerful word, synset, and relationship queries
- **Data Management** - Download, manage, and export WordNet datasets
- **Multi-language Support** - Work with multiple languages and lexicons
- **Performance** - Optimized for large datasets and batch operations
- **Developer Tools** - Machine-readable output and scripting support
- **Analytics** - Statistical analysis and data exploration tools

## Installation

```bash
npm install -g wn-cli
```

## Usage

### Basic Commands
```bash
# Search for words
wn-cli search "computer" --lexicon oewn:2024

# Get relationships
wn-cli relations "computer" --type hypernym

# Translate between languages
wn-cli translate "computer" --from en --to fr

# Data management
wn-cli data download oewn:2024
wn-cli data export --format json
```

### Interactive Mode
```bash
# Start interactive TUI
wn-cli interactive

# Start TUI with specific lexicon
wn-cli interactive --lexicon oewn:2024
```

### Output Formats
```bash
# JSON output
wn-cli search "computer" --format json

# CSV output
wn-cli search "computer" --format csv

# Table output
wn-cli search "computer" --format table
```

## Configuration

```bash
# Set default lexicon
wn-cli config set default-lexicon oewn:2024

# Set output format
wn-cli config set output-format json

# View configuration
wn-cli config list
```

## Scripting

```bash
# Shell scripts
wn-cli search "computer" --format json | jq '.words[].lemma'

# Batch processing
for term in computer programming software; do
  wn-cli search "$term" --format json > "${term}.json"
done
```

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Examples](../../docs/examples/README.md)
- [Getting Started](../../docs/getting-started/README.md)