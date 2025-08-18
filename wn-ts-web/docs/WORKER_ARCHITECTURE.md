# WordNet Worker-First Architecture

## Overview

The `wn-ts-web` library now uses a **worker-first architecture** where all heavy WordNet operations are handled by web workers to ensure UI responsiveness. React components should never directly access `DataLoader` or `WebWordnet` instances.

## Architecture Flow

```
React Components → useWordNet Hook → WordNetWorkerClient → WordNetWorker → WordNetOrchestrator → DataLoader/WebWordnet
```

### Component Responsibilities

1. **React Components**: UI logic and state management
2. **useWordNet Hook**: React integration and state synchronization
3. **WordNetWorkerClient**: Worker communication and event management
4. **WordNetWorker**: Web worker implementation and Comlink API
5. **WordNetOrchestrator**: WordNet business logic and lexicon management
6. **DataLoader/WebWordnet**: Low-level data operations and storage

## Key Principles

### 1. No Direct DataLoader Access
❌ **Wrong**: Accessing DataLoader directly from React components
```tsx
// DON'T DO THIS
const dataLoader = useDataLoader(); // Direct access
await dataLoader.downloadAndLoad('oewn:2024');
```

✅ **Correct**: Using the worker client through useWordNet
```tsx
// DO THIS
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');
```

### 2. Worker-First Operations
All heavy operations must go through the worker:
- Package loading and downloading
- Data processing and parsing
- Complex queries and statistics
- Cache management

### 3. Event-Driven Updates
The architecture uses events for real-time updates:
- `packageLoaded`: When a package finishes loading
- `lexiconsChanged`: When lexicon state changes
- `statusUpdated`: When statistics are updated
- `error`: When operations fail

### 4. Worker Readiness
Always check if the worker is ready before calling worker-dependent methods:
```tsx
const { workerReady, loadPackageData, getCacheInfo } = useWordNet();

// Check worker readiness
if (workerReady) {
  await loadPackageData('oewn:2024');
  const cacheInfo = await getCacheInfo();
} else {
  console.log('Worker not ready yet, please wait...');
}
```

### 5. Queue System for Early Requests
The hook automatically queues package load requests made before the worker is ready:
```tsx
const { workerReady, hasPendingLoads, loadPackageData } = useWordNet();

// This will be queued if worker isn't ready yet
await loadPackageData('oewn:2024');

// Check if there are pending loads
if (hasPendingLoads()) {
  console.log('Package load request queued, waiting for worker...');
}

// The queued request will be automatically processed when worker becomes ready
```

## New Methods

### Worker Readiness
- **`workerReady`**: Boolean state indicating if the worker is ready for operations
- **`isWorkerReady()`**: Method to check worker readiness
- **`hasPendingLoads()`**: Check if there are queued package load requests
- **`hasInitializationStarted()`**: Check if initialization has begun

### Queue Management
- **Automatic queuing**: Package load requests are automatically queued if worker isn't ready
- **Automatic processing**: Queued requests are processed when worker becomes ready
- **No manual management**: The queue system works transparently

## Usage Examples

### Basic Package Loading
```tsx
const { loadPackageData, loading, progressStage } = useWordNet();

const handleLoadPackage = async () => {
  try {
    await loadPackageData('oewn:2024');
    console.log('Package loaded successfully');
  } catch (error) {
    console.error('Failed to load package:', error);
  }
};
```

### Querying Words
```tsx
const { queryWords, wordnet } = useWordNet();

const handleQuery = async (term: string) => {
  try {
    const results = await queryWords(term);
    console.log('Query results:', results);
  } catch (error) {
    console.error('Query failed:', error);
  }
};
```

### Event Handling
```tsx
const { wordnet } = useWordNet();

useEffect(() => {
  const handlePackageLoaded = (event: any) => {
    if (event.success) {
      console.log(`Package ${event.packageId} loaded successfully`);
    }
  };

  // The hook automatically sets up event listeners
  // You can access events through the worker client if needed
}, []);
```

