# Web API Documentation

## 📖 **Overview**

This document provides comprehensive API documentation for `wn-ts-web`, including React hooks, worker APIs, and core functionality. The library features a **microkernel architecture** with plugin system and enhanced lexicon introspection.

## 🔧 **React Integration**

### `useWordNet(config?)`

Main React hook that provides WordNet functionality with automatic worker management.

#### Configuration Options

```typescript
interface WordNetConfig {
  enableWorkers?: boolean;        // Enable web worker usage (default: true)
  fallbackToMainThread?: boolean; // Allow fallback to main thread (default: true)
  workerUrl?: string;             // Custom worker URL (optional)
}
```

#### Returned State

```typescript
interface WordNetState {
  wordnet: WebWordnet | null;           // WordNet instance (main thread fallback)
  dataLoader: DataLoader | null;        // Data loader instance (main thread fallback)
  loading: boolean;                     // Current loading state
  isInitializing: boolean;              // Initialization state
  error: string | null;                 // Any error messages
  statistics: WordNetStatistics | undefined; // WordNet statistics
  integrity: IntegrityInfo | null;      // Data integrity information
  dataSource: DataSourceInfo | null;    // Current data source information
  availablePackages: PackageInfo[];     // List of available packages
  loadedPackages: string[];             // Currently loaded packages
  progress: number;                     // Operation progress (0-1)
  progressStage: string;                // Current operation stage
  workerReady: boolean;                 // Worker readiness state
}
```

#### Returned Methods

##### Data Loading

```typescript
// Load a WordNet package
loadPackageData(
  packageId: string, 
  progress?: (progress: number) => void
): Promise<void>

// Load demo data
loadDemoData(
  progress?: (progress: number) => void
): Promise<void>

// Unload all data
unloadData(): Promise<void>

// Clear cache and unload data
clearCacheAndUnload(): Promise<void>
```

##### Query Operations

```typescript
// Query words
queryWords(term: string): Promise<WordQueryResult[]>

// Query synsets
querySynsets(term: string): Promise<SynsetQueryResult[]>

// Query senses
querySenses(term: string): Promise<SenseInfo[]>
```

##### Advanced Queries

```typescript
// Get senses by word ID or form
getSensesByWordIdOrForm(wordIdOrForm: string): Promise<SenseInfo[]>

// Get words by synset ID and language
getWordsBySynsetAndLanguage(synsetId: string, language: string): Promise<WordInfo[]>

// Get definitions by synset ID
getDefinitionsBySynsetId(synsetId: string): Promise<DefinitionInfo[]>

// Get synset by ID
getSynsetById(synsetId: string): Promise<SynsetQueryResult | undefined>

// Get words by ILI and language
getWordsByIliAndLanguage(ili: string, language: string): Promise<WordInfo[]>

// Get words by ILI and lexicon prefix
getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<WordInfo[]>

// Search words in lexicon
searchWordsInLexicon(term: string, lexicon: string, language?: string): Promise<WordQueryResult[]>
```

##### **Enhanced Lexicon Introspection and Analysis**

```typescript
// Resource introspection with REAL DATA
introspectLexicon(lexiconId: string): Promise<LexiconIntrospection>
introspectAllResources(): Promise<LexiconIntrospection[]>
detectResourceType(lexiconId: string): Promise<ResourceTypeInfo>
categorizeResources(): Promise<CategorizedResources>

// Cross-lingual analysis
analyzeCrossLingualCapabilities(): Promise<CrossLingualAnalysis>
getCrossLingualMappingCoverage(): Promise<MappingCoverage>

// Resource validation
validateResourceIntegrity(lexiconId: string): Promise<IntegrityReport>
checkResourceCompatibility(lexiconIds: string[]): Promise<CompatibilityReport>
```

#### Usage Examples

##### Basic Setup

```typescript
import { useWordNet } from 'wn-ts-web/react';

function WordNetComponent() {
  const { 
    loading, 
    error, 
    loadPackageData, 
    queryWords,
    statistics,
    introspectLexicon 
  } = useWordNet();

  // Component logic
}
```

##### Loading Packages

```typescript
const { loadPackageData } = useWordNet();

const handleLoad = async () => {
  try {
    await loadPackageData('oewn:2024', (progress) => {
      console.log(`Loading: ${Math.round(progress * 100)}%`);
    });
  } catch (error) {
    console.error('Failed to load package:', error);
  }
};
```

