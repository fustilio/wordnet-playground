# CILI Optional Clarification

## 🎯 Corrected Understanding

You correctly clarified that:
- **CILI is optional** - users can work with just English without needing CILI
- **CILI is only required for the translation plugin** - which enables multilingual functionality
- **English-only users don't need CILI** - they can use similarity methods within the same lexicon
- **Multilingual users need CILI** - to enable cross-lingual operations

## ✅ Updated Implementation

### Use Cases

1. **English-Only Users**:
   - Don't need CILI installed
   - Can use all similarity methods within the same lexicon
   - Can compare English synsets without any cross-lingual functionality

2. **Multilingual Users**:
   - Need CILI installed for the translation plugin
   - Can use cross-lingual similarity methods
   - Can compare synsets across different languages

### Updated Error Messages

The cross-lingual similarity method now correctly states:

```typescript
throw new Error(
  'Cross-lingual similarity requires CILI (Conceptual Interlingual Index) to be installed ' +
  'and ILI mappings for both synsets. CILI is optional but required for the translation plugin ' +
  'and cross-lingual operations. For English-only similarity, use same-lexicon methods.'
);
```

### Updated Documentation

All documentation now correctly reflects that:
- CILI is **optional** for English-only use cases
- CILI is **required for the translation plugin** and multilingual operations
- English-only users can use similarity methods without CILI
- Cross-lingual operations require CILI to be installed

## 🔧 Implementation Impact

### Similarity Methods
- Same-lexicon similarity works without CILI
- Cross-lingual similarity requires CILI (optional but needed for multilingual)
- Clear error messages guide users to appropriate methods

### Translation Plugin
- The translation plugin requires CILI for its core functionality
- Cross-lingual similarity methods work in conjunction with the translation plugin
- Both require CILI only when doing multilingual operations

### User Experience
- English-only users can work without CILI
- Clear guidance when CILI is needed vs. optional
- Proper error messages that don't assume CILI is always required

## 📚 Updated Examples

All examples now correctly show:
- CILI as optional for English-only operations
- CILI as required only for translation plugin and multilingual operations
- Clear distinction between same-lexicon and cross-lingual use cases

## 🎉 Result

The implementation now correctly reflects that:
1. **CILI is optional** - English-only users don't need it
2. **CILI is required for translation plugin** - only for multilingual functionality
3. **Same-lexicon similarity works without CILI** - no cross-lingual operations needed
4. **Cross-lingual similarity requires CILI** - but only when doing multilingual work

Thank you for the important clarification! This ensures the implementation accurately reflects the architecture where CILI is optional for English-only use cases but required for the translation plugin and multilingual operations.
