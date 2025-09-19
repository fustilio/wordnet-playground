import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useStdoutDimensions } from "./utils/hooks/useStdOutDimensions.js";
import { ThemeProvider } from "./contexts/ThemeContext.js";
import ErrorBoundary from "./components/shared/ErrorBoundary.js";
import StatusBar from "./components/shared/StatusBar.js";
import Menu from "./components/Menu.js";
import WordSearch from "./components/WordSearch.js";
import SynsetExplorer from "./components/SynsetExplorer.js";
import SenseBrowser from "./components/SenseBrowser.js";
import CrossLanguageSearch from "./components/CrossLanguageSearch.js";
import WritingAssistant from "./components/WritingAssistant.js";
import LearningMode from "./components/LearningMode.js";
import { DataManager } from "./components/DataManager.js";
import Settings from "./components/Settings.js";
import DebugPanel from "./components/DebugPanel.js";
import { LexiconHelper } from "./utils/lexicon-helpers.js";
import {
  useLayoutContext,
  calculateComponentLayout,
} from "./utils/layout-helpers.js";

export type TUIView =
  | "menu"
  | "word-search"
  | "synset-explorer"
  | "sense-browser"
  | "cross-language"
  | "writing-assistant"
  | "learning-mode"
  | "data-manager"
  | "settings"
  | "help";

interface AppProps {
  chainCommands?: string[];
  snapshotEnabled?: boolean;
}

interface AppState {
  currentView: TUIView;
  debugMode: boolean;
  error: string | null;
  lexicon: string;
  language: string;
  availableLexicons: string[];
  availableLanguages: string[];
  inputFocused: boolean; // Track if an input field is focused
}

// Add view information mapping
const VIEW_INFO = {
  menu: {
    title: "Main Menu",
    subtitle: "Select a feature to explore",
  },
  "word-search": {
    title: "Word Search",
    subtitle: "Search for words and their definitions",
  },
  "synset-explorer": {
    title: "Synset Explorer",
    subtitle: "Explore semantic relations",
  },
  "sense-browser": {
    title: "Sense Browser",
    subtitle: "Browse word senses",
  },
  "cross-language": {
    title: "Cross-Language Search",
    subtitle: "Multi-language search (CILI)",
  },
  "writing-assistant": {
    title: "Writing Assistant",
    subtitle: "Find synonyms and related words",
  },
  "learning-mode": {
    title: "Learning Mode",
    subtitle: "Simplified definitions",
  },
  "data-manager": {
    title: "Data Manager",
    subtitle: "Manage WordNet data",
  },
  settings: {
    title: "Settings",
    subtitle: "Configure preferences",
  },
  help: { title: "Help", subtitle: "Navigation and shortcuts" },
} as const;

