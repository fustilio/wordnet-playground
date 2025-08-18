/**
 * Utility functions for handling WordNet package IDs and matching
 */

export interface PackageIdParts {
  base: string;
  version?: string;
  packageVersion?: string;
}

/**
 * Parse a package ID into its component parts
 * Handles different formats:
 * - oewn:2024 (base:version)
 * - oewn:2019:2024 (base:packageVersion:lexiconVersion)
 */
export function parsePackageId(packageId: string): PackageIdParts {
  const parts = packageId.split(':');
  
  if (parts.length === 2) {
    // Format: base:version
    return {
      base: parts[0],
      version: parts[1]
    };
  } else if (parts.length === 3) {
    // Format: base:packageVersion:lexiconVersion
    return {
      base: parts[0],
      packageVersion: parts[1],
      version: parts[2]
    };
  }
  
  // Format: base (no version)
  return {
    base: parts[0]
  };
}

/**
 * Check if a requirement is satisfied by loaded packages
 * @param requirementId - The required package ID (e.g., "oewn:2024")
 * @param loadedPackages - Array of loaded package IDs
 * @returns true if the requirement is satisfied
 */
export function isRequirementSatisfied(requirementId: string, loadedPackages: string[]): boolean {
  const req = parsePackageId(requirementId);
  
  return loadedPackages.some(loadedPkg => {
    const loaded = parsePackageId(loadedPkg);
    
    // Base IDs must match
    if (req.base !== loaded.base) return false;
    
    // If we have a specific version requirement, check if it matches
    if (req.version && loaded.version) {
      return req.version === loaded.version;
    }
    
    // If no specific version requirement, any version is acceptable
    return true;
  });
}

/**
 * Check if a requirement is available in available packages
 * @param requirementId - The required package ID (e.g., "oewn:2024")
 * @param availablePackages - Array of available package objects
 * @returns true if the requirement is available
 */
export function isRequirementAvailable(requirementId: string, availablePackages: any[]): boolean {
  const req = parsePackageId(requirementId);
  
  return availablePackages.some(pkg => {
    // Check if package base ID matches requirement base ID
    const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
    
    // If we have a specific version requirement, check if it's available
    if (req.version && pkg.versions && pkg.versions.length > 0) {
      return baseMatches && pkg.versions.includes(req.version);
    }
    
    // If no specific version, just check base ID match
    return baseMatches;
  });
}

/**
 * Find the best available package for a requirement
 * @param requirementId - The required package ID
 * @param availablePackages - Array of available package objects
 * @returns The best matching package or undefined
 */
export function findBestPackageForRequirement(requirementId: string, availablePackages: any[]): any | undefined {
  const req = parsePackageId(requirementId);
  
  return availablePackages.find(pkg => {
    // Check if package base ID matches requirement base ID
    const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
    
    // If we have a specific version requirement, check if it's available
    if (req.version && pkg.versions && pkg.versions.length > 0) {
      return baseMatches && pkg.versions.includes(req.version);
    }
    
    // If no specific version, just check base ID match
    return baseMatches;
  });
}

/**
 * Generate the package ID to load for a requirement
 * @param requirementId - The required package ID
 * @param bestPackage - The best available package
 * @returns The package ID to load
 */
export function getPackageIdToLoad(requirementId: string, bestPackage: any): string {
  const req = parsePackageId(requirementId);
  
  // We need to return the package ID for downloading, but also need to handle
  // the lexicon ID mapping for data insertion. For now, return the package ID
  // and we'll need to fix the data insertion process separately.
  return bestPackage.id;
}