##### Querying Data

```typescript
const { queryWords, querySynsets } = useWordNet();

const handleQuery = async () => {
  try {
    const words = await queryWords('water');
    const synsets = await querySynsets('water');
    
    console.log('Words:', words);
    console.log('Synsets:', synsets);
  } catch (error) {
    console.error('Query failed:', error);
  }
};
```

##### **Enhanced Lexicon Introspection**

```typescript
const { introspectLexicon, introspectAllResources } = useWordNet();

const handleIntrospect = async () => {
  try {
    // Get comprehensive lexicon information with REAL DATA
    const info = await introspectLexicon('oewn:2024');
    console.log('Sense count:', info.senseCount); // 212,478 (real data!)
    console.log('ILI coverage:', info.iliCoverage); // Calculated percentage
    console.log('Has definitions:', info.hasDefinitions); // Verified from database
    
    // Get all resources overview
    const allResources = await introspectAllResources();
    console.log('Total resources:', allResources.length);
  } catch (error) {
    console.error('Introspection failed:', error);
  }
};
```

### Context Providers

#### `WordNetConfigProvider`

Provides configuration for WordNet workers.

```typescript
import { WordNetConfigProvider } from 'wn-ts-web/react';

function App() {
  return (
    <WordNetConfigProvider config={{
      enableWorkers: true,
      fallbackToMainThread: true
    }}>
      <YourApp />
    </WordNetConfigProvider>
  );
}
```

#### `WordNetProvider`

Provides WordNet services and state to the component tree.

```typescript
import { WordNetProvider } from 'wn-ts-web/react';

function App() {
  return (
    <WordNetConfigProvider config={{ enableWorkers: true }}>
      <WordNetProvider>
        <YourApp />
      </WordNetProvider>
    </WordNetConfigProvider>
  );
}
```

#### `useWordNetContext()`

Hook to consume WordNet context in components.

```typescript
import { useWordNetContext } from 'wn-ts-web/react';

function MyComponent() {
  const { loadPackageData, queryWords, introspectLexicon } = useWordNetContext();
  
  // Use context methods
}
```

## 🚀 **Worker API**

### `WordNetWorkerClient`

Main thread client for communicating with the WordNet worker.

#### Methods

```typescript
class WordNetWorkerClient {
  // Initialize the worker
  async initialize(workerUrl: string | URL): Promise<boolean>
  
  // Get worker status
  async getStatus(): Promise<any>
  
  // Load a package
  async loadPackage(packageId: string, progressCallback?: (progress: number, stage: string) => Promise<boolean>
  
  // Load demo data
  async loadDemoData(progressCallback?: (progress: number, stage: string) => Promise<boolean>
  
  // Query operations
  async queryWords(term: string, pos?: string): Promise<any[]>
  async querySynsets(term: string, pos?: string): Promise<any[]>
  async querySenses(term: string, pos?: string): Promise<any[]>
  
  // Data management
  async clearData(): Promise<boolean>
  async hasLoadedData(packageId?: string): Promise<boolean>
  
  // Advanced queries
  async getSensesByWordIdOrForm(wordIdOrForm: string): Promise<any[]>
  async getWordsBySynsetAndLanguage(synsetId: string, language: string): Promise<any[]>
  async getDefinitionsBySynsetId(synsetId: string): Promise<any[]>
  async getSynsetById(synsetId: string): Promise<any | undefined>
  async getWordsByIliAndLanguage(ili: string, language: string): Promise<any[]>
  async getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<any[]>
  async searchWordsInLexicon(term: string, lexicon: string, language?: string): Promise<any[]>
  
  // Testing
  async testMemoryQueries(): Promise<any>
  
  // Event management
  addEventListener<K extends keyof WordNetEventMap>(event: K, listener: WordNetEventListener<K>): void
  removeEventListener<K extends keyof WordNetEventMap>(event: K, listener: WordNetEventListener<K>): void
  
  // Cleanup
  dispose(): void
  
  // Properties
  get initialized(): boolean
  get lexicons(): LexiconInfo[]
  get currentStatistics(): any
  get lexiconCount(): number
}
```

#### Events

