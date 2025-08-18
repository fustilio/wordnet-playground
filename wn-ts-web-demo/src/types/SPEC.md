# Types Directory Specification

## 1. Overview

The `types/` directory contains TypeScript type definitions, interfaces, and type utilities used throughout the application. This directory provides centralized type management to ensure consistency and type safety across all components and modules.

## 2. Implementation Status

- [x] **Core Types**: Basic type definitions and interfaces
- [x] **Storage Types**: Storage and database type definitions
- [x] **Type Organization**: Organized type structure
- [x] **Type Safety**: Full TypeScript type safety
- [x] **Unified Architecture**: Single source of truth for all types

## 3. Current Directory Structure

```
types/
├── index.ts               # Main type exports (re-exports from wordnet.ts)
├── wordnet.ts             # All WordNet and application type definitions
└── SPEC.md                # This specification file
```

## 4. Type Categories

### 4.1 Core WordNet Types (`wordnet.ts`)

**Purpose**: Define all WordNet-related types and interfaces

**Key Types**:
- **LexiconInfo**: Lexicon information (extends wn-ts-web types)
- **WordNetStatistics**: Statistics interface (extends wn-ts-web types)
- **WordQueryResult**: Word query results
- **SynsetQueryResult**: Synset query results
- **SenseInfo**: Sense information
- **DefinitionInfo**: Definition information

**Type Definitions**:
```typescript
// Extends wn-ts-web types for consistency
export interface LexiconInfo extends WnTsLexiconInfo {
  // Only add demo-specific extensions
}

export interface WordNetStatistics extends DatabaseStatistics {
  source: 'Database' | 'Worker' | 'MainThread';
}
```

### 4.2 Storage and Database Types

**Purpose**: Define types for storage and database operations

**Key Types**:
- **StorageInfo**: Storage system information
- **DatabaseInfo**: Database metadata and information

**Type Definitions**:
```typescript
export interface StorageInfo {
  total: number;           // Total storage capacity
  used: number;            // Used storage space
  available: number;       // Available storage space
  databases: DatabaseInfo[]; // Database information
}
```

### 4.3 Event and Status Types

**Purpose**: Define types for event handling and status updates

**Key Types**:
- **WorkerStatus**: Worker operation status
- **LexiconsChangedEvent**: Lexicon change events
- **PackageLoadedEvent**: Package loading events
- **StatusUpdatedEvent**: Status update events

### 4.4 Utility and Compatibility Types

**Purpose**: Provide utility types and backward compatibility

**Key Types**:
- **WordNetStats**: Type alias for wn-ts-web statistics
- **StatisticsBundle**: Bundled statistics information
- **WordNetTotals**: Legacy interface for backward compatibility

## 5. Type Design Patterns

### 5.1 Interface Design
- **Single Responsibility**: Each interface has one clear purpose
- **Composition**: Use composition over inheritance
- **Extensibility**: Design for future extension
- **Documentation**: Clear documentation for all types

### 5.2 Type Safety
- **Strict Types**: Use strict type definitions
- **Generic Support**: Support for generic types
- **Union Types**: Use union types for flexibility
- **Discriminated Unions**: Use discriminated unions for complex types

### 5.3 Type Organization
- **Logical Grouping**: Group related types together
- **Consistent Naming**: Use consistent naming conventions
- **Clear Hierarchy**: Establish clear type hierarchies
- **Reusability**: Design types for reuse

## 6. Type Standards

### 6.1 Naming Conventions
- **Interfaces**: PascalCase with descriptive names
- **Types**: PascalCase for complex types, camelCase for simple types
- **Generics**: Single uppercase letters for simple generics
- **Constants**: UPPER_SNAKE_CASE for constants

### 6.2 Documentation Standards
- **JSDoc Comments**: Document all public types
- **Examples**: Provide usage examples
- **Constraints**: Document type constraints
- **Relationships**: Document type relationships

### 6.3 Type Safety Standards
- **Strict Mode**: Use strict TypeScript mode
- **No Any**: Avoid `any` type usage
- **Type Guards**: Implement proper type guards
- **Validation**: Runtime type validation where needed

