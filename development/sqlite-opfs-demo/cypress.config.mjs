import { defineConfig } from "cypress";
import customViteConfig from "./vite.config.mjs";

// Log level control for task-based logging
// Levels: silent < error < warn < info < debug
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LOG_LEVEL_WEIGHT = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const currentWeight = LOG_LEVEL_WEIGHT[LOG_LEVEL] ?? LOG_LEVEL_WEIGHT.info;

function shouldLog(minLevel) {
  return currentWeight >= (LOG_LEVEL_WEIGHT[minLevel] ?? LOG_LEVEL_WEIGHT.info);
}

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      // optionally pass in vite config
      viteConfig: () => {
        let modifiedConfig = customViteConfig;
        modifiedConfig.server.port === 5174;
        modifiedConfig.server.headers = {
          ...modifiedConfig.server.headers,
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        };
        return customViteConfig;
      },
      // or a function - the result is merged with
      // any `vite.config` file that is detected
      //   viteConfig: async () => {
      //     // ... do things ...
      //     const modifiedConfig = await injectCustomConfig(baseConfig)
      //     return modifiedConfig
      //   },
    },
  },

  e2e: {
    setupNodeEvents(on, config) {
      // Task/status logging - gated by LOG_LEVEL
      on("task", {
        log(message) {
          if (shouldLog("debug")) {
            console.log("🧪 [task:log]", message);
          }
          return null;
        },
        section(message) {
          if (shouldLog("info")) {
            console.log("\n=== " + message + " ===");
          }
          return null;
        },
        progress(payload) {
          if (shouldLog("debug")) {
            console.log("🧪 [progress]", payload);
          }
          return null;
        },
      });

      // Summarize failures at the end of each spec
      on("after:spec", (spec, results) => {
        if (results && results.stats && results.stats.failures > 0) {
          console.error(
            `❌ Failures in ${spec.relative}: ${results.stats.failures}`,
          );
          for (const test of results.tests || []) {
            if (test.state === "failed") {
              console.error(`  - ${test.title.join(" > ")}`);
              for (const attempt of test.attempts || []) {
                if (attempt.error) {
                  console.error(
                    `      ${attempt.error.name || "Error"}: ${
                      attempt.error.message || attempt.error
                    }`,
                  );
                }
              }
            }
          }
        }
      });

      on("before:browser:launch", (browser, launchOptions) => {
       
        // this is for chrome
        // [
        //   '--test-type',
        //   '--ignore-certificate-errors',
        //   '--start-maximized',
        //   '--silent-debugger-extension-api',
        //   '--no-default-browser-check',
        //   '--no-first-run',
        //   '--noerrdialogs',
        //   '--enable-fixed-layout',
        //   '--disable-popup-blocking',
        //   '--disable-password-generation',
        //   '--disable-single-click-autofill',
        //   '--disable-prompt-on-repos',
        //   '--disable-background-timer-throttling',
        //   '--disable-renderer-backgrounding',
        //   '--disable-renderer-throttling',
        //   '--disable-backgrounding-occluded-windows',
        //   '--disable-restore-session-state',
        //   '--disable-new-profile-management',
        //   '--disable-new-avatar-menu',
        //   '--allow-insecure-localhost',
        //   '--reduce-security-for-testing',
        //   '--enable-automation',
        //   '--disable-print-preview',
        //   '--disable-component-extensions-with-background-pages',
        //   '--disable-infobars',
        //   '--disable-device-discovery-notifications',
        //   '--autoplay-policy=no-user-gesture-required',
        //   '--disable-site-isolation-trials',
        //   '--metrics-recording-only',
        //   '--disable-prompt-on-repost',
        //   '--disable-hang-monitor',
        //   '--disable-sync',
        //   '--disable-web-resources',
        //   '--safebrowsing-disable-download-protection',
        //   '--disable-client-side-phishing-detection',
        //   '--disable-component-update',
        //   "--simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'",
        //   '--disable-default-apps',
        //   '--disable-features=Translate,PrivacySandboxSettings4',
        //   '--use-fake-ui-for-media-stream',
        //   '--use-fake-device-for-media-stream',
        //   '--disable-ipc-flooding-protection',
        //   '--disable-backgrounding-occluded-window',
        //   '--disable-breakpad',
        //   '--password-store=basic',
        //   '--use-mock-keychain',
        //   '--disable-dev-shm-usage',
        //   '--enable-precise-memory-info',
        //   '--proxy-server=http://localhost:54284',
        //   '--proxy-bypass-list=<-loopback>',
        //   '--remote-debugging-port=54316',
        //   '--remote-debugging-address=127.0.0.1'
        // console.log("launching browser",  launchOptions.args);
        // launchOptions.args.push("--user-data-dir=../chromeProfile/Default");
        // if (browser.name === "chrome") {
        //   launchOptions.args.push("--disable-web-security");
        // }
        return launchOptions;
      });
    },
    specPattern: [
      "cypress/e2e/**/basic.cy.ts",
      "cypress/e2e/**/crud.cy.ts",
      "cypress/e2e/**/kitchensink.cy.ts",
    ],
    // Ensure TypeScript support files are used
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "http://localhost:5174",
  },
});
