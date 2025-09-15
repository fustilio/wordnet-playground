/**
 * Package/Lexicon ID parsing utilities
 *
 * Supported formats:
 * - base:version            → e.g., oewn:2024
 * - base                    → e.g., oewn
 * 
 * The format is designed to be simple and logical:
 * - base: The package identifier (e.g., oewn for Open English WordNet)
 * - version: The specific version of the package
 */

export interface PackageIdParts {
  base: string;
  version?: string;
}

export function parsePackageId(packageId: string): PackageIdParts {
  const parts = packageId.split(":");

  if (parts.length === 2) {
    const result: PackageIdParts = { base: parts[0]! };
    if (parts[1]) {
      result.version = parts[1];
    }
    return result;
  }

  if (parts.length === 1) {
    return { base: parts[0]! };
  }

  // For any other format, throw an error to prevent data corruption
  if (parts.length > 2) {
    const error = new Error(`Invalid package ID format: "${packageId}". Expected format: base:version or base. Found ${parts.length} parts: [${parts.join(', ')}]`);
    console.error(`Invalid package ID format: ${packageId}. Expected format: base:version or base`);
    throw error;
  }

  return { base: parts[0]! };
}

/**
 * Format a package ID from its parts
 */
export function formatPackageId(parts: PackageIdParts): string {
  if (parts.version) {
    return `${parts.base}:${parts.version}`;
  }
  return parts.base;
}

/**
 * Validate if a package ID follows the expected format
 */
export function isValidPackageId(packageId: string): boolean {
  const parts = packageId.split(":");
  return parts.length === 1 || parts.length === 2;
}

/**
 * Extract the base identifier from a package ID
 */
export function getPackageBase(packageId: string): string {
  return parsePackageId(packageId).base;
}

/**
 * Extract the version from a package ID
 */
export function getPackageVersion(packageId: string): string | undefined {
  return parsePackageId(packageId).version;
}

/**
 * Sanitize a lexicon ID to ensure it follows proper package ID format
 * This function handles cases where lexiconId might already contain version information
 * and prevents creation of malformed package IDs with multiple colons
 */
export function sanitizeLexiconId(lexiconId: string, version?: string): string {
  // First, validate the existing lexiconId format
  if (lexiconId.includes(':')) {
    // Use parsePackageId to validate and throw error if malformed
    parsePackageId(lexiconId); // This will throw if malformed
    // If it parsed successfully, return the original (it's already in correct format)
    return lexiconId;
  }
  
  // If no colons and we have a version, format a proper package ID
  if (version) {
    return formatPackageId({ base: lexiconId, version });
  }
  
  // No version, return as-is
  return lexiconId;
}
