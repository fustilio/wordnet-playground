/**
 * Core error classes for the wn-ts library
 */

// Error types
export class WnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnError';
  }
}

export class DatabaseError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProjectError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class WnWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnWarning';
  }
}
