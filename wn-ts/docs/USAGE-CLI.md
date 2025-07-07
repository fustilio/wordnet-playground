# wn-ts Command-Line Interface

The `wn-ts` library provides a comprehensive command-line interface for managing WordNet data, querying the database, and performing various operations.

## Installation

Install the library globally to access the CLI:

```bash
npm install -g wn-ts
# or
pnpm add -g wn-ts
```

## Basic Usage

```bash
wn-ts [command] [options]
```

## Available Commands

### Data Management

#### `download` - Download WordNet Projects

Download WordNet projects to your local system.

```bash
wn-ts download <project> [options]
```

**Arguments:**
- `<project>` - Project identifier (e.g., `oewn:2024`, `omw:1.4`)

**Options:**
- `-f, --force` - Force re-download
- `-p, --progress` - Show progress

**Examples:**
```bash
# Download Open English WordNet 2024
wn-ts download oewn:2024

# Force re-download with progress
wn-ts download oewn:2024 --force --progress

# Download Open Multilingual Wordnet
wn-ts download omw:1.4
```

#### `add` - Add Lexical Resources

Add lexical resources to the database.

```bash
wn-ts add <file> [options]
```

**Arguments:**
- `<file>` - Path to LMF XML file

**Options:**
- `-f, --force` - Force re-add

**Examples:**
```bash
# Add a downloaded WordNet file
wn-ts add oewn-2024-english-wordnet-2024.xml.gz

# Force re-add a file
wn-ts add lexicon.xml --force
```

#### `remove` - Remove Lexicons

Remove lexicons from the database.

```bash
wn-ts remove <lexicon>
```

**Arguments:**
- `<lexicon>` - Lexicon identifier

**Examples:**
```bash
# Remove a specific lexicon
wn-ts remove oewn
```

#### `export` - Export Data

Export data from the database in various formats.

```bash
wn-ts export [options]
```

**Options:**
- `-f, --format <format>` - Export format (json, xml, csv) [default: json]
- `-o, --output <file>` - Output file path
- `-i, --include <lexicons>` - Comma-separated list of lexicons to include
- `-e, --exclude <lexicons>` - Comma-separated list of lexicons to exclude

**Examples:**
```bash
# Export to JSON
wn-ts export --format json --output export.json

# Export specific lexicons to XML
wn-ts export --format xml --output export.xml --include oewn,omw-fr

# Export to CSV excluding test data
wn-ts export --format csv --output export.csv --exclude test
```

### Query Commands

#### `query` - Query WordNet Data

Query words, synsets, or senses in the database.

```bash
wn-ts query <word> [options]
```

**Arguments:**
- `<word>` - Word to look up

**Options:**
- `-p, --pos <pos>` - Part of speech (n, v, a, r)
- `-l, --lexicon <lexicon>` - Lexicon to query
- `-t, --type <type>` - Query type (words, synsets, senses) [default: words]

**Examples:**
```bash
# Query words
wn-ts query run

# Query synsets for a specific part of speech
wn-ts query bank --pos n --type synsets

# Query senses in a specific lexicon
wn-ts query computer --lexicon oewn --type senses
```

#### `projects` - List Available Projects

List all available WordNet projects.

```bash
wn-ts projects [options]
```

**Options:**
- `-l, --limit <number>` - Limit number of projects shown [default: 20]

**Examples:**
```bash
# List all projects
wn-ts projects

# List first 10 projects
wn-ts projects --limit 10
```

### Configuration

#### `config` - Show or Modify Configuration

Show current configuration or modify settings.

```bash
wn-ts config [options]
```

**Options:**
- `-s, --set <key=value>` - Set configuration value

**Examples:**
```bash
# Show current configuration
wn-ts config

# Set data directory
wn-ts config --set dataDirectory=/path/to/data
```

#### `info` - Show Database Information

Show information about installed data.

```bash
wn-ts info
```

**Examples:**
```bash
# Show database information
wn-ts info
```

### Interactive Mode

#### `interactive` - Start Interactive Mode

Start an interactive session for exploring WordNet data.

```bash
wn-ts interactive
# or
wn-ts i
```

**Examples:**
```bash
# Start interactive mode
wn-ts interactive
```

### Database Management

The `db` subcommand provides comprehensive database and cache management capabilities.

#### `db status` - Show Database Status

Show database status and cache information.

```bash
wn-ts db status [options]
```

**Options:**
- `-v, --verbose` - Show detailed statistics

**Examples:**
```bash
# Show basic database status
wn-ts db status

# Show detailed statistics
wn-ts db status --verbose
```

#### `db cache` - Show Cache Contents

