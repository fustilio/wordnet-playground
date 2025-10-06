/**
 * WordNet Worker System
 * 
 * Provides web worker functionality for WordNet operations
 */

export { WordNetOrchestrator } from './wordnet-orchestrator.js';
export { WordNetWorkerClient } from '../client/wordnet-worker-client.js';
export type * from './type.js';

// Helper function to create a WordNet worker
export function createWordNetWorker(): Worker {
  return new Worker(new URL('./wordnet-worker.js', import.meta.url), {
    type: 'module'
  });
}
