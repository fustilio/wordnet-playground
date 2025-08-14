/**
 * Worker Factory for wn-ts-web
 *
 * This module provides convenience functions for creating and managing WordNet workers
 * with Comlink integration. It handles the worker setup, API exposure, and provides
 * a clean interface for main thread applications.
 */

import { expose, wrap } from "comlink";
import { createWordNetInstance, WebWordnet, DataLoader } from "./index";
import type { PartOfSpeech } from "wn-ts-core";

// Worker implementation
class WordNetWorker {
  private wordnet: WebWordnet | null = null;
  private dataLoader: DataLoader | null = null;
  private isInitialized = false;

  async initializeWordNet(lexiconId = "oewn:2024") {
    try {
      if (this.isInitialized) {
        // Return existing state if already initialized
        const lexiconStats = await this.wordnet!.getLexiconStatistics();
        const statistics = await this.wordnet!.getStatistics();
        return {
          success: true,
          data: {
            lexiconStats,
            statistics,
            hasInitialState: true,
          },
        };
      }

      // Initialize new instance
      const instance = await createWordNetInstance(lexiconId);
      this.wordnet = instance.wordnet;
      this.dataLoader = instance.dataLoader;
      this.isInitialized = true;

      // Try to get initial state, but don't fail if we get SQLITE_NOMEM
      let lexiconStats = null;
      let statistics = null;
      let hasInitialState = false;

      try {
        // Get lexicon stats first (usually lightweight)
        lexiconStats = await this.wordnet.getLexiconStatistics();

        // Only try to get general statistics if it's not too expensive
        try {
          statistics = await this.wordnet.getStatistics();
          hasInitialState = true;
        } catch (e: any) {
          if (e?.resultCode === 7) {
            // SQLITE_NOMEM
            console.warn(
              "SQLITE_NOMEM during initial statistics fetch, skipping for now"
            );
          } else {
            console.warn("Failed to get initial statistics in worker", e);
          }
        }
      } catch (e: any) {
        if (e?.resultCode === 7) {
          // SQLITE_NOMEM
          console.warn(
            "SQLITE_NOMEM during initial lexicon stats fetch, continuing without initial state"
          );
        } else {
          console.warn("Failed to get initial lexicon stats in worker", e);
        }
      }

      return {
        success: true,
        data: {
          lexiconStats,
          statistics,
          hasInitialState,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async queryWords(term: string, pos?: string) {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const posEnum = pos as PartOfSpeech | undefined;
      const results = await this.wordnet.words(term, posEnum);
      return { success: true, data: results };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async querySynsets(term: string, pos?: string) {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const posEnum = pos as PartOfSpeech | undefined;
      const results = await this.wordnet.synsets(term, posEnum);
      return { success: true, data: results };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async querySenses(term: string, pos?: string) {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const posEnum = pos as PartOfSpeech | undefined;
      const results = await this.wordnet.senses(term, posEnum);
      return { success: true, data: results };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async loadPackage(
    packageId: string,
    options?: { onProgress?: (progress: number) => void }
  ) {
    try {
      if (!this.dataLoader) {
        return { success: false, error: "DataLoader not initialized" };
      }

      await this.dataLoader.downloadAndLoad(packageId, {
        progress: options?.onProgress,
      });

      // Get updated state after successful load
      const statistics = await this.wordnet!.getStatistics();
      const lexiconStats = await this.wordnet!.getLexiconStatistics();

      return {
        success: true,
        data: {
          statistics,
          lexiconStats,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async loadDemoData(options?: { onProgress?: (progress: number) => void }) {
    try {
      if (!this.dataLoader) {
        return { success: false, error: "DataLoader not initialized" };
      }

      // Use the same method as loadPackage for demo data
      await this.dataLoader.downloadAndLoad("oewn:2024", {
        progress: options?.onProgress,
      });

      // Get updated state after successful load
      const statistics = await this.wordnet!.getStatistics();
      const lexiconStats = await this.wordnet!.getLexiconStatistics();

      return {
        success: true,
        data: {
          statistics,
          lexiconStats,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getStatus() {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      // Lightweight status check - only get what's already cached/available
      let lexiconStats = null;
      let statistics = null;

      try {
        // Get lexicon stats (usually lightweight)
        lexiconStats = await this.wordnet.getLexiconStatistics();

        // Only try to get general statistics if it's not too expensive
        try {
          statistics = await this.wordnet.getStatistics();
        } catch (e: any) {
          if (e?.resultCode === 7) {
            // SQLITE_NOMEM
            console.warn(
              "SQLITE_NOMEM during status statistics fetch, skipping"
            );
          } else {
            console.warn("Failed to get statistics during status check", e);
          }
        }
      } catch (e: any) {
        if (e?.resultCode === 7) {
          // SQLITE_NOMEM
          console.warn("SQLITE_NOMEM during status lexicon stats fetch");
        } else {
          console.warn("Failed to get lexicon stats during status check", e);
        }
      }

      return {
        success: true,
        data: {
          lexiconStats,
          statistics,
          hasData: !!(lexiconStats && lexiconStats.length > 0),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async hasLoadedData(packageId?: string) {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      // Lightweight check for loaded data
      try {
        const lexiconStats = await this.wordnet.getLexiconStatistics();
        if (packageId) {
          // Check if specific package is loaded
          const hasPackage = lexiconStats.some(
            (ls: any) => ls.lexiconId === packageId
          );
          return {
            success: true,
            data: { hasPackage, loadedCount: lexiconStats.length },
          };
        } else {
          // Return general loaded status
          return {
            success: true,
            data: {
              hasData: lexiconStats.length > 0,
              loadedCount: lexiconStats.length,
            },
          };
        }
      } catch (e: any) {
        if (e?.resultCode === 7) {
          // SQLITE_NOMEM
          console.warn("SQLITE_NOMEM during hasLoadedData check");
          // On SQLITE_NOMEM, assume no data to be safe
          return {
            success: true,
            data: { hasPackage: false, hasData: false, loadedCount: 0 },
          };
        } else {
          console.warn("Failed to check loaded data status", e);
          return { success: false, error: e.message };
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async clearData() {
    try {
      if (!this.dataLoader) {
        return { success: false, error: "DataLoader not initialized" };
      }

      await this.dataLoader.clearAllData();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getStatistics() {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const statistics = await this.wordnet.getStatistics();
      return { success: true, data: statistics };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getLexiconStatistics() {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const lexiconStats = await this.wordnet.getLexiconStatistics();
      return { success: true, data: lexiconStats };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getPartOfSpeechDistribution() {
    try {
      if (!this.wordnet) {
        return { success: false, error: "WordNet not initialized" };
      }

      const posDistribution = await this.wordnet.getPartOfSpeechDistribution();
      return { success: true, data: posDistribution };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

// Export types for consumers
export interface WordNetWorkerAPI {
  // Initialization
  initializeWordNet(lexiconId?: string): Promise<{
    success: boolean;
    data?: {
      lexiconStats: any[];
      statistics: any;
      hasInitialState: boolean;
    };
    error?: string;
  }>;

  // Query operations
  queryWords(
    term: string,
    pos?: string
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }>;

  querySynsets(
    term: string,
    pos?: string
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }>;

  querySenses(
    term: string,
    pos?: string
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }>;

  // Data loading operations
  loadPackage(
    packageId: string,
    options?: {
      onProgress?: (progress: number) => void;
    }
  ): Promise<{
    success: boolean;
    data?: {
      statistics: any;
      lexiconStats: any[];
    };
    error?: string;
  }>;

  loadDemoData(options?: { onProgress?: (progress: number) => void }): Promise<{
    success: boolean;
    data?: {
      statistics: any;
      lexiconStats: any[];
    };
    error?: string;
  }>;

  // Status and utility operations
  getStatus(): Promise<{
    success: boolean;
    data?: {
      lexiconStats: any[];
      statistics: any;
      hasData: boolean;
    };
    error?: string;
  }>;

  hasLoadedData(packageId?: string): Promise<{
    success: boolean;
    data?: {
      hasPackage?: boolean;
      hasData?: boolean;
      loadedCount: number;
    };
    error?: string;
  }>;

  clearData(): Promise<{
    success: boolean;
    error?: string;
  }>;

  // Statistics operations
  getStatistics(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;

  getLexiconStatistics(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }>;

  getPartOfSpeechDistribution(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
}

// Factory function for creating workers in main thread
export function createWordNetWorker(workerUrl: string | URL): WordNetWorkerAPI {
  const workerInstance = new Worker(workerUrl, { type: "module" });
  return wrap<WordNetWorkerAPI>(workerInstance);
}

// Convenience function for creating a worker with the default URL
export function createDefaultWordNetWorker(): WordNetWorkerAPI {
  // This assumes the worker script is at the same path as the main script
  // Applications should provide their own worker URL
  throw new Error(
    "Please provide a worker URL. Use createWordNetWorker(workerUrl) instead."
  );
}
