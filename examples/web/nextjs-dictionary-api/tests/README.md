# Dictionary Tests

This directory contains Vitest test suites for the dictionary API.

## Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

## Test Files

- `dictionary.test.ts` - Tests dictionary file structure, loading, lookups, and translations

## Test Coverage

The tests verify:
- ✅ Dictionary files exist and are valid
- ✅ Dictionary modules load correctly
- ✅ Metadata is valid (synset count, word count, languages)
- ✅ Word lookups work correctly
- ✅ Translations work for language pairs
- ✅ No placeholder ILIs (like "in") are present
- ✅ All ILIs follow valid format (`i` + numbers)

## Note

Some tests may fail until dictionaries are regenerated with the latest fixes:
- Tests for placeholder ILI validation will pass after running `pnpm run generate-dict:force`
