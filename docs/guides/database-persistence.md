# Database Persistence Guide

## 🚀 Quick Start

The wn-ts ecosystem provides a **simple, intuitive API** for database persistence with excellent TypeScript support and developer experience.

### One Function, All Options

```typescript
import { createWordnet } from 'wn-ts-node';

// 🎯 Default persistent storage (recommended)
const wordnet = createWordnet('oewn:2024');
await wordnet.initialize();

// 🧠 In-memory database (perfect for testing)
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// 📁 Custom database location
const wordnet = createWordnet('oewn:2024', { 
  filename: '/path/to/my/wordnet.db' 
});

// 🔄 With automatic backups
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }
});
```

## 📋 Configuration Options

### Database Modes

```typescript
type DatabaseMode = 
  | 'persistent'    // Store in file system (default)
  | 'memory'        // In-memory only
  | 'temp';         // Temporary file (deleted on exit)
```

### Complete Configuration

```typescript
interface NodeWordnetConfig {
  // 🗄️ Database Storage
  mode?: DatabaseMode;           // Storage mode (default: 'persistent')
  filename?: string;             // Database file path
  
  // 🔄 Migrations & Backups
  migrations?: {
    enabled?: boolean;           // Enable migrations (default: true)
    backup?: boolean;            // Backup before migrations (default: false)
  };
  
  // ⚙️ Database Options
  forceRecreate?: boolean;       // Force recreation
  readonly?: boolean;            // Read-only mode
  verbose?: boolean;             // Verbose logging
  timeout?: number;              // Connection timeout
  
  // 🔍 Query Options
  strategy?: QueryStrategy;      // Query strategy
  // ... other WordNet options
}
```

## 🎯 Usage Examples

### 1. Production Setup (Recommended)
```typescript
import { createWordnet } from 'wn-ts-node';

// ✅ Default persistent storage with automatic migrations
const wordnet = createWordnet('oewn:2024');
await wordnet.initialize();

// ✅ With backup enabled for safety
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }
});
```

### 2. Development & Testing
```typescript
// 🧪 In-memory database (no files, perfect for tests)
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// 🗂️ Custom location for development
const wordnet = createWordnet('oewn:2024', {
  filename: './dev-wordnet.db',
  verbose: true  // See SQL queries
});

// 🔄 Fresh start every time
const wordnet = createWordnet('oewn:2024', {
  mode: 'memory',
  forceRecreate: true
});
```

### 3. Advanced Scenarios
```typescript
// 📦 Multiple lexicons
const wordnet = createWordnet(['oewn:2024', 'omw-en:1.4']);

// 🔒 Read-only mode
const wordnet = createWordnet('oewn:2024', {
  readonly: true
});

// 🎛️ Full control
const wordnet = createWordnet('oewn:2024', {
  filename: '/custom/path/wordnet.db',
  mode: 'persistent',
  migrations: {
    enabled: true,
    backup: true
  },
  forceRecreate: false,
  verbose: true,
  strategy: 'fuzzy'
});
```

### 4. Complete Working Examples

#### **Basic Word Search**
```typescript
import { createWordnet } from 'wn-ts-node';

async function searchWords(term: string) {
  const wordnet = createWordnet('oewn:2024');
  await wordnet.initialize();
  
  try {
    const words = await wordnet.words({ form: term });
    console.log('Found words:', words);
    
    // Get synsets for each word
    for (const word of words) {
      const synsets = await wordnet.synsets({ wordId: word.id });
      console.log(`Synsets for "${word.form}":`, synsets);
    }
  } finally {
    await wordnet.close();
  }
}

// Usage
await searchWords('cat');
```

#### **Database Statistics**
```typescript
import { createWordnet } from 'wn-ts-node';

async function getDatabaseStats() {
  const wordnet = createWordnet('oewn:2024');
  await wordnet.initialize();
  
  try {
    const stats = await wordnet.getStatistics();
    console.log('Database Statistics:', {
      totalWords: stats.totalWords,
      totalSynsets: stats.totalSynsets,
      totalSenses: stats.totalSenses,
      languages: stats.languages,
      partsOfSpeech: stats.partsOfSpeech
    });
  } finally {
    await wordnet.close();
  }
}

// Usage
await getDatabaseStats();
```

#### **Testing with In-Memory Database**
```typescript
import { createWordnet } from 'wn-ts-node';

async function testWordNet() {
  // Use in-memory database for testing
  const wordnet = createWordnet('oewn:2024', { mode: 'memory' });
  await wordnet.initialize();
  
  try {
    // Test word search
    const words = await wordnet.words({ form: 'test' });
    console.assert(words.length > 0, 'Should find words');
    
    // Test synset lookup
    const synsets = await wordnet.synsets({ wordId: words[0].id });
    console.assert(synsets.length > 0, 'Should find synsets');
    
    console.log('✅ All tests passed!');
  } finally {
    await wordnet.close();
  }
}

// Usage
await testWordNet();
```

#### **REST API Server**
```typescript
import express from 'express';
import { createWordnet } from 'wn-ts-node';

const app = express();
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true }  // Enable backups for production
});

// Initialize database
await wordnet.initialize();

app.get('/api/words/:term', async (req, res) => {
  try {
    const words = await wordnet.words({ form: req.params.term });
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/synsets/:wordId', async (req, res) => {
  try {
    const synsets = await wordnet.synsets({ wordId: req.params.wordId });
    res.json(synsets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('WordNet API server running on port 3000');
});
```

