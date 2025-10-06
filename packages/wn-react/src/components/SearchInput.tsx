/**
 * Search input component - ready-to-use search input
 */

import React, { useState, useCallback } from 'react';
import { useWordNetContext } from '../providers/WordNetProvider.js';

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (term: string) => void;
  debounceMs?: number;
}

export function SearchInput({ 
  placeholder = 'Search for a word...', 
  className = '',
  onSearch,
  debounceMs = 300
}: SearchInputProps) {
  const { search, loading } = useWordNetContext();
  const [value, setValue] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      if (newValue.trim()) {
        search(newValue.trim());
        onSearch?.(newValue.trim());
      }
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [search, onSearch, debounceMs, debounceTimeout]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      search(value.trim());
      onSearch?.(value.trim());
    }
  }, [value, search, onSearch, debounceTimeout]);

  return (
    <div className={`search-input ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
