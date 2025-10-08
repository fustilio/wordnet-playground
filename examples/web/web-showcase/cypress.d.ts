/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to visit the WordNet Showcase app
     * @example cy.visitShowcase()
     */
    visitShowcase(): Chainable<void>
    
    /**
     * Custom command to wait for WordNet to be ready
     * @example cy.waitForWordNetReady()
     */
    waitForWordNetReady(): Chainable<void>
    
    /**
     * Custom command to navigate to a demo
     * @example cy.navigateToDemo('basic-search')
     */
    navigateToDemo(demoId: string): Chainable<void>
    
    /**
     * Custom command to search for a word in the current demo
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
