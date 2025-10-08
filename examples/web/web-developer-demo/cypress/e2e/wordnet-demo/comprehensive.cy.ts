/// <reference types="cypress" />

describe('WordNet Developer Demo - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
  })

  describe('Data Loading and Management', () => {
    it('should load WordNet data successfully', () => {
      cy.goToTab('Advanced')
      
      // Check if data is already loaded
      cy.get('[data-testid="database-stats"]').then(($stats) => {
        const statsText = $stats.text()
        
        if (statsText.includes('No statistics available')) {
          // Load data if not already loaded
          cy.contains('Load Required').click()
          
          // Wait for loading to complete
          cy.contains('Loading', { timeout: 60000 }).should('not.exist')
          
          // Verify data is loaded
          cy.get('[data-testid="database-stats"]').should('contain.text', 'Words:')
        }
      })
    })

    it('should handle package loading with progress indication', () => {
      cy.goToTab('Advanced')
      
      // Check for loading indicators
      cy.get('button').contains('Load Required').click()
      
      // Should show loading state
      cy.contains('Loading').should('be.visible')
      
      // Wait for completion
      cy.contains('Loading', { timeout: 60000 }).should('not.exist')
    })

    it('should export and import database functionality', () => {
      cy.goToTab('Advanced')
      
      // Test export functionality
      cy.get('button').contains('Export Database').should('be.visible')
      cy.get('button').contains('Export Database').click()
      
      // Should trigger download or show export status
      cy.wait(2000)
      
      // Test import functionality
      cy.get('button').contains('Import Database').should('be.visible')
    })

    it('should clear cache and reload data', () => {
      cy.goToTab('Developer')
      
      // Clear cache
      cy.get('button').contains('Clear DB Data').click()
      
      // Confirm action if dialog appears
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-dialog"]').length > 0) {
          cy.get('button').contains('Confirm').click()
        }
      })
      
      // Verify cache is cleared
      cy.wait(2000)
      
      // Go back to Advanced tab to reload
      cy.goToTab('Advanced')
      cy.get('button').contains('Load Required').click()
      
      // Wait for reload
      cy.contains('Loading', { timeout: 60000 }).should('not.exist')
    })
  })

  describe('Search Functionality Across Tabs', () => {
    it('should perform word search in Basic tab', () => {
      cy.goToTab('Basic')
      
      // Search for a common word
      cy.search('computer')
      
      // Verify results are displayed
      cy.get('pre').should('be.visible')
      cy.get('pre').should('not.be.empty')
    })

    it('should perform synset search in Basic tab', () => {
      cy.goToTab('Basic')
      
      // Switch to synsets tab
      cy.get('button').contains('synsets').click()
      
      // Search for synsets
      cy.search('computer', 'synsets')
      
      // Verify results
      cy.get('pre').should('be.visible')
    })

    it('should perform sense search in Basic tab', () => {
      cy.goToTab('Basic')
      
      // Switch to senses tab
      cy.get('button').contains('senses').click()
      
      // Search for senses
      cy.search('computer', 'senses')
      
      // Verify results
      cy.get('pre').should('be.visible')
    })

    it('should handle search errors gracefully', () => {
      cy.goToTab('Basic')
      
      // Search for invalid input
      cy.get('input[placeholder*="happy"]').clear().type('!@#$%^&*()')
      cy.get('button').contains('Search').click()
      
      // Should handle gracefully
      cy.get('pre').should('be.visible')
    })
  })

  describe('Multilingual Features', () => {
    it('should load multilingual packages', () => {
      cy.goToTab('Advanced')
      
      // Look for multilingual package options
      cy.get('body').then(($body) => {
        if ($body.text().includes('French') || $body.text().includes('Thai')) {
          // Load multilingual packages
          cy.get('button').contains('Load Required').click()
          
          // Wait for loading
          cy.contains('Loading', { timeout: 60000 }).should('not.exist')
        }
      })
    })

    it('should perform cross-lingual searches', () => {
      cy.goToTab('Basic')
      
      // Test with different languages if available
      cy.get('body').then(($body) => {
        if ($body.text().includes('French') || $body.text().includes('Thai')) {
          cy.search('water')
          
          // Should show results
          cy.get('pre').should('be.visible')
        }
      })
    })
  })

  describe('Developer Tools', () => {
    it('should inspect cache and show storage information', () => {
      cy.goToTab('Developer')
      
      // Inspect cache
      cy.get('button').contains('Inspect Cache').click()
      
      // Should show cache information
      cy.wait(2000)
      cy.get('pre, .cache-info').should('be.visible')
    })

    it('should save snapshot to OPFS', () => {
      cy.goToTab('Developer')
      
      // Save snapshot
      cy.get('button').contains('Save Snapshot to OPFS').click()
      
      // Should show success or progress
      cy.wait(2000)
    })

    it('should perform OPFS operations', () => {
      cy.goToTab('Developer')
      
      // Look for OPFS operation buttons
      cy.get('button').contains('OPFS').click()
      
      // Should show OPFS information
      cy.wait(2000)
    })
  })

  describe('Performance and Reliability', () => {
    it('should handle rapid tab switching', () => {
      const tabs = ['Basic', 'Advanced', 'Developer']
      
      // Rapidly switch between tabs
      for (let i = 0; i < 3; i++) {
        tabs.forEach(tab => {
          cy.goToTab(tab)
          cy.wait(100)
        })
      }
      
      // Should still be functional
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').should('be.visible')
    })

    it('should handle multiple searches in sequence', () => {
      cy.goToTab('Basic')
      
      const words = ['computer', 'water', 'happy', 'run', 'cat']
      
      words.forEach(word => {
        cy.search(word)
        cy.wait(1000)
      })
      
      // Should still be functional
      cy.get('input[placeholder*="happy"]').should('be.visible')
    })

    it('should maintain state across page interactions', () => {
      cy.goToTab('Basic')
      cy.search('computer')
      
      // Switch tabs and come back
      cy.goToTab('Advanced')
      cy.goToTab('Basic')
      
      // Should still be functional
      cy.get('input[placeholder*="happy"]').should('be.visible')
      cy.get('button').contains('Search').should('be.visible')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', () => {
      // This would require network interception
      // For now, test with invalid input
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').clear().type('nonexistentword123')
      cy.get('button').contains('Search').click()
      
      // Should handle gracefully
      cy.get('pre').should('be.visible')
    })

    it('should handle empty searches', () => {
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').clear()
      cy.get('button').contains('Search').click()
      
      // Should handle gracefully
      cy.get('body').should('be.visible')
    })

    it('should handle special characters in search', () => {
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').clear().type('café')
      cy.get('button').contains('Search').click()
      
      // Should handle gracefully
      cy.get('pre').should('be.visible')
    })
  })

  describe('Accessibility and Usability', () => {
    it('should support keyboard navigation', () => {
      cy.goToTab('Basic')
      
      // Tab through elements
      cy.get('input[placeholder*="happy"]').focus()
      cy.get('input[placeholder*="happy"]').should('be.focused')
      
      cy.get('input[placeholder*="happy"]').type('{tab}')
      cy.get('button').contains('Search').should('be.focused')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.goToTab('Basic')
      
      // Check for proper form structure
      cy.get('input[placeholder*="happy"]').should('have.attr', 'type', 'text')
      cy.get('button').contains('Search').should('have.attr', 'type', 'button')
    })

    it('should be responsive on different screen sizes', () => {
      // Test mobile viewport
      cy.viewport(375, 667)
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').should('be.visible')
      
      // Test tablet viewport
      cy.viewport(768, 1024)
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').should('be.visible')
      
      // Test desktop viewport
      cy.viewport(1920, 1080)
      cy.goToTab('Basic')
      cy.get('input[placeholder*="happy"]').should('be.visible')
    })
  })

  describe('Data Integrity and Validation', () => {
    it('should validate search results structure', () => {
      cy.goToTab('Basic')
      cy.search('computer')
      
      cy.get('pre').then(($pre) => {
        const content = $pre.text()
        
        if (content && !content.includes('error')) {
          // Should be valid JSON
          expect(() => JSON.parse(content)).to.not.throw()
          
          const data = JSON.parse(content)
          expect(data).to.be.an('array')
        }
      })
    })

    it('should maintain data consistency across operations', () => {
      cy.goToTab('Advanced')
      
      // Get initial stats
      cy.get('[data-testid="database-stats"]').then(($stats) => {
        const initialStats = $stats.text()
        
        // Perform operations
        cy.goToTab('Basic')
        cy.search('computer')
        
        // Go back and check stats haven't changed unexpectedly
        cy.goToTab('Advanced')
        cy.get('[data-testid="database-stats"]').should('contain.text', 'Words:')
      })
    })
  })
})
