/**
 * React-specific exports for wn-ts-web
 * 
 * This module provides React hooks and components for using WordNet with workers.
 * It's kept separate from the main wn-ts-web exports to maintain framework-agnostic design.
 */

export { useWordNet } from './hooks';
export { WordNetProvider, useWordNetContext } from './contexts/WordNetContext';
export { WordNetConfigProvider, useWordNetConfig } from './contexts/WordNetConfigContext';

// Export types
export type { WordNetState } from './hooks/useWordNet';
export type { WordNetConfig } from './contexts/WordNetConfigContext';

// Export utilities
export { getAvailableProjects } from './utils/project-list';
export type { ProjectInfo } from './utils/project-list';