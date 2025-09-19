import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface WordNetConfig {
  workerUrl?: string;
  enableWorkers?: boolean;
  fallbackToMainThread?: boolean;
}

const defaultConfig: WordNetConfig = {
  enableWorkers: true,
  fallbackToMainThread: true,
};

const WordNetConfigContext = createContext<WordNetConfig>(defaultConfig);

interface WordNetConfigProviderProps {
  children: ReactNode;
  config?: Partial<WordNetConfig>;
}

export const WordNetConfigProvider: React.FC<WordNetConfigProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  return (
    <WordNetConfigContext.Provider value={mergedConfig}>
      {children}
    </WordNetConfigContext.Provider>
  );
};

export const useWordNetConfig = (): WordNetConfig => {
  const context = useContext(WordNetConfigContext);
  if (!context) {
    throw new Error('useWordNetConfig must be used within a WordNetConfigProvider');
  }
  return context;
};
