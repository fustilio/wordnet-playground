import { parsePackageId } from 'wn-ts-web';

export interface PackageIdParts {
  base: string;
  version?: string;
  packageVersion?: string;
}

export function isRequirementSatisfied(requirementId: string, loadedPackages: string[]): boolean {
  const requirement = parsePackageId(requirementId);
  
  return loadedPackages.some(loadedPkg => {
    try {
      const loaded = parsePackageId(loadedPkg);
      if (requirement.base !== loaded.base) return false;
      if (requirement.version && loaded.version) {
        return requirement.version === loaded.version;
      }
      return true;
    } catch (error) {
      console.error('🚨 ERROR in isRequirementSatisfied', { loadedPkg, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
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
  
  console.debug('🔍 findBestPackageForRequirement:', {
    requirementId,
    req,
    availablePackages: availablePackages.map(p => ({ id: p.id, versions: p.versions }))
  });
  
  // Handle special case for Open English WordNet version transitions
  if (req.base === 'oewn' && req.version) {
    const version = parseInt(req.version);
    
    // For versions prior to 2021, look for 'ewn' packages instead
    if (version < 2021) {
      const ewnMatch = availablePackages.find(pkg => {
        const baseMatches = pkg.id === 'ewn' || pkg.id.startsWith('ewn:');
        if (req.version && pkg.versions && pkg.versions.length > 0) {
          return baseMatches && pkg.versions.includes(req.version);
        }
        return baseMatches;
      });
      console.debug('🔍 EWN match for version < 2021:', ewnMatch);
      return ewnMatch;
    }
  }
  
  // First, try to find an exact match (package ID with exact version)
  const exactMatch = availablePackages.find(pkg => pkg.id === requirementId);
  if (exactMatch) {
    console.debug('🔍 Exact match found:', exactMatch);
    return exactMatch;
  }
  
  // Then, try to find a package with the exact version in its versions array
  if (req.version) {
    const versionMatch = availablePackages.find(pkg => {
      const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
      return baseMatches && pkg.versions && pkg.versions.includes(req.version!);
    });
    if (versionMatch) {
      console.debug('🔍 Version match found:', versionMatch);
      return versionMatch;
    }
  }
  
  // For oewn, prioritize newer versions (2024, 2023, 2022, 2021)
  if (req.base === 'oewn') {
    const oewnPackages = availablePackages.filter(pkg => 
      pkg.id === 'oewn' || pkg.id.startsWith('oewn:')
    );
    
    console.debug('🔍 OEWN packages found:', oewnPackages);
    
    // Sort by version (newest first) and return the first one
    const sortedOewnPackages = oewnPackages.sort((a, b) => {
      const aVersion = a.id.includes(':') ? parseInt(a.id.split(':')[1]) : 0;
      const bVersion = b.id.includes(':') ? parseInt(b.id.split(':')[1]) : 0;
      return bVersion - aVersion; // Descending order (newest first)
    });
    
    console.debug('🔍 Sorted OEWN packages:', sortedOewnPackages);
    
    if (sortedOewnPackages.length > 0) {
      console.debug('🔍 Returning newest OEWN package:', sortedOewnPackages[0]);
      return sortedOewnPackages[0];
    }
  }
  
  // Finally, fall back to any base match
  const fallbackMatch = availablePackages.find(pkg => {
    const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
    return baseMatches;
  });
  
  console.debug('🔍 Fallback match:', fallbackMatch);
  return fallbackMatch;
}

export function getPackageIdToLoad(requirementId: string, bestPackage: { id: string; versions?: string[] }): string {
  const requirement = parsePackageId(requirementId);
  
  console.debug('🔍 getPackageIdToLoad:', {
    requirementId,
    requirement,
    bestPackage
  });
  
  // Handle special case for Open English WordNet version transitions
  if (requirement.base === 'oewn' && requirement.version) {
    const version = parseInt(requirement.version);
    
    // For versions prior to 2021, use 'ewn' instead of 'oewn'
    if (version < 2021) {
      const result = `ewn:${requirement.version}`;
      console.debug('🔍 Using EWN for version < 2021:', result);
      return result;
    }
  }
  
  // Check if bestPackage.id already contains a version (has a colon)
  if (bestPackage.id.includes(':')) {
    // bestPackage.id already has a version, return it as-is
    console.debug('🔍 Best package already has version, using as-is:', bestPackage.id);
    return bestPackage.id;
  }
  
  // Handle case where bestPackage has versions and we need to pick the right one
  if (bestPackage.versions && bestPackage.versions.length > 0) {
    // If requirement has a specific version, try to match it
    if (requirement.version) {
      const matchingVersion = bestPackage.versions.find(v => v === requirement.version);
      if (matchingVersion) {
        const result = `${bestPackage.id}:${matchingVersion}`;
        console.debug('🔍 Found matching version:', result);
        return result;
      }
    }
    
    // Otherwise, use the first available version
    const result = `${bestPackage.id}:${bestPackage.versions[0]}`;
    console.debug('🔍 Using first available version:', result);
    return result;
  }
  
  console.debug('🔍 Using best package ID as-is:', bestPackage.id);
  return bestPackage.id;
}
