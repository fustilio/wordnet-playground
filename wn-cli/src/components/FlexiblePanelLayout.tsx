import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { useStdoutDimensions } from '../utils/hooks/useStdOutDimensions.js';

export interface Panel {
  id: string;
  title: string;
  content: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'flex';
  priority?: 'high' | 'medium' | 'low';
  collapsible?: boolean;
  children?: Panel[];
}

export interface PanelLayout {
  type: 'horizontal' | 'vertical' | 'nested';
  left?: Panel;
  right?: Panel;
  leftSize?: number; // percentage (0-100)
  rightSize?: number; // percentage (0-100)
}

interface FlexiblePanelLayoutProps {
  layout: PanelLayout;
  activePanelId?: string;
  onPanelChange?: (panelId: string) => void;
}

const FlexiblePanelLayout: React.FC<FlexiblePanelLayoutProps> = ({
  layout,
  activePanelId,
  onPanelChange
}) => {
  const { columns, rows } = useStdoutDimensions();
  const [focusedPanel, setFocusedPanel] = useState<string | null>(activePanelId || null);

  // Calculate available height for panels
  const headerHeight = 2; // Layout controls
  const footerHeight = 2; // Navigation help
  const availableHeight = Math.max(8, rows - headerHeight - footerHeight - 6); // More conservative margins

  // Handle keyboard navigation
  useInput((_, key) => {
    if (key.tab) {
      // Cycle through panels
      const panels = getAllPanels(layout);
      const currentIndex = panels.findIndex(p => p.id === focusedPanel);
      const nextIndex = (currentIndex + 1) % panels.length;
      const nextPanel = panels[nextIndex];
      setFocusedPanel(nextPanel.id);
      onPanelChange?.(nextPanel.id);
    }
    
    if (key.escape) {
      setFocusedPanel(null);
    }
  });

  const renderPanel = useCallback((panel: Panel, isActive: boolean = false) => {
    const isFocused = focusedPanel === panel.id;
    
    return (
      <Box
        key={panel.id}
        borderStyle="round"
        borderColor={isFocused ? "cyan" : isActive ? "blue" : "gray"}
        flexDirection="column"
        flexGrow={1}
        minHeight={3}
        padding={1}
      >
        <Box justifyContent="space-between" alignItems="center">
          <Text color={isFocused ? "cyan" : "white"} bold>
            {panel.title}
          </Text>
          {isFocused && (
            <Text color="gray" dimColor>
              [FOCUSED]
            </Text>
          )}
        </Box>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          {panel.content}
        </Box>
      </Box>
    );
  }, [focusedPanel]);

  const renderNestedPanels = useCallback((panels: Panel[]) => {
    return (
      <Box flexDirection="column" flexGrow={1}>
        {panels.map((panel, index) => (
          <Box key={panel.id} marginBottom={index < panels.length - 1 ? 1 : 0}>
            {renderPanel(panel)}
          </Box>
        ))}
      </Box>
    );
  }, [renderPanel]);

  const renderHorizontalLayout = useCallback(() => {
    const leftSize = layout.leftSize || 50;
    const rightSize = layout.rightSize || 50;
    
    return (
      <Box flexDirection="row" height={availableHeight}>
        {/* Left Panel */}
        <Box 
          width={`${leftSize}%`} 
          borderStyle="single" 
          borderColor="blue"
          marginRight={1}
          padding={1}
          height={availableHeight}
        >
          {layout.left && (
            <Box flexDirection="column" height="100%">
              <Box marginBottom={1}>
                <Text bold color="blue">
                  {layout.left.title}
                </Text>
              </Box>
              <Box flexGrow={1} paddingY={1}>
                {layout.left.children ? 
                  renderNestedPanels(layout.left.children) : 
                  layout.left.content
                }
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Panel */}
        <Box 
          width={`${rightSize}%`} 
          borderStyle="single" 
          borderColor="green"
          padding={1}
          height={availableHeight}
        >
          {layout.right && (
            <Box flexDirection="column" height="100%">
              <Box marginBottom={1}>
                <Text bold color="green">
                  {layout.right.title}
                </Text>
              </Box>
              <Box flexGrow={1} paddingY={1}>
                {layout.right.children ? 
                  renderNestedPanels(layout.right.children) : 
                  layout.right.content
                }
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }, [layout, renderNestedPanels, availableHeight]);

  const renderVerticalLayout = useCallback(() => {
    const leftSize = layout.leftSize || 50;
    const rightSize = layout.rightSize || 50;
    const topHeight = Math.floor(availableHeight * (leftSize / 100));
    const bottomHeight = availableHeight - topHeight;
    
    return (
      <Box flexDirection="column" height={availableHeight}>
        {/* Top Panel */}
        <Box 
          height={topHeight} 
          borderStyle="single" 
          borderColor="blue"
          marginBottom={1}
          padding={1}
        >
          {layout.left && (
            <Box flexDirection="column" height="100%">
              <Box marginBottom={1}>
                <Text bold color="blue">
                  {layout.left.title}
                </Text>
              </Box>
              <Box flexGrow={1} paddingY={1}>
                {layout.left.children ? 
                  renderNestedPanels(layout.left.children) : 
                  layout.left.content
                }
              </Box>
            </Box>
          )}
        </Box>

        {/* Bottom Panel */}
        <Box 
          height={bottomHeight} 
          borderStyle="single" 
          borderColor="green"
          padding={1}
        >
          {layout.right && (
            <Box flexDirection="column" height="100%">
              <Box marginBottom={1}>
                <Text bold color="green">
                  {layout.right.title}
                </Text>
              </Box>
              <Box flexGrow={1} paddingY={1}>
                {layout.right.children ? 
                  renderNestedPanels(layout.right.children) : 
                  layout.right.content
                }
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }, [layout, renderNestedPanels, availableHeight]);

  // Helper function to get all panels recursively
  const getAllPanels = (layout: PanelLayout): Panel[] => {
    const panels: Panel[] = [];
    
    if (layout.left) {
      panels.push(layout.left);
      if (layout.left.children) {
        panels.push(...layout.left.children);
      }
    }
    
    if (layout.right) {
      panels.push(layout.right);
      if (layout.right.children) {
        panels.push(...layout.right.children);
      }
    }
    
    return panels;
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Panel Content */}
      <Box flexGrow={1} paddingY={1} height={availableHeight}>
        {layout.type === 'horizontal' && renderHorizontalLayout()}
        {layout.type === 'vertical' && renderVerticalLayout()}
        {layout.type === 'nested' && (
          <Box flexDirection="row" height={availableHeight}>
            {layout.left && (
              <Box flexGrow={1} marginRight={1} padding={1} height={availableHeight}>
                {renderPanel(layout.left)}
              </Box>
            )}
            {layout.right && (
              <Box flexGrow={1} padding={1} height={availableHeight}>
                {renderPanel(layout.right)}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Navigation Help */}
      <Box marginTop={1} paddingY={1}>
        <Text color="gray" dimColor>
          Tab: Navigate panels | Esc: Clear focus | Ctrl+D: Debug
        </Text>
      </Box>
    </Box>
  );
};

export default FlexiblePanelLayout; 