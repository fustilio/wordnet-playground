import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner, Alert, Badge } from '@inkjs/ui';
import { WordNetHelper, type WordResult } from "../utils/wordnet-helpers.js";
import FlexiblePanelLayout from './FlexiblePanelLayout.js';

interface CrossLanguageResult {
  language: string;
  lexicon: string;
  words: WordResult[];
}

interface CrossLanguageSearchProps {
  onExit: () => void;
  lexicon: string;
  language: string;
}

const CrossLanguageSearch: React.FC<CrossLanguageSearchProps> = ({
  onExit,
  lexicon,
  language: _,
}) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CrossLanguageResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordNetHelper] = useState(() => new WordNetHelper(lexicon));

  useInput((_, key) => {
    if (results) {
      if (key.downArrow) setSelected((prev) => (prev + 1) % results.length);
      else if (key.upArrow)
        setSelected((prev) => (prev - 1 + results.length) % results.length);
      else if (key.escape) {
        setResults(null);
        setSelected(0);
        setError(null);
      } else if (key.return) {
        // Keep selected result for detailed view
      }
      return;
    }
    if (key.escape) onExit();
  });

  const performCrossLanguageSearch = async (word: string) => {
    setLoading(true);
    setError(null);
    try {
      // For now, simulate cross-language search by searching in multiple lexicons
      // In a real implementation, this would use the ILI/CILI index
      const crossLanguageResults: CrossLanguageResult[] = [];

      // Search in different lexicons to simulate cross-language results
      const lexicons = ["oewn", "omw", "ewn"];
      const languages = ["eng", "spa", "fra"];

      for (let i = 0; i < lexicons.length; i++) {
        const helper = new WordNetHelper(lexicons[i]);
        const words = await helper.searchWords(word, undefined, languages[i]);
        if (words.length > 0) {
          crossLanguageResults.push({
            language: languages[i],
            lexicon: lexicons[i],
            words: words,
          });
        }
      }

      setResults(crossLanguageResults);
      setSelected(0);
    } catch (err) {
      setError("Cross-language search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      'eng': 'English',
      'spa': 'Spanish',
      'fra': 'French',
      'deu': 'German',
      'ita': 'Italian',
      'jpn': 'Japanese',
      'por': 'Portuguese',
      'nld': 'Dutch',
      'pol': 'Polish',
      'rus': 'Russian',
      'zho': 'Chinese',
      'kor': 'Korean',
      'ara': 'Arabic',
      'hin': 'Hindi',
    };
    return names[code] || code;
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="yellow" bold>
          🌍 Cross-Language Search (CILI)
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>
          Search for "{input}" across multiple languages
        </Text>
      </Box>
      
      {/* Search Input */}
      <Box marginBottom={1}>
        <TextInput
          placeholder="Enter a word to search across languages..."
          onSubmit={performCrossLanguageSearch}
        />
      </Box>
      
      {/* Status Messages */}
      {loading && (
        <Box marginBottom={1}>
          <Spinner label="Searching across languages..." />
        </Box>
      )}
      {error && (
        <Box marginBottom={1}>
          <Alert variant="error">
            <Text>{error}</Text>
          </Alert>
        </Box>
      )}
      
      {/* Results */}
      {results && (
        <Box flexDirection="column" flexGrow={1}>
          <Box marginBottom={1}>
            <Text>
              Cross-language results for <Text color="cyan" bold>{input}</Text>:
            </Text>
          </Box>
          {results.length === 0 ? (
            <Box marginBottom={1}>
              <Alert variant="error">
                <Text>No cross-language results found.</Text>
              </Alert>
            </Box>
          ) : (
            <Box flexDirection="column" flexGrow={1}>
              {results.map((result, idx) => (
                <Box key={`${result.language}-${result.lexicon}`} marginBottom={1}>
                  <Text color={selected === idx ? "cyan" : "white"}>
                    {selected === idx ? "❯ " : "  "} 
                    <Text bold>{getLanguageName(result.language)}</Text>
                    <Badge color="blue">{result.language}</Badge>
                    <Text color="dim"> ({result.lexicon})</Text>
                  </Text>
                  <Box marginLeft={4}>
                    <Text color="dim">
                      {result.words.map((w) => w.lemma).join(", ")}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Navigation Help */}
      <Box marginTop={1}>
        <Text dimColor>
          ⌨️  ↑↓ Navigate | Enter: Select | Esc: Back
        </Text>
      </Box>
    </Box>
  );
};

export default CrossLanguageSearch;
