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

// Minimal, useful network logging
const LOG_LEVEL = (Cypress.env('LOG_LEVEL') as string) || (window as any).LOG_LEVEL || 'info'
const isDebug = LOG_LEVEL === 'debug'

before(() => {
  // Only alias API calls used in tests; avoid aliasing every GET/POST
  cy.intercept({ url: /\/api\// }).as('api')
})

beforeEach(() => {
  if (isDebug) {
    cy.intercept('GET', /.*/).as('GET_ALL')
    cy.intercept('POST', /.*/).as('POST_ALL')
  }
})
