# WordNet TypeScript Demo Specification

## Overview

The WordNet TypeScript Demo is a comprehensive demonstration of the `wn-ts-web` library, showcasing browser-based WordNet functionality with real data loading, search capabilities, and OPFS storage with intelligent caching.

## Core Requirements

### ✅ High Priority (Fixed)
- [x] **No Automatic Data Loading**: Demos should not automatically load lexicons on mount
- [x] **Fix Screen Freezing**: Lexicon loading should not block the UI thread
- [x] **Manual Lexicon Loading**: Users must explicitly choose which lexicons to load
- [x] **Lexicon Requirements Display**: Clear indication of what lexicons are needed for each demo

### 🔄 Medium Priority
- [ ] **Progress Indicators**: Better visual feedback during lexicon loading
- [ ] **Error Handling**: Graceful fallback when lexicon loading fails
- [ ] **Cache Management**: Better UI for managing cached lexicons

### 📋 Low Priority
- [ ] **Performance Metrics**: Display loading times and performance data
- [ ] **Advanced Search**: More sophisticated search capabilities
- [ ] **Data Export**: Ability to export search results

## Architecture

### Core Components

#### Widgets (Sidebar)
- **StatusWidget**: Shows overall system status and loaded packages
- **StatisticsWidget**: Shows database statistics after lexicons are loaded
- **OPFSWidget**: Manages browser storage and caching
- **CacheWidget**: Cache management and status

#### Shared Components
- **LexiconRequirements**: Reusable component for displaying lexicon requirements within individual demos

#### Demo Components
- **BasicDemo**: Simple word and synset search (requires English WordNet)
- **BilingualDictionary**: Cross-language dictionary (requires multiple lexicons)
- **AdvancedDemo**: Advanced data management features
- **DeveloperDemo**: Developer tools and debugging features

#### Hooks
- **useWordNet**: Main WordNet state management and operations
- **useOPFS**: OPFS storage management
- **useWordNetCache**: Caching functionality

### Data Flow

1. **Initialization**: Load SQLite WASM module without loading any lexicons
2. **User Choice**: User manually selects which lexicons to load
3. **Non-blocking Loading**: Lexicon loading happens with UI yielding to prevent freezing
4. **Progress Updates**: Real-time progress indicators during loading
5. **Statistics Update**: Database statistics updated asynchronously after loading
6. **Demo Functionality**: Demos become functional once required lexicons are loaded

## Lexicon Requirements

### Required Lexicons by Demo

#### BasicDemo
- **oewn:2024** (High Priority): English WordNet for basic search functionality

#### BilingualDictionary
- **oewn:2024** (High Priority): English source language
- **cili:1.0** (Medium Priority): Cross-lingual index
- **omw-fra:1.4** (Medium Priority): French language support
- **omw-tha:1.4** (Low Priority): Thai language support

#### AdvancedDemo
- **oewn:2024** (High Priority): English WordNet for advanced features

#### DeveloperDemo
- **oewn:2024** (Medium Priority): For testing and development

### Lexicon Loading Strategy

1. **No Auto-loading**: Lexicons are never loaded automatically
2. **Manual Selection**: Users must explicitly choose which lexicons to load
3. **Priority-based UI**: High priority lexicons are prominently displayed
4. **Dependency Checking**: Clear indication of what each demo requires
5. **Individual Loading**: Each lexicon can be loaded independently
6. **Batch Loading**: Option to load all required lexicons for a specific demo

## UI/UX Design

### Sidebar Layout
```
┌─────────────────────┐
│   Status Widget     │ ← System status, loaded packages
├─────────────────────┤
│   Statistics Widget │ ← Database stats (when available)
├─────────────────────┤
│    OPFS Widget      │ ← Storage management
└─────────────────────┘
```

### Demo Layout
Each demo now includes its own lexicon requirements section at the top, showing:
- Required lexicons with priority indicators
- Load buttons for missing lexicons
- Status of loaded vs. required lexicons

### Lexicon Requirements Display
- **Priority Indicators**: Color-coded priority levels (High/Medium/Low)
- **Status Badges**: Loaded/Not Loaded/Not Available
- **Progress Bar**: Visual progress indicator showing loaded vs. required lexicons
- **Individual Load Buttons**: Load buttons for each specific lexicon
- **Load All Required Button**: Single button to start downloading all missing lexicons
- **Refresh Available Packages**: Button to refresh package availability when no packages are found
- **Loading States**: Visual feedback during download process with spinner animation
- **Helpful Messages**: Clear guidance when packages don't match requirements

### Non-blocking Loading
- **UI Thread Yielding**: Regular yielding to prevent screen freezing
- **Progress Updates**: Real-time progress bars and status messages
- **Async Statistics**: Statistics updated in background after loading
- **Error Handling**: Graceful fallback when operations fail

## Technical Implementation