```typescript
interface WordNetEventMap {
  'initialized': { success: boolean; error?: string };
  'packageLoaded': { packageId: string; success: boolean; error?: string; lexiconInfo?: LexiconInfo };
  'packageLoadProgress': { packageId: string; progress: number; stage: string };
  'dataCleared': { success: boolean; error?: string };
  'error': { error: string; context: string };
  'statusUpdated': { status: any };
  'lexiconsChanged': { lexicons: LexiconInfo[]; added?: LexiconInfo[]; removed?: string[] };
}
```

#### Usage

```typescript
import { WordNetWorkerClient } from 'wn-ts-web';

const client = new WordNetWorkerClient();

// Initialize
await client.initialize('./wordnet-worker.mjs');

// Load package
await client.loadPackage('oewn:2024');

// Query data
const words = await client.queryWords('water');

// Listen for events
client.addEventListener('packageLoaded', (event) => {
  console.log('Package loaded:', event.packageId);
});

// Cleanup
client.dispose();
```

## 🏗️ **Core API**

### `WordNetOrchestrator`

High-level orchestrator for managing WordNet operations.

#### Methods

```typescript
class WordNetOrchestrator {
  // Initialization
  async initialize(sqlModule: Sqlite3Static, options?: { onProgress?: (progress: number, stage: string) => void }): Promise<void>
  
  // Lexicon management
  async loadLexicon(lexiconId: string, options?: LoadLexiconOptions): Promise<void>
  async ensureLexiconLoaded(lexiconId: string, options?: LoadLexiconOptions): Promise<void>
  async unloadLexicon(lexiconId: string): Promise<void>
  
  // Query operations
  async queryWords(term: string, pos?: PartOfSpeech, options?: QueryOptions): Promise<Word[]>
  async querySynsets(term: string, pos?: PartOfSpeech, options?: QueryOptions): Promise<Synset[]>
  async querySenses(term: string, pos?: PartOfSpeech, options?: QueryOptions): Promise<Sense[]>
  
  // Statistics
  async getLexiconStatistics(lexiconId?: string): Promise<any[]>
  async getOverallStatistics(): Promise<Statistics>
  
  // Updates
  async checkForUpdates(): Promise<UpdateCheckResult>
  
  // State management
  getLexiconStates(): Map<string, LexiconState>
  getLexiconState(lexiconId: string): LexiconState | undefined
  
  // Events
  on(event: string, callback: EventCallback): void
  off(event: string, callback: EventCallback): void
  
  // Cleanup
  async close(): Promise<void>
  async clearAllData(): Promise<void>
}
```

### **Enhanced Lexicon Introspection and Resource Analysis**

The orchestrator now provides comprehensive introspection capabilities with **real data** instead of placeholder values:

```typescript
class WordNetOrchestrator {
  // Resource introspection with REAL DATA
  async introspectLexicon(lexiconId: string): Promise<LexiconIntrospection>
  async introspectAllResources(): Promise<LexiconIntrospection[]>
  async detectResourceType(lexiconId: string): Promise<ResourceTypeInfo>
  async categorizeResources(): Promise<CategorizedResources>
  
  // Cross-lingual analysis
  async analyzeCrossLingualCapabilities(): Promise<CrossLingualAnalysis>
  async getCrossLingualMappingCoverage(): Promise<MappingCoverage>
  
  // Resource validation
  async validateResourceIntegrity(lexiconId: string): Promise<IntegrityReport>
  async checkResourceCompatibility(lexiconIds: string[]): Promise<CompatibilityReport>
}
```

### `WebWordnet`

Browser-compatible WordNet implementation.

#### Methods

