# Dictionary Scoring Algorithm Improvements

## Problem

The original scoring algorithm prioritized synsets by the **number of synonyms** (member count), which led to incorrect results:

- ❌ "hot dog" (food) was included because it has 8 synonyms
- ❌ "dog" (the animal) was excluded because it has fewer synonyms
- ❌ Less common meanings were prioritized over common ones

## Solution

Implemented a new multi-factor scoring algorithm that prioritizes **common meanings** and **primary senses**:

### Scoring Factors

1. **Sense Position (Primary Factor)** - WordNet orders senses by frequency (sense 0 = most common)
   - Strong bonus for primary senses (sense 0, 1, 2)
   - Score: `1000 - (position * 100)` for primary senses

2. **Word Frequency** - Words appearing in fewer synsets are more specific/common
   - Score: `1000 / frequency` (inverse frequency)

3. **External Frequency Data** - Optional support for word frequency lists (e.g., A1-C2)
   - Score: `2000 / rank` if provided

4. **Base Form Preference** - Simple words over compounds
   - Bonus: `+50` for short words without spaces/hyphens

5. **Cross-Lingual Coverage** - Important for bilingual dictionaries
   - Bonus: `+100` per language

6. **Member Count Penalty** - Slight penalty for very large synsets (>10 members)
   - Penalty: `-20` for synsets with >10 members

## Performance Optimizations

### Progress Indicators
- Real-time progress with percentage, rate, and ETA
- Updates every 5,000 synsets during lemma pre-loading
- Updates every 500 words during sense ordering collection
- Shows time estimates: `Processed 5000/10000 (50%) | Rate: 100/s | ETA: 50s`

### Processing Optimizations
- Only processes candidate synsets (filtered by POS and language)
- Only queries sense ordering for ambiguous words (appearing in 2+ synsets)
- Chunked processing for better memory management
- Parallel processing of chunks where possible

## Expected Results

### Before (Old Algorithm)
- Scores: 20-30 (based on member count)
- "hot dog" included, "dog" (animal) excluded
- Less common meanings prioritized

### After (New Algorithm)
- Scores: 1000-5000+ (based on multiple factors)
- "dog" (animal) included and prioritized
- Common meanings prioritized over rare ones

## Testing

### Vitest Test Suites

1. **`dog-query.test.ts`** - Verifies "dog" query returns correct synsets
2. **`dictionary-generation.test.ts`** - Performance tests with time bounds
3. **`dictionary.test.ts`** - General dictionary structure tests

### Quick Test Script

```bash
# Test generation speed and progress indicators
pnpm test:generation-speed
```

### Performance Expectations

- **Small dictionary (500 synsets)**: < 10 minutes
- **English-Thai dictionary (1000 synsets)**: < 15 minutes
- **Progress indicators**: Should appear every few seconds

## Usage

### Basic Usage (No Changes Required)

```bash
pnpm generate-dict:force
```

### With External Frequency Data

```typescript
import { generateDictionary } from 'wn-serverless-dict';
import { createWordnet } from 'wn-ts-node';

const wordnet = await createWordnet();
const frequencyData = new Map([
  ['dog', 100],    // rank 100 = very common
  ['cat', 150],    // rank 150 = common
  // ... more words
]);

const dict = await generateDictionary(wordnet, {
  languages: ['en', 'th'],
  limit: 1000,
  pos: ['n', 'v', 'a'],
  wordFrequencyData: frequencyData
});
```

## Implementation Details

### Key Files Modified

- `packages/wn-serverless-dict/src/generators/index.ts` - Main scoring algorithm
- `packages/wn-serverless-dict/src/types/index.ts` - Added `WordFrequencyData` type

### Algorithm Flow

1. **Collect candidate synsets** - Filter by POS and language
2. **Pre-load lemmas** - Build frequency map and cache lemmas
3. **Collect sense ordering** - Only for ambiguous words (2+ synsets)
4. **Score ILI groups** - Using multi-factor algorithm
5. **Sort and filter** - Select top N by score

## Future Improvements

- [ ] Add caching for sense ordering queries
- [ ] Support for more external frequency data sources
- [ ] Configurable scoring weights
- [ ] Sampling strategy for very large datasets
- [ ] Parallel processing of sense ordering queries
