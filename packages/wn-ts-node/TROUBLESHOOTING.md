# WordNet Dictionary Service - Troubleshooting Guide

This document records common errors and issues encountered while using `wn-ts-node`.

## Common Issues

### Issue #1: Empty Query Results Despite Successful Initialization

**Primary Problem**: WordNet database queries return 0 results despite successful initialization.

**Root Cause**: The `forms` table in the SQLite database is not being populated during the database import process, even though the `words` table contains data. The `words({ form: ... })` API method queries the `forms` table, which remains empty.

**Status**: ⚠️ **Known Issue** - May be a bug in certain versions of `wn-ts-node`

---

## Symptoms

### 1. No Query Results

**Symptoms**:
```javascript
const kernel = new NodeWordNetKernel('oewn:2024');
await kernel.initialize();
const words = await kernel.words({ form: 'test' });
console.log(words.length); // Returns 0
```

**What to check**:
- Service initialization completes successfully
- `kernel.initialize()` returns without errors
- Database file exists and has reasonable size (~187MB for English WordNet)
- But all queries return 0 results

---

### 2. Database Appears Empty

**Symptoms**:
- Test queries return 0 results
- Synsets count is 0
- No errors during initialization

**Investigation steps**:
```javascript
// Test basic queries
const words = await kernel.words({ form: 'the' });
const synsets = await kernel.synsets();
console.log('Words:', words.length);
console.log('Synsets:', synsets.length);
```

---

## Database Schema Investigation

### Expected Database State

```sql
-- Data counts (for English WordNet oewn:2024):
Words table: ~304,000+ entries
Forms table: ~300,000+ entries (should match or exceed words)
Synsets table: ~250,000+ entries
```

### Problem: Empty Forms Table

**Key Discovery**:
- The `words` table has data (304,802 entries)
- The `forms` table is essentially empty (only 1 entry)
- The `words()` API method queries the `forms` table, not the `words` table
- The `words` table uses `lemma` field, not `form` field

**Schema Details**:
```sql
-- words table structure:
- id (TEXT)
- lemma (TEXT)  -- This is where the actual word data is
- pos (TEXT)
- language (TEXT)
- lexicon (TEXT)

-- forms table structure:
- id (TEXT)
- word_id (TEXT)
- written_form (TEXT)  -- This should be populated but isn't
- script (TEXT)
- tag (TEXT)
```

### Diagnostic Queries

To check your database state, you can use SQLite directly:

```bash
# Open the database
sqlite3 ~/.wn_ts_data/wn.db

# Check table counts
SELECT COUNT(*) FROM words;
SELECT COUNT(*) FROM forms;
SELECT COUNT(*) FROM synsets;

# Check a specific word
SELECT * FROM words WHERE lemma = 'test' LIMIT 5;
SELECT * FROM forms WHERE written_form = 'test' LIMIT 5;
```

---

## Attempted Query Methods

```javascript
// Query by form (expected method)
const words = await kernel.words({ form: 'test' });
// Result: 0 entries if forms table is empty

// Query by lemma (alternative)
const words = await kernel.words({ lemma: 'test' });
// Result: May also return 0 if the query method doesn't support lemma

// Get all words (no filter)
const words = await kernel.words();
// Result: May return empty array if forms table is empty
```

---

## Database File Locations

**Default Location**:
```
Windows: C:\Users\<username>\.wn_ts_data\wn.db
Linux/Mac: ~/.wn_ts_data/wn.db
```

**Custom Location**:
You can configure a custom location using `config.dataDirectory`:
```javascript
import { config } from 'wn-ts-node';
config.dataDirectory = '/path/to/your/data/directory';
```

---

## Solutions and Workarounds

### Solution 1: Try Different Version

If you're experiencing empty forms table issues, try a different version:

```bash
# Try stable version
npm install wn-ts-node@0.7.2

# Or use latest
npm install wn-ts-node@latest
```

### Solution 2: Manual Forms Population

If the forms table is empty, you can manually populate it from the words table:

```sql
INSERT INTO forms (id, word_id, written_form, script, tag)
SELECT
  id || '-form' as id,
  id as word_id,
  lemma as written_form,
  'Latn' as script,
  NULL as tag
FROM words
WHERE NOT EXISTS (
  SELECT 1 FROM forms WHERE word_id = words.id
);
```

### Solution 3: Alternative Libraries

If issues persist, consider alternative WordNet libraries:

- `wordnet` (morungos) - Older but stable
- `node-wordnet` - Callback-based interface
- Direct SQLite access - Query the database directly

### Solution 4: Report the Bug

If you encounter this issue, please report it:

1. See [Bug Reporting Guide](./BUG_REPORTING.md) for instructions
2. Include:
   - Your `wn-ts-node` version
   - Database table counts (words, forms, synsets)
   - Example queries that fail
   - Database file size

---

## Configuration Issues

### Issue: Database in Wrong Location

**Problem**: Database appears in default location even when custom path is configured

**Solution**: Set `config.dataDirectory` before creating kernel instances:

```javascript
import { config, NodeWordNetKernel } from 'wn-ts-node';

// Set config BEFORE creating kernel
config.dataDirectory = '/your/custom/path';

const kernel = new NodeWordNetKernel('oewn:2024');
await kernel.initialize();
```

### Issue: Initialization Takes Too Long

**Problem**: `initialize()` hangs or takes very long

**Possible causes**:
1. First-time download of WordNet data
2. Network issues
3. Disk I/O issues

**Solutions**:
- Check network connection
- Ensure sufficient disk space
- Try downloading data separately first

---

## Diagnostic Checklist

When troubleshooting, check:

- [ ] Database file exists and has reasonable size (>100MB for English)
- [ ] `words` table has entries (should be 200,000+)
- [ ] `forms` table has entries (should match words table)
- [ ] `synsets` table has entries (should be 200,000+)
- [ ] `kernel.initialize()` completes without errors
- [ ] Test queries with common words like "test", "the", "run"
- [ ] Check `wn-ts-node` version (try 0.7.2 or latest)
- [ ] Verify `config.dataDirectory` is set correctly

---

## Getting Help

If you're still experiencing issues:

1. **Check existing issues**: https://github.com/fustilio/wordnet-playground/issues
2. **File a bug report**: See [BUG_REPORTING.md](./BUG_REPORTING.md)
3. **Include diagnostics**:
   - Package version
   - Database table counts
   - Example queries that fail
   - Any error messages

---

## Related Documentation

- [Bug Reporting Guide](./BUG_REPORTING.md) - How to report bugs
- [Main README](./README.md) - Package documentation
- [CHANGELOG](./CHANGELOG.md) - Version history and changes

---

**Last Updated**: 2026-01-03
