---
title: Command Line Interface
description: Powerful CLI tools for WordNet data exploration and management
---

# Command Line Interface

Use the WordNet TypeScript ecosystem's CLI tools for data exploration, management, and scripting.

## Quick Start

### Installation

```bash
npm install -g wn-cli
```

### Basic Usage

```bash
# Search for words
wn-cli search "computer" --lexicon oewn:2024

# Get word relationships
wn-cli relations "computer" --type hypernym

# Translate words
wn-cli translate "computer" --from en --to fr

# Interactive mode
wn-cli --tui
```

## 🏗️ **Architecture**

The CLI platform provides:

- **Command-Line Tools**: Direct terminal access
- **Interactive TUI**: Terminal user interface
- **Batch Processing**: Handle multiple operations
- **Scripting Support**: Integrate with shell scripts

## 📚 **Features**

### **Data Management**
- Download lexicons
- Add/remove data sources
- Export data in various formats
- Database maintenance

### **Query Operations**
- Word search and lookup
- Synset exploration
- Relationship queries
- Cross-lingual operations

### **Interactive Mode**
- Terminal user interface (TUI)
- Real-time search
- Visual data exploration
- Keyboard shortcuts

### **Batch Processing**
- Process multiple queries
- Script automation
- Output formatting
- Error handling

## 🔧 **Commands**

### **Search Commands**

```bash
# Search words
wn-cli search "computer" --lexicon oewn:2024

# Search with filters
wn-cli search "run" --pos v --limit 10

# Fuzzy search
wn-cli search "computr" --fuzzy
```

### **Relation Commands**

```bash
# Get hypernyms
wn-cli relations "computer" --type hypernym

# Get all relations
wn-cli relations "computer" --all

# Get similarity
wn-cli similarity "computer" "machine"
```

### **Translation Commands**

```bash
# Translate word
wn-cli translate "computer" --from en --to fr

# Get available languages
wn-cli languages

# Translation confidence
wn-cli translate "computer" --from en --to fr --confidence
```

### **Data Management**

```bash
# Download lexicon
wn-cli download oewn:2024

# Add lexicon
wn-cli add oewn:2024

# List lexicons
wn-cli list

# Remove lexicon
wn-cli remove oewn:2024
```

## 🎯 **Interactive Mode (TUI)**

Launch the interactive terminal interface:

```bash
wn-cli --tui
```

### **TUI Features**

- **Real-time Search**: Type to search instantly
- **Visual Navigation**: Browse through results
- **Keyboard Shortcuts**: Efficient navigation
- **Data Visualization**: See relationships graphically

### **Keyboard Shortcuts**

- `Ctrl+C`: Exit
- `Tab`: Navigate between sections
- `Enter`: Select item
- `Esc`: Go back
- `?`: Help

## 🔧 **Configuration**

### **Global Configuration**

```bash
# Set default lexicon
wn-cli config set default-lexicon oewn:2024

# Set output format
wn-cli config set output-format json

# Set cache directory
wn-cli config set cache-dir ~/.wordnet-cache
```

### **Configuration File**

```json
{
  "defaultLexicon": "oewn:2024",
  "outputFormat": "table",
  "cacheDir": "~/.wordnet-cache",
  "enableColors": true,
  "maxResults": 100
}
```

## 📖 **Scripting**

### **Shell Integration**

```bash
#!/bin/bash
# Find all hypernyms of a word
wn-cli relations "$1" --type hypernym --format json | jq '.[].lemma'
```

### **Node.js Integration**

```javascript
const { execSync } = require('child_process');

function searchWords(term) {
  const result = execSync(`wn-cli search "${term}" --format json`, { encoding: 'utf8' });
  return JSON.parse(result);
}
```

## 🎯 **Examples**

- **[Basic Usage](/examples/cli/)** - Simple CLI operations
- **[Advanced Scripting](/examples/cli/)** - Complex automation
- **[CLI Examples](/examples/cli/)** - Working examples

## 📚 **Further Reading**

- **[CLI Reference](/api/cli/)** - Complete command reference
- **[TUI Guide](/packages/wn-cli/tui/)** - Interactive interface guide
- **[Examples](/examples/cli/)** - Working scripts and demos

---

**Ready to explore WordNet from the command line? Try `wn-cli --tui` to get started! 🚀**
