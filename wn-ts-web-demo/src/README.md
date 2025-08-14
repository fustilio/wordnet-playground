# WordNet Web Demo - Source Directory

## Overview

This directory contains the complete source code for the WordNet Web Demo application. The application demonstrates various WordNet functionalities through an interactive web interface, showcasing features like word search, synset exploration, data management, and visualization.

> Worker-first: The demo runs `wn-ts-web` inside a dedicated Web Worker (Comlink) to keep SQLite/OPFS operations off the main thread. See `src/workers/wordnetWorker.ts` and `src/hooks/useWordNetWorker.ts`.

## Directory Structure

```
src/
├── app/                    # Main application components
│   ├── App.tsx           # Root application component
│   └── SPEC.md           # Application specification
├── components/            # React components organized by feature
│   ├── demos/            # WordNet demonstration components
│   ├── developer-tools/  # Development and debugging utilities
│   ├── features/         # Core feature implementations
│   ├── screens/          # Full-screen display components
│   ├── shared/           # Reusable UI components
│   ├── ui/               # Basic UI elements
│   ├── visualizations/   # Data visualization components
│   ├── widgets/          # Sidebar and status widgets
│   └── SPEC.md           # Components specification
├── contexts/              # React context providers
│   ├── WordNetContext.tsx # WordNet service context
│   └── SPEC.md           # Contexts specification
├── examples/              # Example implementations
│   ├── BasicWordNetDemo.tsx
│   ├── FullWordNetDemo.tsx
│   ├── ProjectList.tsx
│   ├── SequentialRunner.tsx
│   └── SPEC.md           # Examples specification
├── hooks/                 # Custom React hooks
│   ├── useWordNet.ts     # Core WordNet service hook
│   ├── useOPFS.ts        # OPFS integration hook
│   ├── useBackup.ts      # Backup functionality hook
│   ├── useExport.ts      # Data export hook
│   └── SPEC.md           # Hooks specification
├── lib/                   # Library integrations
│   ├── sqliteClient.ts   # SQLite client and worker
│   └── SPEC.md           # Library specification
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Main type exports
│   └── SPEC.md           # Types specification
├── utils/                 # Utility functions
│   ├── cors-proxy.ts     # CORS proxy management
│   ├── project-list.ts   # Project information utilities
│   ├── proxy-test.ts     # Proxy testing utilities
│   └── SPEC.md           # Utils specification
├── workers/               # Web worker implementations
│   ├── sqliteWorker.ts   # SQLite database worker
│   ├── wordnetWorker.ts  # WordNet processing worker
│   └── SPEC.md           # Workers specification
├── index.css              # Global styles
├── main.tsx               # Application entry point
├── SPEC.md                # Main source specification
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Modern browser with OPFS support
- TypeScript knowledge

### Development Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

### Worker usage (concise example)

```ts
// Comlink-backed worker usage (provided by vite-plugin-comlink)
const worker = new ComlinkWorker(new URL('../workers/wordnetWorker.ts', import.meta.url));
await worker.initializeWordNet();
const synsets = await worker.querySynsets('joy');
```

## Key Concepts

#### 1. Context-Based Architecture
The application uses React Context for state management, eliminating prop drilling:
```typescript
import { useWordNetContext } from './contexts/WordNetContext';

function MyComponent() {
  const { wordnet, loading, queryWords } = useWordNetContext();
  // Use WordNet services directly
}
```

#### 2. Component Organization
Components are organized by functionality:
- **Demos**: Interactive WordNet demonstrations
- **Features**: Core application features
- **Widgets**: Status and information displays
- **Visualizations**: Data visualization tools

#### 3. Hook-Based Services
Custom hooks provide service access:
```typescript
import { useWordNet, useOPFS } from './hooks';

