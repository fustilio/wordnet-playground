# SQLite in the Browser: sql.js vs @sqlite.org/sqlite-wasm

This document explains the differences between the two SQLite WebAssembly implementations and our migration strategy.

## 🔍 **Key Differences**

### **sql.js (Legacy)**
- **Source**: Community-maintained port of SQLite to WebAssembly
- **API**: Traditional SQL.js API with `Database` class
- **OPFS Support**: Limited, requires manual integration
- **Bundle Size**: ~1.2MB (includes full SQLite engine)
- **Maturity**: Well-established, widely used
- **Performance**: Good, but not optimized for modern browsers

### **@sqlite.org/sqlite-wasm (Modern)**
- **Source**: Official SQLite project WebAssembly build
- **API**: Modern API with better browser integration
- **OPFS Support**: Native OPFS support with `sqlite3_wasm_vfs`
- **Bundle Size**: ~800KB (more optimized)
- **Maturity**: Official SQLite project, actively maintained
- **Performance**: Optimized for modern browsers and OPFS

## 🏗️ **Architecture Benefits**

### **Your Current Setup is Perfect!**

```json
// wn-ts-web/package.json
{
  "peerDependencies": {
    "@sqlite.org/sqlite-wasm": "catalog:",
    "sql.js": "catalog:"
  }
}

// wn-ts-web-demo/package.json  
{
  "dependencies": {
    "@sqlite.org/sqlite-wasm": "catalog:",
    "sql.js": "catalog:",
    "wn-ts-web": "workspace:*"
  }
}
```

**Benefits of this approach:**
1. **Explicit Client Passing**: Demo initializes SQL module and passes it to `wn-ts-web`
2. **Flexibility**: Can use either sql.js or sqlite-wasm
3. **OPFS Support**: Native OPFS integration with sqlite-wasm
4. **Bundle Optimization**: Only include the SQL module you need

## 🚀 **Migration Strategy**

### **Phase 1: Dual Support (Current)**
- Support both sql.js and @sqlite.org/sqlite-wasm
- Demo uses sqlite-wasm for better OPFS support
- Fallback to sql.js if needed

### **Phase 2: sqlite-wasm Primary**
- Make sqlite-wasm the default
- Keep sql.js as fallback for compatibility
- Optimize for OPFS features

### **Phase 3: sqlite-wasm Only**
- Remove sql.js dependency
- Full OPFS integration
- Modern browser optimization

## 🔧 **Implementation Details**

### **SQL Module Detection**

```typescript
// Support both sql.js and @sqlite.org/sqlite-wasm
type SQLJsDatabase = {
  Database: new (data?: Uint8Array) => {
    exec: (sql: string) => void;
    export: () => Uint8Array;
    close: () => void;
  };
};

type SQLiteWasmDatabase = {
  Database: new (data?: Uint8Array) => {
    exec: (sql: string) => void;
    export: () => Uint8Array;
    close: () => void;
  };
  // Additional OPFS support
  opfs?: {
    Vfs: new () => any;
    registerVfs: (vfs: any) => void;
  };
};

type SQLModule = SQLJsDatabase | SQLiteWasmDatabase;
```

### **OPFS Integration**

```typescript
// Check if we have OPFS support (sqlite-wasm)
if ('opfs' in sqlModule && sqlModule.opfs) {
  try {
    // Register OPFS VFS for persistent storage
    const vfs = new sqlModule.opfs.Vfs();
    sqlModule.opfs.registerVfs(vfs);
    this.useOPFS = true;
    console.log('✅ OPFS support enabled for persistent storage');
  } catch (error) {
    console.warn('⚠️ OPFS not available, falling back to in-memory storage');
  }
}
```

### **Initialization Pattern**

```typescript
// Demo initializes SQL module
const sqlite3 = await import('@sqlite.org/sqlite-wasm');
const SQL = await sqlite3.default({
  locateFile: (file: string) => `https://sqlite.org/wasm/${file}`
});

// Pass to wn-ts-web
const wordnet = await createWebWordnet({
  sqlJsModule: SQL
});
```

## 📊 **Performance Comparison**

| Feature | sql.js | @sqlite.org/sqlite-wasm |
|---------|--------|-------------------------|
| **Bundle Size** | ~1.2MB | ~800KB |
| **OPFS Support** | Manual | Native |
| **Browser Optimization** | Good | Excellent |
| **Memory Usage** | Higher | Lower |
| **Startup Time** | Slower | Faster |
| **Query Performance** | Good | Better |

## 🎯 **Recommendations**

### **For New Projects**
- Use `@sqlite.org/sqlite-wasm` as primary
- Leverage native OPFS support
- Enjoy smaller bundle size and better performance

### **For Existing Projects**
- Migrate gradually with dual support
- Test OPFS features with sqlite-wasm
- Keep sql.js as fallback during transition

### **For Production**
- Use sqlite-wasm for modern browsers
- Implement feature detection for OPFS
- Provide fallback for older browsers

## 🔄 **Migration Steps**

1. **Add sqlite-wasm dependency**
   ```bash
   pnpm add @sqlite.org/sqlite-wasm
   ```

2. **Update initialization**
   ```typescript
   // Old: sql.js
   const sqlJs = await import('sql.js');
   const SQL = await sqlJs.default({...});
   
   // New: sqlite-wasm
   const sqlite3 = await import('@sqlite.org/sqlite-wasm');
   const SQL = await sqlite3.default({...});
   ```

3. **Enable OPFS features**
   ```typescript
   // Automatic OPFS detection and registration
   if ('opfs' in SQL && SQL.opfs) {
     const vfs = new SQL.opfs.Vfs();
     SQL.opfs.registerVfs(vfs);
   }
   ```

4. **Test and optimize**
   - Verify OPFS persistence
   - Check performance improvements
   - Ensure compatibility

## 🎉 **Benefits of Migration**

1. **Better Performance**: Smaller bundle, faster startup
2. **Native OPFS**: Persistent storage without manual work
3. **Official Support**: Backed by SQLite project
4. **Future-Proof**: Modern browser optimization
5. **Explicit Architecture**: Clean separation of concerns

Your architecture with explicit client passing and peer dependencies is exactly the right approach for this migration! 