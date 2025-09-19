import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStdoutDimensions } from "../utils/hooks/useStdOutDimensions.js";

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  debugInfo: Record<string, any>;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  isVisible, 
  onToggle, 
  debugInfo 
}) => {
  const { columns, rows } = useStdoutDimensions();
  const [expanded, setExpanded] = useState(false);

  useInput((input, key) => {
    if (key.ctrl && input === 'd') {
      onToggle();
    }
    if (isVisible && key.return) {
      setExpanded(!expanded);
    }
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Box 
      borderStyle="round" 
      borderColor="yellow" 
      padding={1}
      margin={1}
      flexDirection="column"
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="yellow" bold>
          🐛 Debug Panel (Ctrl+D to hide)
        </Text>
        <Text color="dim">
          {expanded ? "Collapse [Enter]" : "Expand [Enter]"}
        </Text>
      </Box>

      <Box flexDirection="column" gap={0}>
        <Text color="cyan">Terminal: {columns}x{rows}</Text>
        <Text color="cyan">Timestamp: {new Date().toISOString()}</Text>
        
        {expanded && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="yellow" bold>Debug Info:</Text>
            {Object.entries(debugInfo).map(([key, value]) => (
              <Box key={key} marginLeft={2}>
                <Text color="green">{key}: </Text>
                <Text color="white">
                  {typeof value === 'object' 
                    ? JSON.stringify(value, null, 2) 
                    : String(value)
                  }
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DebugPanel; 