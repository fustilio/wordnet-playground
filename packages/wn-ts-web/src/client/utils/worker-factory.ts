/**
 * Worker Factory for wn-ts-web
 *
 * This module provides convenience functions for creating and managing WordNet workers
 * with Comlink integration. It handles the worker setup, API exposure, and provides
 * a clean interface for main thread applications.
 */

import { wrap, type Remote } from "comlink";
import type { WordNetWorkerAPI } from "../../workers/type";

// Factory function for creating workers in main thread
export function createWordNetWorker(workerUrl: string | URL) {
  let resolvedUrl: string | URL;
  
  if (typeof workerUrl === "string") {
    // Handle different URL formats
    if (workerUrl.startsWith('http://') || workerUrl.startsWith('https://')) {
      // Absolute URL - use as is
      resolvedUrl = workerUrl;
    } else if (workerUrl.startsWith('/')) {
      // Root-relative URL - use as is
      resolvedUrl = workerUrl;
    } else {
      // Relative URL - resolve against current location
      resolvedUrl = new URL(workerUrl, window.location.href);
    }
  } else {
    resolvedUrl = workerUrl;
  }
  
  console.log('Creating worker with URL:', resolvedUrl);
  
  const workerInstance = new Worker(resolvedUrl, { type: "module" });
  return wrap<WordNetWorkerAPI>(workerInstance);
}


export type RemoteWordNetWorker = Remote<WordNetWorkerAPI>;