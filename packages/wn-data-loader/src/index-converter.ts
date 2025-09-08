import type { WordNetDataSourceRegistry, WordNetDataSource } from "./types.js";

/**
 * Convert index.json format to WordNetDataSourceRegistry format
 * This allows the WordNetProcessor to use the same data sources as the main application
 */
export function convertIndexToDataSources(indexData: any): WordNetDataSourceRegistry {
  const dataSources: WordNetDataSourceRegistry = {};

  for (const [projectId, projectData] of Object.entries(indexData)) {
    if (typeof projectData !== 'object' || projectData === null) continue;
    
    const project = projectData as any;
    
    // Skip projects with errors
    if (project.error) continue;
    
    // Process versions
    if (project.versions && typeof project.versions === 'object') {
      for (const [version, versionData] of Object.entries(project.versions)) {
        if (typeof versionData !== 'object' || versionData === null) continue;
        
        const versionInfo = versionData as any;
        
        // Skip versions with errors
        if (versionInfo.error) continue;
        
        const fullProjectId = `${projectId}:${version}`;
        
        // Handle single URL or multiple URLs
        let urls: string[] = [];
        if (typeof versionInfo.url === 'string') {
          // Handle malformed URLs with newlines and whitespace
          const urlString = versionInfo.url.trim();
          if (urlString.includes('\n')) {
            // Split by newlines and clean up each URL
            urls = urlString.split('\n')
              .map(url => url.trim())
              .filter(url => url.length > 0 && url.startsWith('http'));
          } else {
            urls = [urlString];
          }
        } else if (Array.isArray(versionInfo.url)) {
          urls = versionInfo.url;
        }
        
        // Use the first URL as the primary URL
        if (urls.length > 0) {
          const primaryUrl = urls[0];
          
          // Determine format based on URL extension
          let format = 'xml';
          if (primaryUrl.includes('.tar.gz') || primaryUrl.includes('.tgz')) {
            format = 'tar.gz';
          } else if (primaryUrl.includes('.tar.xz')) {
            format = 'tar.xz';
          } else if (primaryUrl.includes('.xml.gz')) {
            format = 'xml.gz';
          } else if (primaryUrl.includes('.gz')) {
            format = 'gz';
          } else if (primaryUrl.includes('.xz')) {
            format = 'xz';
          }
          
          dataSources[fullProjectId] = {
            id: fullProjectId,
            name: `${project.label || projectId} ${version}`,
            language: project.language || 'unknown',
            version: version,
            url: primaryUrl,
            format: format,
            description: project.label || `WordNet data for ${projectId} version ${version}`,
            size: 'Unknown',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
      }
    }
  }
  
  return dataSources;
}

/**
 * Load and convert index.json data
 */
export async function loadIndexDataSources(indexUrl?: string): Promise<WordNetDataSourceRegistry> {
  // For now, return empty registry - this would be implemented to load from URL
  // or use a default index.json if no URL is provided
  return {};
}