Show cache contents and file sizes.

```bash
wn-ts db cache
```

**Examples:**
```bash
# Show cache contents
wn-ts db cache
```

#### `db unlock` - Unlock Locked Databases

Unlock locked databases by removing journal files and closing connections.

```bash
wn-ts db unlock [options]
```

**Options:**
- `-f, --force` - Force unlock even if processes are running

**Examples:**
```bash
# Unlock databases
wn-ts db unlock

# Force unlock
wn-ts db unlock --force
```

#### `db clean` - Clean Cache Directories

Clean up cache directories to free space.

```bash
wn-ts db clean [options]
```

**Options:**
- `--dry-run` - Show what would be cleaned without actually doing it

**Examples:**
```bash
# Clean cache directories
wn-ts db clean

# See what would be cleaned
wn-ts db clean --dry-run
```

#### `db reset` - Reset All Databases

Reset all databases (WARNING: This removes all data).

```bash
wn-ts db reset [options]
```

**Options:**
- `-f, --force` - Force reset without confirmation

**Examples:**
```bash
# Reset all databases (with confirmation)
wn-ts db reset

# Force reset without confirmation
wn-ts db reset --force
```

## Common Use Cases

### Setting Up WordNet Data

```bash
# Download and add Open English WordNet
wn-ts download oewn:2024
wn-ts add oewn-2024-english-wordnet-2024.xml.gz

# Download and add Open Multilingual Wordnet
wn-ts download omw:1.4
wn-ts add omw-1.4-multilingual-wordnet.xml.gz
```

### Exploring Data

```bash
# List available projects
wn-ts projects

# Query words
wn-ts query computer

# Query synsets
wn-ts query bank --type synsets

# Show database status
wn-ts db status
```

### Troubleshooting

```bash
# Check database status
wn-ts db status

# Unlock locked databases
wn-ts db unlock

# Clean up cache
wn-ts db clean

# Reset everything (dangerous!)
wn-ts db reset --force
```

### Exporting Data

```bash
# Export to JSON
wn-ts export --format json --output wordnet.json

# Export specific lexicons to XML
wn-ts export --format xml --output multilingual.xml --include oewn,omw-fr

# Export to CSV
wn-ts export --format csv --output wordnet.csv
```

## Error Handling

The CLI provides comprehensive error handling:

- **Download failures**: Check internet connection and project availability
- **Database errors**: Use `wn-ts db unlock` to fix locked databases
- **Memory issues**: Use `wn-ts db clean` to free up space
- **Timeout errors**: Some operations may take time with large datasets

## Configuration

The CLI uses the same configuration as the library:

- **Data Directory**: Where WordNet data is stored
- **Download Directory**: Where downloaded files are stored
- **Database Path**: Path to the SQLite database

You can modify these settings using the `config` command:

```bash
# Show current configuration
wn-ts config

# Set data directory
wn-ts config --set dataDirectory=/path/to/data
```

## Integration with Library

The CLI is designed to work seamlessly with the library:

```typescript
import { Wordnet } from 'wn-ts';

// Use the same data that the CLI manages
const wn = new Wordnet('oewn');
const words = await wn.words('computer');
```

## Examples

### Complete Workflow

```bash
# 1. Check what's available
wn-ts projects

# 2. Download and add data
wn-ts download oewn:2024
wn-ts add oewn-2024-english-wordnet-2024.xml.gz

# 3. Query the data
wn-ts query computer
wn-ts query bank --type synsets

# 4. Export data
wn-ts export --format json --output export.json

# 5. Manage the database
wn-ts db status
wn-ts db clean
```

### Advanced Usage

```bash
# Download multiple projects
wn-ts download oewn:2024
wn-ts download omw:1.4
wn-ts download cili:1.0

# Add all downloaded files
wn-ts add oewn-2024-english-wordnet-2024.xml.gz
wn-ts add omw-1.4-multilingual-wordnet.xml.gz
wn-ts add cili-1.0-interlingual-index.xml.gz

# Query across multiple lexicons
wn-ts query computer --lexicon oewn
wn-ts query ordinateur --lexicon omw-fr

# Export comprehensive data
wn-ts export --format xml --output multilingual.xml --include oewn,omw-fr,omw-es
```

## Help

Get help for any command:

```bash
# General help
wn-ts --help

# Help for specific command
wn-ts download --help
wn-ts db --help
wn-ts db status --help
```

## Version Information

```bash
wn-ts --version
```

---

The CLI provides a complete interface for managing WordNet data, from downloading and adding resources to querying and exporting data. All operations are designed to work seamlessly with the library API.
