import { defineConfig } from "vite";
import path from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        "index": path.resolve(process.cwd(), "src/index.ts"),
        "config": path.resolve(process.cwd(), "src/config.ts"),
        "database": path.resolve(process.cwd(), "src/database/index.ts"),
        "lmf": path.resolve(process.cwd(), "src/lmf.ts"),
        "taxonomy": path.resolve(process.cwd(), "src/taxonomy.ts"),
        "validation": path.resolve(process.cwd(), "src/validation.ts"),
        "wordnet": path.resolve(process.cwd(), "src/wordnet.ts"),
        "wordnet-core": path.resolve(process.cwd(), "src/wordnet-core.ts"),
        "wordnet-kernel": path.resolve(process.cwd(), "src/wordnet-kernel.ts"),
      },
      name: "WnTsNode",
      fileName: (format, entryName) => {
        return `${entryName}.${format === "es" ? "js" : "cjs"}`;
      },
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "node18",
    rollupOptions: {
      external: [
        // Node.js built-ins - these should be external for Node.js
        "fs", "fs/promises", "path", "os", "crypto", "stream", "stream/promises", 
        "util", "url", "child_process", "zlib", "assert",
        // External dependencies that should remain external
        "better-sqlite3",
        "kysely", 
        "lzma-native",
        "sax",
        "smol-toml",
        "tar-stream"
      ],
      output: {
        globals: {
          "better-sqlite3": "BetterSqlite3",
          "kysely": "Kysely",
          "lzma-native": "LzmaNative",
          "sax": "Sax",
          "smol-toml": "SmolToml",
          "tar-stream": "TarStream"
        },
      },
      onwarn(warning, warn) {
        // Suppress warnings about externalized modules
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  define: {
    __dirname: "undefined",
    __filename: "undefined",
    global: "globalThis",
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: "dist",
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx", 
        "**/*.e2e.test.ts",
        "**/*.e2e.test.tsx",
        "**/*.bench.ts",
        "**/*.bench.tsx",
        "**/test/**",
        "**/tests/**",
        "**/e2e/**",
        "**/bench/**"
      ],
      rollupTypes: false,
      bundledPackages: ['wn-ts-core'],
    }),
  ],
});
