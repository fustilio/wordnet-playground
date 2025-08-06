# wn-ts-core TODO

## Immediate Priorities (Week 1)

### **Phase 1: Clean wn-ts-core (Environment-Agnostic)**

#### **High Priority**
- [ ] **Fix TypeScript compilation errors** - Remove Node.js-specific code from `config.ts`
- [ ] **Remove placeholder database** - Keep only interfaces in `db/database.ts`
- [ ] **Make BaseWordnet truly abstract** - Remove concrete implementations from `wordnet.ts`
- [ ] **Remove environment provider pattern** - Delete `interfaces/environment.ts`

#### **Medium Priority**
- [ ] **Clean up exports** - Ensure `index.ts` only exports agnostic APIs
- [ ] **Fix utility functions** - Make download, parsers, archive utilities environment-agnostic
- [ ] **Update types** - Ensure all types are properly defined and exported

#### **Low Priority**
- [ ] **Documentation updates** - Update README and API docs
- [ ] **Test cleanup** - Remove environment-specific tests

## Architecture Goals

### **Environment-Agnostic Core**
- [ ] No Node.js-specific imports or code
- [ ] No browser-specific imports or code
- [ ] Abstract interfaces only
- [ ] Pure TypeScript utilities

### **Clean Separation**
- [ ] Database interfaces only (no implementations)
- [ ] Abstract base classes only (no concrete implementations)
- [ ] Environment-agnostic utilities only
- [ ] Clear API boundaries

## Success Criteria

### **Phase 1 Success**
- [ ] wn-ts-core compiles without TypeScript errors
- [ ] wn-ts-core has no environment-specific code
- [ ] All interfaces are properly defined
- [ ] BaseWordnet is truly abstract
- [ ] All tests pass (for agnostic utilities only)

## Notes

- Priority is clean architecture over quick fixes
- Focus on making wn-ts-core truly environment-agnostic
- Environment-specific code should move to wn-ts-node and wn-ts-web
- Testing strategy must account for different environments 