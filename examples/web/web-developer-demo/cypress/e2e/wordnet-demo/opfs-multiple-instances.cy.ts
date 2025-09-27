/// <reference types="cypress" />

describe('OPFS Multiple Instances Fix', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
  })

  it('should handle multiple database instances without OPFS access handle conflicts', () => {
    // This test verifies that the OPFS singleton pattern fix works
    // by checking that multiple database operations don't cause access handle conflicts
    
    cy.goToTab('Advanced')
    
    // Wait for the system to be ready and check for any OPFS errors in console
    cy.window().then((win) => {
      // Clear any existing console errors
      cy.clearConsoleErrors()
    })
    
    // Trigger multiple database operations that would previously cause conflicts
    cy.getByTestId('load-package-button').click()
    cy.getByTestId('package-selector').select('oewn:2024')
    cy.getByTestId('confirm-load-button').click()
    
    // Wait for loading to complete
    cy.getByTestId('loading-indicator', { timeout: 30000 }).should('not.exist')
    
    // Check that no OPFS access handle errors occurred
    cy.window().then((win) => {
      const consoleErrors = win.consoleErrors || []
      const opfsErrors = consoleErrors.filter((error: string) => 
        error.includes('Access Handles cannot be created') ||
        error.includes('NoModificationAllowedError') ||
        error.includes('createSyncAccessHandle')
      )
      
      expect(opfsErrors, 'Should not have OPFS access handle conflicts').to.have.length(0)
    })
    
    // Verify that the database is working correctly
    cy.getByTestId('search-input').type('test')
    cy.getByTestId('search-button').click()
    
    // Should get results without errors
    cy.getByTestId('search-results').should('exist')
    
    // Check storage info to confirm OPFS is working
    cy.getByTestId('opfs-status').should('contain', 'Supported')
  })

  it('should handle rapid successive database operations without conflicts', () => {
    // Test rapid successive operations that could trigger multiple database instances
    cy.goToTab('Basic')
    
    // Perform multiple rapid operations
    for (let i = 0; i < 3; i++) {
      cy.getByTestId('search-input').clear().type(`word${i}`)
      cy.getByTestId('search-button').click()
      cy.wait(100) // Small delay between operations
    }
    
    // Check for any OPFS errors
    cy.window().then((win) => {
      const consoleErrors = win.consoleErrors || []
      const opfsErrors = consoleErrors.filter((error: string) => 
        error.includes('Access Handles cannot be created') ||
        error.includes('NoModificationAllowedError') ||
        error.includes('createSyncAccessHandle')
      )
      
      expect(opfsErrors, 'Should not have OPFS access handle conflicts during rapid operations').to.have.length(0)
    })
  })

  it('should properly dispose and recreate database instances', () => {
    // Test that database instances can be properly disposed and recreated
    cy.goToTab('Advanced')
    
    // Load a package
    cy.getByTestId('load-package-button').click()
    cy.getByTestId('package-selector').select('oewn:2024')
    cy.getByTestId('confirm-load-button').click()
    
    // Wait for loading
    cy.getByTestId('loading-indicator', { timeout: 30000 }).should('not.exist')
    
    // Unload the package (this should dispose the database instance)
    cy.getByTestId('unload-package-button').click()
    
    // Load again (this should create a new instance without conflicts)
    cy.getByTestId('load-package-button').click()
    cy.getByTestId('package-selector').select('oewn:2024')
    cy.getByTestId('confirm-load-button').click()
    
    // Wait for loading
    cy.getByTestId('loading-indicator', { timeout: 30000 }).should('not.exist')
    
    // Check for OPFS errors
    cy.window().then((win) => {
      const consoleErrors = win.consoleErrors || []
      const opfsErrors = consoleErrors.filter((error: string) => 
        error.includes('Access Handles cannot be created') ||
        error.includes('NoModificationAllowedError') ||
        error.includes('createSyncAccessHandle')
      )
      
      expect(opfsErrors, 'Should not have OPFS access handle conflicts during dispose/recreate').to.have.length(0)
    })
  })
})
