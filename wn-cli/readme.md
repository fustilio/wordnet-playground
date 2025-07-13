# WordNet CLI

A powerful command-line interface for managing and querying WordNet data using the `wn-ts` library. Designed for researchers, developers, content writers, language learners, and system administrators.

## Quick Start

```bash
# Install globally
npm install -g wn-cli

# Or use with npx
npx wn-cli --help

# Launch interactive TUI
npx wn-cli --tui
```

## TUI (Interactive Mode)

For users who prefer a guided, visual experience, `wn-cli` includes a powerful Text-based User Interface (TUI) built with Ink and Ink UI components. It's perfect for exploring WordNet data, discovering relationships between words, and for tasks that benefit from an interactive workflow.

Launch it with:
`wn-cli --tui`

The TUI features a modern, component-based architecture with:
- **Shared Components**: Reusable UI components for consistent experience
- **Theme System**: Centralized styling and theming
- **Error Boundaries**: Graceful error handling and recovery
- **Responsive Design**: Adapts to different terminal sizes
- **Persistent Status Bar**: Always-visible context and shortcuts

The TUI is ideal for:
-   **Interactive Exploration**: Navigate through synsets, definitions, and relations without needing to know command syntax.
-   **Writing Assistance**: Get real-time synonym suggestions in a user-friendly interface.
-   **Learning**: A non-intimidating way for language learners to discover new words and concepts.
-   **Data Management**: Visually manage downloaded WordNet projects.

<details>
<summary>TUI Screenshot (conceptual)</summary>

```
┌─ WordNet CLI - Interactive TUI ────────────────────────────────────────────────────────────────────────┐
│ 📋 WordNet CLI - Main Menu                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Available Features ──────────────┐ ┌─ Feature Details ─────────────────────────────────────────────┐ │
│ │ 🔍  Word Search                  │ │ [Search & Explore]                                            │ │
│ │ 🌐  Synset Explorer              │ │                                                               │ │
│ │ 📖  Sense Browser                │ │ Find words and their definitions. Type a word and press      │ │
│ │ 🌍  Cross-Language Search (CILI) │ │ Enter to search.                                              │ │
│ │ ✍️   Writing Assistance          │ │                                                               │ │
│ │ 🎓  Learning Mode                │ │ ┌─ Ready to explore WordNet data ──────────────────────────┐ │ │
│ │ ⚙️   Settings                    │ │ │                                                           │ │
│ │ 📦  Data Manager                 │ │ └───────────────────────────────────────────────────────────┘ │ │
│ │ ❓  Help                         │ │                                                               │ │
│ │ 🚪  Exit                         │ │                                                               │ │
│ │                                  │ │                                                               │ │
│ │ ↑↓: Navigate | Enter: Select     │ │                                                               │ │
│ └───────────────────────────────────┘ └───────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Current: menu | Ctrl+D: Debug | Ctrl+C: Exit | ?: Help                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
</details>

### TUI Features

#### **Modern Architecture**
- **Shared Components**: Reusable UI components for consistency
- **Theme System**: Centralized styling and theming
- **Error Boundaries**: Graceful error handling and recovery
- **Component-Based**: Modular, testable, and maintainable code

#### **Responsive Design**
- Adapts to different terminal sizes
- Optimized layouts for wide, medium, and narrow screens
- Consistent navigation across all views

#### **Enhanced Navigation**
- **Keyboard Shortcuts**: 
  - `↑↓`: Navigate menus
  - `Enter`: Select/Confirm
  - `Escape`: Go back/Exit
  - `Ctrl+D`: Toggle debug panel
  - `Ctrl+C`: Exit application
  - `?` or `h`: Show help
- **Tab Navigation**: Switch between panels
- **Global Help**: Access help from anywhere with `?`
- **Persistent Status Bar**: Always-visible context and shortcuts

#### **Modern UI Components**
- **Select Components**: Dropdown menus with emoji icons
- **Text Input**: Search fields with placeholders
- **Spinners**: Loading indicators for async operations
- **Alerts**: Success, error, and info messages
- **Badges**: Status indicators and categories
- **Progress Indicators**: For long-running operations

#### **Feature Categories**
- **Search & Explore**: Word Search, Synset Explorer, Sense Browser
- **Language Tools**: Cross-Language Search, Writing Assistant, Learning Mode
- **System**: Settings, Data Manager
- **Navigation**: Help, Exit

## Overview

The `wn-cli` provides a comprehensive set of tools for different user types, following the design principles of the [Command Line Interface Guidelines (CLIG)](https://clig.dev/).

- **Researchers**: Statistical analysis, data export, batch processing.
- **NLP Developers**: Machine-readable output, API integration, performance metrics.
- **Content Writers**: Synonym finding, writing assistance, context-aware suggestions.
- **Language Learners**: Simplified explanations, examples, learning tips.
- **System Administrators**: Installation, configuration, maintenance.

If a command is run without its required arguments, it displays help text to guide the user.

## Commands

### Data Management

#### Download Projects

```bash
# Download a specific project
wn-cli data download oewn:2024

