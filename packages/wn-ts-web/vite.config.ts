import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.base.config.js";

export default defineConfig(
  mergeConfig(baseConfig, {
    mode: "production",
    build: {
      sourcemap: true, // Production build - with source maps, because we want people to be able to debug the code
      minify: true, // Production build - with minification
    },
  })
);
