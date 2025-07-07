import { performance } from "perf_hooks";
import {
  WnTsLibrary,
  NaturalLibrary,
  NodeWordNetLibrary,
  WordposLibrary,
  WordsWordNetLibrary,
  WnPybridgeLibrary,
} from "../lib/wordnet-libraries/index.ts";

// Test words for benchmarking and feature testing
export const TEST_WORDS = [
  "run",
  "computer",
  "happy",
  "quickly",
  "information",
  "dog",
  "cat",
  "book",
  "read",
  "write",
  "fast",
  "slow",
  "big",
  "small",
  "good",
  "bad",
  "new",
  "old",
  "high",
  "low",
];

export const TEST_POS = ["n", "v", "a", "r"];

// All available libraries
export const ALL_LIBRARIES = [
  new WnTsLibrary(),
  new NaturalLibrary(),
  new NodeWordNetLibrary(),
  new WordposLibrary(),
  new WordsWordNetLibrary(),
  new WnPybridgeLibrary(),
];

// Focus on the most reliable libraries for testing
export const RELIABLE_LIBRARIES = [
  new WnTsLibrary(),
  new NaturalLibrary(),
  new WnPybridgeLibrary(),
  new WordsWordNetLibrary(),
  new NodeWordNetLibrary(),
  new WordposLibrary(),
];

// Progress tracking utilities
export class ProgressTracker {
  private startTime: number;
  private totalOperations: number;
  private completedOperations: number;
  private lastUpdateTime: number;

  constructor(totalOperations: number, operationName: string) {
    this.startTime = performance.now();
    this.totalOperations = totalOperations;
    this.completedOperations = 0;
    this.lastUpdateTime = this.startTime;
    console.log(`🔄 Starting ${operationName} (${totalOperations} operations)`);
  }

  update(completed: number = 1) {
    this.completedOperations += completed;
    const now = performance.now();

    // Update every 2 seconds or when complete
    if (
      now - this.lastUpdateTime > 2000 ||
      this.completedOperations >= this.totalOperations
    ) {
      const elapsed = (now - this.startTime) / 1000;
      const progress = (this.completedOperations / this.totalOperations) * 100;
      const rate = this.completedOperations / elapsed;
      const remaining = this.totalOperations - this.completedOperations;
      const eta = remaining / rate;

      console.log(
        `📊 Progress: ${this.completedOperations}/${this.totalOperations} (${progress.toFixed(1)}%) - ${elapsed.toFixed(1)}s elapsed, ETA: ${eta.toFixed(1)}s`
      );
      this.lastUpdateTime = now;
    }
  }

  complete() {
    const totalTime = (performance.now() - this.startTime) / 1000;
    console.log(`✅ Completed in ${totalTime.toFixed(2)}s`);
  }
}

// Timeout wrapper to prevent hanging operations
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}

// Enhanced logging with timestamps
export function log(
  message: string,
  level: "info" | "warn" | "error" | "debug" = "info"
) {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  const prefix = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    debug: "🔍",
  }[level];

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Library initialization utilities
export async function initializeLibraries(
  libraries: any[],
  timeoutMs: number = 30000
) {
  log(`🔧 Initializing ${libraries.length} libraries`);
  const progress = new ProgressTracker(
    libraries.length,
    "library initialization"
  );

  const initPromises = libraries.map(async (lib, index) => {
    try {
      log(
        `🔧 Initializing ${lib.name} (${index + 1}/${libraries.length})`,
        "debug"
      );
      await withTimeout(
        () => lib.init(),
        timeoutMs,
        `${lib.name} initialization`
      );
      progress.update();
      return { library: lib.name, success: true };
    } catch (error) {
      log(`${lib.name} initialization failed: ${error}`, "error");
      progress.update();
      return { library: lib.name, success: false, error };
    }
  });

  const results = await Promise.all(initPromises);
  progress.complete();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  log(
    `✅ Initialized ${successful.length}/${libraries.length} libraries successfully`
  );
  if (failed.length > 0) {
    log(
      `❌ Failed to initialize: ${failed.map((f) => f.library).join(", ")}`,
      "warn"
    );
  }

  return results;
}

// Library cleanup utilities
export async function cleanupLibraries(
  libraries: any[],
  timeoutMs: number = 10000
) {
  log(`🧹 Cleaning up ${libraries.length} libraries`);
  const progress = new ProgressTracker(libraries.length, "library cleanup");

  const cleanupPromises = libraries.map(async (lib) => {
    try {
      if (lib.cleanup) {
        log(`🧹 Cleaning up ${lib.name}`, "debug");
        await withTimeout(
          () => lib.cleanup!(),
          timeoutMs,
          `${lib.name} cleanup`
        );
      }
      progress.update();
      return { library: lib.name, success: true };
    } catch (error) {
      log(`${lib.name} cleanup failed: ${error}`, "error");
      progress.update();
      return { library: lib.name, success: false, error };
    }
  });

  const results = await Promise.all(cleanupPromises);
  progress.complete();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  log(
    `✅ Cleaned up ${successful.length}/${libraries.length} libraries successfully`
  );
  if (failed.length > 0) {
    log(
      `❌ Failed to cleanup: ${failed.map((f) => f.library).join(", ")}`,
      "warn"
    );
  }

  return results;
}

// Feature parity testing utilities
export interface ParityTestResult {
  library: string;
  operation: string;
  success: boolean;
  result?: any;
  error?: string;
  normalized?: any;
}

