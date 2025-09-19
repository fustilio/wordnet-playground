import { defineConfig } from "vite";
import path from "node:path";
import dts from "vite-plugin-dts";
import { comlink } from "vite-plugin-comlink";

export default defineConfig({
  build: {
    lib: {
      entry: {
        "wn-ts-web": path.resolve(process.cwd(), "src/index.ts"),
        "wn-ts-web-react": path.resolve(process.cwd(), "src/react/index.ts"),
        "wordnet-worker": path.resolve(process.cwd(), "src/workers/wordnet-worker.ts"),
      },
      name: "WnTsWeb",
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "mjs" : "umd.cjs"}`,
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "@sqlite.org/sqlite-wasm", 
        "lzma",
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime"
      ],
      output: {
        globals: {
          "@sqlite.org/sqlite-wasm": "SqliteWasm",
          "react": "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "React",
          "react/jsx-dev-runtime": "React"
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
    exclude: ["@sqlite.org/sqlite-wasm", "pako"],
  },
  plugins: [
    comlink(),
    dts({
      insertTypesEntry: true,
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
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [comlink()],
  },
});
