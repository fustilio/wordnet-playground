# wn-ts-web: Browser Distribution & Demo for wn-ts

## 🚧 Implementation Plan & Checklist

| Step | Description | Rationale | Status |
|------|-------------|-----------|--------|
| 1. Data Conversion Script | Complete the data conversion script in `wn-ts/tools/makeBrowserData.ts` to output browser-optimized WordNet data (JSON/JS modules) for all required resources. | Enables browser to load only what it needs, reduces bundle size, and follows the proven wordpos-web approach. | Pending |
| 2. Tool-Specific Tests | Add and maintain tests for browser tooling in `wn-ts/tools/tests/`, colocated for clarity and separation from core library tests. | Keeps tool tests close to the tool, clarifies their external/plugin nature, and avoids cluttering core test suite. | In Progress |
| 3. Dynamic Data Loader | Implement a dynamic data loader in `wn-ts-web` that loads WordNet data modules on demand in the browser. | Allows efficient, on-demand loading and mirrors the wordpos-web approach. | Complete |
| 4. API Parity | Ensure the browser build of wn-ts exposes a unified API matching the Node.js API, with any browser-specific differences clearly documented. | Guarantees a consistent developer experience. | Pending |
| 5. Documentation | Update this README and `wn-ts/README.md` to document the node-to-browser strategy, build pipeline, dynamic loading, usage, demo, and implementation checklist. | Ensures transparency and helps contributors track progress. | Ongoing |

> **Note:** Tool-specific tests are now colocated in `wn-ts/tools/tests/` to reflect their external/plugin nature and to keep the main test suite focused on the core library.

---

## 📦 Dynamic Data Loader for the Browser

The browser build of `wn-ts-web` supports dynamic, on-demand loading of WordNet data files. This is inspired by the `wordpos-web` approach and enables efficient use of memory and bandwidth in browser environments.

### How It Works
- **Data Files:** Browser-optimized JSON files (e.g., `index.noun.json`, `data.noun.json`) are placed in the `/data/` directory at build time (see the data conversion tool).
- **Loader API:** The following async functions are available:

```ts
import { getIndex, getData } from 'wn-ts-web';

// Load the noun index (lemma -> info)
const nounIndex = await getIndex('noun');

// Load the noun data (offset -> info)
const nounData = await getData('noun');
```

- **Caching:** Data is cached in memory after the first load for fast repeated access.
- **Integration:** These functions are exported from the main entry point and can be used in any browser app or demo.

### Directory Structure
```
wn-ts-web/
  data/
    index.noun.json
    data.noun.json
    ...
```

### Notes
- The `/data/` directory must be present and populated by the data conversion tool before running the browser app.
- The loader will throw if a file is missing or fetch fails.
- You can extend the loader to support additional POS or custom data files as needed.

---

## 🛠 Preparing Browser Data (Required Step)

Before running or building the browser demo, you must prepare browser-optimized data files using the CLI:

```sh
pnpm run build:data
```
This will invoke:
```
wn-cli browser prep --lexicon oewn --outDir ./data
```
- You can specify a different lexicon or output directory as needed.
- The output will be in `data/<lexicon>/index.<pos>.json` and `data/<lexicon>/data.<pos>.json`.

### Multilingual Support
- To prepare data for another lexicon/language:
  ```sh
  pnpm --filter wn-cli exec -- wn-cli browser prep --lexicon wn31 --outDir ./data
  ```
- The loader API:
  ```js
  import { getIndex, getData } from 'wn-ts-web';
  // English (default)
  const nounIndex = await getIndex('noun', 'oewn');
  // Another lexicon
  const nounIndex2 = await getIndex('noun', 'wn31');
  ```

---

`wn-ts-web` is the browser/web distribution and interactive demo for the [wn-ts](../wn-ts/README.md) TypeScript WordNet library. It enables full-featured WordNet access directly in the browser, leveraging the same API as the Node.js version.

## 🌐 Purpose
- **Web Demo:** Provides a static, interactive demo for exploring WordNet in the browser.
- **Browser Distribution:** Bundles the browser build of `wn-ts` and preprocessed WordNet data for easy deployment on static sites.
- **Reference Implementation:** Demonstrates how to use `wn-ts` in browser-based applications, with example HTML/JS usage.

## 🚀 Node-to-Browser Strategy
This project follows the dual-environment strategy pioneered by [wordpos](../wordpos/README.md) and [wordpos-web](../wordpos-web/README.md):

- **Unified Codebase:** The core `wn-ts` library is designed to work in both Node.js and browser environments, with environment-specific entry points.
- **Browser Data Preparation:** WordNet data is preprocessed into browser-usable formats (e.g., JSON or JS modules) and loaded dynamically in the browser.
- **API Parity:** The same API is exposed in both environments, so code and tests are portable.
- **Static Distribution:** This package bundles the browser build and data files for static hosting and demo purposes.

## 🛠️ Planned Approach
- **Build Pipeline:** A build process will convert WordNet data into browser-usable modules, similar to the approach in `wordpos-web`.
- **Demo UI:** An interactive web UI will showcase the capabilities of `wn-ts` in the browser.
- **Comprehensive Testing:** All APIs will be tested for parity and correctness in both Node.js and browser builds.

## ✨ Example Usage
```html
<!-- Example: Using wn-ts-web in the browser -->
<script src="dist/wn-ts.min.js"></script>
<script>
  // Assume Wordnet is available globally
  const wn = new Wordnet('oewn');
  wn.synsets('run', 'v').then(synsets => {
    document.body.innerText = synsets[0]?.definitions[0]?.text;
  });
</script>
```

## 📦 Next Steps for Contributors
- Implement the browser build and data pipeline for `wn-ts`.
- Develop the interactive demo UI for `wn-ts-web`.
- Ensure all APIs are available and tested in both environments.
- See [wordpos-web](../wordpos-web/README.md) for a working example of this strategy.

---

For more details on the node-to-browser strategy, see the [main workspace README](../README.md) and the [wn-ts README](../wn-ts/README.md).

