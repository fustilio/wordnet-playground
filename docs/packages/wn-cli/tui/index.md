---
title: TUI Guide
description: Interactive Terminal User Interface guide for WordNet CLI
---

# TUI Guide

Interactive Terminal User Interface (TUI) guide for the WordNet TypeScript CLI.

## Overview

The TUI provides an interactive, terminal-based interface for exploring WordNet data. Built with React Ink, it offers an intuitive experience for researchers, content writers, language learners, and developers who prefer interactive exploration over command-line scripting.

## Quick Start

```bash
# Launch TUI
wn-cli --tui

# TUI with specific lexicon
wn-cli --tui --lexicon oewn:2024

# TUI with options
wn-cli --tui --theme dark --fullscreen
```

## Features

- **Real-time Search**: Type to search instantly
- **Visual Navigation**: Browse through results
- **Keyboard Shortcuts**: Efficient navigation
- **Data Visualization**: See relationships graphically
- **Multi-panel Layout**: Side-by-side comparison

## Keyboard Shortcuts

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

```bash
# Set theme
wn-cli --tui --theme dark

# Set fullscreen mode
wn-cli --tui --fullscreen

# Set default lexicon
wn-cli --tui --lexicon oewn:2024
```

## Troubleshooting

### Common Issues

#### TUI doesn't start
```bash
# Check if CLI is installed
wn-cli --version

# Try with verbose output
wn-cli --tui --verbose
```

#### Navigation issues
- Use `Tab` to navigate between sections
- Use `Enter` to select items
- Use `Esc` to go back

## Further Reading

- **[CLI Platform Guide](/platforms/cli/)** - Complete CLI documentation
- **[CLI API Reference](/api/cli/)** - Complete API reference
- **[CLI Examples](/examples/cli/)** - Working examples

---

**Ready to explore WordNet interactively? Try `wn-cli --tui` to get started!**
