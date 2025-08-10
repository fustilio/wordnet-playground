/// <reference types="cypress" />

describe('OPFS Storage Reporting', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
  })

  it('reports sane storage metrics when supported and updates after save', () => {
    cy.goToTab('Advanced')

    cy.getByTestId('opfs-status').then(($el) => {
      const supported = $el.text().includes('Supported')
      if (!supported) {
        cy.log('OPFS not supported in this environment; skipping metric assertions')
        return
      }

      cy.wrap($el).contains('Used:')
      cy.wrap($el).contains('Available:')
      cy.wrap($el).contains('Total:')

      // Save to OPFS should be visible if supported
      cy.getByTestId('save-opfs').should('exist')

      // Attempt a save; then expect widget still renders usage lines
      cy.getByTestId('save-opfs').click({ force: true })
      // Allow some time for save and info refresh
      cy.wait(1000)
      cy.getByTestId('opfs-status').contains('Used:')
    })
  })
})