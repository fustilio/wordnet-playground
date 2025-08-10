import { defineConfig } from "cypress";
import customViteConfig from './vite.config.mjs'

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      // optionally pass in vite config
      viteConfig: customViteConfig,
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
      // Verbose task/status logging can be controlled via LOG_LEVEL
      // Levels: 'silent' | 'basic' (default) | 'progress' | 'verbose'
      const logLevel = (config?.env?.LOG_LEVEL || process.env.CYPRESS_LOG_LEVEL || 'basic').toLowerCase()
      const shouldLog = (type) => {
        if (logLevel === 'silent') return false
        if (logLevel === 'verbose') return true
        if (logLevel === 'progress') return type === 'section' || type === 'progress'
        // 'basic' default: only high-level sections
        return type === 'section'
      }

      on('task', {
        log(message) {
          if (shouldLog('log')) console.log('🧪 [log]', message)
          return null
        },
        section(message) {
          if (shouldLog('section')) console.log('🧪 [section]', message)
          return null
        },
        progress(payload) {
          if (shouldLog('progress')) console.log('🧪 [progress]', payload)
          return null
        }
      })
    },
    specPattern: 'cypress/e2e/wordnet-demo/*.cy.ts',
    // Ensure TypeScript support files are used
    supportFile: 'cypress/support/e2e.ts',
  },
});
