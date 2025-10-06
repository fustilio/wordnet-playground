/**
 * WordNet React - React bindings for WordNet TypeScript
 *
 * A modern React integration for WordNet with hooks, providers, and components.
 *
 * @version 1.0.0
 * @example
 * ```typescript
 * import { useWordNet } from 'wn-react';
 *
 * function App() {
 *   const { search, results, loading } = useWordNet();
 *
 *   return (
 *     <div>
 *       <input onChange={e => search(e.target.value)} />
 *       {loading ? 'Loading...' : results.map(r => <div>{r.definition}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
/**
 * Main WordNet hook - provides all WordNet functionality
 *
 * @example
 * ```typescript
 * import { useWordNet } from 'wn-react';
 *
 * function App() {
 *   const { search, results, loading, error } = useWordNet('oewn:2024');
 *
 *   return (
 *     <div>
 *       <input onChange={e => search(e.target.value)} />
 *       {loading && <div>Loading...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       {results.map(r => <div key={r.id}>{r.definition}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export { useWordNet } from './hooks/useWordNet.js';
/**
 * Default export - same as useWordNet
 * Enables: import useWordNet from 'wn-react';
 */
export { useWordNet as default } from './hooks/useWordNet.js';
/**
 * Simple search hook - just search functionality
 *
 * @example
 * ```typescript
 * import { useSearch } from 'wn-react';
 *
 * function SearchComponent() {
 *   const { search, results, loading } = useSearch('oewn:2024');
 *
 *   return (
 *     <div>
 *       <input onChange={e => search(e.target.value)} />
 *       {loading ? 'Searching...' : results.map(r => <div>{r.word}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export { useSearch } from './hooks/useSearch.js';
/**
 * Definitions hook - get word definitions
 *
 * @example
 * ```typescript
 * import { useDefinitions } from 'wn-react';
 *
 * function DefinitionComponent() {
 *   const { getDefinitions, definitions, loading } = useDefinitions('oewn:2024');
 *
 *   return (
 *     <div>
 *       <button onClick={() => getDefinitions('computer')}>
 *         Get Definitions
 *       </button>
 *       {loading ? 'Loading...' : definitions.map(d => <div>{d.text}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export { useDefinitions } from './hooks/useDefinitions.js';
/**
 * Relations hook - get word relations (hypernyms, hyponyms, etc.)
 *
 * @example
 * ```typescript
 * import { useRelations } from 'wn-react';
 *
 * function RelationsComponent() {
 *   const { getHypernyms, hypernyms, loading } = useRelations('oewn:2024');
 *
 *   return (
 *     <div>
 *       <button onClick={() => getHypernyms('car')}>
 *         Get Hypernyms
 *       </button>
 *       {loading ? 'Loading...' : hypernyms.map(h => <div>{h.word}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export { useRelations } from './hooks/useRelations.js';
/**
 * WordNet provider - provides WordNet context to child components
 *
 * @example
 * ```typescript
 * import { WordNetProvider } from 'wn-react';
 *
 * function App() {
 *   return (
 *     <WordNetProvider lexicon="oewn:2024">
 *       <SearchComponent />
 *       <DefinitionComponent />
 *     </WordNetProvider>
 *   );
 * }
 * ```
 */
export { WordNetProvider } from './providers/WordNetProvider.js';
/**
 * WordNet context hook - access WordNet context
 *
 * @example
 * ```typescript
 * import { useWordNetContext } from 'wn-react';
 *
 * function ChildComponent() {
 *   const { search, results } = useWordNetContext();
 *   // Use WordNet functionality
 * }
 * ```
 */
export { useWordNetContext } from './providers/WordNetProvider.js';
/**
 * WordNet kernel provider - provides advanced kernel functionality
 *
 * @example
 * ```typescript
 * import { WordNetKernelProvider } from 'wn-react';
 *
 * function App() {
 *   return (
 *     <WordNetKernelProvider lexicon="oewn:2024" plugins={['relations', 'similarity']}>
 *       <AdvancedComponent />
 *     </WordNetKernelProvider>
 *   );
 * }
 * ```
 */
export { WordNetKernelProvider, useWordNetKernelContext } from './contexts/WordNetKernelContext.js';
/**
 * WordNet config provider - provides configuration context
 *
 * @example
 * ```typescript
 * import { WordNetConfigProvider } from 'wn-react';
 *
 * function App() {
 *   return (
 *     <WordNetConfigProvider config={{ storage: 'opfs', cache: true }}>
 *       <WordNetProvider>
 *         <SearchComponent />
 *       </WordNetProvider>
 *     </WordNetConfigProvider>
 *   );
 * }
 * ```
 */
export { WordNetConfigProvider, useWordNetConfig } from './contexts/WordNetConfigContext.js';
/**
 * Search input component - ready-to-use search input
 *
 * @example
 * ```typescript
 * import { SearchInput } from 'wn-react';
 *
 * function App() {
 *   return (
 *     <WordNetProvider lexicon="oewn:2024">
 *       <SearchInput placeholder="Search for a word..." />
 *     </WordNetProvider>
 *   );
 * }
 * ```
 */
export { SearchInput } from './components/SearchInput.js';
/**
 * Results list component - displays search results
 *
 * @example
 * ```typescript
 * import { ResultsList } from 'wn-react';
 *
 * function App() {
 *   return (
 *     <WordNetProvider lexicon="oewn:2024">
 *       <SearchInput />
 *       <ResultsList />
 *     </WordNetProvider>
 *   );
 * }
 * ```
 */
export { ResultsList } from './components/ResultsList.js';
export type { UseWordNetReturn, UseSearchReturn, UseDefinitionsReturn, UseRelationsReturn, WordNetProviderProps, WordNetContextValue, SearchInputProps, ResultsListProps, Word, Sense, Synset, Lexicon, ILI, PartOfSpeech, SearchResult, DefinitionResult, TranslationResult, } from './types/index.js';
export declare const version = "1.0.0";
//# sourceMappingURL=index.d.ts.map