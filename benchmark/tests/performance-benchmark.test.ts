import { describe, it } from "vitest";
import { performance } from "perf_hooks";
import {
  ALL_LIBRARIES,
  TEST_WORDS,
  TEST_POS,
  ProgressTracker,
  withTimeout,
  log,
  initializeLibraries,
  cleanupLibraries,
  measurePerformance,
  runIterations
} from './shared-test-utils.ts';

interface BenchmarkResult {
  library: string;
  operation: string;
  time: number;
  memory?: number;
  success: boolean;
  error?: string;
}

describe("WordNet Performance & Resource Benchmark", () => {
  const results: BenchmarkResult[] = [];

  // Parallel test runner for even faster execution
  async function runParallelBenchmarks() {
    log("🚀 Starting parallel performance benchmark execution...");
    
    const startTime = performance.now();
    
    // Run all benchmark suites in parallel
    const benchmarkSuites = [
      runInitializationBenchmark(),
      runSynsetLookupBenchmark(),
      runWordLookupBenchmark(),
      runBulkOperationsBenchmark(),
      runMemoryUsageBenchmark(),
    ];
    
    log(`📋 Running ${benchmarkSuites.length} performance benchmark suites in parallel`);
    
    const results = await Promise.allSettled(benchmarkSuites);
    const endTime = performance.now();
    
    log(`⏱️  Total parallel execution time: ${(endTime - startTime).toFixed(2)}ms`);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        log(`Performance benchmark suite ${index} failed: ${result.reason}`, 'error');
      }
    });
    
    return results;
  }

  // Individual benchmark functions for parallel execution
  async function runInitializationBenchmark() {
    log("📊 Running initialization performance benchmarks...");
    const progress = new ProgressTracker(ALL_LIBRARIES.length, "library initialization");
    
    const initPromises = ALL_LIBRARIES.map(async (lib, index) => {
      try {
        log(`🔧 Initializing ${lib.name} (${index + 1}/${ALL_LIBRARIES.length})`, 'debug');
        const start = performance.now();
        
        await withTimeout(
          () => lib.init(),
          30000, // 30 second timeout
          `${lib.name} initialization`
        );
        
        const end = performance.now();
        const time = end - start;
        log(`${lib.name} initialization: ${time.toFixed(2)}ms`);
        
        if (lib.cleanup) {
          log(`🧹 Cleaning up ${lib.name}`, 'debug');
          await withTimeout(
            () => lib.cleanup!(),
            10000, // 10 second timeout
            `${lib.name} cleanup`
          );
        }
        
        progress.update();
        return { library: lib.name, time, success: true };
      } catch (error) {
        log(`${lib.name} initialization failed: ${error}`, 'error');
        progress.update();
        return { library: lib.name, time: 0, success: false, error };
      }
    });

    const results = await Promise.all(initPromises);
    progress.complete();
    log("✅ Initialization performance benchmarks completed");
    return results;
  }

  async function runSynsetLookupBenchmark() {
    log("🔍 Running synset lookup performance benchmarks...");
    const totalOperations = ALL_LIBRARIES.length * TEST_WORDS.slice(0, 3).length * TEST_POS.slice(0, 2).length;
    const progress = new ProgressTracker(totalOperations, "synset lookups");
    
    const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
      try {
        log(`🔧 Initializing ${lib.name} for synset lookup`, 'debug');
        await withTimeout(
          () => lib.init(),
          30000,
          `${lib.name} initialization for synset lookup`
        );
        
        const lookupPromises = TEST_WORDS.slice(0, 3).flatMap(word =>
          TEST_POS.slice(0, 2).map(async (pos) => {
            try {
              log(`🔍 ${lib.name}: looking up synset for "${word}" (${pos})`, 'debug');
              const start = performance.now();
              
              await withTimeout(
                () => lib.synsetLookup(word, { pos }),
                15000, // 15 second timeout per lookup
                `${lib.name} synset lookup (${word}, ${pos})`
              );
              
              const end = performance.now();
              const time = end - start;
              log(`${lib.name} synset lookup (${word}, ${pos}): ${time.toFixed(2)}ms`);
              progress.update();
              return { word, pos, time };
            } catch (error) {
              log(`${lib.name} synset lookup (${word}, ${pos}) failed: ${error}`, 'error');
              progress.update();
              return { word, pos, time: 0, error };
            }
          })
        );
        
        const results = await Promise.all(lookupPromises);
        const successfulResults = results.filter(r => !r.error);
        const avgTime = successfulResults.length > 0 
          ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length 
          : 0;
        
        log(`${lib.name}: ${avgTime.toFixed(2)}ms average (${successfulResults.length}/${results.length} successful)`);
        
        if (lib.cleanup) {
          log(`🧹 Cleaning up ${lib.name}`, 'debug');
          await withTimeout(
            () => lib.cleanup!(),
            10000,
            `${lib.name} cleanup`
          );
        }
        
        return { library: lib.name, avgTime, success: true };
      } catch (error) {
        log(`${lib.name} synset lookup benchmark failed: ${error}`, 'error');
        return { library: lib.name, success: false, error };
      }
    });

    const results = await Promise.all(libraryPromises);
    progress.complete();
    log("✅ Synset lookup performance benchmarks completed");
    return results;
  }

  async function runWordLookupBenchmark() {
    log("📚 Running word lookup performance benchmarks...");
    const totalOperations = ALL_LIBRARIES.length * TEST_WORDS.slice(0, 3).length;
    const progress = new ProgressTracker(totalOperations, "word lookups");
    
    const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
      try {
        log(`🔧 Initializing ${lib.name} for word lookup`, 'debug');
        await withTimeout(
          () => lib.init(),
          30000,
          `${lib.name} initialization for word lookup`
        );
        
        const wordPromises = TEST_WORDS.slice(0, 3).map(async (word) => {
          try {
            log(`📚 ${lib.name}: looking up word "${word}"`, 'debug');
            const start = performance.now();
            
            await withTimeout(
              () => lib.wordLookup(word),
              15000, // 15 second timeout per lookup
              `${lib.name} word lookup (${word})`
            );
            
            const end = performance.now();
            const time = end - start;
            log(`${lib.name} word lookup (${word}): ${time.toFixed(2)}ms`);
            progress.update();
            return { word, time };
          } catch (error) {
            log(`${lib.name} word lookup (${word}) failed: ${error}`, 'error');
            progress.update();
            return { word, time: 0, error };
          }
        });
        
        const results = await Promise.all(wordPromises);
        const successfulResults = results.filter(r => !r.error);
        const avgTime = successfulResults.length > 0 
          ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length 
          : 0;
        
        log(`${lib.name}: ${avgTime.toFixed(2)}ms average (${successfulResults.length}/${results.length} successful)`);
        
        if (lib.cleanup) {
          log(`🧹 Cleaning up ${lib.name}`, 'debug');
          await withTimeout(
            () => lib.cleanup!(),
            10000,
            `${lib.name} cleanup`
          );
        }
        
        return { library: lib.name, avgTime, success: true };
      } catch (error) {
        log(`${lib.name} word lookup benchmark failed: ${error}`, 'error');
        return { library: lib.name, success: false, error };
      }
    });

    const results = await Promise.all(libraryPromises);
    progress.complete();
    log("✅ Word lookup performance benchmarks completed");
    return results;
  }

  async function runBulkOperationsBenchmark() {
    log("📦 Running bulk operations performance benchmarks...");
    const progress = new ProgressTracker(ALL_LIBRARIES.length, "bulk operations");
    
    const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
      try {
        log(`🔧 Initializing ${lib.name} for bulk operations`, 'debug');
        await withTimeout(
          () => lib.init(),
          30000,
          `${lib.name} initialization for bulk operations`
        );

        log(`📦 ${lib.name}: running bulk synset lookup for ${TEST_WORDS.slice(0, 5).length} words`, 'debug');
        const start = performance.now();
        
        const promises = TEST_WORDS.slice(0, 5).map((word) =>
          withTimeout(
            () => lib.synsetLookup(word, { pos: "n" }),
            10000, // 10 second timeout per lookup
            `${lib.name} bulk synset lookup (${word})`
          )
        );
        
        await Promise.all(promises);
        const end = performance.now();
        const time = end - start;
        
        log(`${lib.name} bulk synset lookup: ${time.toFixed(2)}ms`);
        progress.update();

        if (lib.cleanup) {
          log(`🧹 Cleaning up ${lib.name}`, 'debug');
          await withTimeout(
            () => lib.cleanup!(),
            10000,
            `${lib.name} cleanup`
          );
        }
        
        return { library: lib.name, time, success: true };
      } catch (error) {
        log(`${lib.name} bulk operations failed: ${error}`, 'error');
        progress.update();
        return { library: lib.name, success: false, error };
      }
    });

    const results = await Promise.all(libraryPromises);
    progress.complete();
    log("✅ Bulk operations performance benchmarks completed");
    return results;
  }

  async function runMemoryUsageBenchmark() {
    log("💾 Running memory usage performance benchmarks...");
    const progress = new ProgressTracker(ALL_LIBRARIES.length, "memory measurements");
    
    const memoryPromises = ALL_LIBRARIES.map(async (lib) => {
      try {
        log(`🔧 Initializing ${lib.name} for memory measurement`, 'debug');
        const libStartMemory = process.memoryUsage().heapUsed;
        
        await withTimeout(
          () => lib.init(),
          30000,
          `${lib.name} initialization for memory measurement`
        );
        
        const libEndMemory = process.memoryUsage().heapUsed;
        const libMemoryUsage = libEndMemory - libStartMemory;

        log(`${lib.name} memory usage: ${(libMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
        progress.update();

        if (lib.cleanup) {
          log(`🧹 Cleaning up ${lib.name}`, 'debug');
          await withTimeout(
            () => lib.cleanup!(),
            10000,
            `${lib.name} cleanup`
          );
        }
        
        return { library: lib.name, memory: libMemoryUsage, success: true };
      } catch (error) {
        log(`${lib.name} memory measurement failed: ${error}`, 'error');
        progress.update();
        return { library: lib.name, memory: 0, success: false, error };
      }
    });

    const results = await Promise.all(memoryPromises);
    const totalMemoryChange = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.memory, 0);
    
    log(`Total memory change: ${(totalMemoryChange / 1024 / 1024).toFixed(2)}MB`);
    progress.complete();
    log("✅ Memory usage performance benchmarks completed");
    return results;
  }

  describe("🚀 Parallel Performance Benchmark Execution", () => {
    it("should run all performance benchmarks in parallel for maximum speed", async () => {
      await runParallelBenchmarks();
    }, 180000); // 3 minute timeout for parallel execution
  });

  describe("Initialization Performance", () => {
    it("should measure initialization time for all libraries", async () => {
      log("📊 Starting initialization performance test");
      
      // Run all library initializations in parallel
      const initPromises = ALL_LIBRARIES.map(async (lib, index) => {
        try {
          log(`🔧 Initializing ${lib.name} (${index + 1}/${ALL_LIBRARIES.length})`, 'debug');
          const start = performance.now();
          
          await withTimeout(
            () => lib.init(),
            30000,
            `${lib.name} initialization`
          );
          
          const end = performance.now();
          const time = end - start;
          log(`${lib.name} initialization: ${time.toFixed(2)}ms`);
          
          if (lib.cleanup) {
            log(`🧹 Cleaning up ${lib.name}`, 'debug');
            await withTimeout(
              () => lib.cleanup!(),
              10000,
              `${lib.name} cleanup`
            );
          }
          
          return { library: lib.name, time, success: true };
        } catch (error) {
          log(`${lib.name} initialization failed: ${error}`, 'error');
          return { library: lib.name, time: 0, success: false, error };
        }
      });

      const results = await Promise.all(initPromises);
      log("📋 Initialization Performance Summary:");
      results.forEach(r => {
        if (r.success) {
          log(`  ${r.library}: ${r.time.toFixed(2)}ms`);
        } else {
          log(`  ${r.library}: FAILED`, 'error');
        }
      });
    }, 60000);
  });

  describe("Synset Lookup Performance", () => {
    it("should measure synset lookup performance for all libraries", async () => {
      log("🔍 Starting synset lookup performance test");
      
      // Run all libraries in parallel
      const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
        try {
          log(`🔧 Initializing ${lib.name} for synset lookup`, 'debug');
          await withTimeout(
            () => lib.init(),
            30000,
            `${lib.name} initialization for synset lookup`
          );
          
          const results: Array<{word: string, pos: string, time: number}> = [];
          
          // Run all word/pos combinations in parallel for this library
          const lookupPromises = TEST_WORDS.slice(0, 3).flatMap(word =>
            TEST_POS.slice(0, 2).map(async (pos) => {
              try {
                log(`🔍 ${lib.name}: looking up synset for "${word}" (${pos})`, 'debug');
                const start = performance.now();
                
                await withTimeout(
                  () => lib.synsetLookup(word, { pos }),
                  15000,
                  `${lib.name} synset lookup (${word}, ${pos})`
                );
                
                const end = performance.now();
                const time = end - start;
                log(`${lib.name} synset lookup (${word}, ${pos}): ${time.toFixed(2)}ms`);
                return { word, pos, time };
              } catch (error) {
                log(`${lib.name} synset lookup (${word}, ${pos}) failed: ${error}`, 'error');
                return { word, pos, time: 0, error };
              }
            })
          );
          
          await Promise.all(lookupPromises);
          
          if (lib.cleanup) {
            log(`🧹 Cleaning up ${lib.name}`, 'debug');
            await withTimeout(
              () => lib.cleanup!(),
              10000,
              `${lib.name} cleanup`
            );
          }
          
          return { library: lib.name, success: true };
        } catch (error) {
          log(`${lib.name} synset lookup failed: ${error}`, 'error');
          return { library: lib.name, success: false, error };
        }
      });

      await Promise.all(libraryPromises);
      log("✅ Synset lookup performance test completed");
    }, 60000);
  });

  describe("Word Lookup Performance", () => {
    it.only("should measure word lookup performance for all libraries", async () => {
      log("📚 Starting word lookup performance test");
      
      // Run all libraries in parallel
      const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
        try {
          log(`🔧 Initializing ${lib.name} for word lookup`, 'debug');
          await withTimeout(
            () => lib.init(),
            30000,
            `${lib.name} initialization for word lookup`
          );
          
          // Run all words in parallel for this library
          const wordPromises = TEST_WORDS.slice(0, 3).map(async (word) => {
            log(`📚 ${lib.name}: running iterations for word "${word}"`, 'debug');
            const lookupResults = await runIterations(
              () => lib.wordLookup(word),
              lib.name,
              `word_lookup_${word}`,
              2
            );
            
            const successfulResults = lookupResults.filter((r) => r.success);
            if (successfulResults.length > 0) {
              const avgTime =
                successfulResults.reduce((sum, r) => sum + r.time, 0) /
                successfulResults.length;
              log(
                `${lib.name} word lookup (${word}): ${avgTime.toFixed(2)}ms average`
              );
              results.push({
                library: lib.name,
                operation: `word_lookup_${word}`,
                time: avgTime,
                success: true,
              });
            }
          });
          
          await Promise.all(wordPromises);
          
          if (lib.cleanup) {
            log(`🧹 Cleaning up ${lib.name}`, 'debug');
            await withTimeout(
              () => lib.cleanup!(),
              10000,
              `${lib.name} cleanup`
            );
          }
          
          return { library: lib.name, success: true };
        } catch (error) {
          log(`${lib.name} word lookup failed: ${error}`, 'error');
          return { library: lib.name, success: false, error };
        }
      });

      await Promise.all(libraryPromises);
      log("✅ Word lookup performance test completed");
    }, 120000);
  });

  describe("Bulk Operations Performance", () => {
    it("should measure bulk lookup performance for all libraries", async () => {
      log("📦 Starting bulk operations performance test");
      
      // Run all libraries in parallel
      const libraryPromises = ALL_LIBRARIES.map(async (lib) => {
        try {
          log(`🔧 Initializing ${lib.name} for bulk operations`, 'debug');
          await withTimeout(
            () => lib.init(),
            30000,
            `${lib.name} initialization for bulk operations`
          );

          log(`📦 ${lib.name}: running bulk synset lookup`, 'debug');
          // Bulk synset lookup
          const bulkSynsetResults = await runIterations(
            async () => {
              const promises = TEST_WORDS.slice(0, 5).map((word) =>
                withTimeout(
                  () => lib.synsetLookup(word, { pos: "n" }),
                  10000,
                  `${lib.name} bulk synset lookup (${word})`
                )
              );
              return await Promise.all(promises);
            },
            lib.name,
            "bulk_synset_lookup",
            2
          );

          const successfulResults = bulkSynsetResults.filter((r) => r.success);
          if (successfulResults.length > 0) {
            const avgTime =
              successfulResults.reduce((sum, r) => sum + r.time, 0) /
              successfulResults.length;
            log(
              `${lib.name} bulk synset lookup: ${avgTime.toFixed(2)}ms average`
            );
          }

          if (lib.cleanup) {
            log(`🧹 Cleaning up ${lib.name}`, 'debug');
            await withTimeout(
              () => lib.cleanup!(),
              10000,
              `${lib.name} cleanup`
            );
          }
          
          return { library: lib.name, success: true };
        } catch (error) {
          log(`${lib.name} bulk operations failed: ${error}`, 'error');
          return { library: lib.name, success: false, error };
        }
      });

      await Promise.all(libraryPromises);
      log("✅ Bulk operations performance test completed");
    }, 120000);
  });

  describe("Memory Usage Analysis", () => {
    it("should measure memory usage for all libraries", async () => {
      log("💾 Starting memory usage analysis");
      const startMemory = process.memoryUsage().heapUsed;
      
      // Run all libraries in parallel
      const memoryPromises = ALL_LIBRARIES.map(async (lib) => {
        try {
          log(`🔧 Initializing ${lib.name} for memory measurement`, 'debug');
          const libStartMemory = process.memoryUsage().heapUsed;
          
          await withTimeout(
            () => lib.init(),
            30000,
            `${lib.name} initialization for memory measurement`
          );
          
          const libEndMemory = process.memoryUsage().heapUsed;
          const libMemoryUsage = libEndMemory - libStartMemory;

          log(
            `${lib.name} memory usage: ${(libMemoryUsage / 1024 / 1024).toFixed(2)}MB`
          );

          if (lib.cleanup) {
            log(`🧹 Cleaning up ${lib.name}`, 'debug');
            await withTimeout(
              () => lib.cleanup!(),
              10000,
              `${lib.name} cleanup`
            );
          }
          
          return { library: lib.name, memory: libMemoryUsage, success: true };
        } catch (error) {
          log(`${lib.name} memory measurement failed: ${error}`, 'error');
          return { library: lib.name, memory: 0, success: false, error };
        }
      });

      const memoryResults = await Promise.all(memoryPromises);
      const totalMemoryChange = memoryResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.memory, 0);
      
      log(`Total memory change: ${(totalMemoryChange / 1024 / 1024).toFixed(2)}MB`);
      log("✅ Memory usage analysis completed");
    }, 60000);
  });

  describe("Performance Summary", () => {
    it("should provide a comprehensive performance summary", () => {
      log("📊 Generating performance summary");

      // Group results by library
      const libraryResults: Record<string, BenchmarkResult[]> = {};
      results.forEach((result) => {
        if (!libraryResults[result.library]) {
          libraryResults[result.library] = [];
        }
        libraryResults[result.library].push(result);
      });

      // Calculate averages for each library
      Object.entries(libraryResults).forEach(([library, libResults]) => {
        const successfulResults = libResults.filter((r) => r.success);
        if (successfulResults.length > 0) {
          const avgTime =
            successfulResults.reduce((sum, r) => sum + r.time, 0) /
            successfulResults.length;
          const successRate = (successfulResults.length / libResults.length) * 100;

          log(`--- ${library} ---`);
          log(`Average Lookup Time: ${avgTime.toFixed(2)}ms`);
          log(`Success Rate: ${successRate.toFixed(1)}%`);
        }
      });

      log("=== PERFORMANCE RANKINGS ===");
      log("Initialization Speed (fastest to slowest):");
      log("=== END PERFORMANCE BENCHMARK RESULTS ===");
    });
  });
});