export async function runParityTest(
  libraries: any[],
  operation: (lib: any) => Promise<any>,
  operationName: string,
  timeoutMs: number = 15000
): Promise<ParityTestResult[]> {
  log(`🔍 Running parity test: ${operationName}`);
  const progress = new ProgressTracker(libraries.length, operationName);

  const testPromises = libraries.map(async (lib) => {
    try {
      if (lib.isInitialized && !lib.isInitialized()) {
        log(`${lib.name} not initialized, skipping`, "warn");
        progress.update();
        return {
          library: lib.name,
          operation: operationName,
          success: false,
          error: "Not initialized",
        };
      }

      const result = await withTimeout(
        () => operation(lib),
        timeoutMs,
        `${lib.name} ${operationName}`
      );

      const normalized = lib.normalizeSynsets
        ? lib.normalizeSynsets(result)
        : result;

      progress.update();
      return {
        library: lib.name,
        operation: operationName,
        success: true,
        result,
        normalized,
      };
    } catch (error) {
      log(`${lib.name} ${operationName} failed: ${error}`, "error");
      progress.update();
      return {
        library: lib.name,
        operation: operationName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const results = await Promise.all(testPromises);
  progress.complete();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  log(
    `✅ ${operationName}: ${successful.length}/${libraries.length} libraries succeeded`
  );
  if (failed.length > 0) {
    log(
      `❌ ${operationName} failed for: ${failed.map((f) => f.library).join(", ")}`,
      "warn"
    );
  }

  return results;
}

// Performance measurement utilities
export interface PerformanceResult {
  library: string;
  operation: string;
  time: number;
  memory?: number;
  success: boolean;
  error?: string;
}

export async function measurePerformance(
  operation: () => Promise<any>,
  library: string,
  operationName: string,
  timeoutMs: number = 15000
): Promise<PerformanceResult> {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    await withTimeout(operation, timeoutMs, operationName);
    const end = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      library,
      operation: operationName,
      time: end - start,
      memory: endMemory - startMemory,
      success: true,
    };
  } catch (error) {
    const end = performance.now();
    return {
      library,
      operation: operationName,
      time: end - start,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Iteration runner for performance testing
export async function runIterations(
  operation: () => Promise<any>,
  library: string,
  operationName: string,
  iterations: number = 5,
  timeoutMs: number = 15000
): Promise<PerformanceResult[]> {
  log(
    `🔄 Running ${iterations} iterations for ${library} ${operationName}`,
    "debug"
  );

  // Warm-up
  log(`🔥 Warming up ${library} ${operationName}`, "debug");
  const warmupPromises = Array(3)
    .fill(null)
    .map((_, i) =>
      operation().catch((error) => {
        log(`Warm-up ${i + 1} failed: ${error}`, "debug");
      })
    );
  await Promise.all(warmupPromises);

  // Actual measurements - run in parallel
  log(
    `📊 Running ${iterations} measurements for ${library} ${operationName}`,
    "debug"
  );
  const measurementPromises = Array(iterations)
    .fill(null)
    .map((_, i) =>
      measurePerformance(
        operation,
        library,
        `${operationName}_${i + 1}`,
        timeoutMs
      )
    );
  return await Promise.all(measurementPromises);
}

// Test data utilities
export const TEST_CASES = {
  // Basic functionality tests
  basic: {
    word: "test",
    pos: "n",
  },

  // Edge cases
  edgeCases: [
    { word: "", pos: "n", description: "empty string" },
    { word: "nonexistentword", pos: "n", description: "non-existent word" },
    { word: "test", pos: "x", description: "invalid POS" },
  ],

  // Common words for testing
  commonWords: TEST_WORDS.slice(0, 5),

  // Different parts of speech
  partsOfSpeech: TEST_POS,
};

// Result comparison utilities
export function compareResults(
  results: ParityTestResult[],
  tolerance: "exact" | "structure" | "non-empty" = "structure"
) {
  const successful = results.filter((r) => r.success);

  if (successful.length < 2) {
    return {
      comparable: false,
      reason: "Need at least 2 successful results to compare",
    };
  }

  const [reference, ...others] = successful;

  switch (tolerance) {
    case "exact":
      // Strict equality
      for (const other of others) {
        if (
          JSON.stringify(other.normalized) !==
          JSON.stringify(reference.normalized)
        ) {
          return {
            comparable: false,
            reason: `${other.library} differs from ${reference.library}`,
          };
        }
      }
      return { comparable: true };

    case "structure":
      // Check that all results have the same structure and non-zero length
      const refLength = reference.normalized?.length || 0;
      for (const other of others) {
        const otherLength = other.normalized?.length || 0;
        if (refLength === 0 && otherLength === 0) continue; // Both empty is OK
        if (refLength > 0 && otherLength === 0) {
          return {
            comparable: false,
            reason: `${other.library} returned empty when ${reference.library} returned ${refLength} results`,
          };
        }
        if (refLength === 0 && otherLength > 0) {
          return {
            comparable: false,
            reason: `${reference.library} returned empty when ${other.library} returned ${otherLength} results`,
          };
        }
      }
      return { comparable: true };

    case "non-empty":
      // Just check that all libraries return some results
      for (const result of successful) {
        if (!result.normalized || result.normalized.length === 0) {
          return {
            comparable: false,
            reason: `${result.library} returned no results`,
          };
        }
      }
      return { comparable: true };

    default:
      return { comparable: false, reason: "Invalid tolerance level" };
  }
}
