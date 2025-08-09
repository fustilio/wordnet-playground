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
Cypress.Commands.add('getByTestId', (testId: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) => {
  return cy.get(`[data-testid="${testId}"]`, options as unknown as Cypress.Timeoutable)
})

// Visit app
Cypress.Commands.add('visitApp', () => {
  cy.task('log', 'Visiting app at http://localhost:5173')
  cy.visit('http://localhost:5173')
})

// Wait for system ready
Cypress.Commands.add('waitForSystemReady', (timeout = 20000) => {
  cy.task('log', `Waiting for system ready (timeout=${timeout}ms)`) 
  cy.getByTestId('system-status', { timeout })
    .should(($status) => {
      const statusText = $status.text().toLowerCase()
      expect(statusText.includes('ready') || statusText.includes('loaded') || !statusText.includes('loading')).to.eq(true)
    })
})

// Ensure WordNet loaded
Cypress.Commands.add('ensureWordNetLoaded', () => {
  cy.contains('Advanced').click()
  cy.get('button').contains('Open English WordNet').then(($btn) => {
    if (!$btn.prop('disabled')) {
      cy.task('log', 'Loading OEWN via Advanced tab')
      cy.wrap($btn).click()
      cy.waitForSystemReady()
    }
  })
  cy.contains('Basic').click()
  return cy.getByTestId('database-stats')
})

// Navigate tabs
Cypress.Commands.add('goToTab', (name: string) => {
  cy.task('log', `Navigating to tab: ${name}`)
  // Wait for tabs to be visible and clickable
  cy.get('nav[aria-label="Tabs"]').should('be.visible')
  cy.contains('button', name).should('be.visible').click({ force: true })
  cy.task('log', `Successfully clicked tab: ${name}`)
})

// Search helper
Cypress.Commands.add('search', (term: string, tab: 'words' | 'synsets' | 'senses' = 'words') => {
  cy.get('input[placeholder*="happy"]').clear({ force: true }).type(term, { force: true })
  cy.contains('Search').click()
  cy.contains(tab).click()
  return cy.get('pre')
})

// Section log helper
Cypress.Commands.add('section', (message: string) => {
  Cypress.log({ name: 'section', message })
  cy.task('section', message)
})

export {}

export {}
