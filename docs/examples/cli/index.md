---
title: CLI Examples
description: Command-line examples and scripts for WordNet TypeScript
---

# CLI Examples

Command-line examples and scripts demonstrating the WordNet TypeScript CLI functionality.

## Quick Start

```bash
# Install CLI globally
npm install -g wn-cli

# Search for words
wn-cli search "computer" --lexicon oewn:2024

# Interactive mode
wn-cli --tui
```

## Basic Examples

### Word Search

```bash
# Basic search
wn-cli search "computer"

# Search with filters
wn-cli search "run" --pos v --limit 10

# Fuzzy search
wn-cli search "computr" --fuzzy
```

### Word Relationships

```bash
# Get hypernyms
wn-cli relations "computer" --type hypernym

# Get all relations
wn-cli relations "computer" --all

# Get similarity
wn-cli similarity "computer" "machine"
```

### Translation

```bash
# Translate word
wn-cli translate "computer" --from en --to fr

# Get available languages
wn-cli languages
```

## Advanced Examples

### Batch Processing

```bash
# Process multiple words
echo "computer,program,algorithm" | xargs -d ',' -I {} wn-cli search "{}"
```

### Scripting

```bash
#!/bin/bash
# Find all hypernyms of a word
wn-cli relations "$1" --type hypernym --format json | jq '.[].lemma'
```

## Interactive Mode

```bash
# Launch TUI
wn-cli --tui

# TUI with specific lexicon
wn-cli --tui --lexicon oewn:2024
```

## Further Reading

- **[CLI Platform Guide](/platforms/cli/)** - Complete CLI documentation
- **[CLI API Reference](/api/cli/)** - Complete API reference
- **[TUI Guide](/packages/wn-cli/tui/)** - Interactive interface guide

---

**Ready to explore WordNet from the command line? Try `wn-cli --tui` to get started!**
