/**
 * Project List Utilities
 * 
 * This module provides utilities to list and filter available WordNet projects
 * from the JSON index for the demo interface.
 */

// Import from wn-ts-web package
import { getAvailableProjects, getProjectDetails, type ProjectInfo } from '../../wn-ts-web/src/index';

/**
 * Get projects by language
 */
export function getProjectsByLanguage(language: string): ProjectInfo[] {
  return getAvailableProjects().filter(project => 
    project.language === language
  );
}

/**
 * Get English WordNet projects
 */
export function getEnglishProjects(): ProjectInfo[] {
  return getProjectsByLanguage('en');
}

/**
 * Get multilingual projects
 */
export function getMultilingualProjects(): ProjectInfo[] {
  return getProjectsByLanguage('mul');
}

/**
 * Get popular projects for demo
 */
export function getPopularProjects(): ProjectInfo[] {
  const popularIds = ['oewn', 'cili', 'omw-en', 'omw-en31'];
  return getAvailableProjects().filter(project => 
    popularIds.includes(project.id)
  );
}

/**
 * Search projects by name or description
 */
export function searchProjects(query: string): ProjectInfo[] {
  const projects = getAvailableProjects();
  const lowerQuery = query.toLowerCase();
  
  return projects.filter(project => 
    project.label.toLowerCase().includes(lowerQuery) ||
    project.description?.toLowerCase().includes(lowerQuery) ||
    project.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get project statistics
 */
export function getProjectStats(): {
  total: number;
  byLanguage: Record<string, number>;
  byType: Record<string, number>;
} {
  const projects = getAvailableProjects();
  const byLanguage: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  projects.forEach(project => {
    // Count by language
    const lang = project.language || 'unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
    
    // Count by type (based on ID prefix)
    const type = project.id.split('-')[0];
    byType[type] = (byType[type] || 0) + 1;
  });
  
  return {
    total: projects.length,
    byLanguage,
    byType
  };
}

// Re-export the main functions for convenience
export { getAvailableProjects, getProjectDetails }; 
