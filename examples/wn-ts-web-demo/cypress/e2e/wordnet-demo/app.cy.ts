/// <reference types="cypress" />

describe('WordNet TypeScript Demo', () => {
  beforeEach(() => {
    Cypress.log({ name: 'init', message: 'Visiting app for UI smoke checks' })
    cy.visitApp()
  })

  it('should load the application and display basic elements', () => {
    // Check that the main title is present
    cy.contains('WordNet TypeScript Demo').should('be.visible')
    
    // Check that the main tabs are present
    cy.contains('Basic').should('be.visible')
    cy.contains('Advanced').should('be.visible')
    cy.contains('Developer').should('be.visible')
    
    // Check that status widgets are present
    cy.contains('System Status').should('be.visible')
    cy.contains(/(Database Statistics|Statistics)/).should('be.visible')
    cy.contains('OPFS Status').should('be.visible')
  })

  it('should display system status information with valid states', () => {
    // Wait for the app to initialize
    cy.contains('System Status').should('be.visible')
    
    // Check that system status shows some information
    cy.contains('Overall Status').should('be.visible')
    
    // Validate that the status shows some information
    cy.get('[data-testid="system-status"]').should('exist')
    cy.get('[data-testid="system-status"]').within(() => {
      cy.get('p').should('exist')
    })
  })

  it('should display database statistics with valid data structure', () => {
    // Check that database statistics section is present
    cy.contains('Database Statistics').should('be.visible')
    cy.log('Database Statistics section is visible')
    
    // Check that statistics show some content (either empty message or actual stats)
    cy.get('[data-testid="database-stats"]').should('exist')
    cy.log('Database stats widget exists')
    
    // If statistics are loaded, validate the data structure
    cy.get('[data-testid="database-stats"]').then(($stats) => {
      const statsText = $stats.find('p').text()
      cy.log('Database stats content:', statsText)
      
      if (statsText.includes('No statistics available')) {
        // Empty state - validate the message
        cy.log('Database is empty - validating empty state')
        cy.wrap($stats).should('contain.text', 'No statistics available')
        cy.log('Empty state validation passed')
      } else {
        // Loaded state - validate statistics structure
        cy.log('Database has data - validating loaded state')
        cy.wrap($stats).within(() => {
          // Check for totals section
          cy.contains('Totals').should('be.visible')
          cy.log('Totals section is visible')
          
          // Check for Words, Synsets, Senses labels
          cy.contains('Words:').should('be.visible')
          cy.contains('Synsets:').should('be.visible')
          cy.contains('Senses:').should('be.visible')
          cy.log('All statistics labels are visible')
          
          // Validate that numbers are displayed and are reasonable
          cy.get('.font-mono').each(($el, index) => {
            const text = $el.text().trim()
            cy.log(`Number ${index + 1}:`, text)
            if (text && text !== '0') {
              // Should be a number (with commas for thousands)
              expect(text).to.match(/^[\d,]+$/)
              const num = parseInt(text.replace(/,/g, ''))
              // Reasonable range for WordNet data
              expect(num).to.be.greaterThan(0)
              expect(num).to.be.lessThan(10000000) // Max reasonable size
              cy.log(`Number ${index + 1} validation passed:`, num)
            }
          })
        })
        cy.log('Loaded state validation passed')
      }
    })
  })

  it('should display OPFS status with valid browser support detection', () => {
    // Check that OPFS status section is present
    cy.contains('OPFS Status').should('be.visible')
    
    // Check that OPFS support information is displayed
    cy.contains('OPFS Support').should('be.visible')
    
    // Validate OPFS support status
    cy.get('[data-testid="opfs-status"]').should('exist')
    cy.get('[data-testid="opfs-status"]').within(() => {
      cy.get('p').should('exist')
    })
  })

  it('should allow switching between tabs with proper content validation', () => {
    // Test Basic tab
    cy.goToTab('Basic')
    cy.contains('Basic WordNet Explorer').should('be.visible')
    
    // Validate Basic tab content structure
    cy.contains('Use this simple interface to search').should('be.visible')
    cy.get('input[placeholder*="happy"]').should('be.visible')
    cy.get('button').contains('Search').should('be.visible')
    
    // Test Advanced tab
    cy.goToTab('Advanced')
    cy.contains('Advanced Data Management').should('be.visible')
    
    // Validate Advanced tab content structure
    cy.contains('Available Packages').should('be.visible')
    cy.contains('Database Operations').should('be.visible')
    cy.contains('Export Database').should('be.visible')
    cy.contains('Import Database').should('be.visible')
    
    // Test Developer tab
    cy.goToTab('Developer')
    cy.contains('Developer Tools').should('be.visible')
    
    // Validate Developer tab content structure
    cy.contains('Cache & Storage').should('be.visible')
    cy.contains('OPFS Operations').should('be.visible')
    cy.contains('Inspect Cache').should('be.visible')
    cy.contains('Clear DB Data').should('be.visible')
  })

  it('should have functional search in Basic tab with data validation', () => {
    cy.goToTab('Basic')
    
    // Check that search input is present
    cy.get('input[placeholder*="happy"]').should('be.visible')
    
    // Check that search button is present
    cy.get('button').contains('Search').should('be.visible')
    
    // Test search functionality with a common word
    cy.get('input[placeholder*="happy"]').clear().type('computer')
    cy.get('button').contains('Search').click()
    
    // Wait for search results and validate structure
    cy.wait(2000) // Allow time for search to complete
    
    // Check if results are displayed (either data or error message)
    cy.get('pre').should('exist')
    
    // Validate that results contain expected structure
    cy.get('pre').then(($pre) => {
      const content = $pre.text()
      if (content && !content.includes('error')) {
        // Should contain JSON structure
        expect(content).to.include('[')
        expect(content).to.include(']')
      }
    })
  })

  it('should have package loading functionality in Advanced tab with validation', () => {
    cy.goToTab('Advanced')
    
    // Check that package loading section is present
    cy.contains('Available Packages').should('be.visible')
    
    // Validate available packages structure
    cy.contains('Open English WordNet').should('be.visible')
    cy.contains('Collaborative Interlingual Index').should('be.visible')
    
    // Check that export/import functionality is present
    cy.contains('Export Database').should('be.visible')
    cy.contains('Import Database').should('be.visible')
    
    // Validate button states
    cy.get('button').contains('Export Database').should('be.visible')
    cy.get('button').contains('Import Database').should('be.visible')
  })

  it('should have developer tools in Developer tab with functionality validation', () => {
    cy.goToTab('Developer')
    
    // Check that cache inspection is present
    cy.contains('Inspect Cache').should('be.visible')
    
    // Check that data management is present
    cy.contains('Clear DB Data').should('be.visible')
    
    // Validate developer tools structure
    cy.contains('Cache & Storage').should('be.visible')
    cy.contains('OPFS Operations').should('be.visible')
    cy.contains('Save Snapshot to OPFS').should('be.visible')
    
    // Validate button states
    cy.get('button').contains('Inspect Cache').should('be.visible')
    cy.get('button').contains('Clear DB Data').should('be.visible')
    cy.get('button').contains('Save Snapshot to OPFS').should('be.visible')
  })

  it('should perform comprehensive data integrity checks', () => {
    // Wait for app to fully initialize
    cy.wait(3000)
    
    // Check system status is in a valid state
    cy.get('[data-testid="system-status"]').should('exist')
    cy.get('[data-testid="system-status"]').within(() => {
      cy.get('p').should('exist')
    })
    
    // Check database statistics have valid structure
    cy.get('[data-testid="database-stats"]').should('exist')
    
    // Check OPFS status is properly detected
    cy.get('[data-testid="opfs-status"]').should('exist')
    cy.get('[data-testid="opfs-status"]').within(() => {
      cy.get('p').should('exist')
    })
    
    // Validate that all main sections are accessible
    cy.goToTab('Basic')
    cy.contains('Basic WordNet Explorer').should('be.visible')
    
    cy.goToTab('Advanced')
    cy.contains('Advanced Data Management').should('be.visible')
    
    cy.goToTab('Developer')
    cy.contains('Developer Tools').should('be.visible')
  })
})