# Force re-download
wn-cli data download oewn:2024 --force

# Show progress
wn-cli data download oewn:2024 --progress
```

#### Add Lexical Resources

```bash
# Add an LMF XML file
wn-cli data add path/to/lexicon.xml

# Force re-add
wn-cli data add path/to/lexicon.xml --force
```

#### Remove Lexicons

```bash
# Remove a lexicon by identifier
wn-cli data remove lexicon-id
```

#### Export Data

```bash
# Export to JSON (default)
wn-cli data export

# Export to XML
wn-cli data export --format xml

# Export to CSV
wn-cli data export --format csv

# Export to specific file
wn-cli data export --output data.json

# Export to stdout to pipe to other tools
wn-cli data export --include oewn --format json --output - | jq .

# Include specific lexicons
wn-cli data export --include oewn,wn31

# Exclude specific lexicons
wn-cli data export --exclude demo,test
```


### Querying

#### Find Word Information (`lookup`)

For developers and researchers needing raw data.

```bash
# Basic word lookup
wn-cli query lookup "happy"

# Search by part of speech
wn-cli query lookup "run" --pos v

# Search in specific lexicon
wn-cli query lookup "happy" --lexicon oewn

# Machine-readable output
wn-cli query lookup "happy" --json

# Batch processing
wn-cli query lookup "happy,joy,glad" --batch

# Performance timing
wn-cli query lookup "happy" --time
```

#### Find Synonyms (`synonyms`)

For content writers looking for alternative words.

```bash
# Find synonyms and alternatives
wn-cli query synonyms "happy" --pos a

# Context-aware suggestions
wn-cli query synonyms "computer" --pos n --context "technology"

# Include definitions and examples
wn-cli query synonyms "happy" --include-definitions --include-examples

# Machine-readable output
wn-cli query synonyms "happy" --json
```

#### Explain Words (`explain`)

For language learners who want simple explanations.

```bash
# Simplified explanations
wn-cli query explain "happy" --pos a

# Even simpler explanations
wn-cli query explain "computer" --pos n --simple

# Include examples and similar words
wn-cli query explain "happy" --include-examples --include-synonyms

# Machine-readable output
wn-cli query explain "happy" --json
```

#### Search Synsets

```bash
# Basic synset search
wn-cli query synset "computer" --pos n

# Include relationship information
wn-cli query synset "computer" --include-relations

# Machine-readable output
wn-cli query synset "computer" --json
```

#### Search Senses

```bash
# Basic sense search
wn-cli query sense "run" --pos v

# Machine-readable output
wn-cli query sense "run" --json
```

#### List Projects

```bash
# List all available projects
wn-cli projects

# Limit results
wn-cli projects --limit 10
```

### Database Management

#### Status Check

```bash
# Basic status
wn-cli db status

# Detailed status
wn-cli db status --verbose
```

#### Cache Management

```bash
# View cache contents
wn-cli db cache

# Clean cache (dry run)
wn-cli db clean --dry-run

# Clean cache (actual)
wn-cli db clean
```

#### Database Maintenance

```bash
# Unlock locked databases
wn-cli db unlock

# Force unlock
wn-cli db unlock --force

# Reset all databases (WARNING: destructive)
wn-cli db reset --force
```

### Configuration

#### View Configuration

```bash
# Show current config
wn-cli config
```

#### Modify Configuration

```bash
# Set configuration value
wn-cli config --set dataDirectory=/custom/path
```

### Information

#### System Info

```bash
# Show data information
wn-cli info
```

## Real-World Use Cases

### For Researchers

```bash
# Download and analyze data
wn-cli data download oewn:2024 --progress
wn-cli data stats --lexicon oewn --json > analysis.json

# Export for external analysis
wn-cli data export --format json --output research-data.json

# Batch processing for analysis
wn-cli query lookup "happy,joy,glad,elated" --batch --json > word-analysis.json
```

### For NLP Developers

```bash
# Get machine-readable output for scripts
wn-cli query lookup "happy" --json | jq '.[0].synsets'

# Pipe plain text output to other tools
wn-cli query lookup "happy" --plain | grep "of the highest quality"

# Performance testing
wn-cli query lookup "happy" --time

# Batch processing with error handling
wn-cli query lookup "happy,joy,glad" --batch --json

# Integration with other tools
wn-cli query synset "computer" --json | python my-analysis-script.py

# Advanced scripting with jq to find synsets with specific definitions
wn-cli query synset "run" --pos v --json | jq '[.[] | select(.definitions[0].text | test("race"))]'
```

### For Content Writers

```bash
# Find synonyms for writing
wn-cli query synonyms "happy" --pos a

# Context-aware suggestions
wn-cli query synonyms "computer" --pos n --context "technology"

# Get alternatives with examples
wn-cli query synonyms "beautiful" --include-examples --include-definitions
```

### For Language Learners

```bash
# Learn about a word
wn-cli query explain "happy" --pos a

# Simplified explanations
wn-cli query explain "computer" --pos n --simple