```typescript
class WebWordnet extends BaseWordnet {
  // Initialization
  async initialize(sqlJsModule: Sqlite3Static): Promise<void>
  
  // Core queries
  async words(form?: string, pos?: PartOfSpeech): Promise<Word[]>
  async synsets(form: string, pos?: PartOfSpeech, ili?: string | ILI): Promise<Synset[]>
  async senses(form?: string, pos?: PartOfSpeech): Promise<Sense[]>
  
  // Individual entity queries
  async getWord(wordId: string): Promise<Word | undefined>
  async getSynset(synsetId: string): Promise<Synset | undefined>
  async getSense(senseId: string): Promise<Sense | undefined>
  async getIli(iliId: string): Promise<ILI | undefined>
  
  // Lexicon management
  async lexicons(): Promise<Lexicon[]>
  async expandedLexicons(): Promise<Lexicon[]>
  
  // Statistics
  async getStatistics(): Promise<Statistics>
  async getLexiconStatistics(lexiconId?: string): Promise<LexiconStatistics[]>
  async getPartOfSpeechDistribution(): Promise<Record<string, number>>
  
  // Data quality
  async getDataQualityMetrics(): Promise<DataQualityMetrics>
  async getSynsetSizeAnalysis(): Promise<SynsetSizeAnalysis>
  
  // Search
  async searchWords(searchTerm: string, options?: SearchOptions): Promise<SearchResult[]>
  
  // Export
  async exportData(): Promise<ExportData>
  exportDataBytes(): Uint8Array
  
  // Utility
  async hasLoadedLexicons(): Promise<boolean>
  async getQuickStatus(options?: { includeExpensive?: boolean }): Promise<QuickStatus>
  
  // Cleanup
  async close(): Promise<void>
  
  // Events
  on(event: string, callback: EventCallback): void
  off(event: string, callback: EventCallback): void
  removeAllListeners(event?: string): void
  listenerCount(event: string): number
}
```

## 📊 **Data Types**

### Core Types

```typescript
interface Word {
  id: string;
  lemma: string;
  pos: PartOfSpeech;
  language: string;
  lexicon: string;
}

interface Synset {
  id: string;
  ili?: string;
  pos: PartOfSpeech;
  language: string;
  lexicon: string;
  definitions: Definition[];
  words: Word[];
  relations: Relation[];
}

interface Sense {
  id: string;
  wordId: string;
  synsetId: string;
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}

interface Definition {
  id: string;
  synsetId: string;
  language: string;
  text: string;
  source?: string;
}

interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  source?: string;
}

type PartOfSpeech = 'n' | 'v' | 'a' | 'r' | 's' | 'c' | 'x' | 'u';
```

### **Enhanced Introspection Types**

```typescript
interface LexiconIntrospection {
  // Basic information
  id: string;
  label: string;
  language: string;
  version: string;
  type: 'lexicon' | 'ili';
  
  // Content statistics (REAL DATA, not placeholders)
  wordCount: number;           // e.g., 161,705 for OEWN 2024
  synsetCount: number;         // e.g., 120,630 for OEWN 2024
  senseCount: number;          // e.g., 212,478 for OEWN 2024 (was 0 before!)
  iliCount?: number;           // Only for ILI resources
  
  // Structural information (verified from database)
  hasDefinitions: boolean;     // Actually checked, not hardcoded
  hasRelations: boolean;       // Actually checked, not hardcoded
  hasILIMappings: boolean;     // Based on actual ILI data
  
  // Language-specific features
  supportedPartsOfSpeech: string[];  // Real POS with counts
  supportedLanguages: string[];
  
  // Data quality metrics (calculated from real data)
  iliCoverage?: number;        // Percentage of synsets with ILI mappings
  crossLingualLinks?: number;  // Number of cross-language connections
  
  // Metadata
  loadedAt: Date;
  lastUpdated?: Date;
  source: 'worker' | 'database';
}

interface ResourceTypeInfo {
  type: 'lexicon' | 'ili' | 'mixed';
  hasCrossLingualMappings: boolean;
  supportedLanguages: string[];
  primaryLanguage: string;
  mappingConfidence: number;
}

interface CategorizedResources {
  lexicons: LexiconIntrospection[];
  ilis: LexiconIntrospection[];
  mixed: LexiconIntrospection[];
  total: number;
}

interface CrossLingualAnalysis {
  // Language coverage
  supportedLanguages: string[];
  primaryLanguage: string;
  
  // Cross-lingual mapping coverage
  totalILIMappings: number;
  languagePairCoverage: Record<string, Record<string, number>>;
  
  // Concept coverage analysis
  conceptCoverage: {
    total: number;
    fullyMapped: number; // Available in all languages
    partiallyMapped: number; // Available in some languages
    unmapped: number; // Only available in one language
  };
  
  // Quality metrics
  mappingQuality: {
    averageConfidence: number;
    verifiedMappings: number;
    unverifiedMappings: number;
  };
}
```

## 🔧 **Configuration**

### Worker Configuration

