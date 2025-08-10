// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import './commands'

// Global verbose network logging
before(() => {
  cy.intercept({ url: /\/api\// }).as('api')
})

beforeEach(() => {
  cy.intercept('GET', /.*/).as('GET_ALL')
  cy.intercept('POST', /.*/).as('POST_ALL')
})

// Log filtering: keep output concise by default
const getLogLevel = () => (Cypress.env('LOG_LEVEL') || 'basic').toLowerCase()

Cypress.Commands.overwrite('log', (originalFn, ...args) => {
  const level = getLogLevel()
  if (level === 'verbose') {
    // @ts-ignore - forward to original
    return originalFn(...args)
  }
  // suppress standard cy.log in non-verbose modes
  return cy.wrap(null, { log: false })
})
