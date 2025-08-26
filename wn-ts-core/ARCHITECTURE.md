# wn-ts Architecture & Naming Conventions

## Overview

This document describes the architectural patterns and naming conventions used throughout the wn-ts ecosystem to ensure consistency and maintainability.

## Naming Convention Strategy

### 1. Database Layer (SQLite)
- **Format**: snake_case
- **Rationale**: Follows SQLite and general database naming conventions
- **Examples**: `synset_id`, `word_id`, `lexicon_id`

### 2. TypeScript Interfaces (Application Layer)
- **Format**: camelCase
- **Rationale**: Follows JavaScript/TypeScript naming conventions
- **Examples**: `synsetId`, `wordId`, `lexiconId`

### 3. Data Transformation
- **Location**: Query service transformation methods
- **Purpose**: Convert between database format (snake_case) and application format (camelCase)
- **Pattern**: `transform*Record` methods in query services

## Data Flow Architecture

```
XML/LMF → Parser → TypeScript Objects → Database → Query Results → TypeScript Objects
  ↓           ↓           ↓              ↓           ↓              ↓
synset   → synsetId   → synsetId    → synset_id → synset_id   → synsetId
```

### Detailed Flow

1. **XML/LMF Parsing**: Extract attributes (e.g., `synset="i12345"`)
2. **Parser Layer**: Create TypeScript objects with camelCase properties (e.g., `synsetId: "i12345"`)
3. **Database Insertion**: Transform to snake_case for storage (e.g., `synset_id: "i12345"`)
4. **Database Query**: Retrieve with snake_case column names
5. **Data Transformation**: Convert back to camelCase for application use
6. **Application Layer**: Use camelCase properties consistently

## Implementation Examples

### Database Schema (snake_case)
```sql
CREATE TABLE senses (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  synset_id TEXT NOT NULL,
  source TEXT,
  -- ... other columns
);
```

### TypeScript Interface (camelCase)
```typescript
export interface Sense {
  id: string;
  word: string;
  synsetId: string;  // Note: camelCase
  source?: string;
  // ... other properties
}
```

### Data Transformation Method
```typescript
protected transformSenseRecord(record: any): Sense {
  return {
    id: record.id,
    word: record.word_id,        // snake_case → camelCase
    synsetId: record.synset_id,  // snake_case → camelCase
    source: record.source,
    // ... other transformations
  };
}
```

## Benefits of This Approach

1. **Database Standards**: Follows SQLite naming conventions
2. **JavaScript Standards**: Follows TypeScript/JavaScript naming conventions
3. **Clear Boundaries**: Transformation happens at well-defined interfaces
4. **Maintainability**: Easy to understand where conversions occur
5. **Consistency**: Uniform naming within each layer

## When to Apply This Pattern

### ✅ Apply This Pattern To:
- Database column names → TypeScript interface properties
- API request/response objects
- Configuration files that bridge different systems
- Any data that crosses layer boundaries

### ❌ Don't Apply This Pattern To:
- Internal method names within a layer
- Local variables
- Constants that don't cross boundaries
- Database queries (use snake_case consistently)

## Migration Guidelines

When updating existing code:

1. **Database Layer**: Keep snake_case, update schema if needed
2. **TypeScript Interfaces**: Update to use camelCase
3. **Transformation Methods**: Ensure they convert between the two formats
4. **Tests**: Update test data to match the new conventions
5. **Documentation**: Update any relevant documentation

## Common Transformation Patterns

### Basic Property Mapping
```typescript
// Database record → TypeScript object
{
  id: record.id,
  wordId: record.word_id,
  synsetId: record.synset_id,
  // ...
}
```

### Nested Object Transformation
```typescript
// Handle nested objects that also need transformation
{
  id: record.id,
  word: await this.transformWordRecord(record.word),
  // ...
}
```

### Array Transformation
```typescript
// Transform arrays of records
return records.map(record => this.transformRecord(record));
```

## Testing Considerations

When writing tests:

1. **Database Tests**: Use snake_case column names
2. **Interface Tests**: Use camelCase property names
3. **Integration Tests**: Verify transformation works end-to-end
4. **Mock Data**: Ensure mock data follows the correct conventions

## Troubleshooting

### Common Issues

1. **Property Not Found**: Check if transformation method is missing
2. **Type Mismatch**: Verify interface matches transformed data
3. **Database Errors**: Ensure column names use snake_case
4. **Runtime Errors**: Check if transformation is being called

### Debugging Steps

1. Check the transformation method exists
2. Verify database column names are correct
3. Ensure TypeScript interfaces match transformed data
4. Add logging to transformation methods if needed

## Future Considerations

- **Automation**: Consider generating transformation methods
- **Validation**: Add runtime validation for transformed data
- **Performance**: Monitor transformation overhead in high-throughput scenarios
- **Tooling**: Use linting rules to enforce naming conventions
