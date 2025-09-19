# WordNet CLI Documentation

This directory contains documentation for the WordNet CLI project, covering both the command-line interface and the interactive TUI.

## 📚 Documentation Structure

### CLI Documentation
- **[CLI Specification](./cli/SPEC.md)** - Complete CLI command reference and design
- **[CLI Cheatsheet](./cli/cheatsheet.md)** - Quick reference for common commands

### TUI Documentation (Work in Progress)
- **[TUI Overview](./tui/README.md)** - TUI documentation and status
- **[TUI Specification](./tui/SPEC.md)** - Interactive TUI design and features
- **[TUI Architecture](./tui/ARCHITECTURE.md)** - Component architecture and design patterns

> **Note**: The TUI (Text User Interface) is currently a work in progress and not actively being developed. The CLI interface is the primary focus.

## 🎯 Quick Start

### CLI Usage
```bash
# Install globally
npm install -g wn-cli

# Basic commands
wn-cli data download oewn:2024
wn-cli query word run v
wn-cli --tui  # Launch interactive mode (experimental)
```

### CLI Navigation
- **Data Management**: `data download`, `data add`, `data export`
- **Query Commands**: `query word`, `query synset`, `query explain`
- **Database**: `db status`, `db clean`, `db logs`
- **Statistics**: `stats`, `lexicons`, `config`

## 🏗️ Architecture

The WordNet CLI is a hybrid application:

1. **CLI (Command-Line Interface)**: Primary interface built with `commander.js`
2. **TUI (Text-based User Interface)**: Experimental interface built with React Ink

### Core Technologies
- **Commander.js**: CLI framework with proper command organization
- **React Ink**: TUI framework (experimental)
- **TypeScript**: Type safety and developer experience

## 🧪 Testing

### Test Commands
```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:cli      # CLI command tests
pnpm test:component # Component tests (TUI)
pnpm test:tui      # TUI tests (experimental)
```

## 🚀 Development

### Getting Started
```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## 📝 Contributing

We welcome contributions! Focus areas:

- **CLI Features**: Command improvements and new functionality
- **Bug Reports**: Help identify and fix issues
- **Documentation**: Improve examples and tutorials
- **Testing**: Enhance test coverage

---

**This documentation provides a comprehensive guide for the WordNet CLI project. The CLI is production-ready, while the TUI remains experimental.** 