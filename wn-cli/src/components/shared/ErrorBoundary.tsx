import React from 'react';
import { Box, Text } from 'ink';
import { Alert } from '@inkjs/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console for debugging
    console.error('TUI Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            errorInfo={this.state.errorInfo!} 
          />
        );
      }

      return (
        <Box 
          borderStyle="round" 
          borderColor="red" 
          padding={2} 
          flexDirection="column"
        >
          <Alert variant="error">
            <Text bold>Oops! Something went wrong.</Text>
          </Alert>
          
          <Box marginTop={1}>
            <Text>An unexpected error occurred in the UI.</Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color="dim">
              Error: {this.state.error?.message || 'Unknown error'}
            </Text>
          </Box>
          
          {this.state.errorInfo && (
            <Box marginTop={1}>
              <Text color="dim" dimColor>
                Component Stack: {this.state.errorInfo.componentStack}
              </Text>
            </Box>
          )}
          
          <Box marginTop={2}>
            <Text color="yellow">
              Press Ctrl+C to exit or restart the application.
            </Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 