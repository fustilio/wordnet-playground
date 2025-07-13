import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner, Alert, Badge } from '@inkjs/ui';
import { WordNetHelper, type SenseResult } from "../utils/wordnet-helpers.js";
import FlexiblePanelLayout from './FlexiblePanelLayout.js';

interface SenseBrowserProps {
  onExit: () => void;
  lexicon: string;
  language: string;
}

const SenseBrowser: React.FC<SenseBrowserProps> = ({
  onExit,
  lexicon,
  language,
}) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SenseResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordNetHelper, setWordNetHelper] = useState(
    () => new WordNetHelper(lexicon)
  );

  useEffect(() => {
    setWordNetHelper(new WordNetHelper(lexicon));
  }, [lexicon]);

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
        // Keep selected sense for detailed view
      }
      return;
    }
    if (key.escape) onExit();
  });

  const performSearch = async (word: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchResults = await wordNetHelper.searchSenses(word);
      setResults(searchResults);
      setSelected(0);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="yellow" bold>
          📖 Sense Browser
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>
          Lexicon: <Badge color="green">{lexicon}</Badge> | Language: <Badge color="yellow">{language}</Badge>
        </Text>
      </Box>
      
      {/* Search Input */}
      <Box marginBottom={1}>
        <TextInput
          placeholder="Enter a word to search senses..."
          onSubmit={performSearch}
        />
      </Box>
      
      {/* Status Messages */}
      {loading && (
        <Box marginBottom={1}>
          <Spinner label="Searching senses..." />
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
              Senses for <Text color="cyan" bold>{input}</Text>:
            </Text>
          </Box>
          {results.length === 0 ? (
            <Box marginBottom={1}>
              <Alert variant="error">
                <Text>No senses found.</Text>
              </Alert>
            </Box>
          ) : (
            <Box flexDirection="column" flexGrow={1}>
              {results.map((r, idx) => (
                <Box key={r.id} marginBottom={1}>
                  <Text color={selected === idx ? "cyan" : "white"}>
                    {selected === idx ? "❯ " : "  "} 
                    <Text bold>{r.id}</Text>
                  </Text>
                  <Box marginLeft={4}>
                    <Text color="dim">
                      Synset: {r.synset}
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

export default SenseBrowser;
