import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useLayoutContext, calculateComponentLayout } from './layout-helpers.js';

interface LayoutTestToolProps {
  onExit: () => void;
}

interface TestScenario {
  name: string;
  columns: number;
  rows: number;
  hasError: boolean;
  hasDebugPanel: boolean;
}

const testScenarios: TestScenario[] = [
  { name: 'Small Terminal', columns: 60, rows: 20, hasError: false, hasDebugPanel: false },
  { name: 'Medium Terminal', columns: 80, rows: 24, hasError: false, hasDebugPanel: false },
  { name: 'Large Terminal', columns: 120, rows: 30, hasError: false, hasDebugPanel: false },
  { name: 'With Error', columns: 80, rows: 24, hasError: true, hasDebugPanel: false },
  { name: 'With Debug Panel', columns: 80, rows: 24, hasError: false, hasDebugPanel: true },
  { name: 'With Both', columns: 80, rows: 24, hasError: true, hasDebugPanel: true },
  { name: 'Very Small', columns: 40, rows: 15, hasError: false, hasDebugPanel: false },
  { name: 'Very Large', columns: 150, rows: 40, hasError: false, hasDebugPanel: false },
];

const componentTypes = ['menu', 'data-manager', 'search', 'settings', 'help'] as const;

export const LayoutTestTool: React.FC<LayoutTestToolProps> = ({ onExit }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentComponent, setCurrentComponent] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const scenario = testScenarios[currentScenario];
  const componentType = componentTypes[currentComponent];

  // Mock terminal dimensions for testing
  const mockDimensions = {
    columns: scenario.columns,
    rows: scenario.rows,
  };

  // Create a mock layout context
  const layoutContext = {
    ...mockDimensions,
    appHeaderHeight: 2,
    errorDisplayHeight: scenario.hasError ? 2 : 0,
    statusBarHeight: 2,
    debugPanelHeight: scenario.hasDebugPanel ? 8 : 0,
    availableHeight: mockDimensions.rows - 2 - (scenario.hasError ? 2 : 0) - 2 - (scenario.hasDebugPanel ? 8 : 0),
    availableWidth: mockDimensions.columns,
    isWide: mockDimensions.columns >= 100,
    isMedium: mockDimensions.columns >= 80,
    isSmall: mockDimensions.columns < 80,
  };

  const layout = calculateComponentLayout(layoutContext, componentType);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onExit();
    } else if (key.leftArrow) {
      setCurrentScenario((prev) => (prev > 0 ? prev - 1 : testScenarios.length - 1));
    } else if (key.rightArrow) {
      setCurrentScenario((prev) => (prev < testScenarios.length - 1 ? prev + 1 : 0));
    } else if (key.upArrow) {
      setCurrentComponent((prev) => (prev > 0 ? prev - 1 : componentTypes.length - 1));
    } else if (key.downArrow) {
      setCurrentComponent((prev) => (prev < componentTypes.length - 1 ? prev + 1 : 0));
    } else if (input === 'd') {
      setShowDetails(!showDetails);
    } else if (input === 'h') {
      // Show help
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* Compact Header */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text bold>Layout Test Tool</Text>
        <Text> | ←→:scenario ↑↓:component d:details q:exit</Text>
      </Box>

      {/* Scenario and Component Info - Combined */}
      <Box marginBottom={1}>
        <Text bold>Scenario: </Text>
        <Text color="cyan">{scenario.name}</Text>
        <Text> ({scenario.columns}x{scenario.rows})</Text>
        {scenario.hasError && <Text color="red"> [E]</Text>}
        {scenario.hasDebugPanel && <Text color="yellow"> [D]</Text>}
        <Text> | </Text>
        <Text bold>Component: </Text>
        <Text color="green">{componentType}</Text>
      </Box>

      {/* Key Layout Info - Compact */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text bold>Key Metrics:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>Available: {layoutContext.availableWidth} x {layoutContext.availableHeight}</Text>
          <Text>Content: {layout.contentWidth} x {layout.contentHeight}</Text>
          <Text>MaxVisible: {layout.maxVisibleRows} | Reserved: {layout.reservedLines}</Text>
          {componentType === 'menu' && (
            <Text>Menu Options: {layout.menuOptionRows} | Header: {layout.menuHeaderLines} | Controls: {layout.menuControlsLines}</Text>
          )}
        </Box>
      </Box>

      {/* Responsive Info - Compact */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text bold>Responsive:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>Breakpoints: Wide={layoutContext.isWide.toString()} Medium={layoutContext.isMedium.toString()} Small={layoutContext.isSmall.toString()}</Text>
          <Text>Columns: Lexicon={layout.lexiconWidth} Status={layout.statusWidth} Size={layout.sizeWidth}</Text>
        </Box>
      </Box>

      {/* App UI Consumption - Compact */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Text bold>App UI Space:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>Header: {layoutContext.appHeaderHeight} | Error: {layoutContext.errorDisplayHeight} | Status: {layoutContext.statusBarHeight} | Debug: {layoutContext.debugPanelHeight}</Text>
          <Text>Total Reserved: {layoutContext.appHeaderHeight + layoutContext.errorDisplayHeight + layoutContext.statusBarHeight + layoutContext.debugPanelHeight}</Text>
        </Box>
      </Box>

      {showDetails && (
        <Box borderStyle="single" padding={1} marginBottom={1}>
          <Text bold>Raw Data (press 'd' to hide):</Text>
          <Box marginLeft={2}>
            <Text>Context: {JSON.stringify(layoutContext, null, 1)}</Text>
            <Text>Layout: {JSON.stringify(layout, null, 1)}</Text>
          </Box>
        </Box>
      )}

      {/* Navigation - Compact */}
      <Box borderStyle="single" padding={1}>
        <Text bold>Navigation:</Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>← → : Scenario {currentScenario + 1}/{testScenarios.length}</Text>
          <Text>↑ ↓ : Component {currentComponent + 1}/{componentTypes.length}</Text>
          <Text>d : Toggle details</Text>
          <Text>q : Exit</Text>
        </Box>
      </Box>
    </Box>
  );
}; 