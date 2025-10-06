/**
 * User-friendly error classes for WordNet TypeScript
 */

export class WordNetError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public solutions: string[] = [],
    public cause?: Error
  ) {
    super(message);
    this.name = 'WordNetError';
  }
}

export class DatabaseError extends WordNetError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      'Failed to access WordNet database',
      [
        'Check if the database file exists and is readable',
        'Try re-downloading the data: await download("oewn:2024")',
        'Check file permissions in your data directory'
      ],
      cause
    );
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends WordNetError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      'Invalid WordNet configuration',
      [
        'Check your lexicon identifier (e.g., "oewn:2024")',
        'Verify your data directory path',
        'Ensure all required options are provided'
      ],
      cause
    );
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends WordNetError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      'Network error while downloading WordNet data',
      [
        'Check your internet connection',
        'Try again in a few minutes',
        'Use a different mirror if available'
      ],
      cause
    );
    this.name = 'NetworkError';
  }
}
