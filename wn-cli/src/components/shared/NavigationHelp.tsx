import React from 'react';
import { Box, Text } from 'ink';

interface NavigationHelpProps {
  shortcuts: Array<{ key: string; description: string }>;
  additionalInfo?: string;
}

const NavigationHelp: React.FC<NavigationHelpProps> = ({
  shortcuts,
  additionalInfo
}) => {
  return (
    <Box marginTop={1} paddingY={1}>
      <Text dimColor>
        ⌨️  {shortcuts.map((shortcut, index) => (
          <Text key={index}>
            {index > 0 && ' | '}
            {shortcut.key}: {shortcut.description}
          </Text>
        ))}
      </Text>
      {additionalInfo && (
        <Box marginTop={1}>
          <Text dimColor>{additionalInfo}</Text>
        </Box>
      )}
    </Box>
  );
};

export default NavigationHelp; 