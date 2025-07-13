import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput, Spinner, Alert } from '@inkjs/ui';

interface SearchInputProps {
  placeholder?: string;
  onSubmit: (query: string) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Enter search term...",
  onSubmit,
  loading = false,
  error = null,
  disabled = false,
  onFocus,
  onBlur
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Track focus state using input detection
  useInput((input, key) => {
    // If we receive any input, we're focused
    if (!isFocused && (input || key.return || key.escape || key.backspace || key.delete)) {
      setIsFocused(true);
      onFocus?.();
    }
  });

  // Handle blur when component unmounts or loses focus
  useEffect(() => {
    return () => {
      if (isFocused) {
        setIsFocused(false);
        onBlur?.();
      }
    };
  }, [isFocused, onBlur]);

  const handleSubmit = (submittedValue: string) => {
    if (submittedValue.trim() && !disabled) {
      onSubmit(submittedValue.trim());
      setValue('');
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <TextInput
          placeholder={placeholder}
          onSubmit={handleSubmit}
        />
      </Box>
      
      {loading && (
        <Box marginBottom={1}>
          <Spinner label="Searching..." />
        </Box>
      )}
      
      {error && (
        <Box marginBottom={1}>
          <Alert variant="error">
            <Text>{error}</Text>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default SearchInput; 