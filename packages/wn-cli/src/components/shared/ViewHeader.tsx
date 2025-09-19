import React from 'react';
import { Box, Text } from 'ink';
import { Badge } from '@inkjs/ui';

interface ViewHeaderProps {
  title: string;
  icon?: string;
  lexicon?: string;
  language?: string;
  subtitle?: string;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  icon = '📋',
  lexicon,
  language,
  subtitle
}) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          {icon} {title}
        </Text>
      </Box>
      
      {(lexicon || language) && (
        <Box marginBottom={1}>
          <Text dimColor>
            {lexicon && <Text>Lexicon: <Badge color="green">{lexicon}</Badge></Text>}
            {lexicon && language && <Text> | </Text>}
            {language && <Text>Language: <Badge color="yellow">{language}</Badge></Text>}
          </Text>
        </Box>
      )}
      
      {subtitle && (
        <Box marginBottom={1}>
          <Text dimColor>{subtitle}</Text>
        </Box>
      )}
    </Box>
  );
};

export default ViewHeader; 