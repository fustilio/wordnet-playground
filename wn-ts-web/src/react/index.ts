/**
 * React-specific exports for wn-ts-web
 * 
 * This module provides React hooks and components for using WordNet with workers.
 * It's kept separate from the main wn-ts-web exports to maintain framework-agnostic design.
 */

export { useWordNet } from './hooks';
export { WordNetProvider, useWordNetContext } from './contexts/WordNetContext';
export { WordNetConfigProvider, useWordNetConfig } from './contexts/WordNetConfigContext';

// New kernel-based architecture (recommended)
export { useWordNetKernel } from './hooks';
export { WordNetKernelProvider, useWordNetKernelContext } from './contexts/WordNetKernelContext';

// Export types
export type * from './types/index.js';

// Export utilities
export { getAvailableProjects } from './utils/project-list';
export type { ProjectInfo } from './utils/project-list';