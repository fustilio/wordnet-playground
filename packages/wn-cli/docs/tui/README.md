# TUI Documentation

> **⚠️ Experimental**: The TUI (Text User Interface) is currently a work in progress and not actively being developed. The CLI interface is the primary focus.

## Overview

The TUI provides an interactive, terminal-based interface for exploring WordNet data. Built with React Ink, it offers an intuitive experience for researchers, content writers, language learners, and developers who prefer interactive exploration over command-line scripting.

## Documentation

- **[TUI Specification](./SPEC.md)** - Interactive TUI design and features
- **[Architecture](./ARCHITECTURE.md)** - High-level architecture overview
- **[Component Architecture](./COMPONENT_ARCHITECTURE.md)** - Detailed component design and shared components
- **[Layout System](./LAYOUT_SYSTEM.md)** - Responsive design and space allocation
- **[Debugging](./DEBUGGING.md)** - Debugging tools and troubleshooting guide

## Current Status

- **Status**: Experimental, not actively developed
- **Focus**: CLI interface is the primary focus
- **Contributions**: Limited to bug fixes and essential maintenance

## Quick Start

```bash
# Launch TUI (experimental)
wn-cli --tui

# Navigation
# Arrow Keys: Navigate menus and lists
# Enter: Select or confirm
# Escape: Go back or cancel
# Q: Quit the application
# H: Show help
# Ctrl+D: Toggle debug panel
```

## Development

The TUI is built with:
- **React Ink**: Foundation for building React components in the terminal
- **@inkjs/ui**: Official component library providing standard UI components
- **TypeScript**: For type safety and better developer experience

---

**Note**: This TUI implementation is experimental and may have bugs or incomplete features. For production use, please use the CLI interface. 