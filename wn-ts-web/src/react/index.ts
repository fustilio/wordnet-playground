/**
 * React-specific exports for wn-ts-web
 * 
 * This module provides React hooks and components for using WordNet with workers.
 * It's kept separate from the main wn-ts-web exports to maintain framework-agnostic design.
 */

export { useWordNet, usePackageStatus, useCacheInfo } from './react-hooks';
export type { WordNetState, UseWordNetOptions, QueryResult, ProgressCallback } from './react-hooks';
