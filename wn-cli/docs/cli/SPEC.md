# CLI Specification

## Overview

The WordNet CLI provides a powerful command-line interface for WordNet data exploration, designed for researchers, developers, content writers, and system administrators. It offers both interactive TUI mode and scriptable commands for automation.

### Design Philosophy

Following modern CLI design principles, our approach emphasizes:

- **Human-first design**: Commands are designed for human users first, machines second
- **Simple parts that work together**: Modular commands that can be composed and piped
- **Consistency across programs**: Following established UNIX conventions
- **Ease of discovery**: Comprehensive help, examples, and suggestions
- **Conversation as the norm**: Treating CLI interaction as a dialogue with the user
- **Robustness**: Graceful error handling and recovery
- **Empathy**: Designing for user success and delight

> **Note:** Every feature available in the TUI must also be accessible via a CLI command, ensuring full scriptability and automation.

## Functional Requirements

### Core CLI Commands
- [x] **Data Management**: Download, add, export, and manage WordNet data
- [x] **Query System**: Search words, synsets, and semantic relations
- [x] **Statistics**: Generate database statistics and analysis
- [x] **Disambiguation**: Word sense disambiguation tools
- [x] **Multilingual**: Cross-language search and analysis
- [x] **Database Management**: Status, cleanup, maintenance, and log viewing
- [x] **Configuration**: User preferences and settings, including opt-in usage logging
- [x] **Project Management**: List and manage available projects (via `data list`)
- [x] **Browser/Web Build Tools**: Prepare browser-optimized data for web apps

### TUI Integration
- [x] **Interactive Mode**: Launch TUI with `--tui` flag
- [x] **Chain Automation**: Script TUI flows with `--chain` flag
- [x] **Snapshot Mode**: Enable testing mode with `--snapshot` flag

### Output Formats
- [x] **JSON Output**: Machine-readable output with `--json` flag
- [x] **Plain Text**: Line-based output with `--plain` flag
- [x] **Color Control**: Disable colors with `--no-color` flag
- [x] **Verbosity**: Control output detail with `-v` and `-q` flags

### Error Handling
- [x] **Graceful Errors**: Proper error handling and exit codes
- [x] **Testing Support**: Exit override for test environments
- [x] **Development Mode**: Enhanced error reporting in development
- [x] **Human-readable Errors**: Clear, actionable error messages
- [x] **Suggestions**: Helpful suggestions when user makes mistakes
- [x] **Signal Handling**: Proper Ctrl+C and signal handling

## Implementation Status

### Completed Features
- [x] **Commander.js Integration**: Full command-line interface with proper help
- [x] **Command Registration**: All commands properly registered and organized
- [x] **Global Options**: Consistent option handling across all commands
- [x] **Help System**: Comprehensive help text with examples
- [x] **TUI Integration**: Seamless integration with React Ink TUI
- [x] **Chain Automation**: Scriptable TUI flows for testing and automation
- [x] **Output Formatting**: JSON, plain text, and color control
- [x] **Error Handling**: Robust error handling with proper exit codes
- [x] **Usage Logging**: Opt-in logging of user commands for development analysis

### In Progress
- [ ] **Advanced Automation**: Enhanced chain command capabilities
- [ ] **Performance Optimization**: Optimize command execution speed
- [x] **Additional Formats**: Support for CSV, XML export formats

### Planned Features
- [ ] **Plugin System**: Extensible command system
- [x] **Batch Processing**: Process multiple inputs efficiently
- [x] **Progress Indicators**: Better progress reporting for long operations
- [x] **Configuration Persistence**: Save user preferences

## Directory Structure

```
src/
├── cli.tsx                    # Main CLI entry point and program builder
├── commands/                  # Command implementations
│   ├── data.ts               # Data download, add, export, management
│   ├── query.ts              # Word and synset search
│   ├── stats.ts              # Database statistics and analysis
│   ├── disambiguation.ts     # Word sense disambiguation
│   ├── multilingual.ts       # Cross-language search
│   ├── db.ts                 # Database management and status
│   ├── config.ts             # Configuration management
│   ├── lexicons.ts           # Lexicon management
│   ├── layout-test.ts        # Layout system testing
│   └── utils/                # Command utilities
├── app.tsx                   # TUI application component
└── wordnet-singleton.ts      # WordNet instance management
```

## Technical Design

