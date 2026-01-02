/**
 * Dictionary configuration management
 * Based on patterns from wn-ts-core project-config.ts
 */

export interface DictionaryVersionConfig {
  version: string;
  limit: number;
  pos: string[] | null;
  description: string;
  recommended?: boolean;
}

export interface DictionaryConfig {
  id: string;
  sourceLang: string;
  targetLang: string;
  label: string;
  versions: Record<string, DictionaryVersionConfig>;
  fallbackUrls?: string[];
  metadata?: {
    bidirectional?: boolean;
    defaultVersion?: string;
    [key: string]: any;
  };
}

/**
 * Predefined dictionary configurations
 */
export const DICTIONARY_CONFIGS: Record<string, DictionaryConfig> = {
  'en-th': {
    id: 'en-th',
    sourceLang: 'en',
    targetLang: 'th',
    label: 'English-Thai Dictionary',
    versions: {
      'mini': {
        version: 'mini',
        limit: 100,
        pos: ['n', 'v'],
        description: 'Ultra-compact, top 100 words',
        recommended: false
      },
      'small': {
        version: 'small',
        limit: 500,
        pos: ['n', 'v', 'a'],
        description: 'Small, top 500 common words',
        recommended: false
      },
      'standard': {
        version: 'standard',
        limit: 1000,
        pos: ['n', 'v', 'a'],
        description: 'Standard dictionary, top 1000 words',
        recommended: true
      },
      'large': {
        version: 'large',
        limit: 3000,
        pos: null,
        description: 'Large dictionary, top 3000 words',
        recommended: false
      }
    },
    metadata: {
      bidirectional: true,
      defaultVersion: 'standard'
    }
  },
  'en-fr': {
    id: 'en-fr',
    sourceLang: 'en',
    targetLang: 'fr',
    label: 'English-French Dictionary',
    versions: {
      'mini': {
        version: 'mini',
        limit: 100,
        pos: ['n', 'v'],
        description: 'Ultra-compact, top 100 words',
        recommended: false
      },
      'small': {
        version: 'small',
        limit: 500,
        pos: ['n', 'v', 'a'],
        description: 'Small, top 500 common words',
        recommended: false
      },
      'standard': {
        version: 'standard',
        limit: 1000,
        pos: ['n', 'v', 'a'],
        description: 'Standard dictionary, top 1000 words',
        recommended: true
      },
      'large': {
        version: 'large',
        limit: 3000,
        pos: null,
        description: 'Large dictionary, top 3000 words',
        recommended: false
      }
    },
    metadata: {
      bidirectional: true,
      defaultVersion: 'standard'
    }
  },
  'th-fr': {
    id: 'th-fr',
    sourceLang: 'th',
    targetLang: 'fr',
    label: 'Thai-French Dictionary',
    versions: {
      'mini': {
        version: 'mini',
        limit: 100,
        pos: ['n', 'v'],
        description: 'Ultra-compact, top 100 words',
        recommended: false
      },
      'small': {
        version: 'small',
        limit: 500,
        pos: ['n', 'v', 'a'],
        description: 'Small, top 500 common words',
        recommended: false
      },
      'standard': {
        version: 'standard',
        limit: 1000,
        pos: ['n', 'v', 'a'],
        description: 'Standard dictionary, top 1000 words',
        recommended: true
      },
      'large': {
        version: 'large',
        limit: 3000,
        pos: null,
        description: 'Large dictionary, top 3000 words',
        recommended: false
      }
    },
    metadata: {
      bidirectional: true,
      defaultVersion: 'standard'
    }
  }
};

/**
 * Get dictionary configuration by ID
 */
export function getDictionaryConfig(id: string): DictionaryConfig | undefined {
  return DICTIONARY_CONFIGS[id];
}

/**
 * Get all available language pairs
 */
export function getAvailableLanguagePairs(): string[] {
  return Object.keys(DICTIONARY_CONFIGS);
}

/**
 * Get recommended version for a language pair
 */
export function getRecommendedVersion(languagePair: string): string {
  const config = getDictionaryConfig(languagePair);
  if (!config) {
    return 'standard';
  }

  // Find recommended version
  for (const [version, versionConfig] of Object.entries(config.versions)) {
    if (versionConfig.recommended) {
      return version;
    }
  }

  // Fallback to default version from metadata
  return config.metadata?.defaultVersion ?? 'standard';
}

/**
 * Check if language pair is bidirectional
 */
export function isBidirectional(languagePair: string): boolean {
  const config = getDictionaryConfig(languagePair);
  return config?.metadata?.bidirectional ?? true;
}

/**
 * Get reverse language pair
 */
export function getReversePair(languagePair: string): string {
  const [lang1, lang2] = languagePair.split('-');
  return `${lang2}-${lang1}`;
}

/**
 * Validate language pair format
 */
export function isValidLanguagePair(languagePair: string): boolean {
  return /^[a-z]{2}-[a-z]{2}$/.test(languagePair);
}
