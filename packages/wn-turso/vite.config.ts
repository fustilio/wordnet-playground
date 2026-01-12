import { defineConfig } from 'vite';
import path from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: path.resolve(process.cwd(), 'src/index.ts'),
        config: path.resolve(process.cwd(), 'src/config.ts'),
        database: path.resolve(process.cwd(), 'src/database/index.ts'),
        adapters: path.resolve(process.cwd(), 'src/adapters/index.ts'),
        pipeline: path.resolve(process.cwd(), 'src/pipeline/index.ts'),
        'cli/index': path.resolve(process.cwd(), 'src/cli/index.ts'),
      },
      name: 'WnTurso',
      fileName: (format, entryName) => {
        return `${entryName}.${format === 'es' ? 'js' : 'cjs'}`;
      },
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node18',
    rollupOptions: {
      external: [
        // Node.js built-ins
        'fs',
        'fs/promises',
        'path',
        'os',
        'crypto',
        'stream',
        'stream/promises',
        'util',
        'url',
        'child_process',
        'zlib',
        'assert',
        // External dependencies that should remain external
        '@libsql/client',
        'kysely',
        // Note: wn-ts-core is NOT here - it gets bundled
      ],
      output: {
        globals: {
          '@libsql/client': 'LibsqlClient',
          kysely: 'Kysely',
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
    extensions: ['.ts', '.js'],
  },
  define: {
    __dirname: 'undefined',
    __filename: 'undefined',
    global: 'globalThis',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.e2e.test.ts',
        '**/*.e2e.test.tsx',
        '**/*.bench.ts',
        '**/*.bench.tsx',
        '**/test/**',
        '**/tests/**',
        '**/e2e/**',
        '**/bench/**',
      ],
      rollupTypes: false,
      bundledPackages: ['wn-ts-core'],
    }),
  ],
});
