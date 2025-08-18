# WordNet TypeScript Web Demo

An interactive demo for exploring the WordNet API in the browser using SQLite WASM and OPFS.

## 🚀 Features

- **Interactive WordNet Exploration** - Search words, synsets, and explore relationships
- **Multi-language Support** - English, French, Thai, and more
- **Real-time Statistics** - Live database statistics and integrity checks
- **Advanced Data Management** - Backup, restore, and cache management
- **Developer Tools** - Built-in debug console and performance monitoring
- **Responsive Design** - Works on desktop and mobile devices

## 📚 Documentation

- **[Logger Documentation](./src/LOGGER_README.md)** - Super simple & powerful logging system
- **[Component Specifications](./src/components/SPEC.md)** - Detailed component documentation
- **[Hooks Documentation](./src/hooks/SPEC.md)** - Custom React hooks guide
- **[Utils Documentation](./src/utils/SPEC.md)** - Utility functions reference

## 🧵 Using Web Workers with `wn-ts-web`

This demo runs `wn-ts-web` inside a dedicated Web Worker to keep SQLite/OPFS and heavy processing off the main thread. We use `vite-plugin-comlink` for ergonomic worker RPC.

- Worker implementation: `src/workers/wordnetWorker.ts`
- Hook integration: `src/hooks/useWordNet.ts`, `src/hooks/useWordNetWorker.ts`
- Vite setup: `vite.config.mjs` (includes Comlink plugin and COOP/COEP headers for OPFS)

### Quick example (Comlink worker)

```ts
// Create Comlink-backed worker (plugin provides ComlinkWorker)
const worker = new ComlinkWorker(new URL('./src/workers/wordnetWorker.ts', import.meta.url));

// Initialize and run queries without blocking the UI
await worker.initializeWordNet();
const results = await worker.querySynsets('joy');
console.log(results);
```

### Vite configuration (excerpt)

```js
// vite.config.mjs
import comlink from 'vite-plugin-comlink';

export default defineConfig({
  plugins: [comlink(), react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
    format: 'es',
    plugins: () => [comlink()],
  },
});
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Logging System

The demo includes a powerful logging system that makes debugging and monitoring super simple:

```typescript
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('MyComponent');

// Simple logging
logger.log('Button clicked', { buttonId: 'save' });

// Success/failure
logger.success('Data loaded', { recordCount: 150 });
logger.fail('API call failed', error);

// Operations with timing
logger.start('loading data');
logger.step('connecting to server');
logger.end('loading data', { totalRecords: 1000 });
```

See [Logger Documentation](./src/LOGGER_README.md) for complete usage guide.

## 🏗️ Architecture

- **React 19** - Modern React with hooks and context
- **TypeScript** - Full type safety
- **SQLite WASM** - Client-side database
- **OPFS** - Persistent file storage
- **Web Workers** - Background processing
- **Tailwind CSS** - Utility-first styling

## 📁 Project Structure

```
src/
├── app/                 # Main application components
├── components/          # Reusable UI components
│   ├── demos/          # Demo implementations
│   ├── developer-tools/ # Debug and monitoring tools
│   ├── features/       # Feature-specific components
│   ├── shared/         # Common UI components
│   ├── ui/             # Basic UI elements
│   ├── visualizations/ # Data visualization components
│   └── widgets/        # Status and control widgets
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Core libraries and utilities
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── workers/            # Web Worker implementations
├── logger.ts           # Super simple logging system
└── LOGGER_README.md    # Comprehensive logger documentation
```

## 🎯 Usage Examples

### Basic Word Search

```typescript
const { queryWords } = useWordNetContext();

const handleSearch = async (term: string) => {
  const results = await queryWords(term);
  console.log('Search results:', results);
};
```

### Loading WordNet Data

```typescript
const { loadPackageData } = useWordNetContext();

const handleLoadData = async () => {
  await loadPackageData('oewn:2024');
};
```

## 🔧 Configuration

### Environment Variables

- `LOG_LEVEL` - Set global logging level (trace, debug, info, warn, error, silent)
- `VITE_LOG_LEVEL` - Alternative way to set log level in Vite

### Logging Levels

Control application verbosity:

```typescript
import { setGlobalLogLevel } from 'utils/logger';

// Development - show everything
setGlobalLogLevel('debug');

// Production - show only warnings and errors
setGlobalLogLevel('warn');

// Silent mode - no logging
setGlobalLogLevel('silent');
```

## 🧪 Testing

```bash
# Run Cypress tests
pnpm test:cypress

# Run specific test suite
pnpm test:cypress:local

# Open Cypress UI
pnpm cypress:open
```

## 📦 Building

```bash
# Build WordNet index
pnpm index:build

# Generate lexicon
pnpm lexicon:generate

# Build application
pnpm build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WordNet** - Princeton University's lexical database
- **SQLite** - Embedded database engine
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework

---

**Happy WordNet Exploring! 🎉**
