import { defineConfig } from "vite";
import path from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: { "wn-ts-web": path.resolve(process.cwd(), "src/index.ts") },
      name: "WnTsWeb",
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "mjs" : "umd.cjs"}`,
      formats: ["es", "umd"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["wn-ts-core", "@sqlite.org/sqlite-wasm", 'lzma'],
      output: {
        globals: {
          "wn-ts-core": "WnTsCore",
          "@sqlite.org/sqlite-wasm": "SqliteWasm",
        },
      },
      onwarn(warning, warn) {
        // Suppress warnings about externalized modules
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  define: {
    __dirname: "undefined",
    __filename: "undefined",
    global: "globalThis",
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm", "pako"]
  },
  plugins: [dts({
    insertTypesEntry: true,
  })],
});
