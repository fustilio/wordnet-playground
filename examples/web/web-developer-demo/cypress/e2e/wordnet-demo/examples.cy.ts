/// <reference types="cypress" />

describe('Examples Hub', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
  })

  it('should render the Examples tab and show shared state chip', () => {
    cy.goToTab('Examples')
    // Wait for the Examples page to load
    cy.get('aside').should('be.visible')
    cy.contains('Examples').should('be.visible')
    cy.contains('Shared State:').should('be.visible')
    cy.contains('Loaded Packages:').should('be.visible')
  })

  it('should run Basic WordNet Demo without reloading data', () => {
    cy.goToTab('Examples')
    // Wait for examples to load
    cy.get('aside').should('be.visible')
    cy.contains('Basic WordNet Demo').click()
    // Wait for the demo to render
    cy.get('input[placeholder*="Enter a word"]', { timeout: 10000 }).should('be.visible')
    cy.get('input[placeholder*="Enter a word"]').clear({ force: true }).type('water', { force: true })
    cy.contains('Search').click()
    cy.get('pre, [data-testid]').should('exist')
  })

  it('should show Project List and Data Info', () => {
    cy.goToTab('Examples')
    cy.contains('Project List').click()
    cy.contains('Available WordNet Projects').should('exist')
    cy.contains('Examples').click()
    cy.contains('Data Info').click()
    cy.contains('Statistics').should('exist')
  })
})


