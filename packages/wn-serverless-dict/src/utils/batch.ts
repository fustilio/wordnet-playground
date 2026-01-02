/**
 * Batch processing utilities for memory-efficient operations
 * Inspired by patterns from wn-ts-core batch insert logic
 */

import type { ProgressInfo, BatchProcessingOptions } from '../types/index.js';

/**
 * Default batch processing configuration
 */
export const DEFAULT_BATCH_CONFIG: Required<BatchProcessingOptions> = {
  chunkSize: 100,
  chunkTimeout: 120000, // 2 minutes
  onProgress: () => {} // No-op by default
};

/**
 * Process items in batches with timeout protection and progress tracking
 * @param items - Array of items to process
 * @param processor - Function to process each batch
 * @param options - Batch processing options
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (batch: T[], batchIndex: number) => Promise<R[]>,
  options: BatchProcessingOptions = {}
): Promise<R[]> {
  const config = { ...DEFAULT_BATCH_CONFIG, ...options };
  const { chunkSize, chunkTimeout, onProgress } = config;

  const results: R[] = [];
  const totalItems = items.length;
  const totalChunks = Math.ceil(totalItems / chunkSize);
  const startTime = Date.now();

  console.log(`[Batch] Processing ${totalItems} items in ${totalChunks} chunks (size: ${chunkSize})`);

  for (let i = 0; i < totalChunks; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd = Math.min(chunkStart + chunkSize, totalItems);
    const chunk = items.slice(chunkStart, chunkEnd);

    const chunkStartTime = Date.now();

    try {
      // Process chunk with timeout protection
      const chunkResults = await Promise.race([
        processor(chunk, i),
        createTimeout(chunkTimeout, `Chunk ${i + 1}/${totalChunks} timed out`)
      ]);

      results.push(...chunkResults);

      // Report progress
      const elapsed = Date.now() - startTime;
      const progress = Math.round((chunkEnd / totalItems) * 100);
      const progressInfo: ProgressInfo = {
        step: `Processing batch ${i + 1}/${totalChunks}`,
        progress,
        processed: chunkEnd,
        total: totalItems,
        elapsed
      };

      onProgress(progressInfo);

      const chunkElapsed = Date.now() - chunkStartTime;
      console.log(
        `[Batch] Chunk ${i + 1}/${totalChunks}: ${chunk.length} items processed in ${chunkElapsed}ms (${progress}%)`
      );
    } catch (error) {
      console.error(`[Batch] Error processing chunk ${i + 1}/${totalChunks}:`, error);
      throw error;
    }
  }

  const totalElapsed = Date.now() - startTime;
  console.log(`[Batch] Completed: ${results.length} total results in ${totalElapsed}ms`);

  return results;
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Split array into chunks
 * @param array - Array to split
 * @param chunkSize - Size of each chunk
 */
export function chunk<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process items with concurrency limit
 * Useful for controlling parallel async operations
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });

    const e: Promise<void> = promise.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });

    executing.push(e);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