function MyComponent() {
  const wordNetState = useWordNet();
  const opfsState = useOPFS();
  // Access services and state
}
```

## Architecture Overview

### State Management
- **WordNet Context**: Centralized WordNet service access
- **Local State**: Component-specific state management
- **OPFS Integration**: Persistent storage management

### Data Flow
1. **User Interaction** → Component
2. **Component** → Hook/Context
3. **Hook/Context** → Service/Worker
4. **Service/Worker** → External APIs/Storage
5. **Response** → State Update → UI Re-render

### Performance Features
- **Web Workers**: Background processing for heavy operations
- **Lazy Loading**: On-demand component loading
- **Context Optimization**: Minimized re-renders
- **Memory Management**: Efficient resource usage

## Development Guidelines

### Code Standards
- **TypeScript**: Full type safety required
- **Functional Components**: Use hooks and functional components
- **Error Handling**: Comprehensive error boundaries
- **Accessibility**: WCAG compliance

### Component Patterns
```typescript
// Standard component structure
interface ComponentProps {
  // Clear prop definitions
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Local state
  const [localState, setLocalState] = useState();
  
  // Context usage
  const contextValue = useWordNetContext();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Event logic
  }, []);
  
  return (
    // JSX with proper accessibility
  );
};
```

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Complete workflow validation
- **Performance Tests**: Performance regression testing

## Feature Areas

### 1. WordNet Functionality
- **Word Search**: Find words and definitions
- **Synset Exploration**: Navigate synset hierarchies
- **Relationship Visualization**: Graph-based word relationships
- **Multi-language Support**: Multiple WordNet packages

### 2. Data Management
- **Package Loading**: Load WordNet data packages
- **Cache Management**: Efficient data caching
- **Backup/Restore**: Data persistence and recovery
- **Export/Import**: Data format conversion

### 3. Developer Tools
- **Debug Console**: Real-time logging and debugging
- **Performance Monitor**: Performance metrics and optimization
- **Data Validation**: Data integrity checking
- **Error Tracking**: Comprehensive error monitoring

### 4. User Experience
- **Responsive Design**: Mobile-first approach
- **Progressive Disclosure**: Complexity revealed gradually
- **Interactive Elements**: Engaging user interactions
- **Accessibility**: Full accessibility compliance

## Troubleshooting

### Common Issues

#### TypeScript Errors
```bash
# Run type checking to identify issues
pnpm typecheck

# Check specific files
pnpm exec tsc --noEmit src/components/MyComponent.tsx
```

#### Build Issues
```bash
# Clear build cache
rm -rf dist node_modules/.vite

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

#### Runtime Errors
- Check browser console for error messages
- Verify OPFS support in browser
- Check network connectivity for external resources
- Validate data package integrity

### Debug Tools
- **React DevTools**: Component inspection
- **Browser DevTools**: Network and performance analysis
- **Debug Console**: Application-specific logging
- **Performance Monitor**: Real-time metrics

## Contributing

### Development Workflow
1. **Feature Branch**: Create feature branch from main
2. **Implementation**: Implement feature with tests
3. **Type Checking**: Ensure no TypeScript errors
4. **Testing**: Run comprehensive test suite
5. **Documentation**: Update relevant SPEC.md files
6. **Pull Request**: Submit for review

### Code Review Checklist
- [ ] TypeScript compilation passes
- [ ] All tests pass
- [ ] Code follows established patterns
- [ ] Documentation is updated
- [ ] Accessibility requirements met
- [ ] Performance impact considered

## Resources

### Documentation
- **SPEC.md Files**: Detailed specifications for each directory
- **TypeScript**: [Official TypeScript documentation](https://www.typescriptlang.org/)
- **React**: [React documentation](https://react.dev/)
- **Tailwind CSS**: [Tailwind CSS documentation](https://tailwindcss.com/)

### External Libraries
- **wn-ts-web**: WordNet TypeScript library
- **SQLite WASM**: WebAssembly SQLite implementation
- **React Force Graph**: Force-directed graph visualization

### Browser Support
- **Chrome**: 88+ (Full OPFS support)
- **Firefox**: 111+ (Full OPFS support)
- **Safari**: 16.4+ (Full OPFS support)
- **Edge**: 88+ (Full OPFS support)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For questions, issues, or contributions:
- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub discussions
- **Contributions**: Submit pull request
- **Documentation**: Update relevant SPEC.md files