#### **CLI Tool**
```typescript
import { Command } from 'commander';
import { createWordnet } from 'wn-ts-node';

const program = new Command();

program
  .command('search <term>')
  .option('-m, --mode <mode>', 'Database mode', 'persistent')
  .option('-f, --filename <path>', 'Database filename')
  .action(async (term, options) => {
    const wordnet = createWordnet('oewn:2024', {
      mode: options.mode,
      filename: options.filename
    });
    
    await wordnet.initialize();
    
    try {
      const words = await wordnet.words({ form: term });
      console.log(JSON.stringify(words, null, 2));
    } finally {
      await wordnet.close();
    }
  });

program
  .command('stats')
  .action(async () => {
    const wordnet = createWordnet('oewn:2024');
    await wordnet.initialize();
    
    try {
      const stats = await wordnet.getStatistics();
      console.log(JSON.stringify(stats, null, 2));
    } finally {
      await wordnet.close();
    }
  });

program.parse();
```

#### **Batch Processing with Custom Database**
```typescript
import { createWordnet } from 'wn-ts-node';
import fs from 'fs/promises';

async function processWordList(wordList: string[]) {
  // Use temporary database for batch processing
  const wordnet = createWordnet('oewn:2024', {
    filename: './temp-batch.db',
    mode: 'temp',
    verbose: true
  });
  
  await wordnet.initialize();
  
  try {
    const results = [];
    
    for (const word of wordList) {
      const words = await wordnet.words({ form: word });
      const synsets = words.length > 0 ? 
        await wordnet.synsets({ wordId: words[0].id }) : [];
      
      results.push({
        input: word,
        found: words.length > 0,
        wordCount: words.length,
        synsetCount: synsets.length
      });
    }
    
    // Save results
    await fs.writeFile('results.json', JSON.stringify(results, null, 2));
    console.log('Batch processing complete!');
    
  } finally {
    await wordnet.close();
  }
}

// Usage
await processWordList(['cat', 'dog', 'bird', 'fish']);
```

## 🔧 Schema Migration System

### ✅ Automatic & Safe

The migration system is **fully automated** and **safe**:

- **Zero Configuration**: Works out of the box
- **Automatic Detection**: Checks for missing columns
- **Safe Execution**: Only adds missing columns, never removes data
- **Error Handling**: Graceful fallback if migration fails
- **Backup Support**: Optional pre-migration backups

### How It Works

1. **Startup**: Database initializes normally
2. **Detection**: System checks for missing columns
3. **Migration**: Adds missing columns if needed
4. **Backup**: Optional backup before changes
5. **Ready**: Database is ready to use

### Migration History

- **v0.7.2**: Added `requires` and `metadata` JSON columns
- **Future**: Easy to extend for new schema changes

## Migration System Details

### How It Works

1. **Schema Detection**: Uses Kysely introspection to check existing table structure
2. **Column Addition**: Adds missing columns (e.g., `requires`, `metadata` as JSON)
3. **Safe Execution**: Only runs if columns are actually missing
4. **Error Handling**: Logs warnings but doesn't fail the initialization

### Supported Migrations

- **requires column**: Adds JSON column for lexicon requirements
- **metadata column**: Adds JSON column for lexicon metadata

### Backup System

When `migrations.backup: true`:
- Creates timestamped backup files: `database.db.backup.2024-01-15T10-30-45-123Z`
- Only backs up if database file exists
- Graceful error handling if backup fails

## Best Practices

### 1. Production Environments
```typescript
const wordnet = createWordnet('oewn:2024', {
  migrations: { backup: true },  // Enable backups
  verbose: false                 // Disable verbose logging
});
```

### 2. Development/Testing
```typescript
// For testing - use in-memory database
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });

// For development - use custom path with backups
const wordnet = createWordnet('oewn:2024', {
  filename: './dev-wordnet.db',
  migrations: { backup: true },
  verbose: true
});
```

### 3. CI/CD Environments
```typescript
// Use in-memory for CI to avoid file system dependencies
const wordnet = createWordnet('oewn:2024', { mode: 'memory' });
```

## Web Environment

The Web environment uses OPFS (Origin Private File System) for persistence:

- **Automatic Persistence**: Data persists across browser sessions
- **Same Migration System**: Uses the same centralized migration logic
- **No File Paths**: Persistence is handled by the browser automatically

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check database permissions and disk space
2. **Backup Fails**: Ensure write permissions to database directory
3. **Schema Conflicts**: Use `forceRecreate: true` to start fresh

### Debug Mode

```typescript
const wordnet = createWordnet('oewn:2024', {
  filename: '/path/to/db',
  verbose: true,                    // Enable SQL logging
  migrations: { 
    enabled: true,                  // See migration logs
    backup: true                    // See backup logs
  }
});
```

## Migration History

### v0.7.2 - Current
- Added `requires` column as JSON for lexicon requirements
- Added `metadata` column as JSON for lexicon metadata
- Enhanced persistence options with backup support

## API Reference

### Main Function

- `createWordnet(lexicon, options)` - Single function for all database modes

### Configuration Options

- `mode: DatabaseMode` - Storage mode ('persistent', 'memory', 'temp')
- `filename: string` - Database file path (required for persistent mode)
- `migrations.enabled: boolean` - Enable/disable automatic migrations
- `migrations.backup: boolean` - Enable/disable pre-migration backups
- `forceRecreate: boolean` - Force database recreation
- `verbose: boolean` - Enable verbose logging
