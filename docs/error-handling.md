# Error Handling Guide

How to handle errors gracefully in your WordNet applications.

## Philosophy

**Good error handling**:
1. **User-friendly messages** - Explain what went wrong
2. **Actionable solutions** - Tell users what to do
3. **Graceful degradation** - App continues when possible
4. **Proper logging** - Debug-friendly for developers

## Common Errors

### 1. "Module not found: wn-ts-web"

**Error**:
```
Error: Cannot find module 'wn-ts-web'
```

**Cause**: Package not installed or wrong import path

**Fix**:
```bash
# Install the package
pnpm install wn-ts-web @sqlite.org/sqlite-wasm

# Verify it's in package.json
cat package.json | grep wn-ts-web
```

**In code**:
```typescript
// ✅ Correct import
import { useWordNetContext } from 'wn-ts-web/react';

// ❌ Wrong import
import { useWordNetContext } from 'wn-ts-web';  // Missing /react
```

---

### 2. "Database not initialized"

**Error**:
```
DatabaseNotInitializedError: Call initialize() first
```

**Cause**: Forgot to call `initialize()` or it failed

**Fix**:
```typescript
// ❌ Wrong
const wn = createWordnet('oewn:2024');
const results = await wn.synsets('computer');  // Error!

// ✅ Correct
const wn = createWordnet('oewn:2024');
await wn.initialize();  // Don't forget this!
const results = await wn.synsets('computer');
```

**Pattern**:
```typescript
async function safeInitialize() {
  const wn = createWordnet('oewn:2024');
  
  try {
    await wn.initialize();
    return { success: true, wn };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to initialize: ${error.message}` 
    };
  }
}
```

---

### 3. "Worker not ready" (Web)

**Error**:
```
Error: Worker not ready. Please wait for initialization.
```

**Cause**: Trying to query before worker finishes loading

**Fix**:
```typescript
// ✅ Pattern 1: Check loading state
const { querySynsets, loading, error } = useWordNetContext();

if (loading) return <div>Loading...</div>;

// Now safe to call querySynsets()

// ✅ Pattern 2: Wait for ready
const { querySynsets, workerReady } = useWordNetContext();

