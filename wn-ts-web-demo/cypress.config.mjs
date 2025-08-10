import { defineConfig } from "cypress";
import customViteConfig from './vite.config.mjs'

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
      // Verbose task/status logging for headless mode
      on('task', {
        log(message) {
          console.log('🧪 [task:log]', message)
          return null
        },
        section(message) {
          console.log('🧪 [section]', message)
          return null
        },
        progress(payload) {
          console.log('🧪 [progress]', payload)
          return null
        }
      })
    },
    specPattern: 'cypress/e2e/wordnet-demo/*.cy.ts',
    // Ensure TypeScript support files are used
    supportFile: 'cypress/support/e2e.ts',
    baseUrl: 'http://localhost:5174',
  },
});
