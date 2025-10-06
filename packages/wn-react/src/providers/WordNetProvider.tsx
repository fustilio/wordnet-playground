/**
 * WordNet provider - provides WordNet context to child components
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNet } from '../hooks/useWordNet.js';
import type { UseWordNetReturn, UseWordNetOptions } from '../hooks/useWordNet.js';

export interface WordNetProviderProps extends UseWordNetOptions {
  children: ReactNode;
}

export interface WordNetContextValue extends UseWordNetReturn {}

const WordNetContext = createContext<WordNetContextValue | null>(null);

export function WordNetProvider({ children, ...options }: WordNetProviderProps) {
  const wordnetValue = useWordNet(options);

  return (
    <WordNetContext.Provider value={wordnetValue}>
      {children}
    </WordNetContext.Provider>
  );
}

export function useWordNetContext(): WordNetContextValue {
  const context = useContext(WordNetContext);
  
  if (!context) {
    throw new Error('useWordNetContext must be used within a WordNetProvider');
  }
  
  return context;
}
