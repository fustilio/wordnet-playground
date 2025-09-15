/**
 * Shared LMF version extraction and validation utilities
 * This consolidates all LMF version-related logic to eliminate duplication
 * across wn-ts-node, wn-ts-web, and wn-ts-core
 */

// XML declaration and DOCTYPE patterns
export const DOCTYPE_PATTERN = /<!DOCTYPE LexicalResource SYSTEM "([^"]+)">/;

// Schema URLs for different LMF versions
export const LMF_SCHEMAS = {
  '1.0': 'http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd',
  '1.1': 'http://globalwordnet.github.io/schemas/WN-LMF-1.1.dtd',
  '1.2': 'http://globalwordnet.github.io/schemas/WN-LMF-1.2.dtd',
  '1.3': 'http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd',
  '1.4': 'http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd',
} as const;

// Supported LMF versions
export const SUPPORTED_LMF_VERSIONS = new Set(['1.0', '1.1', '1.2', '1.3', '1.4']);

export type SupportedLMFVersion = keyof typeof LMF_SCHEMAS;

/**
 * Extract LMF version from XML content
 * This is the comprehensive version that handles all extraction methods
 * 
 * @param xmlContent - The XML content to analyze
 * @param options - Extraction options
 * @returns The extracted LMF version, or undefined if not found
 */
export function extractLMFVersion(
  xmlContent: string, 
  options: {
    debug?: boolean;
    defaultVersion?: string;
    allowUnsupported?: boolean;
  } = {}
): string | undefined {
  const { debug = false, defaultVersion } = options;
  
  if (debug) {
    console.log(`[DEBUG] Extracting LMF version from XML content...`);
  }
  
  // First try to find lmfVersion attribute in LexicalResource
  const versionMatch = xmlContent.match(/lmfVersion="([^"]*)"/);
  if (versionMatch) {
    const version = versionMatch[1];
    if (debug) {
      console.log(`[DEBUG] Found lmfVersion attribute: ${version}`);
    }
    return version;
  }
  
  // Look for dc:format content that might contain version info
  const formatMatch = xmlContent.match(/<dc:format>([^<]*)<\/dc:format>/);
  if (formatMatch && formatMatch[1]) {
    const format = formatMatch[1];
    const versionMatch2 = format.match(/WN-LMF\s+(\d+\.\d+)/);
    if (versionMatch2) {
      const version = versionMatch2[1];
      if (debug) {
        console.log(`[DEBUG] Found version in dc:format: ${version}`);
      }
      return version;
    }
  }
  
  // Extract version from DOCTYPE - search entire content
  let version = defaultVersion || '1.0';
  const match = xmlContent.match(DOCTYPE_PATTERN);
  if (match?.[1]) {
    const schemaUrl = match[1];
    if (debug) {
      console.log(`[DEBUG] Found DOCTYPE with schema: ${schemaUrl}`);
    }
    
    // First try to match against supported versions
    let foundSupported = false;
    for (const [ver, url] of Object.entries(LMF_SCHEMAS)) {
      if (url === schemaUrl) {
        version = ver;
        foundSupported = true;
        if (debug) {
          console.log(`[DEBUG] Matched schema URL to supported version: ${version}`);
        }
        break;
      }
    }
    
    // If no supported version found, extract version from URL
    if (!foundSupported) {
      const versionMatch = schemaUrl.match(/WN-LMF-([0-9]+\.[0-9]+)\.dtd$/);
      if (versionMatch && versionMatch[1]) {
        version = versionMatch[1];
        if (debug) {
          console.log(`[DEBUG] Extracted version from schema URL: ${version}`);
        }
      }
    }
  } else {
    if (debug) {
      console.log(`[DEBUG] No DOCTYPE pattern found, using default version: ${version}`);
    }
  }
  
  if (debug) {
    console.log(`[DEBUG] Final extracted version: ${version}`);
  }
  
  return version;
}

/**
 * Extract DTD version from XML content
 * 
 * @param xmlContent - The XML content to analyze
 * @returns The DTD version, or undefined if not found
 */
export function extractDTDVersion(xmlContent: string): string | undefined {
  const dtdMatch = xmlContent.match(/WN-LMF-(\d+\.\d+)\.dtd/);
  return dtdMatch ? dtdMatch[1] : undefined;
}