useEffect(() => {
  if (workerReady) {
    // Now safe to query
    querySynsets('computer');
  }
}, [workerReady]);
```

---

### 4. "Download failed" or "Network error"

**Error**:
```
NetworkError: Failed to download oewn:2024
```

**Causes**:
- No internet connection
- Firewall/proxy blocking
- Server temporarily down

**Fix**:
```typescript
// ✅ Retry with exponential backoff
async function downloadWithRetry(packageId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loadPackageData(packageId);
      return { success: true };
    } catch (error) {
      if (i === maxRetries - 1) {
        return { 
          success: false, 
          error: `Failed after ${maxRetries} attempts: ${error.message}`
        };
      }
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

**User guidance**:
```typescript
if (error?.includes('Network')) {
  showMessage(`
    Download failed. Please:
    1. Check your internet connection
    2. Disable VPN/proxy temporarily
    3. Try again in a few moments
  `);
}
```

---

### 5. "Database locked" (Node.js)

**Error**:
```
Error: database is locked
```

**Cause**: Multiple connections to same database file

**Fix**:
```typescript
// ❌ Wrong - Multiple instances
const wn1 = createWordnet('oewn:2024', { filename: 'wn.db' });
const wn2 = createWordnet('oewn:2024', { filename: 'wn.db' });
// Error: Can't open same file twice!

// ✅ Correct - Reuse instance
const wn = createWordnet('oewn:2024', { filename: 'wn.db' });
await wn.initialize();

// Use the same instance everywhere
export { wn };

// Or use different filenames
const wn1 = createWordnet('oewn:2024', { filename: 'wn1.db' });
const wn2 = createWordnet('omw-fr:1.4', { filename: 'wn2.db' });
```

**Singleton pattern**:
```typescript
// wordnet.ts
let instance: KyselyWordnet | null = null;

export function getWordnet() {
  if (!instance) {
    instance = createWordnet('oewn:2024');
  }
  return instance;
}

// Usage everywhere
import { getWordnet } from './wordnet';
const wn = getWordnet();
```

---

### 6. "Invalid query parameters"

**Error**:
```
InvalidQueryError: pos must be one of: n, v, a, r, s
```

**Cause**: Wrong parameter value

**Fix**:
```typescript
// ❌ Wrong
const synsets = await wn.synsets({ pos: 'noun' });  // Use 'n' not 'noun'

// ✅ Correct
const synsets = await wn.synsets({ pos: 'n' });

// ✅ With validation
function validatePos(pos: string): pos is 'n' | 'v' | 'a' | 'r' | 's' {
  return ['n', 'v', 'a', 'r', 's'].includes(pos);
}

const pos = userInput.toLowerCase();
if (!validatePos(pos)) {
  throw new Error(`Invalid part of speech: ${pos}. Use: n, v, a, r, or s`);
}
const synsets = await wn.synsets({ pos });
```

---

### 7. "Out of memory" (Browser)

**Error**:
```
RangeError: Maximum call stack size exceeded
```

**Cause**: Loading too much data at once in browser

**Fix**:
```typescript
// ❌ Wrong - Load everything
const allSynsets = await wn.synsets({});  // Could be 100K+ results!

// ✅ Correct - Use pagination
const PAGE_SIZE = 100;
const synsets = await wn.synsets({ limit: PAGE_SIZE, offset: 0 });

// ✅ Correct - Filter query
const synsets = await wn.synsets({ form: 'computer', limit: 10 });
```

---

## Error Handling Patterns

### Pattern 1: Try-Catch with User Feedback

```typescript
async function searchWithFeedback(term: string) {
  try {
    const results = await wn.synsets(term);
    
    if (results.length === 0) {
      showMessage(`No results found for "${term}". Try a different word.`);
      return [];
    }
    
    return results;
  } catch (error) {
    // User-friendly message
    if (error.message.includes('Network')) {
      showError('Connection failed. Check your internet and try again.');
    } else if (error.message.includes('not initialized')) {
      showError('WordNet is loading. Please wait a moment.');
    } else {
      showError(`Search failed: ${error.message}`);
    }
    
    // Still return empty array (app continues)
    return [];
  }
}
```

### Pattern 2: Result Object (No Throws)

```typescript
// ✅ Better for UX - Never throws, always returns
async function safeQuery(term: string): Promise<{
  success: boolean;
  data?: Synset[];
  error?: string;
}> {
  try {
    const data = await wn.synsets(term);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Usage
const result = await safeQuery('computer');
if (result.success) {
  console.log('Found', result.data.length, 'synsets');
} else {
  console.error('Search failed:', result.error);
}
```

### Pattern 3: React Error Boundary

```typescript
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WordNetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('WordNet error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<WordNetErrorBoundary>
  <WordNetApp />
</WordNetErrorBoundary>
```

### Pattern 4: Loading States with Timeout

```typescript
function WordNetSearch() {
  const { querySynsets, loading } = useWordNetContext();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 60000); // 60 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setTimeoutReached(false);
    }
  }, [loading]);

  if (loading && timeoutReached) {
    return (
      <div>
        <p>This is taking longer than expected.</p>
        <p>First download can take 1-2 minutes.</p>
        <button onClick={() => window.location.reload()}>
          Cancel and Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return <div>Loading WordNet data...</div>;
  }

  // ...rest of component
}
```

---

## Production Error Handling

### Express.js Example

```typescript
import { createWordnet } from 'wn-ts-node';
import express from 'express';

const app = express();
let wn: KyselyWordnet;

// Initialize with error handling
async function initializeWordNet() {
  try {
    wn = createWordnet('oewn:2024');
    await wn.initialize();
    console.log('✅ WordNet initialized');
  } catch (error) {
    console.error('❌ WordNet initialization failed:', error);
    process.exit(1);  // Can't start server without WordNet
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await wn.synsets({ limit: 1 });
    res.json({ status: 'healthy', service: 'wordnet' });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Search endpoint with comprehensive error handling
app.get('/search/:word', async (req, res) => {
  const { word } = req.params;
  
  // Validation
  if (!word || word.length < 2) {
    return res.status(400).json({ 
      error: 'Invalid search term',
      message: 'Word must be at least 2 characters' 
    });
  }

  try {
    const synsets = await wn.synsets(word);
    
    if (synsets.length === 0) {
      return res.status(404).json({ 
        error: 'No results found',
        message: `No synsets found for "${word}"`,
        suggestions: ['Try a different word', 'Check spelling', 'Use base form']
      });
    }

    res.json({ 
      word,
      count: synsets.length,
      results: synsets 
    });
    
  } catch (error) {
    console.error('Search error:', error);
    
    // Don't expose internal errors to users
    res.status(500).json({ 
      error: 'Search failed',
      message: 'An internal error occurred. Please try again.',
      requestId: req.id  // For support debugging
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await wn.close();
  process.exit(0);
});

await initializeWordNet();
app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## Error Logging Best Practices

### Development vs Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

try {
  const results = await wn.synsets('computer');
} catch (error) {
  if (isDev) {
    // Detailed logging for debugging
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
  } else {
    // Minimal logging for production
    console.error('Search failed:', error.message);
  }
  
  // User-friendly message regardless
  throw new Error('Unable to search WordNet. Please try again.');
}
```

### Structured Logging

```typescript
import { createLogger } from './logger';

const logger = createLogger('WordNetService');

try {
  const results = await wn.synsets(term);
  logger.info('Search successful', { term, count: results.length });
} catch (error) {
  logger.error('Search failed', { 
    term, 
    error: error.message,
    stack: error.stack 
  });
  throw new Error(`Search for "${term}" failed`);
}
```

---

## React Error Handling Patterns

### With Error State

```typescript
function WordNetSearch() {
  const { querySynsets } = useWordNetContext();
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState([]);

  const handleSearch = async (term: string) => {
    setError(null);  // Clear previous errors
    
    try {
      const synsets = await querySynsets(term);
      setResults(synsets);
      
      if (synsets.length === 0) {
        setError(`No results for "${term}". Try a different word.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      // User-friendly error messages
      if (message.includes('Network')) {
        setError('Connection failed. Check your internet connection.');
      } else if (message.includes('not ready')) {
        setError('WordNet is still loading. Please wait a moment.');
      } else {
        setError(`Search failed: ${message}`);
      }
    }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}
      {/* ...rest of component */}
    </div>
  );
}
```

### With Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

async function handleSearch(term: string) {
  const toastId = toast.loading('Searching...');
  
  try {
    const results = await querySynsets(term);
    
    if (results.length === 0) {
      toast.error(`No results for "${term}"`, { id: toastId });
    } else {
      toast.success(`Found ${results.length} results`, { id: toastId });
    }
    
    setResults(results);
  } catch (error) {
    toast.error(`Search failed: ${error.message}`, { id: toastId });
  }
}
```

