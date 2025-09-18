# CILI Dependency Clarification

## 🎯 Key Correction

You correctly pointed out that **CILI (Conceptual Interlingual Index) is the default and necessary component** that powers the translation plugin, not just an optional enhancement.

## ✅ Updated Understanding

### CILI is Required for Cross-Lingual Operations

- **CILI is the default** - it's not optional, it's the standard way cross-lingual operations work
- **CILI powers the translation plugin** - without CILI, translation functionality cannot work
- **CILI must be installed** - it's a prerequisite for any cross-lingual similarity comparisons
- **ILI mappings come from CILI** - the ILI identifiers that link synsets across languages are provided by CILI

### Updated Error Messages

The cross-lingual similarity method now correctly states:

```typescript
throw new Error(
  'Cross-lingual similarity requires CILI (Conceptual Interlingual Index) to be installed ' +
  'and ILI mappings for both synsets. CILI is the default and necessary component that ' +
  'powers the translation plugin.'
);
```

### Updated Documentation

All documentation now correctly reflects that:
- CILI is the **default and necessary** component
- CILI **powers the translation plugin**
- Cross-lingual operations **require CILI to be installed**
- ILI mappings come from **CILI, not just any ILI source**

## 🔧 Implementation Impact

### Similarity Methods
- Cross-lingual similarity methods now properly reference CILI as the required component
- Error messages clearly indicate CILI is necessary, not optional
- Documentation emphasizes CILI as the standard approach

### Translation Plugin
- The translation plugin depends on CILI for its core functionality
- Cross-lingual similarity methods work in conjunction with the translation plugin
- Both require CILI to be installed and properly configured

### User Experience
- Clear error messages when CILI is not available
- Proper guidance that CILI is the standard way to enable cross-lingual operations
- No confusion about whether CILI is optional or required

## 📚 Updated Examples

All examples now correctly show:
- CILI as the required component for cross-lingual operations
- Proper error handling when CILI is not available
- Clear indication that CILI is the default approach

## 🎉 Result

The implementation now correctly reflects that:
1. **CILI is the default and necessary component** for cross-lingual operations
2. **CILI powers the translation plugin** - it's not optional
3. **Cross-lingual similarity requires CILI** to be installed
4. **Error messages are accurate** about CILI being required, not optional

Thank you for the correction! This ensures the implementation accurately reflects the architecture where CILI is the standard, default, and necessary component for enabling cross-lingual functionality.
