/**
 * Web Worker for handling heavy WordNet operations
 * Prevents the main thread from freezing during database operations
 */

import { createWordNetInstance } from 'wn-ts-web';

let wordnet: any = null;
let dataLoader: any = null;

// Helper function to detect development environment
function isDevelopment(): boolean {
  // In a worker, we can't access window.location, so we'll use a different approach
  // We can check if we're running on localhost by looking at the import.meta.url
  try {
    const url = new URL(import.meta.url);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.port === '5173';
  } catch {
    // Fallback: assume development if we can't determine
    return true;
  }
}

// Override the toProxyUrl method in the data loader to work in workers
function setupWorkerProxy(dataLoader: any) {
  if (dataLoader && typeof dataLoader.toProxyUrl === 'function') {
    // Store the original method
    // const originalToProxyUrl = dataLoader.toProxyUrl;
    
    // Override with worker-compatible version
    dataLoader.toProxyUrl = function(url: string): string {
      // Check if we're in development environment
      if (!isDevelopment()) {
        return url; // Return original URL in production
      }

      console.log(`🔧 Worker: Original URL: ${url}`);

      // Convert external URLs to proxy URLs
      if (url.includes("en-word.net")) {
        const proxyUrl = url.replace("https://en-word.net", "/api/en-word-net");
        console.log(`🔧 Worker: Proxied to: ${proxyUrl}`);
        return proxyUrl;
      }

      if (url.includes("raw.githubusercontent.com")) {
        const proxyUrl = url.replace(
          "https://raw.githubusercontent.com",
          "/api/raw-github"
        );
        console.log(`🔧 Worker: Proxied to: ${proxyUrl}`);
        return proxyUrl;
      }

      if (url.includes("github.com/globalwordnet")) {
        const proxyUrl = url.replace(
          "https://github.com/globalwordnet",
          "/api/globalwordnet"
        );
        console.log(`🔧 Worker: Proxied to: ${proxyUrl}`);
        return proxyUrl;
      }

      if (url.includes("github.com")) {
        const proxyUrl = url.replace("https://github.com", "/api/github");
        console.log(`🔧 Worker: Proxied to: ${proxyUrl}`);
        return proxyUrl;
      }

      // For any other external URL, use the generic proxy
      if (url.startsWith("https://")) {
        const proxyUrl = url.replace("https://", "/api/external/");
        console.log(`🔧 Worker: Proxied to: ${proxyUrl}`);
        return proxyUrl;
      }

      console.log(`🔧 Worker: No proxy needed: ${url}`);
      return url;
    };
    
    console.log('🔧 Worker: Proxy URL override installed');
  }
}

// Expose functions for Comlink
export async function initializeWordNet() {
  try {
    console.log('🔧 Worker: Starting WordNet initialization...');
    console.log('🔧 Worker: About to call createWordNetInstance()...');
    
    const instance = await createWordNetInstance();
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    
    // Setup worker-compatible proxy URL handling
    setupWorkerProxy(dataLoader);
    
    console.log('🔧 Worker: createWordNetInstance() completed:', instance);
    console.log('🔧 Worker: WordNet instance created successfully');
    console.log('🔧 Worker: wordnet object:', wordnet ? 'available' : 'null');
    console.log('🔧 Worker: dataLoader object:', dataLoader ? 'available' : 'null');
    
    return { success: true };
  } catch (error) {
    console.error('🔧 Worker: Error initializing WordNet:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loadPackage(packageId: string) {
  try {
    if (!dataLoader) {
      return { success: false, error: 'DataLoader not initialized' };
    }
    
    console.log('🔧 Worker: Loading package:', packageId);
    await dataLoader.downloadAndLoad(packageId);
    
    // Get updated statistics after successful load
    console.log('🔧 Worker: Package loaded successfully, fetching updated statistics...');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();
    
    return { 
      success: true, 
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats
      }
    };
  } catch (error) {
    console.error('🔧 Worker: Error loading package:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loadDemoData() {
  try {
    if (!dataLoader) {
      return { success: false, error: 'DataLoader not initialized' };
    }
    
    console.log('🔧 Worker: Loading demo data...');
    await dataLoader.downloadAndLoad('oewn:2024');
    
    // Get updated statistics after successful load
    console.log('🔧 Worker: Demo data loaded successfully, fetching updated statistics...');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();
    
    return { 
      success: true, 
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats
      }
    };
  } catch (error) {
    console.error('🔧 Worker: Error loading demo data:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getStatistics() {
  try {
    if (!wordnet) {
      return { success: false, error: 'WordNet not initialized' };
    }
    
    console.log('🔧 Worker: Getting statistics...');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();
    
    return {
      success: true,
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats
      }
    };
  } catch (error) {
    console.error('🔧 Worker: Error getting statistics:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function queryWords(term: string) {
  try {
    if (!wordnet) {
      return { success: false, error: 'WordNet not initialized' };
    }
    
    console.log('🔧 Worker: Querying words for term:', term);
    const results = await wordnet.queryWords(term);
    
    return { success: true, data: results };
  } catch (error) {
    console.error('🔧 Worker: Error querying words:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function querySynsets(term: string) {
  try {
    if (!wordnet) {
      return { success: false, error: 'WordNet not initialized' };
    }
    
    console.log('🔧 Worker: Querying synsets for term:', term);
    const results = await wordnet.querySynsets(term);
    
    return { success: true, data: results };
  } catch (error) {
    console.error('🔧 Worker: Error querying synsets:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function clearData() {
  try {
    if (!dataLoader) {
      return { success: false, error: 'DataLoader not initialized' };
    }
    
    console.log('🔧 Worker: Clearing all data...');
    await dataLoader.clearAllData();
    
    return { success: true };
  } catch (error) {
    console.error('🔧 Worker: Error clearing data:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Initialize when worker loads
console.log('🔧 Worker: Worker script loaded and ready');