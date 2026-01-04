# Dictionary Generation Caching

## Overview

Dictionary generation is now **cached** to minimize processing time. The build process will skip dictionary generation if the output files already exist.

## How It Works

1. **Cache Check**: Before generating dictionaries, the system checks if output files exist
2. **Skip if Exists**: If files are present and valid, generation is skipped (instant)
3. **Force Regeneration**: Use `--force` flag to regenerate even if files exist

## Performance

### With Cache (Files Exist)
- **Time**: < 1 second (just file checks)
- **No WordNet initialization**
- **No data processing**
- **No file I/O**

### Without Cache (First Run)
- **Time**: 5-10 minutes (downloads and processes WordNet data)
- Downloads lexicons if needed
- Processes and generates dictionaries
- Saves output files

## Usage

### Normal Build (Uses Cache)
```bash
pnpm build
# or
pnpm dev
```

### Force Regeneration
```bash
pnpm run generate-dict:force
```

### Check Dictionary Status
```bash
pnpm run check-dicts
```

## Scripts

- `generate-dict` - Generate all dictionaries (cached)
- `generate-dict:base` - Generate base dictionary (cached)
- `generate-dict:pairs` - Generate language pair dictionaries (cached)
- `generate-dict:force` - Force regeneration of all dictionaries
- `check-dicts` - Verify all dictionary files exist

## Cache Behavior

The cache checks for:
- `serverless-dict.json` and `serverless-dict.js` (base dictionary)
- `dict-en-th.json` and `dict-en-th.js` (English-Thai)
- `dict-en-fr.json` and `dict-en-fr.js` (English-French)
- `dict-th-fr.json` and `dict-th-fr.js` (Thai-French)

If all files exist and are non-empty, generation is skipped.

## Benefits

✅ **Fast builds** - Subsequent builds are instant
✅ **CI/CD friendly** - Can commit dictionary files to git
✅ **Development speed** - No waiting for dictionary generation
✅ **Flexible** - Force regeneration when needed
