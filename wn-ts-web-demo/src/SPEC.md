# `src` Directory Specification

## 1. Overview

This directory contains the core source code for the `wn-ts-web-demo` application. It is structured to separate concerns such as components, hooks, and utilities, facilitating maintainability and scalability.

## 2. Implementation Status

- [x] Application Entry Point (`main.tsx`)
- [x] Root Component (`App.tsx`)
- [x] Component Architecture
- [x] State Management with Hooks
- [x] Utility Functions
- [x] Type Definitions
- [x] Context Architecture (WordNetContext)
- [x] Worker System
- [x] Example Demonstrations

## 3. Current Directory Structure

```
src/
├── app/                    # Main application components
│   └── App.tsx           # Root application component
├── components/            # React components organized by feature
│   ├── demos/            # Demonstration components
│   ├── developer-tools/  # Development and debugging tools
│   ├── features/         # Core feature components
│   ├── screens/          # Screen-level components
│   ├── shared/           # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── visualizations/   # Data visualization components
│   ├── widgets/          # Sidebar and status widgets
│   └── index.ts          # Component exports
├── contexts/              # React context providers
│   └── WordNetContext.tsx # WordNet service context
├── examples/              # Example implementations
├── hooks/                 # Custom React hooks
├── lib/                   # Library integrations
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── workers/               # Web worker implementations
├── index.css              # Global styles
├── main.tsx               # Application entry point
└── vite-env.d.ts          # Vite environment types
```

## 4. Planned Reorganization

### 4.1 Component Restructuring
- [ ] **Consolidate UI components** into logical groups
- [ ] **Create feature-based folders** for better organization
- [ ] **Standardize component interfaces** across similar components
- [ ] **Improve component documentation** with proper props interfaces

### 4.2 Feature Organization
- [ ] **Group related components** by functionality (e.g., data management, search, visualization)
- [ ] **Create consistent naming conventions** for component files
- [ ] **Standardize component exports** and index files
- [ ] **Improve component reusability** through better prop interfaces

### 4.3 Documentation Standards
- [ ] **Create SPEC.md files** for each major directory
- [ ] **Document component interfaces** and usage examples
- [ ] **Standardize component structure** across the application
- [ ] **Add inline documentation** for complex logic

## 5. Key Architectural Decisions

### 5.1 Context-Based State Management
- **WordNetContext**: Provides centralized WordNet service access
- **Benefits**: Eliminates prop drilling, improves component reusability
- **Usage**: Components use `useWordNetContext()` hook for state access

### 5.2 Component Organization
- **Feature-based grouping**: Components organized by functionality
- **Shared components**: Reusable UI elements in `shared/` and `ui/`
- **Specialized components**: Feature-specific components in dedicated folders

### 5.3 Hook Architecture
- **Custom hooks**: Encapsulate complex logic and state management
- **Service hooks**: Interface with external services (WordNet, OPFS)
- **Utility hooks**: Provide common functionality across components

## 6. File Naming Conventions

- **Components**: PascalCase (e.g., `WordNetStatistics.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWordNet.ts`)
- **Utilities**: camelCase (e.g., `cors-proxy.ts`)
- **Types**: camelCase (e.g., `index.ts` in types folder)
- **Constants**: UPPER_SNAKE_CASE (when applicable)

## 7. Import/Export Standards

- **Named exports**: Use named exports for components and functions
- **Index files**: Centralize exports in `index.ts` files
- **Relative imports**: Use relative paths for local imports
- **Type imports**: Use `type` imports for TypeScript types

## 8. Testing Strategy

- **Component testing**: Test individual component functionality
- **Hook testing**: Test custom hooks in isolation
- **Integration testing**: Test component interactions
- **E2E testing**: Test complete user workflows

## 9. Performance Considerations

- **Lazy loading**: Implement lazy loading for heavy components
- **Memoization**: Use React.memo and useMemo where appropriate
- **Bundle splitting**: Separate vendor and application code
- **Image optimization**: Optimize images and assets

## 10. Accessibility Standards

- **ARIA labels**: Proper labeling for screen readers
- **Keyboard navigation**: Full keyboard accessibility
- **Color contrast**: Meet WCAG contrast requirements
- **Semantic HTML**: Use appropriate HTML elements

## 11. Browser Compatibility

- **Modern browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **OPFS support**: Chrome 86+, Firefox 111+, Safari 16.4+, Edge 86+
- **WebAssembly**: All modern browsers support WebAssembly
- **Fallback support**: Graceful degradation for unsupported features

## 12. Future Enhancements

- [ ] **Component library**: Create a reusable component library
- [ ] **Storybook integration**: Add Storybook for component documentation
- [ ] **Performance monitoring**: Implement performance tracking
- [ ] **Error boundaries**: Add comprehensive error handling
- [ ] **Internationalization**: Support for multiple languages
- [ ] **Theme system**: Implement dark/light theme switching
