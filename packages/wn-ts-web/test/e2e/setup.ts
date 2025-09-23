/**
 * Setup file for WordNet Orchestration E2E tests
 *
 * This file configures the browser environment and handles global setup
 * for end-to-end testing of the orchestration system.
 */

import { beforeAll, afterAll } from "vitest";

// Global setup for e2e tests
beforeAll(async () => {
  console.log("🚀 Setting up WordNet Orchestration E2E test environment...");

  // Set up any global configurations needed for browser testing
  if (typeof window !== "undefined") {
    // We're in a browser-like environment
    console.log("🌐 Browser environment detected");

    // Set up any browser-specific globals or polyfills if needed
    if (!window.fetch) {
      console.warn("Fetch API not available, some tests may fail");
    }

    if (!window.Worker) {
      console.warn("Web Workers not available, worker tests will fail");
    }
  } else {
    console.log("🖥️ Node.js environment detected");
  }

  console.log("✅ E2E test environment setup complete");
});

// Global cleanup for e2e tests
afterAll(async () => {
  console.log("🧹 Cleaning up E2E test environment...");

  // Clean up any global resources
  if (typeof window !== "undefined") {
    // Clean up any browser-specific resources
    console.log("🌐 Browser cleanup complete");
  }

  console.log("✅ E2E test environment cleanup complete");
});

// Export any utilities that might be needed by tests
export const testUtils = {
  // Helper to wait for a condition
  waitFor: (condition: () => boolean, timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Wait condition timeout"));
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  },

  // Helper to create a test delay
  delay: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Helper to check if we're in a browser environment
  isBrowser: (): boolean => {
    return typeof window !== "undefined";
  },

  // Helper to check if we're in a worker environment
  isWorker: (): boolean => {
    return typeof self !== "undefined" && typeof (self as any).importScripts === "function";
  },
};
