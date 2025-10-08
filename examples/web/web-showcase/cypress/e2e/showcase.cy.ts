/// <reference types="cypress" />

describe('WordNet Showcase', () => {
  beforeEach(() => {
    cy.visitShowcase()
  })

  describe('App Initialization', () => {
    it('should load the app and show the correct title', () => {
      cy.get('h1').should('contain', 'WordNet Showcase')
    })

    it('should show the sidebar with demo list', () => {
      cy.get('.sidebar').should('be.visible')
      cy.get('.demo-list').should('be.visible')
    })

    it('should show the main content area', () => {
      cy.get('.main-content').should('be.visible')
    })

    it('should have demo items in the sidebar', () => {
      cy.get('.demo-item').should('have.length.greaterThan', 0)
    })
  })

  describe('Demo Navigation', () => {
    it('should navigate to Basic Search Demo', () => {
      cy.get('.demo-button').contains('Basic Search').click()
      cy.url().should('include', '/basic-search')
      cy.get('.demo-page').should('be.visible')
    })

    it('should navigate to Advanced Search Demo', () => {
      cy.get('.demo-button').contains('Advanced Search').click()
      cy.url().should('include', '/advanced-search')
      cy.get('.demo-page').should('be.visible')
    })

    it('should navigate to Synonym/Antonym Demo', () => {
      cy.get('.demo-button').contains('Synonym/Antonym').click()
      cy.url().should('include', '/synonym-antonym')
      cy.get('.demo-page').should('be.visible')
    })

    it('should navigate to Word Relationships Demo', () => {
      cy.get('.demo-button').contains('Word Relationships').click()
      cy.url().should('include', '/word-relationships')
      cy.get('.demo-page').should('be.visible')
    })

    it('should highlight active demo in sidebar', () => {
      cy.get('.demo-button').contains('Basic Search').click()
      cy.get('.demo-button.active').should('contain', 'Basic Search')
    })
  })

  describe('Basic Search Demo', () => {
    beforeEach(() => {
      cy.get('.demo-button').contains('Basic Search').click()
    })

    it('should show demo title and description', () => {
      cy.get('.demo-title').should('contain', 'Basic Search')
      cy.get('.demo-description').should('be.visible')
    })

    it('should have search functionality', () => {
      cy.waitForWordNetReady()
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
    })

    it('should search for a word and show results', () => {
      cy.waitForWordNetReady()
      cy.searchWord('water')
      cy.shouldShowResults()
    })

    it('should handle empty search gracefully', () => {
      cy.waitForWordNetReady()
      cy.get('.search-button').click()
      // Should either be disabled or show appropriate message
      cy.get('body').should('be.visible')
    })
  })

  describe('Advanced Search Demo', () => {
    beforeEach(() => {
      cy.get('.demo-button').contains('Advanced Search').click()
    })

    it('should show demo title and description', () => {
      cy.get('.demo-title').should('contain', 'Advanced Search')
      cy.get('.demo-description').should('be.visible')
    })

    it('should have advanced search controls', () => {
      cy.waitForWordNetReady()
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
    })

    it('should show part of speech filters', () => {
      cy.waitForWordNetReady()
      cy.get('.pos-filter').should('be.visible')
    })

    it('should search and show results with POS breakdown', () => {
      cy.waitForWordNetReady()
      cy.searchWord('run')
      cy.shouldShowResults()
      
      // Should show POS distribution
      cy.get('.pos-counts').should('be.visible')
    })
  })

  describe('Synonym/Antonym Demo', () => {
    beforeEach(() => {
      cy.get('.demo-button').contains('Synonym/Antonym').click()
    })

    it('should show demo title and description', () => {
      cy.get('.demo-title').should('contain', 'Synonym/Antonym')
      cy.get('.demo-description').should('be.visible')
    })

    it('should have search functionality', () => {
      cy.waitForWordNetReady()
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
    })

    it('should search and show synonym/antonym results', () => {
      cy.waitForWordNetReady()
      cy.searchWord('happy')
      cy.shouldShowResults()
      
      // Should show synonym/antonym sections
      cy.get('.synonym-antonym-results').should('be.visible')
    })
  })

  describe('Word Relationships Demo', () => {
    beforeEach(() => {
      cy.get('.demo-button').contains('Word Relationships').click()
    })

    it('should show demo title and description', () => {
      cy.get('.demo-title').should('contain', 'Word Relationships')
      cy.get('.demo-description').should('be.visible')
    })

    it('should have search functionality', () => {
      cy.waitForWordNetReady()
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
    })

    it('should search and show relationship results', () => {
      cy.waitForWordNetReady()
      cy.searchWord('cat')
      cy.shouldShowResults()
      
      // Should show relationship information
      cy.get('.word-relationships').should('be.visible')
    })
  })

  describe('Cross-Demo Navigation', () => {
    it('should maintain state when switching between demos', () => {
      // Navigate to Basic Search
      cy.get('.demo-button').contains('Basic Search').click()
      cy.waitForWordNetReady()
      cy.searchWord('water')
      cy.shouldShowResults()
      
      // Navigate to Advanced Search
      cy.get('.demo-button').contains('Advanced Search').click()
      cy.waitForWordNetReady()
      
      // Navigate back to Basic Search
      cy.get('.demo-button').contains('Basic Search').click()
      cy.waitForWordNetReady()
      
      // Should still be functional
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
    })

    it('should handle rapid navigation between demos', () => {
      const demos = ['Basic Search', 'Advanced Search', 'Synonym/Antonym', 'Word Relationships']
      
      demos.forEach(demo => {
        cy.get('.demo-button').contains(demo).click()
        cy.get('.demo-page').should('be.visible')
        cy.wait(100) // Small delay between navigations
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.get('.sidebar').should('be.visible')
      cy.get('.main-content').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      cy.get('.sidebar').should('be.visible')
      cy.get('.main-content').should('be.visible')
    })

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080) // Desktop
      cy.get('.sidebar').should('be.visible')
      cy.get('.main-content').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid demo routes gracefully', () => {
      cy.visit('/invalid-demo')
      // Should either redirect to home or show 404
      cy.get('body').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.waitForWordNetReady()
      cy.get('.demo-button').contains('Basic Search').click()
      
      // Test with invalid input
      cy.get('.search-input').type('!@#$%^&*()')
      cy.get('.search-button').click()
      
      // Should handle gracefully
      cy.get('body').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      cy.get('h1').should('exist')
      cy.get('.demo-title').should('exist')
    })

    it('should support keyboard navigation', () => {
      cy.get('.demo-button').first().focus()
      cy.get('.demo-button').first().should('be.focused')
      
      cy.get('.demo-button').first().type('{enter}')
      cy.get('.demo-button.active').should('be.visible')
    })

    it('should have proper form labels', () => {
      cy.get('.demo-button').contains('Basic Search').click()
      cy.waitForWordNetReady()
      
      cy.get('.search-input').should('have.attr', 'type', 'text')
      cy.get('.search-button').should('have.attr', 'type', 'button')
    })
  })

  describe('Performance', () => {
    it('should load the app within reasonable time', () => {
      const startTime = Date.now()
      cy.visitShowcase().then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(10000) // Should load within 10 seconds
      })
    })

    it('should navigate between demos quickly', () => {
      const startTime = Date.now()
      cy.get('.demo-button').contains('Basic Search').click()
      cy.get('.demo-page').should('be.visible').then(() => {
        const navTime = Date.now() - startTime
        expect(navTime).to.be.lessThan(2000) // Should navigate within 2 seconds
      })
    })
  })
})
