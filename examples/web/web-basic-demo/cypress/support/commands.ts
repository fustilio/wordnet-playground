/// <reference types="cypress" />

// ***********************************************
// Custom commands for WordNet Basic Demo
// Following Cypress Real World App best practices
// https://github.com/cypress-io/cypress-realworld-app
// ***********************************************

Cypress.Commands.add('visitApp', () => {
  cy.visit('/')
  cy.get('h1').should('contain', 'WordNet Basic Demo')
})

Cypress.Commands.add('waitForWordNetReady', () => {
  // Wait for the status to show "Ready to search!"
  cy.get('.status.ready', { timeout: 60000 }).should('be.visible')
  cy.get('.status.ready').should('contain', 'Ready to search!')
})

Cypress.Commands.add('searchWord', (word: string) => {
  cy.get('.search-input').clear().type(word)
  cy.get('.search-button').click()
})

Cypress.Commands.add('shouldShowResults', () => {
  cy.get('.synset-table').should('be.visible')
  cy.get('.synset-table tbody tr').should('have.length.greaterThan', 0)
})

Cypress.Commands.add('shouldShowNoResults', () => {
  cy.get('.no-results').should('be.visible')
  cy.get('.synset-table').should('not.exist')
})
