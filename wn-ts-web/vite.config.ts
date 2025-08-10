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
      external: ["wn-ts-core", "@sqlite.org/sqlite-wasm"],
      output: {
        globals: {
          "wn-ts-core": "WnTsCore",
          "@sqlite.org/sqlite-wasm": "SqliteWasm",
        },
      },
    },
    minify: true,
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  plugins: [dts({
    insertTypesEntry: true,
  })],
});
