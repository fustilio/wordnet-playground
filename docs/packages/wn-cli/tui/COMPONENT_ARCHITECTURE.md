# WordNet CLI - Component Architecture

This document details the specific component architecture and shared components implemented in the `wn-cli` project.

## Shared Components (`src/components/shared/`)

### ViewHeader.tsx

Provides consistent headers across all views with icons, titles, and metadata.

```tsx
interface ViewHeaderProps {
  title: string;
  icon?: string;
  lexicon?: string;
  language?: string;
  subtitle?: string;
}
```

**Usage:**
```tsx
<ViewHeader 
  title="Word Search"
  icon="🔍"
  lexicon="oewn"
  language="en"
  subtitle="Search for words and their definitions"
/>
```

**Features:**
- Consistent styling with theme colors
- Optional lexicon and language display
- Subtitle support for additional context
- Badge components for metadata

### SearchInput.tsx

Standardized search input with loading and error states.

```tsx
interface SearchInputProps {
  placeholder?: string;
  onSubmit: (query: string) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<SearchInput
  placeholder="Enter a word to search..."
  onSubmit={handleSearch}
  loading={loading}
  error={error}
/>
```

**Features:**
- Integrated loading spinner
- Error message display with Alert component
- Disabled state support
- Automatic input clearing after submission

### ResultsList.tsx

Paginated result display with selection and navigation.

```tsx
interface ResultItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

interface ResultsListProps {
  results: ResultItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}
```

**Usage:**
```tsx
<ResultsList
  results={resultItems}
  selectedIndex={selected}
  onSelect={handleSelect}
  emptyMessage="No words found matching your search."
  loading={loading}
/>
```

**Features:**
- Automatic pagination based on terminal size
- Selection highlighting
- Scroll indicators
- Loading and empty states
- Metadata display
- Tag support with Badge components

### NavigationHelp.tsx

Keyboard shortcut display and help text.

```tsx
interface NavigationHelpProps {
  shortcuts: Array<{ key: string; description: string }>;
  additionalInfo?: string;
}
```

**Usage:**
```tsx
<NavigationHelp
  shortcuts={[
    { key: 'Enter', description: 'Search' },
    { key: '↑↓', description: 'Navigate results' },
    { key: 'Esc', description: 'Back' }
  ]}
  additionalInfo="Recent searches: happy, joy, glad"
/>
```

**Features:**
- Consistent shortcut formatting
- Optional additional information
- Theme-aware styling

### StatusBar.tsx

Persistent status information and global shortcuts.

```tsx
interface StatusBarProps {
  currentView: string;
  lexicon?: string;
  language?: string;
  additionalInfo?: string;
  showDebug?: boolean;
}
```

**Usage:**
```tsx
<StatusBar 
  currentView="word-search"
  lexicon="oewn"
  language="en"
  showDebug={debugMode}
/>
```

**Features:**
- Responsive layout that adapts to terminal width
- Debug mode indicator
- Global shortcut display
- Context information (lexicon, language)

### ErrorBoundary.tsx

Error catching and graceful fallback UI.

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>;
}
```

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches rendering errors
- Provides fallback UI
- Error logging for debugging
- Graceful degradation

## Theme System (`src/contexts/ThemeContext.tsx`)

### Theme Interface

```tsx
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: string;
    muted: string;
    background: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borders: {
    single: string;
    double: string;
    round: string;
  };
  icons: {
    search: string;
    settings: string;
    help: string;
    exit: string;
    back: string;
    forward: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
  };
}
```

### Usage

```tsx
import { useTheme } from '../contexts/ThemeContext.js';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Text color={theme.colors.primary}>
      {theme.icons.search} Search
    </Text>
  );
};
```

## View Component Pattern

All view components follow this consistent pattern:

```tsx
const ExampleView: React.FC<ViewProps> = ({ onExit, lexicon, language }) => {
  // 1. State management
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. Event handlers
  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const data = await performSearch(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Data transformation
  const resultItems = results?.map((result, _) => ({
    id: result.id,
    title: result.title,
    subtitle: result.description,
    tags: [result.type],
    metadata: {
      'ID': result.id,
      'Type': result.type
    }
  })) || [];

  // 4. Render with shared components
  return (
    <Box flexDirection="column" height="100%">
      <ViewHeader 
        title="Example View"
        icon="📋"
        lexicon={lexicon}
        language={language}
        subtitle="Description of this view"
      />
      
      <SearchInput
        placeholder="Search..."
        onSubmit={handleSearch}
        loading={loading}
        error={error}
      />
      
      <ResultsList
        results={resultItems}
        selectedIndex={selected}
        onSelect={setSelected}
        emptyMessage="No results found."
        loading={loading}
      />
      
      <NavigationHelp
        shortcuts={[
          { key: 'Enter', description: 'Search' },
          { key: '↑↓', description: 'Navigate' },
          { key: 'Esc', description: 'Back' }
        ]}
        additionalInfo="Additional help text"
      />
    </Box>
  );
};
```

## File Structure

```
src/
├── components/
│   ├── shared/              # Reusable components
│   │   ├── ViewHeader.tsx
│   │   ├── SearchInput.tsx
│   │   ├── ResultsList.tsx
│   │   ├── NavigationHelp.tsx
│   │   ├── StatusBar.tsx
│   │   └── ErrorBoundary.tsx
│   ├── Menu.tsx            # Main menu
│   ├── WordSearch.tsx      # Word search view
│   ├── SynsetExplorer.tsx  # Synset exploration
│   └── ...                 # Other views
├── contexts/
│   └── ThemeContext.tsx    # Theme system
└── utils/
    ├── hooks/
    │   └── useStdOutDimensions.ts
    ├── lexicon-helpers.ts
    └── wordnet-helpers.ts
```

## Testing Strategy

### Shared Component Tests

Each shared component has corresponding tests in `tests/components/shared/`:

```tsx
// tests/components/shared/ViewHeader.test.tsx
test('ViewHeader renders with lexicon and language', () => {
  const { lastFrame } = render(
    <ViewHeader 
      title="Word Search"
      icon="🔍"
      lexicon="oewn"
      language="en"
    />
  );

  expect(lastFrame()).toContain('🔍 Word Search');
  expect(lastFrame()).toContain('Lexicon: oewn');
  expect(lastFrame()).toContain('Language: en');
});
```

### Integration Tests

View components are tested with integration tests that verify the interaction between shared components.

## Best Practices

### 1. Component Composition

- Use shared components for common patterns
- Keep view components focused on business logic
- Delegate UI concerns to shared components

### 2. Error Handling

- Wrap complex components in ErrorBoundary
- Provide clear error messages
- Implement retry mechanisms where appropriate

### 3. Performance

- Debounce user input for search operations
- Implement pagination for large datasets
- Use React.memo for expensive components

### 4. Accessibility

- Ensure keyboard navigation works
- Provide clear focus indicators
- Use semantic markup where possible

### 5. Testing

- Test shared components in isolation
- Test view components with integration tests
- Mock external dependencies

This architecture provides a solid foundation for building maintainable, consistent, and user-friendly TUIs with React Ink. 