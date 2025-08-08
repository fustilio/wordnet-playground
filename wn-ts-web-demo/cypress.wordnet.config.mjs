import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress.config.mjs').e2e.setupNodeEvents(on, config)
    },
    specPattern: 'cypress/e2e/wordnet-demo/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
})
