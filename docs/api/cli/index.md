---
title: CLI API Reference
description: Complete API reference for the WordNet TypeScript CLI platform
---

# CLI API Reference

Complete API reference for the WordNet TypeScript CLI platform, including commands, options, and scripting capabilities.

## Quick Start

```bash
# Install CLI globally
npm install -g wn-cli

# Search for words
wn-cli search "computer" --lexicon oewn:2024

# Interactive mode
wn-cli --tui
```

## Commands

### **Search Commands**

#### **`search` - Search for words**

```bash
# Basic search
wn-cli search "computer"

# Search with lexicon
wn-cli search "computer" --lexicon oewn:2024

# Search with filters
wn-cli search "run" --pos v --limit 10

# Fuzzy search
wn-cli search "computr" --fuzzy

# Search with output format
wn-cli search "computer" --format json
```

**Options:**
- `--lexicon, -l` - Specify lexicon (default: oewn:2024)
- `--pos, -p` - Part of speech filter (n, v, a, r)
- `--limit, -n` - Limit number of results
- `--offset, -o` - Offset for pagination
- `--fuzzy, -f` - Enable fuzzy matching
- `--format, -F` - Output format (table, json, csv)
- `--verbose, -v` - Verbose output

#### **`synsets` - Search for synsets**

```bash
# Search synsets by word
wn-cli synsets "computer"

# Search synsets with filters
wn-cli synsets "run" --pos v --language en

# Search synsets by ILI
wn-cli synsets --ili i12345
```

**Options:**
- `--lexicon, -l` - Specify lexicon
- `--pos, -p` - Part of speech filter
- `--language, -L` - Language filter
- `--ili, -i` - Search by ILI ID
- `--limit, -n` - Limit number of results
- `--format, -F` - Output format

### **Relation Commands**

#### **`relations` - Get word relationships**

```bash
# Get hypernyms
wn-cli relations "computer" --type hypernym

# Get hyponyms
wn-cli relations "computer" --type hyponym

# Get all relations
wn-cli relations "computer" --all

# Get relations with depth
wn-cli relations "computer" --type hypernym --depth 3
```

**Options:**
- `--type, -t` - Relation type (hypernym, hyponym, meronym, holonym, etc.)
- `--all, -a` - Get all relations
- `--depth, -d` - Traversal depth
- `--lexicon, -l` - Specify lexicon
- `--format, -F` - Output format

#### **`similarity` - Calculate semantic similarity**

```bash
# Path similarity
wn-cli similarity "computer" "machine" --type path

# Wu-Palmer similarity
wn-cli similarity "computer" "machine" --type wu-palmer

# Leacock-Chodorow similarity
wn-cli similarity "computer" "machine" --type lch

# Jaccard similarity
wn-cli similarity "computer" "machine" --type jaccard
```

**Options:**
- `--type, -t` - Similarity type (path, wu-palmer, lch, jaccard)
- `--lexicon, -l` - Specify lexicon
- `--format, -F` - Output format

### **Translation Commands**

#### **`translate` - Translate words**

```bash
# Translate word
wn-cli translate "computer" --from en --to fr

# Translate with confidence
wn-cli translate "computer" --from en --to fr --confidence

# Translate synset
wn-cli translate --synset synset-id --to fr

# Batch translation
wn-cli translate "computer,program,algorithm" --from en --to fr
```

**Options:**
- `--from, -f` - Source language
- `--to, -t` - Target language
- `--synset, -s` - Translate by synset ID
- `--confidence, -c` - Show confidence scores
- `--lexicon, -l` - Specify lexicon
- `--format, -F` - Output format

#### **`languages` - List available languages**

```bash
# List all languages
wn-cli languages

# List languages for specific lexicon
wn-cli languages --lexicon oewn:2024

# List with statistics
wn-cli languages --stats
```

**Options:**
- `--lexicon, -l` - Specify lexicon
- `--stats, -s` - Show statistics
- `--format, -F` - Output format

### **Data Management Commands**

#### **`download` - Download lexicons**

```bash
# Download lexicon
wn-cli download oewn:2024

# Download with specific version
wn-cli download oewn:2024 --version 1.0.0

# Download to specific directory
wn-cli download oewn:2024 --output ./data
```

**Options:**
- `--version, -v` - Specific version
- `--output, -o` - Output directory
- `--force, -f` - Force download
- `--verbose, -V` - Verbose output

#### **`add` - Add lexicon to database**

```bash
# Add lexicon
wn-cli add oewn:2024

# Add with options
wn-cli add oewn:2024 --create-db --enable-wal
```

**Options:**
- `--create-db` - Create database if not exists
- `--enable-wal` - Enable WAL mode
- `--verbose, -V` - Verbose output

#### **`remove` - Remove lexicon from database**

```bash
# Remove lexicon
wn-cli remove oewn:2024

# Remove with confirmation
wn-cli remove oewn:2024 --confirm
```

**Options:**
- `--confirm, -y` - Skip confirmation
- `--verbose, -V` - Verbose output

#### **`list` - List installed lexicons**

