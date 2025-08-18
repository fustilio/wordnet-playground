import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNet } from '../hooks/useWordNet';
import type { WordNetState } from '../hooks/useWordNet';
import { useWordNetConfig } from './WordNetConfigContext';

interface WordNetContextValue extends WordNetState {
  loadPackageData: (packageId: string, progress?: (progress: number) => void) => Promise<void>;
  loadDemoData: (progress?: (progress: number) => void) => Promise<void>;
  queryWords: (term: string) => Promise<unknown[]>;
  querySynsets: (term: string) => Promise<unknown[]>;
  querySenses: (term: string) => Promise<any[]>;
  unloadData: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  getLexiconInfo: (id?: string) => any[] | undefined;
  getCurrentLexicons: () => any[];
  testMemoryQueries: () => Promise<any>;
  // New helpers for bilingual flows
  getSensesByWordIdOrForm: (wordIdOrForm: string) => Promise<any[]>;
  getWordsBySynsetAndLanguage: (synsetId: string, language: string) => Promise<any[]>;
  getDefinitionsBySynsetId: (synsetId: string) => Promise<any[]>;
  getSynsetById: (synsetId: string) => Promise<any | undefined>;
  getWordsByIliAndLanguage: (ili: string, language: string) => Promise<any[]>;
  getWordsByIliAndLexiconPrefix: (ili: string, lexiconPrefix: string) => Promise<any[]>;
  searchWordsInLexicon: (term: string, lexicon: string, language?: string) => Promise<any[]>;
  // Data management
  clearCacheAndUnload: () => Promise<void>;
  getCacheInfo: () => Promise<any>;
}

const WordNetContext = createContext<WordNetContextValue | null>(null);

interface WordNetProviderProps {
  children: ReactNode;
}

export const WordNetProvider: React.FC<WordNetProviderProps> = ({ children }) => {
  const config = useWordNetConfig();
  const wordNetService = useWordNet(config);

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
