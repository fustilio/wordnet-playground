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

# Safely check for issues without changing the database
wn-cli data download oewn:2024 --dry-run
```

The `--dry-run` flag is particularly useful for debugging. If a download and add operation fails or hangs, running it with `--dry-run` can help diagnose the issue (e.g., checking if a lexicon already exists) without making any changes to the database.



#### List Projects

```bash
# List all available projects
wn-cli data list

# Limit results
wn-cli data list --limit 10
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

#### Find Word Information (`word`)

For developers and researchers needing raw data.

```bash
# Basic word lookup
wn-cli query word "happy"

# Search by part of speech
wn-cli query word "run" --pos v

# Search in specific lexicon
wn-cli query word "happy" --lexicon oewn

# Machine-readable output
wn-cli query word "happy" --json

# Batch processing
wn-cli query word "happy,joy,glad" --batch

# Performance timing
wn-cli query word "happy" --time
```

#### Find Synonyms (`synonyms`)

For content writers looking for alternative words.

```bash
# Find synonyms and alternatives
wn-cli query synonyms "happy" --pos a

# Machine-readable output
wn-cli query synonyms "happy" --json
```

#### Explain Words (`explain`)

For language learners who want simple explanations.

```bash
# Simplified explanations
wn-cli query explain "happy" --pos a

# Another simplified explanation
wn-cli query explain "computer" --pos n

# Machine-readable output
wn-cli query explain "happy" --json
```

#### Search Synsets (`explore` alias)

```bash
# Basic synset search
wn-cli query synset "computer" --pos n

# 'explore' is an alias for 'synset'
wn-cli query explore "car" --pos n

# Machine-readable output
wn-cli query synset "computer" --json
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

### Browser/Web Build Tools

#### Prepare Browser Data

The `browser` command group provides tools for preparing browser-optimized WordNet data for use in web applications (e.g., wn-ts-web).

```bash
# Prepare browser-optimized data for a specific lexicon (default: oewn)
wn-cli browser prep --lexicon oewn

# Specify a custom output directory
wn-cli browser prep --lexicon wn31 --outDir ../my-web-app/data

# Dry run (show what would be done without writing files)
wn-cli browser prep --lexicon oewn --dry-run
```

- Converts index/data files for the specified lexicon into JSON modules for browser use.
- Supports multilingual output by specifying the lexicon.
- Intended for use in build pipelines for browser-based WordNet apps.

## Real-World Use Cases

### For Researchers

```bash
# Download and analyze data
wn-cli data download oewn:2024 --progress
wn-cli data stats --lexicon oewn --json > analysis.json

# Export for external analysis
wn-cli data export --format json --output research-data.json

# Batch processing for analysis
wn-cli query word "happy,joy,glad,elated" --batch --json > word-analysis.json
```

### For NLP Developers

```bash
# Get machine-readable output for scripts
wn-cli query word "happy" --json | jq '.[0].synsets'

# Pipe plain-text output to other tools
wn-cli query word "happy" --plain | grep "of the highest quality"

# Performance testing
wn-cli query word "happy" --time

# Batch processing with error handling
wn-cli query word "happy,joy,glad" --batch --json

# Integration with other tools
wn-cli query synset "computer" --json | python my-analysis-script.py

# Advanced scripting with jq to find synsets with specific definitions
wn-cli query synset "run" --pos v --json | jq '[.[] | select(.definitions[0].text | test("race"))]'
```

### For Content Writers

```bash
# Find synonyms for writing
wn-cli query synonyms "happy" --pos a
```

### For Language Learners

```bash
# Learn about a word
wn-cli query explain "happy" --pos a

# Another simplified explanation
wn-cli query explain "run" --pos v
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
wn-cli db reset --force
```

## Options Reference

### Global Options

- `--help, -h`: Show help
- `--version, -V`: Show version
- `--tui`: Launch interactive TUI
- `--json`: Output in JSON format for scripting.
- `--plain`: Output in plain, line-based text for scripting.
- `--no-color`: Disable color output. Also respects the `NO_COLOR` environment variable.
- `--verbose, -v`: Show detailed information
- `--quiet, -q`: Suppress non-essential messages

### Query Options

-   `--pos <pos>`: Part of speech (n, v, a, r).
-   `--lexicon <lexicon>`: Lexicon ID to query (e.g., oewn, wn31).
-   `--batch`: Process a comma-separated list of words.
-   `--time`: Show timing information for the query.

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

- `dataDirectory`: Where WordNet data is stored.
- `downloadDirectory`: Where downloads are cached.

## Error Handling

The CLI provides clear error messages and suggestions:

- **Download failures**: Check network and try `--force`
- **Query failures**: Verify lexicon is installed
- **Database errors**: Use `wn-cli db reset --force` if the database is in a bad state.
- **Performance issues**: Use `--time` flag to identify bottlenecks

## Database Lock Handling and Troubleshooting

- The CLI checks for database locks before performing add operations. If a lock is detected, it will:
  - Print a clear error message.
  - Suggest waiting a few seconds and trying again.
  - Advise ensuring no other CLI, GUI, or test is using the database.
  - On Windows, recommend restarting your computer if the problem persists.
- You can check the lock status at any time with:
  ```sh
  wn-cli db status
  ```
  This command will report if the database is locked and suggest remedies.
- The underlying wn-ts library now closes DB connections on all major process events and adds a short delay on Windows to help release file handles, making the system more robust even if a command is cancelled or interrupted.

## Development

### Building

```bash
# Build the CLI
npm run build

# Run in development
npm run dev
```

### Building Browser Data

```bash
# Prepare browser-optimized data for wn-ts-web
wn-cli browser prep --lexicon oewn --outDir ../wn-ts-web/data
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