```typescript
interface OrchestratorOptions {
  defaultLexicon?: string;
  autoCheckUpdates?: boolean;
  checkInterval?: number;
  maxConcurrentLoads?: number;
  enableCaching?: boolean;
  lexiconId?: string;
}
```

### Query Options

```typescript
interface QueryOptions {
  lexicons?: string[];
  language?: string;
  version?: string;
  includeUnloaded?: boolean;
}

interface LoadLexiconOptions {
  forceRedownload?: boolean;
  onProgress?: ProgressCallback;
  validateChecksum?: boolean;
}
```

## 🚨 **Error Handling**

### Error Types

```typescript
interface WordNetError {
  message: string;
  code?: string;
  context?: string;
  details?: any;
}
```

### Common Error Messages

- `"DataLoader not initialized"`: Worker or main thread not ready
- `"WordNet not initialized"`: Core WordNet instance not ready
- `"Package not found"`: Requested package doesn't exist
- `"Query failed"`: Database query operation failed
- `"Worker communication failed"`: Worker thread communication error

### Error Recovery

```typescript
const { loadPackageData } = useWordNet();

const retryLoad = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loadPackageData('oewn:2024');
      break;
    } catch (error) {
      if (error.message.includes('DataLoader not initialized')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
};
```

## 📚 **Examples**

### Complete Application Setup

```typescript
import React from 'react';
import { WordNetConfigProvider, WordNetProvider, useWordNet } from 'wn-ts-web/react';

function WordNetDemo() {
  const { 
    loading, 
    error, 
    loadPackageData, 
    queryWords,
    statistics,
    introspectLexicon 
  } = useWordNet();

  const handleLoad = async () => {
    try {
      await loadPackageData('oewn:2024');
    } catch (error) {
      console.error('Failed to load package:', error);
    }
  };

  const handleIntrospect = async () => {
    try {
      const info = await introspectLexicon('oewn:2024');
      console.log('Real sense count:', info.senseCount); // 212,478!
      console.log('ILI coverage:', info.iliCoverage);
    } catch (error) {
      console.error('Introspection failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleLoad}>Load Package</button>
      <button onClick={handleIntrospect}>Introspect Lexicon</button>
      {statistics && (
        <div>
          <h3>Statistics</h3>
          <p>Total Words: {statistics.totalWords}</p>
          <p>Total Synsets: {statistics.totalSynsets}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <WordNetConfigProvider config={{ enableWorkers: true }}>
      <WordNetProvider>
        <WordNetDemo />
      </WordNetProvider>
    </WordNetConfigProvider>
  );
}
```

### Advanced Usage with Progress Tracking

```typescript
function AdvancedWordNetDemo() {
  const { loadPackageData, queryWords, introspectLexicon } = useWordNet();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const handleLoadWithProgress = async () => {
    try {
      await loadPackageData('oewn:2024', (progress) => {
        setProgress(progress);
        setStage(`Loading: ${Math.round(progress * 100)}%`);
      });
      setStage('Complete!');
    } catch (error) {
      setStage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleLoadWithProgress}>Load with Progress</button>
      {stage && <p>{stage}</p>}
      {progress > 0 && progress < 1 && (
        <div>
          <progress value={progress} max={1} />
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}
    </div>
  );
}
```

## 🔍 **Debugging**

### Enable Debug Logging

```typescript
import { setGlobalLogLevel } from 'wn-ts-web';

setGlobalLogLevel('debug');
```

### Check Worker Status

```typescript
const { statistics, error } = useWordNet();

useEffect(() => {
  if (statistics) {
    console.log('Worker is ready:', statistics);
  }
  if (error) {
    console.error('Worker error:', error);
  }
}, [statistics, error]);
```

### Monitor Events

```typescript
const { getCacheInfo } = useWordNet();

useEffect(() => {
  const checkStatus = async () => {
    try {
      const cacheInfo = await getCacheInfo();
      console.log('Cache info:', cacheInfo);
    } catch (error) {
      console.error('Cache check failed:', error);
    }
  };
  
  checkStatus();
}, [getCacheInfo]);
```

---

**This API documentation is maintained alongside the codebase and should be updated as new features are added.**

**Status**: ✅ **Production Ready** with Enhanced Lexicon Introspection  
**Last Updated**: 2025-01-20
