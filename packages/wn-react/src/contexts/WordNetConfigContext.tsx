/**
 * WordNet Config Context - Configuration management for WordNet
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface WordNetConfig {
  workerUrl?: string;
  enableWorkers?: boolean;
  fallbackToMainThread?: boolean;
  storage?: 'opfs' | 'indexeddb' | 'memory';
  cache?: boolean;
}

const defaultConfig: WordNetConfig = {
  enableWorkers: true,
  fallbackToMainThread: true,
  storage: 'opfs',
  cache: true,
};

const WordNetConfigContext = createContext<WordNetConfig>(defaultConfig);

export interface WordNetConfigProviderProps {
  children: ReactNode;
  config?: Partial<WordNetConfig>;
}

export function WordNetConfigProvider({ 
  children, 
  config = {} 
}: WordNetConfigProviderProps) {
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  return (
    <WordNetConfigContext.Provider value={mergedConfig}>
      {children}
    </WordNetConfigContext.Provider>
  );
}

export function useWordNetConfig(): WordNetConfig {
  const context = useContext(WordNetConfigContext);
  
  if (!context) {
    throw new Error('useWordNetConfig must be used within a WordNetConfigProvider');
  }
  
  return context;
}