# Practice with examples
wn-cli query explain "run" --pos v --include-examples --include-synonyms
```

### For System Administrators

```bash
# Check system status
wn-cli db status --verbose

# Monitor disk usage
wn-cli db cache

# Clean up space
wn-cli db clean --dry-run
wn-cli db clean

# Troubleshoot issues
wn-cli db unlock
wn-cli db reset --force
```

## Workflows

### Getting Started

1. **Install and Setup**

   ```bash
   # Check if CLI is working
   wn-cli --help

   # View available projects
   wn-cli projects
   ```

2. **Download Your First Project**

   ```bash
   # Download Open English WordNet
   wn-cli data download oewn:2024 --progress

   # Verify download
   wn-cli db status
   ```

3. **Make Your First Query**

   ```bash
   # Look up a word
   wn-cli query lookup "computer"

   # Explore synsets
   wn-cli query synset "computer" --pos n
   ```

### Research Workflow

1. **Download Multiple Projects**

   ```bash
   # Download core projects
   wn-cli data download oewn:2024 --progress
   wn-cli data download wn31:3.1 --progress

   # Check status
   wn-cli db status --verbose
   ```

2. **Generate Statistics**

   ```bash
   # Basic statistics
   wn-cli stats --lexicon oewn

   # Detailed analysis
   wn-cli stats --lexicon oewn --pos n --json > noun-stats.json
   ```

3. **Export for Analysis**

   ```bash
   # Export all data
   wn-cli data export --format json --output wordnet-data.json

   # Export specific lexicons
   wn-cli data export --include oewn,wn31 --format csv
   ```

### Writing Workflow

1. **Find Synonyms**

   ```bash
   # Get writing suggestions
   wn-cli query synonyms "happy" --pos a

   # Context-aware alternatives
   wn-cli query synonyms "computer" --pos n --context "technology"
   ```

2. **Explore Related Words**

   ```bash
   # Get synsets with relationships
   wn-cli query synset "computer" --include-relations
   ```

### Learning Workflow

1. **Learn New Words**

   ```bash
   # Get simplified explanations
   wn-cli query explain "computer" --pos n --simple

   # Practice with examples
   wn-cli query explain "happy" --include-examples --include-synonyms
   ```

2. **Explore Word Relationships**

   ```bash
   # Understand word meanings
   wn-cli query synset "happy" --pos a
   ```

### Maintenance Workflow

1. **Regular Status Checks**

   ```bash
   # Quick status
   wn-cli db status

   # Detailed check
   wn-cli db status --verbose
   ```

2. **Cache Management**

   ```bash
   # Check cache usage
   wn-cli db cache

   # Clean if needed (dry run first)
   wn-cli db clean --dry-run
   wn-cli db clean
   ```

3. **Troubleshooting**

   ```bash
   # If databases are locked
   wn-cli db unlock

   # If you need a fresh start
   wn-cli db reset --force
   ```

## Options Reference

### Global Options

- `--help, -h`: Show help
- `--version, -V`: Show version
- `--tui`: Launch interactive TUI
- `--json`: Output in JSON format for scripting.
- `--plain`: Output in plain, line-based text for scripting with tools like `grep`.
- `--no-color`: Disable color output. Also respects the `NO_COLOR` environment variable.
- `--verbose, -v`: Show detailed information
- `--quiet, -q`: Suppress non-essential messages

### Query Options

- `--pos <pos>`: Part of speech (n, v, a, r)
- `--lexicon <lexicon>`: Lexicon to query
- `--batch`: Process multiple words (comma-separated)
- `--include-synonyms`: Include synonym information
- `--include-examples`: Include example sentences
- `--include-definitions`: Include word definitions
- `--include-relations`: Include relationship information
- `--time`: Show timing information
- `--context <context>`: Context for `query synonyms`
- `--simple`: Show simplified explanations for `query explain`

### Export Options

- `--format <format>`: Export format (json, xml, csv)
- `--output <file>`: Output file path
- `--include <lexicons>`: Comma-separated lexicons to include
- `--exclude <lexicons>`: Comma-separated lexicons to exclude

### Database Options

- `--verbose, -v`: Show detailed information
- `--force, -f`: Force operations
- `--dry-run`: Show what would be done without doing it

## Configuration

The CLI uses configuration from the `wn-ts` library. Key settings:

- `dataDirectory`: Where WordNet data is stored
- `downloadDirectory`: Where downloads are cached

## Error Handling

The CLI provides clear error messages and suggestions:

- **Download failures**: Check network and try `--force`
- **Query failures**: Verify lexicon is installed
- **Database errors**: Use `wn-cli db unlock` or `wn-cli db reset --force`
- **Performance issues**: Use `--time` flag to identify bottlenecks

## Development

### Building

```bash
# Build the CLI
npm run build

# Run in development
npm run dev
```

### Testing

```bash
# Run tests
npm test
```

## Migration from wn-ts CLI

This CLI was migrated from the `wn-ts` library to keep the library standalone. The functionality remains the same, but now it's a separate package that depends on `wn-ts`.

## License

Same as the `wn-ts` library.
