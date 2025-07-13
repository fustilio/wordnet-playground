import React, { createContext, useContext } from 'react';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: string;
    muted: string;
    background: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borders: {
    single: string;
    double: string;
    round: string;
  };
  icons: {
    search: string;
    settings: string;
    help: string;
    exit: string;
    back: string;
    forward: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
  };
}

const defaultTheme: Theme = {
  colors: {
    primary: 'cyan',
    secondary: 'magenta',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    text: 'white',
    muted: 'gray',
    background: 'black',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
  },
  borders: {
    single: 'single',
    double: 'double',
    round: 'round',
  },
  icons: {
    search: '🔍',
    settings: '⚙️',
    help: '❓',
    exit: '🚪',
    back: '←',
    forward: '→',
    loading: '⏳',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  },
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={defaultTheme}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 