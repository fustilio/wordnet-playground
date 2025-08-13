/// <reference types="cypress" />

describe('OPFS Storage Reporting', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
  })

  it('reports sane storage metrics when supported', () => {
    cy.goToTab('Advanced')

    cy.getByTestId('opfs-status').then(($el) => {
      const supported = $el.text().includes('Supported')
      if (!supported) {
        cy.log('OPFS not supported in this environment; skipping metric assertions')
        return
      }

      const hasUsage = $el.text().includes('Storage Usage')
      if (hasUsage) {
        cy.wrap($el).contains('Used:')
        cy.wrap($el).contains('Available:')
        cy.wrap($el).contains('Total:')
      } else {
        cy.log('Storage Usage section not present; skipping metric assertions')
      }
    })
  })
})