import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Task/status logging
      on("task", {
        log(message: string) {
          console.log("🧪 [task:log]", message);
          return null;
        },
        section(message: string) {
          console.log("\n=== " + message + " ===");
          return null;
        },
        progress(payload: any) {
          console.log("🧪 [progress]", payload);
          return null;
        },
      });

      // Summarize failures at the end of each spec
      on("after:spec", (spec, results) => {
        if (results && results.stats && results.stats.failures > 0) {
          console.error(
            `❌ Failures in ${spec.relative}: ${results.stats.failures}`
          );
          for (const test of results.tests || []) {
            if (test.state === "failed") {
              console.error(`  - ${test.title.join(" > ")}`);
              for (const attempt of test.attempts || []) {
                if (attempt.error) {
                  console.error(
                    `      ${attempt.error.name || "Error"}: ${
                      attempt.error.message || attempt.error
                    }`
                  );
                }
              }
            }
          }
        }
      });
    },
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "http://localhost:5173",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    // Following Cypress Real World App best practices
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});
