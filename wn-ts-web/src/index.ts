// src/index.ts
// Browser bundle entry point for wn-ts-web
// Re-export all public API from wn-ts

export * from 'wn-ts';
export { getIndex, getData } from './dataLoader';

// TODO: Add browser-specific logic or data loading here if needed 