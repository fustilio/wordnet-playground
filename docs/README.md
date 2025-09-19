# WordNet TypeScript Documentation

## 🎯 **Overview**

This directory contains the documentation for the WordNet TypeScript ecosystem. All documentation follows established standards and conventions to ensure consistency, maintainability, and ease of use across all `wn-ts` modules.

## 🏗️ **Project Structure**

The project is organized into three main directories:

### **📦 Packages** (`packages/`)
Core libraries and utilities:
- **`wn-ts-core`** - Foundation library with microkernel and plugin system
- **`wn-ts-node`** - Node.js implementation with SQLite integration
- **`wn-ts-web`** - Browser implementation with built-in React hooks and providers (future: may split to `wn-ts-web-react`)
- **`wn-cli`** - Command-line interface and TUI
- **`wn-data-loader`** - Data loading and processing utilities
- **`wn-test-data`** - Test data and sample files
- **`utils`** - Shared utilities and logging

### **🎭 Examples** (`examples/`)
Demo applications and usage examples:
- **`wn-ts-web-demo`** - Interactive web demo with React
- **`wn-ts-node-demo`** - Node.js examples and use cases

### **🔬 Development** (`development/`)
Development tools, benchmarks, and experimental features:
- **`benchmark`** - Performance testing and library comparisons
- **`sqlite-opfs-demo`** - SQLite OPFS browser demo
- **`wn-pybridge`** - Python bridge for cross-language testing

## 📚 **Documentation Structure**

### **Project Overview**
- **[Project Overview](./PROJECT_OVERVIEW.md)** - Complete project overview and ecosystem details
- **[Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)** - Microkernel architecture and design patterns

### **Architecture**
- **[System Architecture](./architecture/SYSTEM_ARCHITECTURE.md)** - Microkernel architecture and design patterns
- **[Web Architecture](./architecture/WEB_ARCHITECTURE.md)** - Browser-specific architecture and worker patterns

### **API Reference**
- **[Web API](./api/WEB_API.md)** - Complete web API reference and React integration

### **Usage Guides**
- **[Web Usage](./guides/WEB_USAGE.md)** - Web usage patterns, React integration, and examples

### **Standards & Conventions**
- **[Development Conventions](./standards/DEVELOPMENT_CONVENTIONS.md)** - Coding standards, architectural patterns, and best practices
- **[Database Schema Standards](./standards/DATABASE_SCHEMA_STANDARDS.md)** - Database design, naming conventions, and optimization strategies
- **[Testing Strategy](./standards/TESTING_STRATEGY.md)** - Testing approach, coverage requirements, and quality assurance
- **[Cross-Lingual Dependencies](./standards/CROSS_LINGUAL_DEPENDENCIES.md)** - Understanding lexicon dependencies

### **Examples & Use Cases**
- **[Usage Examples](./examples/EXAMPLE_USAGE.md)** - Comprehensive examples and use cases

### **Package-Specific Documentation**

#### **Core Library** (`packages/wn-ts-core/`)
- **[Core Library Guide](./packages/wn-ts-core/README.md)** - Microkernel architecture and core functionality
- **[Global WordNet Schemas](./packages/wn-ts-core/GLOBAL_WORDNET_SCHEMAS.md)** - Official schema reference and LMF support
- **[Testing Strategy](./packages/wn-ts-core/TESTING_STRATEGY.md)** - Testing approach and coverage requirements
- **[Advanced Use Cases](./packages/wn-ts-core/ROADMAP.md)** - Superpower operations and examples

#### **Node.js Implementation** (`packages/wn-ts-node/`)
- **[Node.js Usage](./packages/wn-ts-node/USAGE.md)** - Node.js integration and SQLite setup
- **[Translation Utilities](./packages/wn-ts-node/TRANSLATION_UTILITIES.md)** - Cross-lingual operations

#### **Web Implementation** (`packages/wn-ts-web/`)
- **[Web Library Guide](./packages/wn-ts-web/README.md)** - Browser integration and React components

#### **CLI Tool** (`packages/wn-cli/`)
- **[CLI Guide](./packages/wn-cli/README.md)** - Command-line interface overview
- **[Browser Commands](./packages/wn-cli/cli/BROWSER_COMMAND_SUMMARY.md)** - Browser-specific commands
- **[CLI Cheatsheet](./packages/wn-cli/cli/cheatsheet.md)** - Quick reference for commands
- **[TUI Architecture](./packages/wn-cli/tui/README.md)** - Terminal UI system overview
- **[Component Architecture](./packages/wn-cli/tui/COMPONENT_ARCHITECTURE.md)** - TUI component design
- **[Layout System](./packages/wn-cli/tui/LAYOUT_SYSTEM.md)** - TUI layout management
- **[Debugging Guide](./packages/wn-cli/tui/DEBUGGING.md)** - TUI debugging techniques

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run browser tests
pnpm test:browser

# Run all demo examples
pnpm demo:all-use-cases

# Run benchmarks
pnpm benchmark
```

## 📖 **Contributing to Documentation**

When contributing to documentation:

1. **Follow the established structure** - Use the existing organization patterns
2. **Update cross-references** - Ensure links between documents remain valid
3. **Use consistent formatting** - Follow the markdown conventions used throughout
4. **Include examples** - Provide practical code examples where applicable
5. **Test links** - Verify all internal and external links work correctly

## 🔗 **External Resources**

- **[Global WordNet Association](https://globalwordnet.org/)** - Official WordNet organization
- **[Open Multilingual WordNet](https://github.com/globalwordnet/)** - Multi-language WordNet resources
- **[Python wn Library](https://github.com/goodmami/wn)** - Reference Python implementation