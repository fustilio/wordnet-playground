import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    async setupNodeEvents(on, config) {
      const base = (await import('./cypress.config.mjs')).default
      if (base?.e2e?.setupNodeEvents) {
        return base.e2e.setupNodeEvents(on, config)
      }
      return config
    },
    specPattern: 'cypress/e2e/wordnet-demo/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
})
