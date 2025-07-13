import React from 'react';
import { Box, Text } from 'ink';
import { useStdoutDimensions } from '../../utils/hooks/useStdOutDimensions.js';

interface StatusBarProps {
  currentView: string;
  lexicon?: string;
  language?: string;
  additionalInfo?: string;
  showDebug?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentView,
  lexicon,
  language,
  additionalInfo: _,
  showDebug = false
}) => {
  const { columns } = useStdoutDimensions();

  const leftText = `Current: ${currentView}`;
  const centerText = lexicon && language ? `Lexicon: ${lexicon} | Lang: ${language}` : '';
  const rightText = `Ctrl+D: Debug | Ctrl+C: Exit | ?: Help`;
  
  const availableSpace = columns - leftText.length - rightText.length - centerText.length - 6; // 6 for spacing
  const truncatedCenterText = availableSpace > 0 ? centerText.substring(0, availableSpace) : '';

  return (
    <Box 
      width="100%" 
      paddingX={1}
      paddingY={0}
    >
      <Text color="black" bold>{leftText}</Text>
      {truncatedCenterText && (
        <>
          <Box flexGrow={1} />
          <Text color="black">{truncatedCenterText}</Text>
        </>
      )}
      <Box flexGrow={1} />
      <Text color="black">{rightText}</Text>
      {showDebug && (
        <Text color="yellow"> | Debug Mode</Text>
      )}
    </Box>
  );
};

export default StatusBar; 