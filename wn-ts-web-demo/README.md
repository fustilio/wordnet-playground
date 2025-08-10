# WordNet TypeScript Demo

A comprehensive demonstration of the `wn-ts-web` library, showcasing browser-based WordNet functionality with real data loading, search capabilities, and OPFS storage with intelligent caching.

## Features

- **Real WordNet Data**: Loads actual Open English WordNet (OEWN) 2024 data
- **Browser-Based**: Runs entirely in the browser using WebAssembly SQLite
- **OPFS Storage**: Uses Origin Private File System for persistent storage
- **Intelligent Caching**: Caches WordNet databases locally to avoid repeated downloads
- **Search Functionality**: Full-text search across words, senses, and synsets
- **Statistics**: Real-time database statistics and data validation
- **Developer Tools**: Advanced features for data management and debugging

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Caching System

### OPFS-Based Caching

The demo implements intelligent caching using the Origin Private File System (OPFS):

- **Automatic Caching**: WordNet databases are automatically cached after first download
- **Cache-First Loading**: Subsequent loads check cache before downloading
- **Persistent Storage**: Cached data persists across browser sessions
- **Cache Management**: UI controls for viewing and managing cached data

### Cache Benefits

- **Faster Loading**: Cached databases load instantly on subsequent visits
- **Reduced Network Usage**: No repeated downloads from proxy servers
- **Offline Capability**: Works without internet after initial download
- **Bandwidth Savings**: Especially beneficial for large WordNet databases

### Cache Management

The Cache Widget in the sidebar provides:
- **Cache Status**: Shows OPFS support and storage usage
- **Cached Packages**: Lists all cached WordNet databases
- **Storage Information**: Total size and available space
- **Management Controls**: Clear cache, remove specific packages

## Testing

This project uses **Cypress** for comprehensive end-to-end testing:

### Test Categories

- **WordNet Demo Tests** (`cypress/e2e/wordnet-demo/`): Application-specific tests
  - `app.cy.ts`: Basic application functionality and UI validation
  - `data-loading.cy.ts`: Data loading, statistics validation, and search functionality

- **Example Tests** (`cypress/e2e/1-getting-started/`, `cypress/e2e/2-advanced-examples/`): Cypress example tests for reference

### Running Tests

```bash
# Run all WordNet-specific tests (recommended)
pnpm test:cypress

# Run all tests (including examples)
pnpm test:cypress:all

# Run only WordNet demo tests
pnpm test:cypress:wordnet

# Run only example tests
pnpm test:cypress:examples

# Open Cypress UI
pnpm cypress
```

### Test Features

- **Real Data Validation**: Tests verify actual WordNet statistics and data integrity
- **Search Functionality**: Comprehensive testing of word lookup and result validation
- **OPFS Integration**: Tests browser storage capabilities and fallback behavior
- **Cache Testing**: Validates caching functionality and performance
- **Error Handling**: Robust error detection and recovery testing
- **Performance**: Validates loading times and user experience

## Architecture

### Core Components

- **WebWordnet**: Main WordNet query interface
- **DataLoader**: Manages data downloading and loading
- **WebDatabase**: SQLite WASM database wrapper
- **OPFS Storage**: Browser-based persistent storage
- **Cache System**: Intelligent caching with OPFS

### Data Flow

1. **Initialization**: Load SQLite WASM module
2. **Cache Check**: Check for cached database in OPFS
3. **Data Loading**: Load from cache or download and cache
4. **Storage**: Persist data in OPFS for future use
5. **Querying**: Execute searches and retrieve results
6. **Statistics**: Generate real-time database metrics

## Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: Graceful degradation when features aren't supported

## Development

### Project Structure

```
wn-ts-web-demo/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # WordNet service layer
│   └── App.tsx            # Main application
├── cypress/
│   ├── e2e/
│   │   ├── wordnet-demo/   # Application-specific tests
│   │   └── ...            # Cypress example tests
│   └── support/           # Cypress support files
└── docs/                  # Documentation
```

### Key Technologies

- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast development and build tooling
- **Cypress**: End-to-end testing framework
- **OPFS**: Origin Private File System for caching

## Testing Methodology

### Data-First Approach

Tests prioritize real data validation over UI testing:

1. **Statistics Validation**: Verify actual WordNet data counts
2. **Search Validation**: Test real word lookup functionality
3. **Data Integrity**: Ensure data consistency and relationships
4. **Performance**: Validate loading times and user experience
5. **Cache Validation**: Test caching functionality and performance

### Test Categories

- **Application Tests**: Basic UI and functionality validation
- **Data Loading Tests**: Real WordNet data loading and statistics
- **Search Tests**: Comprehensive search functionality validation
- **Cache Tests**: OPFS caching functionality validation
- **Integration Tests**: End-to-end workflow validation

### Quality Assurance

- **Real Data**: Tests use actual WordNet 2024 data
- **Comprehensive Coverage**: All major features tested
- **Error Handling**: Robust error detection and recovery
- **Performance**: Validates acceptable loading times
- **Cross-Browser**: Tests multiple browser environments
- **Cache Performance**: Validates caching benefits

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Run the test suite**: `pnpm test`
6. **Submit a pull request**

## License

This project is part of the WordNet TypeScript ecosystem and follows the same licensing terms.
