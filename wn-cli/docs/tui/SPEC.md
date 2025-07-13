# TUI Specification

## Overview

The WordNet TUI (Text User Interface) provides an interactive, terminal-based interface for exploring WordNet data. Built with React Ink, it offers an intuitive experience for researchers, content writers, language learners, and developers who prefer interactive exploration over command-line scripting.

## Functional Requirements

### Core TUI Features
- [x] **Main Menu**: Central navigation hub with categorized options
- [x] **Word Search**: Interactive word lookup and definition browsing
- [x] **Synset Explorer**: Explore semantic relations and synsets
- [x] **Sense Browser**: Browse word senses and examples
- [x] **Cross-Language Search**: Multi-language search using CILI
- [x] **Writing Assistant**: Find synonyms and related words
- [x] **Learning Mode**: Simplified definitions for language learning
- [x] **Data Manager**: Download and manage WordNet data
- [x] **Settings**: Configure lexicon and language preferences
- [x] **Help System**: Navigation and shortcut information

### User Experience
- [x] **Responsive Design**: Adapts to different terminal sizes
- [x] **Keyboard Navigation**: Arrow keys, Enter, Escape, Tab
- [x] **Global Shortcuts**: Quick access to help, debug, exit
- [x] **Input Focus Management**: Proper handling of input fields
- [x] **Error Handling**: Graceful error display and recovery
- [x] **Loading States**: Visual feedback during operations
- [x] **Debug Panel**: State inspection with Ctrl+D

### Automation & Testing
- [x] **Chain Commands**: Script TUI flows with `--chain` flag
- [x] **Snapshot Mode**: Capture UI state for testing
- [x] **Exit Override**: Proper process management for testing
- [x] **Component Testing**: Unit tests for all components

## Implementation Status

### Completed Features
- [x] **React Ink Integration**: Full TUI implementation with modern React
- [x] **Shared Component Architecture**: Reusable components for consistency
- [x] **Theme System**: Centralized styling and theming
- [x] **Layout System**: Responsive design with dynamic space allocation
- [x] **Error Boundaries**: Comprehensive error handling
- [x] **State Management**: Centralized state with proper memoization
- [x] **Navigation System**: Intuitive menu and view navigation
- [x] **Input Handling**: Proper keyboard and focus management
- [x] **Debug Tools**: Debug panel and layout testing tools
- [x] **Automation Support**: Chain commands and snapshot mode

### In Progress
- [ ] **Component Refactoring**: Update remaining views to use shared components
- [ ] **Performance Optimization**: Optimize rendering and state updates
- [ ] **Advanced Features**: Enhanced search and export capabilities

### Planned Features
- [ ] **Real CILI Integration**: Replace simulated cross-language search
- [ ] **Export Features**: Save results to files from TUI
- [ ] **Custom Themes**: User-customizable appearance
- [ ] **Search History**: Persistent search history
- [ ] **Advanced Automation**: Macro recording and replay

## Directory Structure

```
src/
├── app.tsx                   # Main TUI application component
├── components/               # TUI view components
│   ├── shared/              # Reusable shared components
│   │   ├── ViewHeader.tsx   # Consistent headers
│   │   ├── SearchInput.tsx  # Standardized search input
│   │   ├── ResultsList.tsx  # Paginated result display
│   │   ├── NavigationHelp.tsx # Keyboard shortcuts
│   │   ├── StatusBar.tsx    # Persistent status info
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── Menu.tsx             # Main menu component
│   ├── WordSearch.tsx       # Word search view
│   ├── SynsetExplorer.tsx   # Synset exploration
│   ├── SenseBrowser.tsx     # Sense browsing
│   ├── CrossLanguageSearch.tsx # Cross-language search
│   ├── WritingAssistant.tsx # Writing assistance
│   ├── LearningMode.tsx     # Learning mode
│   ├── DataManager.tsx      # Data management
│   ├── Settings.tsx         # Settings view
│   └── DebugPanel.tsx       # Debug panel
├── contexts/
│   └── ThemeContext.tsx     # Theme system
├── utils/
│   ├── hooks/
│   │   └── useStdOutDimensions.ts # Terminal dimensions
│   ├── layout-helpers.ts    # Layout system
│   ├── lexicon-helpers.ts   # Lexicon utilities
│   └── wordnet-helpers.ts   # WordNet utilities
└── wordnet-singleton.ts     # WordNet instance management
```

## Technical Design

### Architecture
- **React Ink**: Primary TUI framework with React components
- **@inkjs/ui**: Official component library for standard UI elements
- **TypeScript**: Type-safe component implementations
- **Shared Components**: Reusable components for consistency
- **Theme System**: Centralized styling and theming
- **Layout System**: Responsive design with dynamic space allocation

### Component Architecture
```typescript
// Example view component structure
const ExampleView: React.FC<ViewProps> = ({ onExit, lexicon, language }) => {
  // State management
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Layout system
  const layoutContext = useLayoutContext();
  const layout = calculateComponentLayout(layoutContext, 'example');

  // Render with shared components
  return (
    <Box flexDirection="column" height="100%">
      <ViewHeader title="Example" icon="📋" />
      <SearchInput onSubmit={handleSearch} loading={loading} />
      <ResultsList results={results} loading={loading} />
      <NavigationHelp shortcuts={shortcuts} />
    </Box>
  );
};
```

### Shared Components

#### ViewHeader.tsx
- Consistent headers across all views
- Icon, title, subtitle, and metadata display
- Theme-aware styling

#### SearchInput.tsx
- Standardized search input with loading states
- Error message display
- Automatic input clearing

#### ResultsList.tsx
- Paginated result display with selection
- Loading and empty states
- Metadata and tag support

#### NavigationHelp.tsx
- Keyboard shortcut display
- Additional help information
- Theme-aware formatting

