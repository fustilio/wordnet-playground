import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNet } from '../hooks/useWordNet';
import type { WordNetState } from '../hooks/useWordNet';

interface WordNetContextValue extends WordNetState {
  loadPackageData: (packageId: string, progress?: (progress: number) => void) => Promise<void>;
  loadDemoData: (progress?: (progress: number) => void) => Promise<void>;
  queryWords: (term: string) => Promise<unknown[]>;
  querySynsets: (term: string) => Promise<unknown[]>;
  unloadData: () => Promise<void>;
  refreshPackages: () => Promise<void>;
}

const WordNetContext = createContext<WordNetContextValue | null>(null);

interface WordNetProviderProps {
  children: ReactNode;
}

export const WordNetProvider: React.FC<WordNetProviderProps> = ({ children }) => {
  const wordNetService = useWordNet();

  return (
    <WordNetContext.Provider value={wordNetService}>
      {children}
    </WordNetContext.Provider>
  );
};

export const useWordNetContext = (): WordNetContextValue => {
  const context = useContext(WordNetContext);
  if (!context) {
    throw new Error('useWordNetContext must be used within a WordNetProvider');
  }
  return context;
};