### Architecture
- **Commander.js**: Primary CLI framework with proper command organization
- **React Ink**: TUI integration for interactive mode
- **TypeScript**: Type-safe command implementations
- **Modular Design**: Each command type in separate module

### Command Structure
```typescript
// Example command registration
program
  .command('query')
  .description('Search WordNet data')
  .option('--json', 'Output in JSON format')
  .option('--plain', 'Output in plain text')
  .action(async (options) => {
    // Command implementation
  });

// Example browser command registration
program
  .command('browser')
  .description('Browser/web build tools for wn-ts-web')
  .command('prep')
  .description('Prepare browser-optimized WordNet data modules for wn-ts-web (multilingual aware)')
  .option('--lexicon <id>', 'Lexicon ID to export (default: oewn)', 'oewn')
  .option('--outDir <dir>', 'Output directory for browser data', '../../wn-ts-web/data')
  .option('--dry-run', 'Show what would be done without writing files')
  .action(/* ... */);
```

### Global Options
- `--tui`: Launch interactive TUI mode
- `--chain <commands...>`: Chain TUI commands for automation
- `--snapshot`: Enable snapshot mode for testing
- `--json`: Machine-readable output
- `--plain`: Line-based text output
- `--no-color`: Disable color output
- `-v, --verbose`: Verbose output
- `-q, --quiet`: Quiet output
- `--version`: Show version information
- `-h, --help`: Show help information

### Flag Naming Conventions

| Short | Long         | Description                |
|-------|--------------|---------------------------|
| -h    | --help       | Show help                 |
| -v    | --version    | Show version              |
| -q    | --quiet      | Suppress non-essential output |
| -f    | --force      | Force operation           |
| -n    | --dry-run    | Do not make changes       |
|       | --json       | Output in JSON format     |
|       | --plain      | Output in plain text      |
|       | --no-color   | Disable color output      |

### Error Handling
- Proper exit codes for different error types
- Graceful error messages for users
- Development mode with stack traces
- Testing support with exit override

## API Reference

### Core Query Commands
```bash
# Search for words
wn-cli query word <term> [options]

# Search for synsets
wn-cli query synset <term> [options]

# Get definitions
wn-cli query explain <term> [options]

# Explore relationships
wn-cli query explore <term> [options]
```

### Data Commands
```bash
# Download WordNet data
wn-cli data download <project> [options]

# Add a lexical resource from a file
wn-cli data add <file> [options]

# Export data
wn-cli data export [options]
```



### Statistics Commands
```bash
# Database statistics
wn-cli stats [options]

# Quality analysis
wn-cli stats --quality

# Part-of-speech distribution
wn-cli stats --pos-distribution
```

### Disambiguation Commands
```bash
# Word sense disambiguation
wn-cli disambiguation <word> [options]

# Include examples
wn-cli disambiguation <word> --include-examples
```

### Multilingual Commands
```bash
# Cross-language search
wn-cli multilingual <word> [options]

# Target specific language
wn-cli multilingual <word> --target <lang>
```

### Database Commands
```bash
# Check database status
wn-cli db status [options]

# Clean up database
wn-cli db clean [options]

# Cache management
wn-cli db cache

# View and manage logs
wn-cli db logs
```

### TUI Commands
```bash
# Launch interactive TUI
wn-cli --tui

# Chain automation
wn-cli --tui --chain "down enter hello enter q"

# Snapshot mode for testing
wn-cli --tui --snapshot
```

### Browser Commands
```bash
# Prepare browser-optimized data for a specific lexicon
wn-cli browser prep --lexicon oewn

# Specify a custom output directory
wn-cli browser prep --lexicon wn31 --outDir ../my-web-app/data

# Dry run
wn-cli browser prep --lexicon oewn --dry-run
```
- Converts index/data files for the specified lexicon into JSON modules for browser use.
- Supports multilingual output by specifying the lexicon.
- Intended for use in build pipelines for browser-based WordNet apps.

## Testing Strategy

### Unit Tests
- [x] **Command Tests**: Individual command functionality
- [x] **Integration Tests**: End-to-end command workflows
- [x] **Error Tests**: Error handling and edge cases

### TUI Integration Tests
- [x] **Chain Commands**: Test automated TUI flows
- [x] **Snapshot Mode**: Test TUI state capture
- [x] **Exit Handling**: Test proper process management

