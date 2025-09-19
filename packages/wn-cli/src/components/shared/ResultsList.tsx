import React from 'react';
import { Box, Text } from 'ink';
import { Badge, Alert } from '@inkjs/ui';
import { useStdoutDimensions } from '../../utils/hooks/useStdOutDimensions.js';

interface ResultItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

interface ResultsListProps {
  results: ResultItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}

const ResultsList: React.FC<ResultsListProps> = ({
  results,
  selectedIndex,
  onSelect: _,
  emptyMessage = "No results found.",
  loading = false
}) => {
  const { rows } = useStdoutDimensions();
  
  // Calculate available space for results
  const headerLines = 2;
  const footerLines = 2;
  const availableLines = Math.max(3, rows - headerLines - footerLines - 4);
  const maxVisibleResults = Math.min(availableLines, results.length);
  
  // Calculate scroll position
  const scrollStart = Math.max(0, Math.min(
    selectedIndex - Math.floor(maxVisibleResults / 2),
    results.length - maxVisibleResults
  ));
  const scrollEnd = Math.min(scrollStart + maxVisibleResults, results.length);
  const visibleResults = results.slice(scrollStart, scrollEnd);

  if (loading) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text dimColor>Loading results...</Text>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Alert variant="error">
          <Text>{emptyMessage}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Results Header */}
      <Box marginBottom={1}>
        <Text>
          Found <Text color="cyan" bold>{results.length}</Text> results:
        </Text>
      </Box>
      
      {/* Results List */}
      <Box flexDirection="column" paddingY={1}>
        {visibleResults.map((result, idx) => {
          const actualIndex = scrollStart + idx;
          const isSelected = actualIndex === selectedIndex;
          
          return (
            <Box key={result.id} flexDirection="column" marginTop={idx > 0 ? 1 : 0}>
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "❯ " : "  "}
                <Text bold>{result.title}</Text>
                {result.tags?.map((tag, tagIdx) => (
                  <Badge key={tagIdx} color="blue">{tag}</Badge>
                ))}
              </Text>
              
              {result.subtitle && (
                <Box marginLeft={4}>
                  <Text color="dim">{result.subtitle}</Text>
                </Box>
              )}
              
              {result.description && (
                <Box marginLeft={4}>
                  <Text color="dim">{result.description}</Text>
                </Box>
              )}
              
              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <Box marginLeft={4} marginTop={1}>
                  {Object.entries(result.metadata).map(([key, value]) => (
                    <Text key={key} color="dim" dimColor>
                      {key}: {value}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* Scroll indicators */}
      {results.length > maxVisibleResults && (
        <Box marginBottom={1}>
          <Text color="dim">
            {scrollStart > 0 ? "↑ " : ""}
            Showing {scrollStart + 1}-{scrollEnd} of {results.length}
            {scrollEnd < results.length ? " ↓" : ""}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ResultsList; 