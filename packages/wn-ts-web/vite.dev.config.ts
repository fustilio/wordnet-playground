import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.base.config.js";

export default defineConfig(
  mergeConfig(baseConfig, {
    mode: "development",
    build: {
      sourcemap: true, // Always include source maps in development
      minify: false, // Never minify in development
    },
  })
);
