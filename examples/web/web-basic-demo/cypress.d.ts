/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to visit the WordNet Basic Demo app
     * @example cy.visitApp()
     */
    visitApp(): Chainable<void>
    
    /**
     * Custom command to wait for WordNet to be ready
     * @example cy.waitForWordNetReady()
     */
    waitForWordNetReady(): Chainable<void>
    
    /**
     * Custom command to search for a word
     * @example cy.searchWord('water')
     */
    searchWord(word: string): Chainable<void>
    
    /**
     * Custom command to check if results are displayed
     * @example cy.shouldShowResults()
     */
    shouldShowResults(): Chainable<void>
    
    /**
     * Custom command to check if no results are shown
     * @example cy.shouldShowNoResults()
     */
    shouldShowNoResults(): Chainable<void>
  }
}
