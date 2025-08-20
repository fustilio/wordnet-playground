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
  
  return availablePackages.find(pkg => {
    const baseMatches = pkg.id === req.base || pkg.id.startsWith(req.base + ':');
    if (req.version && pkg.versions && pkg.versions.length > 0) {
      return baseMatches && pkg.versions.includes(req.version);
    }
    return baseMatches;
  });
}

export function getPackageIdToLoad(_requirementId: string, bestPackage: { id: string }): string {
  return bestPackage.id;
}
