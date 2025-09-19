import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Select, Alert, Badge } from '@inkjs/ui';
import { resolveLexicon } from "../utils/lexicon-helpers.js";
import { useLayoutContext, calculateComponentLayout } from "../utils/layout-helpers.js";

interface SettingsProps {
  lexicon: string;
  language: string;
  onSetLexicon: (lex: string) => void;
  onSetLanguage: (lang: string) => void;
  onExit: () => void;
  availableLexicons: string[];
  availableLanguages: string[];
  lexiconNames: Record<string, string>;
  languageNames: Record<string, string>;
}

const Settings: React.FC<SettingsProps> = ({
  lexicon,
  language,
  onSetLexicon,
  onSetLanguage,
  onExit,
  availableLexicons,
  availableLanguages,
  lexiconNames,
  languageNames,
}) => {
  const [currentLexicon, setCurrentLexicon] = useState(lexicon);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [warning, setWarning] = useState<string | null>(null);

  // Update local state when props change
  React.useEffect(() => {
    setCurrentLexicon(lexicon);
    setCurrentLanguage(language);
  }, [lexicon, language]);

  // Use the layout system
  const layoutContext = useLayoutContext();
  const layout = calculateComponentLayout(layoutContext, 'settings');

  const handleConfirm = useCallback(async () => {
    // Use smart lexicon resolution
    const lexiconResult = await resolveLexicon(currentLexicon);
    let finalLexicon = currentLexicon;
    
    if (!lexiconResult.lexicon && lexiconResult.suggestions.length > 0) {
      finalLexicon = lexiconResult.suggestions[0];
      setWarning(`⚠️  Using '${finalLexicon}' (best match for '${currentLexicon}')`);
    } else if (lexiconResult.lexicon) {
      finalLexicon = lexiconResult.lexicon;
    }
    
    onSetLexicon(finalLexicon);
    onSetLanguage(currentLanguage);
    onExit();
  }, [currentLexicon, currentLanguage, onSetLexicon, onSetLanguage, onExit]);

  useInput((_, key) => {
    if (key.escape) onExit();
    if (key.return) handleConfirm();
  });

  const lexiconOptions = availableLexicons.map(lex => ({
    label: `${lexiconNames[lex] || lex}${lex === currentLexicon ? ' (current)' : ''}`,
    value: lex,
    key: lex,
  }));

  const languageOptions = availableLanguages.map(lang => ({
    label: `${languageNames[lang] || lang}${lang === currentLanguage ? ' (current)' : ''}`,
    value: lang,
    key: lang,
  }));

  // If no content height available, render minimal content
  if (layout.contentHeight <= 0) {
    return (
      <Box flexDirection="column" height="100%">
        <Text color="red">Terminal too small to display settings</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" margin={1} height={layout.contentHeight}>
      {/* Help text - only render if there's space */}
      {layout.contentHeight > 4 && (
        <Text>
          Select Lexicon and Language. Use Tab to switch, arrows to change, Enter to confirm, Esc to
          cancel.
        </Text>
      )}
      
      {/* Lexicon selection - only render if there's space */}
      {layout.contentHeight > 2 && (
        <Box marginTop={2} marginBottom={1}>
          <Text>Lexicon:  </Text>
          <Select
            options={lexiconOptions}
            onChange={setCurrentLexicon}
          />
        </Box>
      )}
      
      {/* Language selection - only render if there's space */}
      {layout.contentHeight > 3 && (
        <Box marginBottom={1}>
          <Text>Language: </Text>
          <Select
            options={languageOptions}
            onChange={setCurrentLanguage}
          />
        </Box>
      )}
      
      {/* Current selection - only render if there's space */}
      {layout.contentHeight > 4 && (
        <Box marginTop={1} marginBottom={1}>
          <Text>Current Selection: </Text>
          <Badge color="green">{lexiconNames[currentLexicon] || currentLexicon}</Badge>
          <Text> | </Text>
          <Badge color="yellow">{languageNames[currentLanguage] || currentLanguage}</Badge>
        </Box>
      )}
      
      {/* Warning - only render if there's space */}
      {warning && layout.contentHeight > 5 && (
        <Box marginTop={1}>
          <Alert variant="warning">
            <Text>{warning}</Text>
          </Alert>
        </Box>
      )}
      
      {/* Help text - only render if there's space */}
      {layout.contentHeight > 6 && (
        <Box marginTop={2}>
          <Text dimColor>
            (Tab: switch, ↑↓: change, Enter: confirm, Esc: cancel)
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Settings;
