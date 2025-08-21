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

  // For any other format, treat as invalid and return just the base
  // This provides backward compatibility while encouraging proper format
  if (parts.length > 2) {
    console.warn(`Invalid package ID format: ${packageId}. Expected format: base:version or base`);
    return { base: parts[0]! };
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