### Package ID Matching
- **Flexible Format Support**: Handles multiple package ID formats (`id:version`, `id:version:version`, `id:version`)
- **Component-based Matching**: Splits package IDs and lexicon IDs for partial matching
- **Direct ID Matching**: Checks if package ID directly equals lexicon ID
- **Helper Functions**: Centralized package availability checking logic with detailed debugging

### Async Operations
- **requestIdleCallback**: Use when available for optimal UI yielding
- **setTimeout**: Fallback for browsers without requestIdleCallback
- **Progress Callbacks**: Regular progress updates during long operations
- **State Management**: Proper React state updates without blocking

### Error Handling
- **Graceful Degradation**: Continue operation even if statistics fail
- **User Feedback**: Clear error messages and recovery options
- **Fallback States**: Default values when data is unavailable

### Performance
- **Chunked Processing**: Break large operations into smaller chunks
- **UI Yielding**: Regular yielding to maintain responsive UI
- **Background Processing**: Heavy operations moved to background
- **Progress Tracking**: Real-time progress updates for user feedback
- **Memoization**: Package availability calculations cached to prevent excessive re-renders
- **Component Memoization**: React.memo wrapper prevents unnecessary component re-renders
- **Callback Optimization**: useCallback prevents function recreation on every render
- **Render Cycle Optimization**: Debug logging limited to prevent performance impact
- **XML Parsing Yielding**: UI thread yielding every 5000 elements during XML parsing
- **Data Processing Yielding**: UI thread yielding every 1000 entries during data processing
- **Database Insertion Yielding**: UI thread yielding during batch database operations

## Testing Strategy

### Manual Testing
- **Lexicon Loading**: Test manual loading of each lexicon
- **UI Responsiveness**: Verify no screen freezing during loading
- **Error Scenarios**: Test behavior when loading fails
- **Cross-demo Functionality**: Verify demos work with different lexicon combinations

### Automated Testing
- **Cypress E2E**: End-to-end testing of lexicon loading flows
- **Component Tests**: Individual component functionality
- **Hook Tests**: Custom hook behavior and state management
- **Performance Tests**: Loading time and UI responsiveness

## Future Enhancements

### Planned Features
- **Web Worker Support**: Move heavy operations to background threads
- **Streaming Loading**: Progressive loading of large lexicons
- **Smart Caching**: Intelligent cache management based on usage
- **Offline Support**: Full offline functionality with cached lexicons

### Performance Improvements
- **Lazy Loading**: Load lexicon components on demand
- **Memory Management**: Better memory usage for large datasets
- **Compression**: Optimize lexicon storage and transfer
- **Indexing**: Pre-built search indexes for faster queries

## Compliance

### Browser Support
- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS Support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback**: Graceful degradation when features aren't supported

### Accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast themes
- **Focus Management**: Clear focus indicators and management

## Directory Structure

```
wn-ts-web-demo/
├── src/
│   ├── app/
│   │   └── App.tsx                 # Main application component
│   ├── components/
│   │   ├── demos/                   # Demo components
│   │   │   ├── BasicDemo.tsx       # Basic search functionality
│   │   │   ├── BilingualDictionary.tsx # Cross-language features
│   │   │   ├── AdvancedDemo.tsx    # Advanced features
│   │   │   └── DeveloperDemo.tsx   # Developer tools
│   │   ├── widgets/                 # Sidebar widgets
│   │   │   ├── StatusWidget.tsx    # System status
│   │   │   ├── StatisticsWidget.tsx # Database statistics
│   │   │   ├── OPFSWidget.tsx      # Storage management
│   │   │   └── CacheWidget.tsx     # Cache management
│   │   └── shared/                  # Shared components
│   │       ├── Card.tsx            # Card wrapper component
│   │       ├── Tabs.tsx            # Tab navigation component
│   │       └── LexiconRequirements.tsx # Lexicon requirements component
│   ├── hooks/                       # Custom React hooks
│   │   ├── useWordNet.ts           # Main WordNet hook
│   │   ├── useOPFS.ts              # OPFS management
│   │   └── useWordNetCache.ts      # Caching functionality
│   └── contexts/                    # React contexts
├── cypress/                         # End-to-end tests
├── public/                          # Static assets
└── docs/                           # Documentation
```

## Success Criteria

### Functional Requirements
- [x] No automatic lexicon loading on demo mount
- [x] Manual lexicon loading with clear UI controls
- [x] No screen freezing during lexicon loading
- [x] Clear indication of lexicon requirements for each demo
- [x] Proper error handling and graceful degradation

### Performance Requirements
- [x] UI remains responsive during lexicon loading
- [x] Progress indicators provide real-time feedback
- [x] Statistics update without blocking the UI
- [x] Loading operations yield to UI thread regularly

### User Experience Requirements
- [x] Clear understanding of what lexicons are needed
- [x] Simple and intuitive lexicon loading process
- [x] Visual feedback during all operations
- [x] Consistent behavior across all demo components
