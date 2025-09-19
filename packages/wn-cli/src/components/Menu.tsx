import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Select, Alert, Badge } from "@inkjs/ui";
import { useLayoutContext, calculateComponentLayout } from "../utils/layout-helpers.js";

const BASE_MENU_ITEMS = [
  "Word Search",
  "Synset Explorer",
  "Sense Browser",
  "Cross-Language Search (CILI)",
  "Writing Assistance",
  "Learning Mode",
  "Settings",
  "Data Manager",
  "Help",
  "Exit",
];

interface MenuProps {
  onSelect?: (item: string) => void;
  extraItems?: string[];
}

// Memoized icon mapping for better performance
const getItemIcon = (item: string): string => {
  switch (item) {
    case "Word Search":
      return "🔍";
    case "Synset Explorer":
      return "🌐";
    case "Sense Browser":
      return "📖";
    case "Cross-Language Search (CILI)":
      return "🌍";
    case "Writing Assistance":
      return "✍️ ";
    case "Learning Mode":
      return "🎓";
    case "Settings":
      return "⚙️ ";
    case "Data Manager":
      return "📦";
    case "Help":
      return "❓";
    case "Exit":
      return "🚪";
    default:
      return "•";
  }
};

// Memoized details mapping
const getItemDetails = (item: string): string => {
  switch (item) {
    case "Word Search":
      return "Find words and their definitions. Type a word and press Enter to search.";
    case "Synset Explorer":
      return "Explore word synsets and semantic relations. Navigate through WordNet's semantic network.";
    case "Sense Browser":
      return "Browse different word senses and meanings. See all possible interpretations of a word.";
    case "Cross-Language Search (CILI)":
      return "Find word equivalents across multiple languages using CILI (Cross-Lingual Interlingual Index) identifiers.";
    case "Writing Assistance":
      return "Find synonyms, antonyms, and alternatives to improve your writing. Get context-aware suggestions.";
    case "Learning Mode":
      return "Get simplified definitions and examples perfect for language learning. Beginner-friendly explanations.";
    case "Settings":
      return "Configure lexicon preferences, language settings, and application behavior.";
    case "Data Manager":
      return "Download, manage, and maintain WordNet data files. Monitor disk usage and cache status.";
    case "Help":
      return "Show comprehensive help, keyboard shortcuts, and navigation guide.";
    case "Exit":
      return "Safely exit the WordNet CLI application.";
    default:
      return "Select a menu item to see detailed information about each feature.";
  }
};

// Memoized category mapping
const getItemCategory = (item: string): string => {
  switch (item) {
    case "Word Search":
    case "Synset Explorer":
    case "Sense Browser":
      return "Search & Explore";
    case "Cross-Language Search (CILI)":
    case "Writing Assistance":
    case "Learning Mode":
      return "Language Tools";
    case "Settings":
    case "Data Manager":
      return "System";
    case "Help":
    case "Exit":
      return "Navigation";
    default:
      return "Other";
  }
};

const Menu: React.FC<MenuProps> = ({ onSelect, extraItems = [] }) => {
  // Use the new layout system that accounts for app-level UI elements
  const layoutContext = useLayoutContext();
  const layout = calculateComponentLayout(layoutContext, 'menu');

  // Memoized menu items to prevent unnecessary re-renders
  const MENU_ITEMS = useMemo(
    () => [
      ...BASE_MENU_ITEMS.slice(0, -2),
      ...extraItems,
      ...BASE_MENU_ITEMS.slice(-2),
    ],
    [extraItems]
  );

  const [highlighted, setHighlighted] = useState(MENU_ITEMS[0]);

  // Memoized options for Select component
  const options = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        label: `${getItemIcon(item)}  ${item}`,
        value: item,
        key: item,
      })),
    [MENU_ITEMS]
  );

  // Memoized select handler
  const handleSelect = useCallback(
    (value: string) => {
      setHighlighted(value);
      if (onSelect) {
        onSelect(value);
      } else if (value === "Exit") {
        process.exit(0);
      }
    },
    [onSelect]
  );

  // Global input handling
  useInput((_, key) => {
    if (key.escape) {
      process.exit(0);
    }
  });

  // If no content height available, render minimal content
  if (layout.contentHeight <= 0) {
    return (
      <Box flexDirection="column" height="100%">
        <Text color="red">Terminal too small to display menu</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Header - only render if there's space */}
      {layout.menuHeaderLines > 0 && (
        <Box marginBottom={1}>
          <Text color="cyan" bold>
            📋 WordNet CLI - Main Menu
          </Text>
        </Box>
      )}

      {/* Main Content */}
      <Box flexGrow={1} height={layout.contentHeight}>
        {/* Left Panel: Menu */}
        <Box
          flexDirection="column"
          flexGrow={1}
          minWidth={layoutContext.isWide ? 40 : layoutContext.isMedium ? 35 : 30}
          borderStyle="round"
          borderColor="cyan"
          marginRight={1}
          padding={layout.menuPanelPadding > 0 ? 1 : 0}
          height={layout.contentHeight}
        >
          {/* Menu Header - only render if there's space */}
          {layout.menuHeaderLines > 0 && (
            <Box marginBottom={1}>
              <Text color="cyan" bold>
                Available Features
              </Text>
            </Box>
          )}

          <Box flexDirection="column" flexGrow={1}>
            <Select
              options={options}
              onChange={handleSelect}
              visibleOptionCount={layout.menuOptionRows}
            />
          </Box>

          {/* Menu Controls - only render if there's space */}
          {layout.menuControlsLines > 0 && (
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                ↑↓: Navigate | Enter: Select | Esc: Exit
              </Text>
            </Box>
          )}
        </Box>

        {/* Right Panel: Details - only render if there's space */}
        {layout.contentHeight > 5 && (
          <Box
            flexDirection="column"
            flexGrow={2}
            minWidth={layoutContext.isWide ? 50 : layoutContext.isMedium ? 40 : 35}
            height={layout.contentHeight}
            borderStyle="round"
            borderColor="green"
            padding={1}
          >
            <Box marginBottom={1}>
              <Text color="green" bold>
                Feature Details
              </Text>
            </Box>

            <Box marginBottom={1}>
              <Badge color="blue">{getItemCategory(highlighted)}</Badge>
            </Box>

            <Box flexGrow={1} paddingY={1}>
              <Text color="white" wrap="wrap">
                {getItemDetails(highlighted)}
              </Text>
            </Box>

            {/* Status Alert */}
            <Box marginTop={1}>
              <Alert variant="info">
                <Text>Ready to explore WordNet data</Text>
              </Alert>
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer - only render if there's space */}
      {layout.contentHeight > 8 && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Ctrl+D: Debug Panel | Ctrl+C: Exit | Tab: Switch Panels
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Menu;