#### StatusBar.tsx
- Persistent status information
- Global shortcut display
- Debug mode indicator

#### ErrorBoundary.tsx
- Error catching and graceful fallback
- Error logging for debugging
- User-friendly error messages

### Theme System
```typescript
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: string;
    muted: string;
    background: string;
  };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; };
  borders: { single: string; double: string; round: string; };
  icons: { search: string; settings: string; help: string; exit: string; };
}
```

### Layout System
- **Dynamic Space Allocation**: Calculates available space based on terminal size
- **Conditional Rendering**: Components render based on available space
- **Responsive Design**: Adapts to different terminal dimensions
- **Pagination**: Handles long lists with proper pagination

## User Interface

### Main Menu
- **Core Features**: Word Search, Synset Explorer, Sense Browser
- **Specialized Tools**: Cross-Language Search, Writing Assistant, Learning Mode
- **System**: Settings, Data Manager, Help, Exit

### Navigation Controls
- **Arrow Keys**: Navigate menus and lists
- **Enter**: Select/confirm
- **Escape**: Go back/cancel
- **Tab**: Switch between sections
- **Q**: Exit application
- **H**: Show help
- **Ctrl+D**: Toggle debug panel

### Global Shortcuts
- **1-8**: Quick access to menu items
- **H**: Help
- **Q**: Exit
- **Ctrl+C**: Emergency exit

### Input Focus Management
- **Input Fields**: Capture all keystrokes when focused
- **Global Shortcuts**: Only active when no input field is focused
- **Navigation**: Escape for navigation, Ctrl+C for emergency exit

## Automation & Testing

### Chain Commands
```bash
# Navigate to Word Search
wn-cli --tui --chain "down enter"

# Complex automation
wn-cli --tui --chain "down down enter up right q"

# Text input
wn-cli --tui --chain "down enter hello enter q"
```

### Supported Commands
- `down`, `up`, `left`, `right`: Navigation
- `enter`: Select/confirm
- `esc`: Go back/cancel
- `tab`: Switch sections
- `backspace`: Delete character
- `q`: Exit
- `h`: Help
- Any single character for text input

### Snapshot Mode
- Captures UI state for testing
- Enables automated testing workflows
- Provides consistent test results

## Testing Strategy

### Component Tests
- [x] **Unit Tests**: Individual component functionality
- [x] **Integration Tests**: Component interaction testing
- [x] **User Interaction Tests**: Keyboard and mouse simulation
- [x] **Layout Tests**: Responsive design testing

### TUI Tests
- [x] **Chain Command Tests**: Automated TUI flow testing
- [x] **Snapshot Tests**: UI state capture and comparison
- [x] **Error Handling Tests**: Error boundary and recovery testing
- [x] **Performance Tests**: Rendering and state update performance

### Test Commands
```bash
# Run component tests
pnpm test:component

# Run TUI tests
pnpm test:tui

# Run layout tests
pnpm test:layout

# Debug TUI
pnpm debug:tui
```

## Development Guidelines

### Adding New Views
1. Create component in `src/components/`
2. Use shared components for consistency
3. Implement proper error handling
4. Add comprehensive tests
5. Update navigation in `app.tsx`

### Component Best Practices
- Use shared components for common patterns
- Implement proper error boundaries
- Follow the theme system for styling
- Use the layout system for responsive design
- Add keyboard navigation support

### Performance Guidelines
- Use `useCallback` and `useMemo` for expensive operations
- Debounce user input for search operations
- Implement pagination for large datasets
- Optimize re-renders with proper state management

## Success Metrics

### Performance
- [ ] TUI startup time < 2 seconds
- [ ] Search response time < 1 second
- [ ] Smooth scrolling with 1000+ results
- [ ] Memory usage < 100MB for typical usage

### Usability
- [ ] Intuitive navigation for new users
- [ ] Efficient workflows for power users
- [ ] Responsive design for all terminal sizes
- [ ] Clear error messages and recovery

### Reliability
- [ ] 99.9% uptime for TUI operations
- [ ] Graceful error handling and recovery
- [ ] Proper cleanup on exit
- [ ] Consistent behavior across platforms

## Future Enhancements

### Planned Features
- [ ] **Real CILI Integration**: Replace simulated cross-language search
- [ ] **Export Capabilities**: Save results to files from TUI
- [ ] **Custom Themes**: User-customizable appearance
- [ ] **Search History**: Persistent search history across sessions
- [ ] **Advanced Automation**: Macro recording and replay
- [ ] **Performance Monitoring**: Add performance metrics
- [ ] **Accessibility**: Screen reader support
- [ ] **Internationalization**: Multi-language TUI

### Technical Improvements
- [ ] **Component Refactoring**: Update all views to use shared components
- [ ] **State Management**: Consider Redux/Zustand for complex state
- [ ] **Performance Optimization**: Optimize rendering and updates
- [ ] **Memory Management**: Better memory usage and cleanup
- [ ] **Error Recovery**: Automatic retry mechanisms

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

## Success Metrics

### Performance
- [ ] TUI startup time < 2 seconds
- [ ] Search response time < 1 second
- [ ] Smooth scrolling with 1000+ results
- [ ] Memory usage < 100MB for typical usage

### Usability
- [ ] Intuitive navigation for new users
- [ ] Efficient workflows for power users
- [ ] Responsive design for all terminal sizes
- [ ] Clear error messages and recovery

### Reliability
- [ ] 99.9% uptime for TUI operations
- [ ] Graceful error handling and recovery
- [ ] Proper cleanup on exit
- [ ] Consistent behavior across platforms

This specification provides a comprehensive guide for the TUI implementation, ensuring a modern, maintainable, and user-friendly interface for WordNet data exploration.