const App: React.FC<AppProps> = ({ chainCommands, snapshotEnabled }) => {
  const { columns, rows } = useStdoutDimensions();

  // Centralized state management following React Ink best practices
  const [state, setState] = useState<AppState>({
    currentView: "menu",
    debugMode: false,
    error: null,
    lexicon: "oewn",
    language: "en",
    availableLexicons: [],
    availableLanguages: ["en"],
    inputFocused: false,
  });

  // Memoized state updater for better performance
  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    // Populate available lexicons on mount
    LexiconHelper.getAllAvailableLexicons()
      .then((lexicons) => {
        updateState({ availableLexicons: lexicons });
      })
      .catch((e) => {
        console.error(e);
      });
  }, [updateState]);

  // Focus management handlers
  const handleInputFocus = useCallback(() => {
    updateState({ inputFocused: true });
  }, [updateState]);

  const handleInputBlur = useCallback(() => {
    updateState({ inputFocused: false });
  }, [updateState]);

  const handleMenuSelect = useCallback(
    (item: string) => {
      try {
        let newView: TUIView;

        switch (item) {
          case "Word Search":
            newView = "word-search";
            break;
          case "Synset Explorer":
            newView = "synset-explorer";
            break;
          case "Sense Browser":
            newView = "sense-browser";
            break;
          case "Cross-Language Search (CILI)":
            newView = "cross-language";
            break;
          case "Writing Assistance":
            newView = "writing-assistant";
            break;
          case "Learning Mode":
            newView = "learning-mode";
            break;
          case "Settings":
            newView = "settings";
            break;
          case "Data Manager":
            newView = "data-manager";
            break;
          case "Help":
            newView = "help";
            break;
          case "Exit":
            process.exit(0);
            return;
          default:
            console.warn(`Unknown menu item: ${item}`);
            return;
        }

        updateState({ currentView: newView, error: null });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        updateState({
          error: `Failed to navigate to ${item}: ${errorMessage}`,
        });
      }
    },
    [updateState]
  );

  const handleExit = useCallback(() => {
    updateState({ currentView: "menu", error: null });
  }, [updateState]);

  const handleSetLexicon = useCallback(
    (lexicon: string) => {
      updateState({ lexicon });
    },
    [updateState]
  );

  const handleSetLanguage = useCallback(
    (language: string) => {
      updateState({ language });
    },
    [updateState]
  );

  // Global input handling following React Ink best practices
  // Only apply global shortcuts when no input field is focused
  useInput((input, key) => {
    // Always allow Ctrl+C for emergency exit
    if (key.ctrl && input === "c") {
      process.exit(0);
      return;
    }

    // If an input field is focused, don't handle global shortcuts
    // except for Ctrl+C (already handled above) and Escape
    if (state.inputFocused) {
      // Only allow Escape to blur input and return to menu
      if (key.escape && state.currentView !== "menu") {
        handleInputBlur();
        handleExit();
        return;
      }
      // Let the input field handle all other input
      return;
    }

    // Global shortcuts only when no input is focused
    if (key.ctrl && input === "d") {
      updateState({ debugMode: !state.debugMode });
      return;
    }

    if (key.escape && state.currentView !== "menu") {
      handleExit();
      return;
    }

    // Help shortcut - only when not in input mode
    if (input === "?" || input === "h") {
      updateState({ currentView: "help" });
      return;
    }
  });

  // Chain command simulation with improved error handling
  useEffect(() => {
    if (chainCommands && chainCommands.length > 0) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < chainCommands.length) {
          const command = chainCommands[i];

          try {
            // Enhanced command simulation
            if (command === "down" || command === "up") {
              // Menu navigation handled by Select component
            } else if (command === "enter") {
              // Selection handled by Select component
            } else if (command === "escape") {
              handleExit();
            } else if (command === "q") {
              process.exit(0);
            }

            if (snapshotEnabled) {
              process.stdout.write(`[Frame ${i + 1}] Command: ${command}\n`);
              process.stdout.write("---\n");
            }
          } catch (error) {
            console.error(
              `Error processing chain command '${command}':`,
              error
            );
          }

          i++;
        } else {
          process.exit(0);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [chainCommands, snapshotEnabled, handleExit]);

  // Memoized view renderer for better performance
  const renderCurrentView = useCallback(() => {
    const commonProps = {
      onExit: handleExit,
      lexicon: state.lexicon,
      language: state.language,
      onInputFocus: handleInputFocus,
      onInputBlur: handleInputBlur,
    };

    switch (state.currentView) {
      case "menu":
        return <Menu onSelect={handleMenuSelect} />;

      case "word-search":
        return <WordSearch {...commonProps} />;

      case "synset-explorer":
        return <SynsetExplorer {...commonProps} />;

      case "sense-browser":
        return <SenseBrowser {...commonProps} />;

      case "cross-language":
        return <CrossLanguageSearch {...commonProps} />;

      case "writing-assistant":
        return <WritingAssistant {...commonProps} />;

      case "learning-mode":
        return <LearningMode {...commonProps} />;

      case "data-manager":
        return <DataManager onBack={handleExit} />;

      case "settings":
        return (
          <Settings
            {...commonProps}
            onSetLexicon={handleSetLexicon}
            onSetLanguage={handleSetLanguage}
            availableLexicons={state.availableLexicons}
            availableLanguages={state.availableLanguages}
            lexiconNames={{ oewn: "Open English WordNet" }}
            languageNames={{ en: "English" }}
          />
        );

      case "help":
        // Use layout system for help view
        const helpLayoutContext = useLayoutContext();
        const helpLayout = calculateComponentLayout(helpLayoutContext, "help");

        // If no content height available, render minimal content
        if (helpLayout.contentHeight <= 0) {
          return (
            <Box flexDirection="column" height="100%">
              <Text color="red">Terminal too small to display help</Text>
            </Box>
          );
        }

        return (
          <Box
            flexDirection="column"
            padding={1}
            height={helpLayout.contentHeight}
          >
            {/* Header - only render if there's space */}
            {helpLayout.reservedLines > 0 && (
              <Box flexDirection="column" marginBottom={2}>
                <Text bold>Keyboard Shortcuts:</Text>
              </Box>
            )}

            {/* Content - only render if there's space */}
            {helpLayout.contentHeight > 3 && (
              <>
                <Text>• ↑↓: Navigate menus</Text>
                <Text>• Enter: Select/Confirm</Text>
                <Text>• Escape: Go back/Exit</Text>
                <Text>• Ctrl+D: Toggle debug panel</Text>
                <Text>• Ctrl+C: Exit application</Text>
                <Text>• ? or h: Show this help (when not typing)</Text>
              </>
            )}

            {/* Features section - only render if there's space */}
            {helpLayout.contentHeight > 8 && (
              <Box flexDirection="column" marginBottom={2}>
                <Text bold>Features:</Text>
                <Text>• Word Search: Find words and definitions</Text>
                <Text>• Synset Explorer: Explore semantic relations</Text>
                <Text>• Sense Browser: Browse word senses</Text>
                <Text>• Cross-Language: Multi-language search</Text>
                <Text>• Writing Assistant: Find synonyms</Text>
                <Text>• Learning Mode: Simplified definitions</Text>
                <Text>• Settings: Configure preferences</Text>
                <Text>• Data Manager: Manage WordNet data</Text>
              </Box>
            )}

            {/* Footer - only render if there's space */}
            {helpLayout.contentHeight > 10 && (
              <Box marginTop={1}>
                <Text color="gray" dimColor>
                  Press Escape to return to menu
                </Text>
              </Box>
            )}
          </Box>
        );

      default:
        return (
          <Box flexDirection="column" padding={1}>
            <Text color="red">Unknown view: {state.currentView}</Text>
            <Text>Press Escape to return to menu</Text>
          </Box>
        );
    }
  }, [
    state.currentView,
    state.lexicon,
    state.language,
    handleExit,
    handleMenuSelect,
    handleSetLexicon,
    handleSetLanguage,
    state.availableLexicons,
    state.availableLanguages,
    handleInputFocus,
    handleInputBlur,
  ]);

  // Get current view info
  const currentViewInfo = VIEW_INFO[state.currentView];

  // Remove old headerHeight, only use new footerHeight/availableHeight
  // Calculate available height for content (no header now)
  const footerHeight = 2; // 1 for status/context, 1 for debug if needed
  const availableHeight = Math.max(
    8,
    rows - footerHeight - (state.debugMode ? 8 : 0)
  );

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Box flexDirection="column" height="100%">
          {/* Main Content - starts at the very top */}
          <Box flexGrow={1} height={availableHeight}>
            {renderCurrentView()}
          </Box>

          {/* Single-line Bottom Bar: context, error, shortcuts */}
          <Box
            borderStyle="single"
            borderColor={state.error ? "red" : "gray"}
            paddingX={1}
            height={1}
            width="100%"
            flexDirection="row"
            alignItems="center"
          >
            {/* Left: View name and context */}
            <Text>
              {currentViewInfo.title} | {state.lexicon}:{state.language}
              {state.error && <Text color="red"> | {state.error}</Text>}
            </Text>
            {/* Right: Shortcuts */}
            <Box flexGrow={1} justifyContent="flex-end">
              <Text color="dim">Ctrl+D:Debug | Ctrl+C:Exit | ?:Help</Text>
            </Box>
          </Box>

          {/* Debug Panel */}
          {state.debugMode && (
            <DebugPanel
              isVisible={state.debugMode}
              onToggle={() => updateState({ debugMode: !state.debugMode })}
              debugInfo={{
                currentView: state.currentView,
                terminalSize: { columns, rows },
                availableHeight,
                timestamp: new Date().toISOString(),
                lexicon: state.lexicon,
                language: state.language,
                inputFocused: state.inputFocused,
              }}
            />
          )}
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