```bash
# List lexicons
wn-cli list

# List with details
wn-cli list --details

# List with statistics
wn-cli list --stats
```

**Options:**
- `--details, -d` - Show detailed information
- `--stats, -s` - Show statistics
- `--format, -F` - Output format

### **Database Commands**

#### **`status` - Database status**

```bash
# Show database status
wn-cli status

# Show detailed status
wn-cli status --details

# Show for specific lexicon
wn-cli status --lexicon oewn:2024
```

**Options:**
- `--details, -d` - Show detailed information
- `--lexicon, -l` - Specific lexicon
- `--format, -F` - Output format

#### **`cleanup` - Database cleanup**

```bash
# Cleanup database
wn-cli cleanup

# Cleanup with options
wn-cli cleanup --vacuum --analyze
```

**Options:**
- `--vacuum, -v` - Vacuum database
- `--analyze, -a` - Analyze database
- `--verbose, -V` - Verbose output

## Interactive Mode (TUI)

### **Launch TUI**

```bash
# Start interactive mode
wn-cli --tui

# Start with specific lexicon
wn-cli --tui --lexicon oewn:2024

# Start with options
wn-cli --tui --theme dark --fullscreen
```

**Options:**
- `--lexicon, -l` - Default lexicon
- `--theme, -t` - Theme (light, dark, auto)
- `--fullscreen, -f` - Fullscreen mode
- `--config, -c` - Config file path

### **TUI Features**

- **Real-time Search**: Type to search instantly
- **Visual Navigation**: Browse through results
- **Keyboard Shortcuts**: Efficient navigation
- **Data Visualization**: See relationships graphically
- **Multi-panel Layout**: Side-by-side comparison

### **Keyboard Shortcuts**

| Key | Action |
|-----|--------|
| `Ctrl+C` | Exit |
| `Tab` | Navigate between sections |
| `Enter` | Select item |
| `Esc` | Go back |
| `?` | Help |
| `Ctrl+F` | Search |
| `Ctrl+R` | Refresh |
| `Ctrl+L` | Clear screen |

## Configuration

### **Global Configuration**

```bash
# Set default lexicon
wn-cli config set default-lexicon oewn:2024

# Set output format
wn-cli config set output-format json

# Set cache directory
wn-cli config set cache-dir ~/.wordnet-cache

# Set theme
wn-cli config set theme dark

# Show configuration
wn-cli config get

# Reset configuration
wn-cli config reset
```

### **Configuration File**

```json
{
  "defaultLexicon": "oewn:2024",
  "outputFormat": "table",
  "cacheDir": "~/.wordnet-cache",
  "enableColors": true,
  "maxResults": 100,
  "theme": "auto",
  "enableFuzzy": true,
  "enableVerbose": false
}
```

## Scripting

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

function getRelations(word, type) {
  const result = execSync(`wn-cli relations "${word}" --type ${type} --format json`, { encoding: 'utf8' });
  return JSON.parse(result);
}
```

### **Python Integration**

```python
import subprocess
import json

def search_words(term):
    result = subprocess.run(['wn-cli', 'search', term, '--format', 'json'], 
                          capture_output=True, text=True)
    return json.loads(result.stdout)

def get_relations(word, relation_type):
    result = subprocess.run(['wn-cli', 'relations', word, '--type', relation_type, '--format', 'json'], 
                          capture_output=True, text=True)
    return json.loads(result.stdout)
```

## Testing

### **Test CLI Commands**

```bash
# Test search functionality
wn-cli search "computer" --lexicon oewn:2024

# Test relations
wn-cli relations "computer" --type hypernym

# Test translation
wn-cli translate "computer" --from en --to fr

# Test TUI
wn-cli --tui --help
```

### **Automated Testing**

```bash
#!/bin/bash
# Test script for CLI functionality

echo "Testing CLI commands..."

# Test search
wn-cli search "test" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Search command works"
else
    echo "✗ Search command failed"
fi

# Test relations
wn-cli relations "test" --type hypernym > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Relations command works"
else
    echo "✗ Relations command failed"
fi

echo "Testing complete"
```

## Troubleshooting

### **Common Issues**

#### **Command Not Found**
```bash
# Check if CLI is installed
wn-cli --version

# Check PATH
echo $PATH

# Reinstall if needed
npm install -g wn-cli
```

#### **Database Not Found**
```bash
# Check if lexicon is installed
wn-cli list

# Download lexicon if needed
wn-cli download oewn:2024
wn-cli add oewn:2024
```

#### **Permission Errors**
```bash
# Check file permissions
ls -la ~/.wordnet-cache

# Fix permissions if needed
chmod 755 ~/.wordnet-cache
```

## Further Reading

- **[CLI Platform Guide](/platforms/cli/)** - Complete platform documentation
- **[TUI Guide](/packages/wn-cli/tui/)** - Interactive interface guide
- **[Examples](/examples/cli/)** - Working scripts and demos

---

**Ready to explore WordNet from the command line? Try `wn-cli --tui` to get started! 🚀**