### Handling Initialization Gracefully
```tsx
const { workerReady, isInitializing, error, getCacheInfo } = useWordNet();

useEffect(() => {
  const initializeApp = async () => {
    try {
      // Wait for worker to be ready
      if (!workerReady) {
        console.log('Waiting for worker to initialize...');
        return;
      }

      // Now safe to call worker methods
      const cacheInfo = await getCacheInfo();
      console.log('Cache info:', cacheInfo);
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  };

  initializeApp();
}, [workerReady, getCacheInfo]);
```

## Migration Guide

### From Direct DataLoader Access

**Before (❌):**
```tsx
const dataLoader = useDataLoader();
await dataLoader.downloadAndLoad('oewn:2024');
const stats = await dataLoader.getStatistics();
```

**After (✅):**
```tsx
const { loadPackageData, statistics } = useWordNet();
await loadPackageData('oewn:2024');
// Statistics are automatically updated via events
```

### From Direct WebWordnet Access

**Before (❌):**
```tsx
const wordnet = useWordNetInstance();
const results = await wordnet.words('water');
```

**After (✅):**
```tsx
const { queryWords } = useWordNet();
const results = await queryWords('water');
```

## Benefits

1. **UI Responsiveness**: Heavy operations don't block the main thread
2. **Better Error Handling**: Centralized error management through the worker
3. **Event-Driven Updates**: Real-time state synchronization
4. **Separation of Concerns**: Clear boundaries between UI and data layers
5. **Memory Efficiency**: Better memory management in workers
6. **Type Safety**: Full TypeScript support with proper interfaces

## Error Handling

The architecture provides multiple layers of error handling:

1. **Worker Level**: Catches and reports errors from WordNet operations
2. **Client Level**: Manages worker lifecycle and connection errors
3. **Hook Level**: Provides error state and fallback mechanisms
4. **Component Level**: Handles UI-specific error states

```tsx
const { error, loading, loadPackageData } = useWordNet();

if (error) {
  return <div>Error: {error}</div>;
}

if (loading) {
  return <div>Loading...</div>;
}
```

## Performance Considerations

- **Initialization**: Worker initialization happens once on mount
- **Package Loading**: All package operations are offloaded to workers
- **Queries**: Light queries can fall back to main thread if needed
- **Memory**: Heavy data structures are kept in worker memory
- **Caching**: Cache operations are handled by the worker

## Debugging

The architecture provides comprehensive logging:

```tsx
// Enable debug logging
setGlobalLogLevel("debug");

// Check worker status
const { testMemoryQueries } = useWordNet();
const results = await testMemoryQueries();
console.log('Memory test results:', results);
```

## Best Practices

1. **Always use the hook**: Never bypass useWordNet for WordNet operations
2. **Handle loading states**: Use the loading and progress indicators
3. **Listen to events**: React to package loading and status changes
4. **Error boundaries**: Implement proper error handling in components
5. **Memory management**: Use the provided cache management methods
6. **Type safety**: Leverage TypeScript interfaces for better development experience

## Troubleshooting

### Worker Not Initializing
- Check browser console for worker errors
- Verify worker file path and CORS settings
- Ensure Comlink is properly imported

### Package Loading Fails
- Check network connectivity
- Verify package ID format
- Check worker memory limits

### Queries Return Empty Results
- Ensure packages are loaded first
- Check worker initialization status
- Verify query parameters

### Performance Issues
- Monitor worker memory usage
- Check for memory leaks in event listeners
- Use the memory testing utilities

### Worker Initialization Errors
- **"Worker client not available"**: The worker hasn't finished initializing yet
  - Use `workerReady` state to check readiness
  - Wait for `workerReady` to be `true` before calling worker methods
  - Use `isInitializing` to show appropriate loading states

- **"Worker client not initialized"**: The worker failed to initialize
  - Check browser console for detailed error messages
  - Verify worker script path and CORS settings
  - Ensure the worker script is accessible

- **Cache info errors during startup**: Normal during initialization
  - Methods like `getCacheInfo()` provide fallbacks when worker isn't ready
  - No need to handle these errors - they're expected during startup