### Performance Tests
- [x] **Command Speed**: Measure command execution time
- [x] **Memory Usage**: Monitor memory consumption
- [ ] **Large Dataset**: Test with large WordNet datasets

## Development Guidelines

### Adding New Commands
1. Create command file in `src/commands/`
2. Implement command logic with proper error handling
3. Register command in `cli.tsx`
4. Add comprehensive tests
5. Update documentation

### Help & Discoverability
- Every command and subcommand must provide a concise `.description()`.
- Use `.addHelpText()` to include usage examples and links to documentation.
- The CLI should display help when run with no arguments, or with `-h`/`--help`.
- Suggest next steps or corrections when the user makes a common mistake (e.g., typo in a command).

### Command Best Practices
- Follow UNIX conventions for flag names
- Provide both short and long flag versions
- Use standard flag names where possible (`-h`, `--help`, `-v`, `--version`, etc.)
- Validate input early and provide clear error messages
- Support piping and composition with other tools

## CLI Best Practices Checklist

- [x] **Human-first design:** All commands and errors are clear, actionable, and user-friendly.
- [x] **Composability:** Output is suitable for piping; supports `--json` and `--plain` for scripts.
- [x] **Consistency:** Follows UNIX conventions for flags, subcommands, and output.
- [x] **Discoverability:** Every command and option has a `.description()` and appears in help.
- [x] **Help & Examples:** `-h`/`--help` always available; help text includes usage examples.
- [x] **Short & Long Flags:** Both forms provided for all options where appropriate.
- [x] **Input Validation:** All user input is validated early, with clear error messages.
- [x] **Error Handling:** Errors are human-readable, suggest next steps, and never show raw stack traces by default.
- [x] **Signal Handling:** Ctrl+C and other signals are handled gracefully.
- [x] **Functional Parity:** Every TUI feature is available as a CLI command.
  - [x] **Writing Assistant**: A dedicated command for finding synonyms and alternatives for content writers.
- [x] **Separation of Concerns:** CLI definitions are thin; business logic is in core modules.
- [x] **Testing:** All commands are covered by automated tests, using Commander’s `.exitOverride()` for testability.
- [x] **Extensibility:** New commands and options can be added without breaking existing usage.

### Testing Commands
```bash
# Test specific command
pnpm test:cli -- --grep "query"

# Test with debug
pnpm test:cli:debug

# End-to-end tests
pnpm test:cli:e2e
```

## Success Metrics

### Performance
- [x] Command execution time < 2 seconds for typical queries
- [x] Memory usage < 100MB for standard operations
- [ ] Startup time < 1 second

### Reliability
- [ ] 99.9% command success rate
- [ ] Proper error handling for all edge cases
- [ ] Graceful degradation for missing data

### Usability
- [ ] Clear and helpful error messages
- [ ] Comprehensive help system
- [ ] Intuitive command structure
- [ ] Consistent option handling

## Future Enhancements

### Planned Features
- [ ] **Plugin Architecture**: Extensible command system
- [ ] **Advanced Automation**: Enhanced chain command capabilities
- [ ] **Batch Processing**: Efficient multi-input processing
- [ ] **Progress Reporting**: Better progress indicators
- [ ] **Configuration Management**: Persistent user preferences

### Technical Improvements
- [ ] **Performance Optimization**: Faster command execution
- [ ] **Memory Management**: Better memory usage
- [ ] **Error Recovery**: Automatic retry mechanisms
- [ ] **Logging**: Comprehensive logging system (basic user interaction logging is now implemented).

## Project Roadmap

### Milestone 1: Enhanced Automation ✅
- Chainable TUI automation
- Debug panel
- Component tests
- Modern documentation

### Milestone 2: Shared Component Architecture ✅
- Shared components for common UI patterns
- Centralized theme system
- Error boundaries
- Component refactoring

### Milestone 3: Complete View Refactoring 🚧
- Refactor all remaining views to use shared components
- Improve error handling and user feedback
- Add comprehensive testing
- Performance optimization

### Milestone 4: Advanced Features 🚧
- Real CILI integration
- Advanced automation features
- Export capabilities
- Performance monitoring

### Milestone 5: Production Ready 🚧
- Comprehensive testing
- Performance monitoring
- Security audit
- Community building

This specification provides a comprehensive guide for the CLI implementation, ensuring consistency, maintainability, and user experience excellence.
