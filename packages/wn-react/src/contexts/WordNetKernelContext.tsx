/**
 * WordNet Kernel Context - Advanced kernel-based WordNet functionality
 * 
 * This context provides access to the full WordNet kernel with plugin system.
 * Use this for advanced scenarios where you need direct kernel access.
 * 
 * For most use cases, prefer the simpler `WordNetProvider`.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNetKernel } from '../hooks/useWordNetKernel.js';
import type { UseWordNetKernelOptions, UseWordNetKernelReturn } from '../hooks/useWordNetKernel.js';

const WordNetKernelContext = createContext<UseWordNetKernelReturn | null>(null);

export interface WordNetKernelProviderProps extends UseWordNetKernelOptions {
  children: ReactNode;
}

export function WordNetKernelProvider({ 
  children, 
  ...options 
}: WordNetKernelProviderProps) {
  const wordNetKernelService = useWordNetKernel(options);

  return (
    <WordNetKernelContext.Provider value={wordNetKernelService}>
      {children}
    </WordNetKernelContext.Provider>
  );
}

export function useWordNetKernelContext(): UseWordNetKernelReturn {
  const context = useContext(WordNetKernelContext);
  
  if (!context) {
    throw new Error('useWordNetKernelContext must be used within a WordNetKernelProvider');
  }
  
  return context;
}
