import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput, Spinner, Alert, Badge, Select } from '@inkjs/ui';
import { WordNetHelper, type WordResult } from "../utils/wordnet-helpers.js";

interface WritingAssistantProps {
  onExit: () => void;
  lexicon: string;
  language: string;
}

interface SynonymResult {
  word: string;
  partOfSpeech: string;
  definition: string;
  examples?: string[];
  context?: string;
}

const WritingAssistant: React.FC<WritingAssistantProps> = ({
  onExit,
  lexicon,
  language,
}) => {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("any");
  const [results, setResults] = useState<SynonymResult[] | null>(null);
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

  const performSearch = async (word: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchResults = await wordNetHelper.searchWords(
        word,
        partOfSpeech === "any" ? undefined : partOfSpeech as any,
        language
      );
      
      // Get synonyms and related words
      const synonyms: SynonymResult[] = [];
      
      for (const result of searchResults) {
        try {
          const synsets = await wordNetHelper.searchSynsets(result.lemma, result.partOfSpeech as any);
          
          for (const synset of synsets) {
            // Get all members of the synset (synonyms)
            if (synset.members) {
              for (const member of synset.members) {
                if (typeof member === 'string') {
                  if (member !== word.toLowerCase()) {
                    const definition = synset.definitions?.[0]?.text || "No definition available";
                    
                    synonyms.push({
                      word: member,
                      partOfSpeech: result.partOfSpeech,
                      definition,
                      context: context || undefined
                    });
                  }
                } else if (member && typeof member === 'object' && 'lemma' in member) {
                  const memberObj = member as { lemma: string };
                  if (memberObj.lemma !== word.toLowerCase()) {
                    const definition = synset.definitions?.[0]?.text || "No definition available";
                    
                    synonyms.push({
                      word: memberObj.lemma,
                      partOfSpeech: result.partOfSpeech,
                      definition,
                      context: context || undefined
                    });
                  }
                }
              }
            }
            
            // Get related synsets (hypernyms, hyponyms, etc.)
            if (synset.relations) {
              for (const relation of synset.relations) {
                if (relation.type === "hypernym" || relation.type === "hyponym") {
                  try {
                    const relatedSynset = await wordNetHelper.getSynset(relation.target);
                    if (relatedSynset?.members) {
                      for (const member of relatedSynset.members) {
                        if (typeof member === 'string') {
                          synonyms.push({
                            word: member.replace(/^oewn-/, '').replace(/-[a-z]$/, ''),
                            partOfSpeech: relatedSynset.partOfSpeech || '?',
                            definition: relatedSynset.definitions?.[0]?.text || "No definition available",
                            context: `related via ${relation.type}`
                          });
                        }
                      }
                    }
                  } catch (e) {
                    // Skip if we can't get the related synset
                  }
                }
              }
            }
          }
        } catch (e) {
          // Skip if we can't get synsets for this word
        }
      }
      
      // Remove duplicates and limit results
      const uniqueSynonyms = synonyms.filter((syn, index, self) => 
        index === self.findIndex(s => s.word === syn.word)
      ).slice(0, 20);
      
      setResults(uniqueSynonyms);
      setSelected(0);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flexDirection="column" margin={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          ✍️ Writing Assistant
        </Text>
      </Box>
      <Text dimColor>
        Find synonyms and alternatives for better writing
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
              placeholder="Enter a word..."
              onSubmit={performSearch}
            />
          </Box>
          
          <Box marginBottom={1}>
            <Text>Context (optional): </Text>
            <TextInput
              placeholder="e.g., business, technical, casual..."
              onSubmit={(value: string) => setContext(value)}
            />
          </Box>
          
          <Text dimColor>
            Press Enter to search, Escape to return
          </Text>
          
          {loading && <Spinner label="Searching for alternatives..." />}
          {error && (
            <Alert variant="error">
              <Text>{error}</Text>
            </Alert>
          )}
        </>
      ) : (
        <>
          <Text>
            Alternatives for <Text color="cyan">{input}</Text>:
          </Text>
          {results.length === 0 ? (
            <Alert variant="error">
              <Text>No alternatives found.</Text>
            </Alert>
          ) : (
            results.map((r, idx) => (
              <Box key={r.word} flexDirection="column" marginTop={1}>
                <Text color={selected === idx ? "cyan" : undefined}>
                  {selected === idx ? "❯" : " "} {r.word} <Badge color="blue">{r.partOfSpeech}</Badge>
                </Text>
                <Box marginLeft={2}>
                  <Text color="dim">
                    Definition: {r.definition}
                  </Text>
                </Box>
                {r.examples && r.examples.length > 0 && (
                  <Box marginLeft={2}>
                    <Text color="green">
                      Example: {r.examples[0]}
                    </Text>
                  </Box>
                )}
                {r.context && (
                  <Box marginLeft={2}>
                    <Text color="yellow">
                      Context: {r.context}
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

export default WritingAssistant; 
