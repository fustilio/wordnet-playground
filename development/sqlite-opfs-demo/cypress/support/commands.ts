/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Helper: get by test id
Cypress.Commands.add('getByTestId' as any, (testId: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) => {
  return cy.get(`[data-testid="${testId}"]`, options as unknown as Cypress.Timeoutable)
})

// Visit app
Cypress.Commands.add('visitApp' as any, () => {
  Cypress.log({ name: 'visitApp', message: 'Visiting app at http://localhost:5174' })
  cy.visit('http://localhost:5174')
})

// Wait for app root
Cypress.Commands.add('waitForSystemReady' as any, (timeout: number = 20000) => {
  Cypress.log({ name: 'waitForSystemReady', message: `timeout=${timeout}ms` })
  cy.get('#root', { timeout }).should('exist')
})

// Wait until the DB is opened and the Run button is enabled
Cypress.Commands.add('waitForDbOpen' as any, (timeout: number = 20000) => {
  Cypress.log({ name: 'waitForDbOpen', message: `timeout=${timeout}ms` })
  cy.contains('WASM: ready', { timeout }).should('be.visible')
  cy.contains('DB: demo.sqlite3', { timeout }).should('be.visible')
  cy.contains('Run', { timeout }).should('be.visible').and('not.be.disabled')
})

// Section log helper
Cypress.Commands.add('section' as any, (message: string) => {
  Cypress.log({ name: 'section', message })
})

export {}

export {}