---

## Node.js Error Handling Patterns

### CLI Application

```typescript
#!/usr/bin/env node
import { createWordnet } from 'wn-ts-node';

async function main() {
  const wn = createWordnet('oewn:2024');
  
  try {
    await wn.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize WordNet');
    console.error('   Error:', error.message);
    console.error('\n💡 Try:');
    console.error('   - Check internet connection');
    console.error('   - Clear cache: rm -rf ~/.wn_data');
    console.error('   - Run with --verbose for details');
    process.exit(1);
  }

  try {
    const synsets = await wn.synsets(process.argv[2] || 'computer');
    console.log(`Found ${synsets.length} synsets`);
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    process.exit(1);
  } finally {
    await wn.close();
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
```

### Server Application

```typescript
import { createWordnet } from 'wn-ts-node';

class WordNetService {
  private wn: KyselyWordnet | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;  // Return existing promise
    }

    this.initPromise = (async () => {
      try {
        this.wn = createWordnet('oewn:2024');
        await this.wn.initialize();
      } catch (error) {
        this.initPromise = null;  // Allow retry
        throw error;
      }
    })();

    return this.initPromise;
  }

  async search(term: string) {
    if (!this.wn) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      return await this.wn.synsets(term);
    } catch (error) {
      // Log but don't expose internals
      console.error('[WordNetService] Search error:', error);
      throw new Error('Search operation failed');
    }
  }

  async healthCheck() {
    try {
      if (!this.wn) return { healthy: false, reason: 'not initialized' };
      await this.wn.synsets({ limit: 1 });
      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }
}

export const wordnetService = new WordNetService();
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// Node.js
process.env.DEBUG = 'wn:*';

// Or use logger
import { setLogLevel } from 'wn-ts-node';
setLogLevel('debug');
```

### Check Initialization State

```typescript
// Web
const { workerReady, loadedPackages, error } = useWordNetContext();

console.log({
  workerReady,
  packagesLoaded: loadedPackages,
  hasError: !!error
});
```

### Verify Database

```typescript
// Node.js - Check database file
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const dbPath = join(homedir(), '.wn_data', 'wn.db');
console.log('Database exists:', existsSync(dbPath));

// Web - Check OPFS
const root = await navigator.storage.getDirectory();
for await (const [name, handle] of root.entries()) {
  console.log('OPFS file:', name);
}
```

---

## Quick Reference

| Error | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| Module not found | Not installed | `pnpm install wn-ts-web` |
| Database not initialized | Missing `initialize()` | Add `await wn.initialize()` |
| Worker not ready | Called too early | Check `loading` state |
| Download failed | Network issue | Check internet, retry |
| Database locked | Multiple connections | Use one instance |
| Invalid query | Wrong parameter | Check API reference |
| Out of memory | Too much data | Use pagination |

---

## Testing Error Handling

```typescript
import { describe, it, expect } from 'vitest';

describe('Error handling', () => {
  it('handles invalid search term gracefully', async () => {
    const result = await safeQuery('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('handles network errors gracefully', async () => {
    // Mock network failure
    const result = await downloadWithRetry('fake:package', 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed');
  });
});
```

---

## Further Reading

- [Quick Start Guide](./quick-start.md) - Basic usage
- [API Reference](./api/api-reference.md) - All methods
- [Examples](../examples/hello-world/) - Working code

---

**Key Takeaway**: Always handle errors gracefully. Users should never see raw stack traces or cryptic messages.

