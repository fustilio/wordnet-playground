/// <reference types="cypress" />

// ***********************************************
// Custom commands for WordNet Showcase
// Following Cypress Real World App best practices
// https://github.com/cypress-io/cypress-realworld-app
// ***********************************************

Cypress.Commands.add('visitShowcase', () => {
  cy.visit('/')
  cy.get('h1').should('contain', 'WordNet Showcase')
})

Cypress.Commands.add('waitForWordNetReady', () => {
  // Wait for the status to show "Ready to search!" or similar ready state
  cy.get('.status.ready, .ready-status', { timeout: 60000 }).should('be.visible')
})

Cypress.Commands.add('navigateToDemo', (demoId: string) => {
  cy.get(`[data-demo-id="${demoId}"]`).click()
  cy.url().should('include', `/${demoId}`)
})

Cypress.Commands.add('searchWord', (word: string) => {
  cy.get('.search-input, input[type="text"]').first().clear().type(word)
  cy.get('.search-button, button[type="submit"]').first().click()
})

Cypress.Commands.add('shouldShowResults', () => {
  cy.get('.results, .synset-table, .word-result', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('shouldShowNoResults', () => {
  cy.get('.no-results, .empty-state', { timeout: 10000 }).should('be.visible')
})
