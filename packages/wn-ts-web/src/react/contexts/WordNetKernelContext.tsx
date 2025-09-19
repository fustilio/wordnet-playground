import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNetKernel } from '../hooks/useWordNetKernel';

// Use the same return type as useWordNetKernel hook
type WordNetKernelContextValue = ReturnType<typeof useWordNetKernel>;

const WordNetKernelContext = createContext<WordNetKernelContextValue | null>(null);

interface WordNetKernelProviderProps {
  children: ReactNode;
  lexicon?: string | string[];
  options?: any;
}

export const WordNetKernelProvider: React.FC<WordNetKernelProviderProps> = ({ 
  children, 
  lexicon, 
  options 
}) => {
  const wordNetKernelService = useWordNetKernel({ lexicon, options });

  return (
    <WordNetKernelContext.Provider value={wordNetKernelService}>
      {children}
    </WordNetKernelContext.Provider>
  );
};

export const useWordNetKernelContext = (): WordNetKernelContextValue => {
  const context = useContext(WordNetKernelContext);
  if (!context) {
    throw new Error('useWordNetKernelContext must be used within a WordNetKernelProvider');
  }
  return context;
};