/**
 * Validate LMF version against supported versions
 * 
 * @param version - The version to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateLMFVersion(
  version: string,
  options: {
    allowUnsupported?: boolean;
    supportedVersions?: Set<string>;
  } = {}
): {
  isValid: boolean;
  isSupported: boolean;
  version: string;
  error?: string;
} {
  const { allowUnsupported = true, supportedVersions = SUPPORTED_LMF_VERSIONS } = options;
  
  if (!version) {
    return {
      isValid: false,
      isSupported: false,
      version,
      error: 'Version is empty or undefined'
    };
  }
  
  const isSupported = supportedVersions.has(version);
  
  if (!isSupported && !allowUnsupported) {
    return {
      isValid: false,
      isSupported: false,
      version,
      error: `Unsupported LMF version: ${version}`
    };
  }
  
  return {
    isValid: true,
    isSupported,
    version
  };
}

/**
 * Extract LMF version with validation
 * This combines extraction and validation in one function
 * 
 * @param xmlContent - The XML content to analyze
 * @param options - Extraction and validation options
 * @returns The extracted and validated version, or undefined if not found/invalid
 */
export function extractAndValidateLMFVersion(
  xmlContent: string,
  options: {
    debug?: boolean;
    defaultVersion?: string;
    allowUnsupported?: boolean;
    supportedVersions?: Set<string>;
  } = {}
): {
  version: string | undefined;
  isValid: boolean;
  isSupported: boolean;
  error?: string;
} {
  const extractedVersion = extractLMFVersion(xmlContent, options);
  
  if (!extractedVersion) {
    return {
      version: undefined,
      isValid: false,
      isSupported: false,
      error: 'No LMF version found in XML content'
    };
  }
  
  const validation = validateLMFVersion(extractedVersion, options);
  
  return {
    version: extractedVersion,
    isValid: validation.isValid,
    isSupported: validation.isSupported,
    ...(validation.error && { error: validation.error })
  };
}

/**
 * Quick scan to get version and estimate number of elements
 * This is the Node.js optimized version that reads from file
 * 
 * @param filePath - Path to the LMF file
 * @param options - Scan options
 * @returns Version and element count information
 */
export async function quickScanLMF(
  filePath: string,
  options: {
    debug?: boolean;
    defaultVersion?: string;
    allowUnsupported?: boolean;
  } = {}
): Promise<{ version: string; elementCount: number; isSupported: boolean }> {
  const { debug = false } = options;
  
  if (debug) {
    console.log(`[DEBUG] Quick scanning file for version and element count...`);
  }
  
  // This function requires Node.js fs module
  let readFile: typeof import('fs/promises').readFile;
  try {
    readFile = require('fs/promises').readFile;
  } catch (error) {
    throw new Error('quickScanLMF requires Node.js environment with fs/promises');
  }
  
  const content = await readFile(filePath, 'utf-8');
  
  // Extract version using the shared logic
  const versionResult = extractAndValidateLMFVersion(content, options);
  
  // Count closing tags to estimate element count
  const elementCount = (content.match(/<\/[^>]+>/g) || []).length + 
                      (content.match(/\/>/g) || []).length;
  
  if (debug) {
    console.log(`[DEBUG] Quick scan: version=${versionResult.version}, isSupported=${versionResult.isSupported}, estimated elements=${elementCount}`);
  }
  
  return { 
    version: versionResult.version || options.defaultVersion || '1.0',
    elementCount,
    isSupported: versionResult.isSupported
  };
}

/**
 * Check if a version is supported
 * 
 * @param version - The version to check
 * @param supportedVersions - Set of supported versions (defaults to SUPPORTED_LMF_VERSIONS)
 * @returns True if the version is supported
 */
export function isSupportedLMFVersion(
  version: string,
  supportedVersions: Set<string> = SUPPORTED_LMF_VERSIONS
): boolean {
  return supportedVersions.has(version);
}

/**
 * Get all supported LMF versions
 * 
 * @returns Array of supported LMF versions
 */
export function getSupportedLMFVersions(): string[] {
  return Array.from(SUPPORTED_LMF_VERSIONS);
}

/**
 * Get schema URL for a given LMF version
 * 
 * @param version - The LMF version
 * @returns The schema URL, or undefined if version not found
 */
export function getSchemaURL(version: string): string | undefined {
  return LMF_SCHEMAS[version as SupportedLMFVersion];
}
