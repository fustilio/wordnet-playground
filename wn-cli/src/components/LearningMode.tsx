import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner, Alert, Badge, Select } from '@inkjs/ui';
import { WordNetHelper, type WordResult } from "../utils/wordnet-helpers.js";

interface LearningModeProps {
  onExit: () => void;
  lexicon: string;
  language: string;
}

interface LearningResult {
  word: string;
  partOfSpeech: string;
  simpleDefinition: string;
  examples: string[];
  relatedWords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const LearningMode: React.FC<LearningModeProps> = ({
  onExit,
  lexicon,
  language,
}) => {
  const [input, setInput] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("any");
  const [results, setResults] = useState<LearningResult[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordNetHelper, setWordNetHelper] = useState(
    () => new WordNetHelper(lexicon)
  );

  const posOptions = [
    { label: "Any part of speech", value: "any" },
    { label: "Noun", value: "n" },
    { label: "Verb", value: "v" },
    { label: "Adjective", value: "a" },
    { label: "Adverb", value: "r" },
  ];

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
        console.log(`Selected: ${results[selected].word}`);
      }
      return;
    }
    if (key.escape) onExit();
  });

  const simplifyDefinition = (definition: string): string => {
    // Remove complex punctuation and simplify language
    return definition
      .replace(/[;:]/g, '.')
      .replace(/\([^)]*\)/g, '') // Remove parenthetical explanations
      .replace(/\s+/g, ' ')
      .trim();
  };

  const determineDifficulty = (word: string, definition: string): 'beginner' | 'intermediate' | 'advanced' => {
    const wordLength = word.length;
    const defLength = definition.length;
    const hasComplexWords = /(therefore|nevertheless|consequently|furthermore)/i.test(definition);
    
    if (wordLength <= 4 && defLength < 50 && !hasComplexWords) return 'beginner';
    if (wordLength <= 6 && defLength < 100 && !hasComplexWords) return 'intermediate';
    return 'advanced';
  };

  const performSearch = async (word: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchResults = await wordNetHelper.searchWords(
        word,
        partOfSpeech === "any" ? undefined : partOfSpeech as any,
        language
      );
      
      const learningResults: LearningResult[] = [];
      
      for (const result of searchResults) {
        try {
          const synsets = await wordNetHelper.searchSynsets(result.lemma, result.partOfSpeech as any);
          
          for (const synset of synsets) {
            const definition = synset.definitions?.[0]?.text || "No definition available";
            const simpleDefinition = simplifyDefinition(definition);
            const difficulty = determineDifficulty(result.lemma, simpleDefinition);
            
            // Get examples - skip for now since examples property doesn't exist
            const examples: string[] = [];
            
            // Get related words from the same synset
            const relatedWords: string[] = [];
            if (synset.members) {
              for (const member of synset.members) {
                if (typeof member === 'string' && member !== result.lemma) {
                  relatedWords.push(member);
                } else if (member && typeof member === 'object' && 'lemma' in member) {
                  const memberObj = member as { lemma: string };
                  if (memberObj.lemma !== result.lemma) {
                    relatedWords.push(memberObj.lemma);
                  }
                }
              }
            }
            
            learningResults.push({
              word: result.lemma,
              partOfSpeech: result.partOfSpeech,
              simpleDefinition,
              examples: examples.slice(0, 3), // Limit to 3 examples
              relatedWords: relatedWords.slice(0, 5), // Limit to 5 related words
              difficulty
            });
          }
        } catch (e) {
          // Skip if we can't get synsets for this word
        }
      }
      
      // Remove duplicates and limit results
      const uniqueResults = learningResults.filter((result, index, self) => 
        index === self.findIndex(r => r.word === result.word)
      ).slice(0, 10);
      
      setResults(uniqueResults);
      setSelected(0);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'white';
    }
  };

  return (
    <Box flexDirection="column" margin={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          🎓 Learning Mode
        </Text>
      </Box>
      <Text dimColor>
        Get simple definitions and examples for language learning
      </Text>
      
      {!results ? (
        <>
          <Box marginBottom={1}>
            <Text>Part of Speech: </Text>
            <Select
              options={posOptions}
              onChange={(value: string) => setPartOfSpeech(value)}
            />
          </Box>
          
          <Box marginBottom={1}>
            <Text>Word: </Text>
            <TextInput
              placeholder="Enter a word to learn..."
              onSubmit={performSearch}
            />
          </Box>
          
          <Text dimColor>
            Press Enter to search, Escape to return
          </Text>
          
          {loading && <Spinner label="Finding learning materials..." />}
          {error && (
            <Alert variant="error">
              <Text>{error}</Text>
            </Alert>
          )}
        </>
      ) : (
        <>
          <Text>
            Learning materials for <Text color="cyan">{input}</Text>:
          </Text>
          {results.length === 0 ? (
            <Alert variant="error">
              <Text>No learning materials found.</Text>
            </Alert>
          ) : (
            results.map((r, idx) => (
              <Box key={r.word} flexDirection="column" marginTop={1}>
                <Text color={selected === idx ? "cyan" : undefined}>
                  {selected === idx ? "❯" : " "} {r.word} <Badge color="blue">{r.partOfSpeech}</Badge>
                </Text>
                <Box marginLeft={2}>
                  <Badge color={getDifficultyColor(r.difficulty)}>
                    {r.difficulty.toUpperCase()}
                  </Badge>
                </Box>
                <Box marginLeft={2}>
                  <Text color="dim">
                    Definition: {r.simpleDefinition}
                  </Text>
                </Box>
                {r.examples && r.examples.length > 0 && (
                  <Box marginLeft={2}>
                    <Text color="green">
                      Examples:
                    </Text>
                    {r.examples.map((example, exIdx) => (
                      <Box key={exIdx} marginLeft={4}>
                        <Text color="green">• {example}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
                {r.relatedWords && r.relatedWords.length > 0 && (
                  <Box marginLeft={2}>
                    <Text color="yellow">
                      Related words: {r.relatedWords.join(', ')}
                    </Text>
                  </Box>
                )}
              </Box>
            ))
          )}
          <Box marginTop={1}>
            <Text dimColor>Use arrow keys to navigate, Enter to select, Escape to return</Text>
          </Box>
        </>
      )}
    </Box>
  );
};

export default LearningMode; 