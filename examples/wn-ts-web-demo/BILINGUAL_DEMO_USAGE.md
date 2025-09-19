# Bilingual Demo Usage Guide

## Overview

The Bilingual Dictionary demo demonstrates cross-lingual WordNet capabilities by finding semantic equivalents between languages using the Collaborative Interlingual Index (CILI).

## Current Loading Behavior

### ⚠️ Important: Manual Package Loading Required

The bilingual demo **does not automatically download** multilingual packages. This is by design to:
- Avoid large downloads without user consent
- Allow users to choose which languages they need
- Provide faster initial loading

### Package Requirements

The demo requires these packages for full functionality:

1. **English WordNet (`oewn:2024`)** ✅ - Loaded automatically as the base package
2. **French WordNet (`omw-fr:1.4`)** ❌ - Must be loaded manually
3. **Thai WordNet (`omw-th:1.4`)** ❌ - Must be loaded manually  
4. **CILI Index (`cili:1.0`)** ❌ - Must be loaded manually

## Step-by-Step Usage

### 1. Navigate to Bilingual Tab
- Open the demo application
- Click on the "Bilingual" tab

### 2. Load Required Packages
**You will see empty results until you load the required packages.**

Click one of these buttons to download multilingual data:
- **"Load Required"** - Downloads all missing packages automatically
- **"Ensure Data"** - Checks and loads missing packages for current language pair

### 3. Wait for Downloads
Package downloads can take 1-5 minutes depending on connection speed:
- French WordNet: ~5-15 MB compressed
- Thai WordNet: ~2-8 MB compressed  
- CILI Index: ~1-3 MB compressed

### 4. Verify Loading
Watch the console logs for:
```
📥 Downloading project: omw-fr:1.4
✅ Successfully loaded omw-fr:1.4
📥 Downloading project: omw-th:1.4  
✅ Successfully loaded omw-th:1.4
```

### 5. Test Searches
Once packages are loaded:
- Search for words like "water", "cat", "dog"
- You should see actual cross-lingual translations
- Results will show source → target language mappings

## Understanding the Interface

### Language Pair Selection
- **From**: Source language (English or French)
- **To**: Target language (French or Thai)

### Available Language Pairs
- English → French (en → fr)
- English → Thai (en → th)  
- French → Thai (fr → th) *if both packages loaded*

### Search Results Format
```
source_word → target_word (synset_id)
def (en): English definition
def (fr): French definition
```

## Debug Tools

The demo includes several debug buttons:

### "Check DB Tables"
- Shows what's actually in the database
- Useful for verifying if packages loaded correctly

### "Test Basic Queries"  
- Tests word search across all languages
- Shows which languages have data

### "Explore All Lexicons"
- Detailed analysis of loaded lexicon content
- Sample word listings per language

### "Run Diagnostics"
- System health checks
- ILI mapping verification

## Common Issues

### "No Results" Problem
**Symptoms**: Searches return 0 results even after "loading"
**Cause**: Packages not actually downloaded, only placeholder entries created
**Solution**: Click "Load Required" and wait for actual downloads

### Empty Lexicon Statistics  
**Symptoms**: Lexicons show `wordCount: 0, synsetCount: 0`
**Cause**: Package metadata created but data not downloaded
**Solution**: Use debug tools to verify, then reload packages

### Network/CORS Issues
**Symptoms**: Downloads fail or timeout
**Cause**: Network connectivity or proxy configuration
**Solution**: Check network connection, try refreshing

## Technical Notes

### How Cross-Lingual Mapping Works
1. Search for source word in source language lexicon
2. Extract ILI (Interlingual Index) from synset
3. Find synsets in target language with same ILI  
4. Return words from matching target synsets

### Lexicon ID Format
- Package IDs: `oewn:2024`, `omw-fr:1.4`
- Database lexicon IDs: `oewn`, `omw-fr`
- System automatically maps between these formats

### Data Persistence
- Downloaded packages persist in browser storage (OPFS)
- No need to re-download after closing/reopening browser
- Use "Clear Cache" to force re-download if needed

## Performance Expectations

### Initial Setup
- First-time package downloads: 2-10 minutes
- Subsequent loads from cache: 5-30 seconds

### Search Performance  
- English searches: Fast (161K+ words loaded)
- Multilingual searches: Fast after initial loading
- Cross-lingual mapping: 100-500ms per query

## Troubleshooting

If you encounter issues:

1. **Check console logs** for download/error messages
2. **Use debug tools** to verify data loading
3. **Clear cache** and reload if data seems corrupted
4. **Check network connectivity** for download issues

The key insight is that the demo **requires manual package loading** - it won't work properly until you explicitly download the multilingual packages.
