import { defineConfig } from "cypress";
import customViteConfig from './vite.config.mjs'

// Log level control for task-based logging
// Levels: silent < error < warn < info < debug
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const LOG_LEVEL_WEIGHT = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 }
const currentWeight = LOG_LEVEL_WEIGHT[LOG_LEVEL] ?? LOG_LEVEL_WEIGHT.info

function shouldLog(minLevel) {
  return currentWeight >= (LOG_LEVEL_WEIGHT[minLevel] ?? LOG_LEVEL_WEIGHT.info)
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
          ...  modifiedConfig.server.headers,
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Embedder-Policy": "require-corp",
        }
        return customViteConfig
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
      on('task', {
        log(message) {
          if (shouldLog('debug')) {
            console.log('🧪 [task:log]', message)
          }
          return null
        },
        section(message) {
          if (shouldLog('info')) {
            console.log('\n=== ' + message + ' ===')
          }
          return null
        },
        progress(payload) {
          if (shouldLog('debug')) {
            console.log('🧪 [progress]', payload)
          }
          return null
        }
      })

      // Summarize failures at the end of each spec
      on('after:spec', (spec, results) => {
        if (results && results.stats && results.stats.failures > 0) {
          console.error(`❌ Failures in ${spec.relative}: ${results.stats.failures}`)
          for (const test of results.tests || []) {
            if (test.state === 'failed') {
              console.error(`  - ${test.title.join(' > ')}`)
              for (const attempt of test.attempts || []) {
                if (attempt.error) {
                  console.error(`      ${attempt.error.name || 'Error'}: ${attempt.error.message || attempt.error}`)
                }
              }
            }
          }
        }
      })
    },
    specPattern: 'cypress/e2e/wordnet-demo/*.cy.ts',
    // Ensure TypeScript support files are used
    supportFile: 'cypress/support/e2e.ts',
    baseUrl: 'http://localhost:5174',
  },
});
