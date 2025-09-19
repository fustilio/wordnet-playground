# WordNet CLI - Architecture Overview

This document provides an overview of the current architecture of `wn-cli`, focusing on the TUI (Text-based User Interface) implementation and the improvements made to create a modern, maintainable component system.

## Architecture Overview

`wn-cli` is a hybrid application with two distinct interfaces:

1. **CLI (Command-Line Interface)**: Built with `commander.js` for scripting and automation
2. **TUI (Text-based User Interface)**: Built with React Ink for interactive exploration

## TUI Architecture

### Core Technologies

- **React Ink**: The foundation for building React components in the terminal
- **@inkjs/ui**: Official component library providing standard UI components
- **TypeScript**: For type safety and better developer experience
- **Vitest**: For testing with ink-testing-library

### Component Architecture

The TUI follows a modern, component-based architecture with clear separation of concerns:

#### Shared Components (`src/components/shared/`)

These reusable components provide consistent functionality across all views:

- **`ViewHeader.tsx`**: Consistent headers with icons, titles, and metadata
- **`SearchInput.tsx`**: Standardized search input with loading and error states
- **`ResultsList.tsx`**: Paginated result display with selection and navigation
- **`NavigationHelp.tsx`**: Keyboard shortcut display and help text
- **`StatusBar.tsx`**: Persistent status information and global shortcuts
- **`ErrorBoundary.tsx`**: Error catching and graceful fallback UI

#### Theme System (`src/contexts/ThemeContext.tsx`)

A centralized theme system provides:

- **Colors**: Consistent color palette for all components
- **Spacing**: Standardized spacing values
- **Borders**: Border style definitions
- **Icons**: Centralized icon definitions

#### View Components (`src/components/`)

Each view component follows a consistent pattern:

1. Use shared components for common functionality
2. Implement proper error handling
3. Provide clear navigation help
4. Follow responsive design principles
5. Use the theme system for styling

### State Management

The application uses React's built-in state management:

- **Local State**: `useState` for component-specific state
- **Context**: `ThemeContext` for global theme
- **Props**: For passing data between components
- **Error Boundaries**: For graceful error handling

### Error Handling

Comprehensive error handling ensures a robust user experience:

- **Error Boundaries**: Catch rendering errors and provide fallback UI
- **Graceful Degradation**: Show clear error messages with recovery options
- **Loading States**: Prevent user confusion during async operations
- **Retry Mechanisms**: Allow users to retry failed operations

### Responsive Design

The TUI adapts to different terminal sizes:

- **Flexbox Layout**: All layouts use Flexbox for flexibility
- **Terminal Dimensions**: `useStdoutDimensions` hook for responsive design
- **Pagination**: Long lists are paginated to fit screen
- **Text Truncation**: Long text is truncated with ellipsis

## File Structure

```
src/
├── app.tsx                 # Main application component
├── cli.tsx                # CLI entry point
├── components/
│   ├── shared/            # Reusable components
│   │   ├── ViewHeader.tsx
│   │   ├── SearchInput.tsx
│   │   ├── ResultsList.tsx
│   │   ├── NavigationHelp.tsx
│   │   ├── StatusBar.tsx
│   │   └── ErrorBoundary.tsx
│   ├── Menu.tsx           # Main menu component
│   ├── WordSearch.tsx     # Word search view
│   ├── SynsetExplorer.tsx # Synset exploration view
│   └── ...                # Other view components
├── contexts/
│   └── ThemeContext.tsx   # Theme system
├── utils/
│   ├── hooks/
│   │   └── useStdOutDimensions.ts
│   ├── lexicon-helpers.ts
│   └── wordnet-helpers.ts
└── commands/              # CLI command definitions
    ├── data.ts
    ├── query.ts
    └── ...
```

## Design Principles

### 1. Component Reusability

- Shared components for common UI patterns
- Consistent interfaces and behavior
- Theme integration for styling

### 2. Error Resilience

- Error boundaries at multiple levels
- Graceful degradation for failures
- Clear error messages and recovery options

### 3. User Experience

- Responsive design for all terminal sizes
- Clear navigation and help systems
- Loading states and feedback

### 4. Developer Experience

- TypeScript for type safety
- Comprehensive testing
- Clear documentation
- Modular architecture

## Testing Strategy

### Component Testing

- Unit tests for shared components
- Integration tests for view components
- User interaction testing with ink-testing-library

### Test Structure

```
tests/
├── components/
│   ├── shared/            # Tests for shared components
│   │   ├── ViewHeader.test.tsx
│   │   ├── SearchInput.test.tsx
│   │   └── ...
│   └── Menu.test.tsx      # Tests for view components
└── e2e/                   # End-to-end tests
    └── basic.e2e.test.ts
```

## Performance Considerations

### Optimization Strategies

- **Debouncing**: User input is debounced to avoid excessive API calls
- **Pagination**: Long lists are paginated to maintain performance
- **Memoization**: Expensive operations are memoized
- **Lazy Loading**: Data is loaded on demand

### Memory Management

- **Component Cleanup**: Proper cleanup in useEffect hooks
- **State Management**: Efficient state updates
- **Error Boundaries**: Prevent memory leaks from errors

## Future Improvements

### Planned Enhancements

1. **Advanced Automation**: Macro recording and replay
2. **Real CILI Integration**: Replace simulated cross-language search
3. **Export Features**: Save results to files
4. **Performance Monitoring**: Add performance metrics
5. **Accessibility**: Screen reader support

### Technical Debt

1. **Component Refactoring**: Update remaining views to use shared components
2. **State Management**: Consider Redux/Zustand for complex state
3. **Testing Coverage**: Increase test coverage
4. **Documentation**: Improve inline documentation

## Development Workflow

### Getting Started

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Run in development: `npm run dev`
4. Run tests: `npm test`

### Development Guidelines

1. **Use Shared Components**: Always use shared components for common patterns
2. **Follow Theme System**: Use theme values for styling
3. **Write Tests**: Add tests for new components
4. **Error Handling**: Implement proper error handling
5. **Documentation**: Update documentation for changes

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with XO configuration
- **Prettier**: Code formatting
- **Testing**: Comprehensive test coverage

This architecture provides a solid foundation for building a robust, maintainable, and user-friendly TUI for WordNet data exploration. 