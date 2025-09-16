import { parsePackageId } from 'wn-ts-web';

export interface PackageIdParts {
  base: string;
  version?: string;
  packageVersion?: string;
}

export function isRequirementSatisfied(requirementId: string, loadedPackages: string[]): boolean {
  const requirement = parsePackageId(requirementId);
  
  return loadedPackages.some(loadedPkg => {
    const loaded = parsePackageId(loadedPkg);
    if (requirement.base !== loaded.base) return false;
    if (requirement.version && loaded.version) {
      return requirement.version === loaded.version;
    }
    return true;
  });
}

export function isRequirementAvailable(requirementId: string, availablePackages: Array<{ id: string; versions?: string[] }>): boolean {
  const requirement = parsePackageId(requirementId);
  
  // Handle special case for Open English WordNet version transitions
  if (requirement.base === 'oewn' && requirement.version) {
    const version = parseInt(requirement.version);
    
    // For versions prior to 2021, look for 'ewn' packages instead
    if (version < 2021) {
      return availablePackages.some(pkg => {
        const baseMatches = pkg.id === 'ewn' || pkg.id.startsWith('ewn:');
        if (requirement.version && pkg.versions && pkg.versions.length > 0) {
          return baseMatches && pkg.versions.includes(requirement.version);
        }
        return baseMatches;
      });
    }
  }
  
  return availablePackages.some(pkg => {
    const baseMatches = pkg.id === requirement.base || pkg.id.startsWith(requirement.base + ':');
    if (requirement.version && pkg.versions && pkg.versions.length > 0) {
      return baseMatches && pkg.versions.includes(requirement.version);
    }
    return baseMatches;
  });
}

export function findBestPackageForRequirement(requirementId: string, availablePackages: Array<{ id: string; versions?: string[] }>): { id: string; versions?: string[] } | undefined {
  const req = parsePackageId(requirementId);
  
  // Handle special case for Open English WordNet version transitions
  if (req.base === 'oewn' && req.version) {
    const version = parseInt(req.version);
    
    // For versions prior to 2021, look for 'ewn' packages instead
    if (version < 2021) {
      return availablePackages.find(pkg => {
        const baseMatches = pkg.id === 'ewn' || pkg.id.startsWith('ewn:');
        if (req.version && pkg.versions && pkg.versions.length > 0) {
          return baseMatches && pkg.versions.includes(req.version);
        }
        return baseMatches;
      });
    }
  }
  
  return availablePackages.find(pkg => {
    const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
    if (req.version && pkg.versions && pkg.versions.length > 0) {
      return baseMatches && pkg.versions.includes(req.version);
    }
    return baseMatches;
  });
}

export function getPackageIdToLoad(requirementId: string, bestPackage: { id: string; versions?: string[] }): string {
  const requirement = parsePackageId(requirementId);
  
  // Handle special case for Open English WordNet version transitions
  if (requirement.base === 'oewn' && requirement.version) {
    const version = parseInt(requirement.version);
    
    // For versions prior to 2021, use 'ewn' instead of 'oewn'
    if (version < 2021) {
      return `ewn:${requirement.version}`;
    }
  }
  
  // Handle case where bestPackage has versions and we need to pick the right one
  if (bestPackage.versions && bestPackage.versions.length > 0) {
    // If requirement has a specific version, try to match it
    if (requirement.version) {
      const matchingVersion = bestPackage.versions.find(v => v === requirement.version);
      if (matchingVersion) {
        return `${bestPackage.id}:${matchingVersion}`;
      }
    }
    
    // Otherwise, use the first available version
    return `${bestPackage.id}:${bestPackage.versions[0]}`;
  }
  
  return bestPackage.id;
}
