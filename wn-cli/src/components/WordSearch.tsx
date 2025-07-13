import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { WordNetHelper, type WordResult, getBestDefinition } from "../utils/wordnet-helpers.js";
import SearchInput from './shared/SearchInput.js';
import ResultsList from './shared/ResultsList.js';
import NavigationHelp from './shared/NavigationHelp.js';

interface WordSearchProps {
  onExit: () => void;
  lexicon: string;
  language: string;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
}

interface WordResultWithDefinition extends WordResult {
  definition?: string;
}

interface SearchState {
  results: WordResultWithDefinition[] | null;
  selected: number;
  loading: boolean;
  error: string | null;
  searchHistory: string[];
}

const WordSearch: React.FC<WordSearchProps> = ({
  onExit,
  lexicon,
  language,
  onInputFocus,
  onInputBlur,
}) => {
  // Centralized state management following React Ink best practices
  const [state, setState] = useState<SearchState>({
    results: null,
    selected: 0,
    loading: false,
    error: null,
    searchHistory: []
  });

  // Memoized WordNet helper to prevent unnecessary re-creation
  const wordNetHelper = useMemo(() => new WordNetHelper(lexicon), [lexicon]);

  // Memoized state updater for better performance
  const updateState = useCallback((updates: Partial<SearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoized input handler following React Ink best practices
  const handleInput = useCallback((_: string, key: any) => {
    if (state.results) {
      if (key.downArrow) {
        updateState({ 
          selected: (state.selected + 1) % (state.results.length || 1) 
        });
      } else if (key.upArrow) {
        updateState({ 
          selected: (state.selected - 1 + (state.results.length || 1)) % (state.results.length || 1) 
        });
      } else if (key.escape) {
        updateState({ 
          results: null, 
          selected: 0, 
          error: null 
        });
      } else if (key.return) {
        if (state.results && state.results[state.selected]) {
          console.log(`Selected: ${state.results[state.selected].lemma}`);
        }
      }
      return;
    }
    
    if (key.escape) {
      onExit();
    }
  }, [state.results, state.selected, updateState, onExit]);

  useInput(handleInput);

  // Memoized search function with improved error handling
  const performSearch = useCallback(async (word: string) => {
    updateState({ loading: true, error: null });
    
    try {
      // Add to search history with deduplication
      setState(prev => ({
        ...prev,
        searchHistory: [word, ...prev.searchHistory.filter((item: string) => item !== word)].slice(0, 10)
      }));
      
      const searchResults = await wordNetHelper.searchWords(
        word,
        undefined,
        language
      );
      
      // Fetch definitions for each word with improved error handling
      const resultsWithDefinitions: WordResultWithDefinition[] = [];
      
      for (const result of searchResults) {
        try {
          const synsets = await wordNetHelper.searchSynsets(
            result.lemma, 
            result.partOfSpeech as any
          );
          
          const definition = (synsets.length > 0)
            ? await getBestDefinition(synsets[0])
            : "No definition available.";
          
          resultsWithDefinitions.push({ ...result, definition });
        } catch (e) {
          // Graceful degradation - include result without definition
          resultsWithDefinitions.push({ 
            ...result, 
            definition: "No definition available." 
          });
        }
      }
      
      updateState({ 
        results: resultsWithDefinitions, 
        selected: 0, 
        loading: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateState({ 
        error: `Search failed: ${errorMessage}. Please try again.`, 
        loading: false 
      });
    }
  }, [wordNetHelper, language, updateState]);

  // Memoized select handler
  const handleSelect = useCallback((index: number) => {
    updateState({ selected: index });
  }, [updateState]);

  // Memoized result items for better performance
  const resultItems = useMemo(() => 
    state.results?.map((result) => ({
      id: result.id,
      title: result.lemma,
      subtitle: result.definition,
      tags: [result.partOfSpeech],
      metadata: {
        'ID': result.id,
        'Language': result.language || language,
        'Lexicon': result.lexicon || lexicon
      }
    })) || [], 
    [state.results, language, lexicon]
  );

  // Memoized navigation shortcuts
  const navigationShortcuts = useMemo(() => [
    { key: 'Enter', description: 'Search' },
    { key: '↑↓', description: 'Navigate results' },
    { key: 'Esc', description: 'Back' }
  ], []);

  // Memoized additional info for navigation help
  const additionalInfo = useMemo(() => 
    state.searchHistory.length > 0 
      ? `Recent searches: ${state.searchHistory.slice(0, 3).join(', ')}` 
      : undefined,
    [state.searchHistory]
  );

  return (
    <Box flexDirection="column" height="100%">
      <SearchInput
        placeholder="Enter a word to search..."
        onSubmit={performSearch}
        loading={state.loading}
        error={state.error}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
      />
      
      {state.results && (
        <Box flexGrow={1}>
          <ResultsList
            results={resultItems}
            selectedIndex={state.selected}
            onSelect={handleSelect}
          />
        </Box>
      )}
      
      {!state.results && (
        <NavigationHelp 
          shortcuts={navigationShortcuts}
          additionalInfo={additionalInfo}
        />
      )}
    </Box>
  );
};

export default WordSearch;