## 7. Type Integration

### 7.1 Component Integration
- **Props Types**: Define component prop types
- **State Types**: Define component state types
- **Event Types**: Define event handler types
- **Context Types**: Define context types

### 7.2 Hook Integration
- **Return Types**: Define hook return types
- **Parameter Types**: Define hook parameter types
- **State Types**: Define hook state types
- **Effect Types**: Define effect types

### 7.3 Service Integration
- **API Types**: Define API response types
- **Service Types**: Define service interface types
- **Data Types**: Define data structure types
- **Error Types**: Define error types

## 8. Type Testing

### 8.1 Type Validation
- **Runtime Validation**: Validate types at runtime
- **Type Guards**: Implement proper type guards
- **Error Handling**: Handle type validation errors
- **Fallback Types**: Provide fallback types

### 8.2 Type Coverage
- **Type Coverage**: Ensure comprehensive type coverage
- **Edge Cases**: Test type edge cases
- **Integration**: Test type integration
- **Performance**: Test type performance impact

## 9. Architecture Principles

### 9.1 Single Source of Truth
- **Centralized Types**: All types defined in `wordnet.ts`
- **No Duplication**: Avoid type duplication across files
- **Clear Exports**: Single export point through `index.ts`

### 9.2 wn-ts-web Integration
- **Extend Don't Redefine**: Extend wn-ts-web types when possible
- **Consistent Interfaces**: Maintain consistency with wn-ts-web APIs
- **Type Compatibility**: Ensure type compatibility across layers

### 9.3 SOLID Principles
- **Single Responsibility**: Each type has one clear purpose
- **Open/Closed**: Types are open for extension, closed for modification
- **Liskov Substitution**: Subtypes are substitutable for base types
- **Interface Segregation**: Keep interfaces focused and minimal
- **Dependency Inversion**: Depend on abstractions, not concretions

## 10. Future Enhancements

- [ ] **Type Generation**: Automatic type generation from schemas
- [ ] **Type Validation**: Runtime type validation system
- [ ] **Type Migration**: Type migration tools
- [ ] **Type Analysis**: Type analysis and optimization tools
- [ ] **Type Visualization**: Type visualization tools
- **Type Testing**: Automated type testing

## 11. Dependencies

### 11.1 Internal Dependencies
- **Hooks**: Types from custom hooks
- **Components**: Types from React components
- **Services**: Types from service implementations
- **Utilities**: Types from utility functions

### 11.2 External Dependencies
- **TypeScript**: TypeScript language and compiler
- **React**: React type definitions
- **wn-ts-web**: Core WordNet types and interfaces

## 12. Performance Considerations

### 12.1 Type Compilation
- **Compilation Time**: Minimize compilation time
- **Bundle Size**: Minimize bundle size impact
- **Runtime Performance**: Minimize runtime performance impact
- **Memory Usage**: Minimize memory usage

### 12.2 Type Optimization
- **Type Inference**: Use type inference where possible
- **Type Caching**: Cache type information
- **Lazy Types**: Use lazy type loading
- **Type Pruning**: Remove unused types

## 13. Security Considerations

### 13.1 Type Security
- **Input Validation**: Validate type inputs
- **Type Sanitization**: Sanitize type data
- **Access Control**: Implement type access control
- **Error Handling**: Secure error handling

### 13.2 Data Protection
- **Sensitive Data**: Protect sensitive data types
- **Data Validation**: Validate data types
- **Input Sanitization**: Sanitize input types
- **Output Encoding**: Encode output types

## 14. Accessibility Considerations

### 14.1 Type Accessibility
- **Screen Reader Support**: Support screen readers
- **Keyboard Navigation**: Support keyboard navigation
- **Focus Management**: Manage focus properly
- **ARIA Support**: Support ARIA attributes

### 14.2 User Experience
- **Clear Types**: Clear and understandable types
- **Error Messages**: Clear error messages
- **Help Text**: Provide help text for complex types
- **Examples**: Provide usage examples
