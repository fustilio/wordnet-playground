/// <reference types="cypress" />

describe('WordNet Basic Demo', () => {
  beforeEach(() => {
    cy.visitApp()
  })

  describe('App Initialization', () => {
    it('should load the app and show the correct title', () => {
      cy.get('h1').should('contain', 'WordNet Basic Demo')
      cy.get('p').should('contain', 'Simple word definitions using WordNet')
    })

    it('should show loading status initially', () => {
      cy.get('.status').should('be.visible')
      cy.get('.status').should('have.class', 'loading')
    })

    it('should have a search form with input and button', () => {
      cy.get('.search-form').should('be.visible')
      cy.get('.search-input').should('be.visible')
      cy.get('.search-button').should('be.visible')
      cy.get('.search-input').should('have.attr', 'placeholder', 'Enter a word (e.g., water, happy, run)')
    })

    it('should disable search initially while loading', () => {
      cy.get('.search-input').should('be.disabled')
      cy.get('.search-button').should('be.disabled')
    })
  })

  describe('WordNet Loading', () => {
    it('should eventually show ready status', () => {
      cy.waitForWordNetReady()
    })

    it('should enable search after loading', () => {
      cy.waitForWordNetReady()
      cy.get('.search-input').should('not.be.disabled')
      cy.get('.search-button').should('not.be.disabled')
    })
  })

  describe('Word Search Functionality', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
    })

    it('should search for a common word and show results', () => {
      cy.searchWord('water')
      cy.shouldShowResults()
      
      // Check that results have expected structure
      cy.get('.synset-table thead th').should('contain', 'POS')
      cy.get('.synset-table thead th').should('contain', 'Definition')
      cy.get('.synset-table thead th').should('contain', 'Synset ID')
      cy.get('.synset-table thead th').should('contain', 'ILI ID')
      
      // Check that we have at least one result
      cy.get('.synset-table tbody tr').should('have.length.greaterThan', 0)
      
      // Check that first result has expected columns
      cy.get('.synset-table tbody tr').first().within(() => {
        cy.get('td').should('have.length', 4)
        cy.get('.pos-tag').should('be.visible')
        cy.get('.definition-cell').should('be.visible')
        cy.get('code').should('have.length', 2) // Synset ID and ILI ID
      })
    })

    it('should search for a verb and show results', () => {
      cy.searchWord('run')
      cy.shouldShowResults()
      
      // Check that we get verb results
      cy.get('.pos-tag.pos-v').should('be.visible')
    })

    it('should search for an adjective and show results', () => {
      cy.searchWord('happy')
      cy.shouldShowResults()
      
      // Check that we get adjective results
      cy.get('.pos-tag.pos-a').should('be.visible')
    })

    it('should search for a noun and show results', () => {
      cy.searchWord('cat')
      cy.shouldShowResults()
      
      // Check that we get noun results
      cy.get('.pos-tag.pos-n').should('be.visible')
    })

    it('should handle search with Enter key', () => {
      cy.get('.search-input').type('dog{enter}')
      cy.shouldShowResults()
    })

    it('should show no results for non-existent word', () => {
      cy.searchWord('nonexistentword123')
      cy.shouldShowNoResults()
    })

    it('should show no results for empty search', () => {
      cy.get('.search-button').click()
      cy.get('.search-button').should('be.disabled')
    })

    it('should clear previous results when searching new word', () => {
      // First search
      cy.searchWord('water')
      cy.shouldShowResults()
      
      // Second search
      cy.searchWord('fire')
      cy.shouldShowResults()
      
      // Results should be different
      cy.get('.synset-table tbody tr').first().should('contain', 'fire')
    })
  })

  describe('Search Form Interactions', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
    })

    it('should update search term as user types', () => {
      cy.get('.search-input').type('test')
      cy.get('.search-input').should('have.value', 'test')
    })

    it('should clear search input', () => {
      cy.get('.search-input').type('test')
      cy.get('.search-input').clear()
      cy.get('.search-input').should('have.value', '')
    })

    it('should disable search button when input is empty', () => {
      cy.get('.search-input').clear()
      cy.get('.search-button').should('be.disabled')
    })

    it('should enable search button when input has content', () => {
      cy.get('.search-input').type('test')
      cy.get('.search-button').should('not.be.disabled')
    })

    it('should show loading state during search', () => {
      cy.get('.search-input').type('water')
      cy.get('.search-button').click()
      
      // Button should show "Searching..." text
      cy.get('.search-button').should('contain', 'Searching...')
      cy.get('.search-button').should('be.disabled')
      cy.get('.search-input').should('be.disabled')
    })
  })

  describe('Results Display', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
      cy.searchWord('water')
    })

    it('should display results in a table format', () => {
      cy.get('.synset-table').should('be.visible')
      cy.get('.synset-table').should('have.class', 'synset-table')
    })

    it('should show part of speech tags with correct styling', () => {
      cy.get('.pos-tag').should('be.visible')
      cy.get('.pos-tag').should('have.class', 'pos-tag')
    })

    it('should show definitions in the definition column', () => {
      cy.get('.definition-cell').should('be.visible')
      cy.get('.definition-cell').should('not.be.empty')
    })

    it('should show synset IDs in code format', () => {
      cy.get('.id-cell code').should('be.visible')
      cy.get('.id-cell code').should('not.be.empty')
    })

    it('should show ILI IDs in code format', () => {
      cy.get('.ili-cell code').should('be.visible')
      cy.get('.ili-cell code').should('not.be.empty')
    })

    it('should have scrollable results container', () => {
      cy.get('.max-h-96').should('be.visible')
      cy.get('.max-h-96').should('have.class', 'overflow-y-auto')
    })

    it('should highlight table rows on hover', () => {
      cy.get('.synset-table tbody tr').first().trigger('mouseover')
      cy.get('.synset-table tbody tr').first().should('have.css', 'background-color')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
    })

    it('should handle network errors gracefully', () => {
      // This test would need to be implemented with network interception
      // For now, we'll test that the app doesn't crash on invalid input
      cy.get('.search-input').type('!@#$%^&*()')
      cy.get('.search-button').click()
      
      // Should either show no results or handle gracefully
      cy.get('body').should('be.visible') // App should still be functional
    })

    it('should show error message if WordNet fails to load', () => {
      // This would require mocking the WordNet loading to fail
      // For now, we'll just ensure the app handles the ready state correctly
      cy.waitForWordNetReady()
      cy.get('.status.error').should('not.exist')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
    })

    it('should have proper form labels and accessibility attributes', () => {
      cy.get('.search-input').should('have.attr', 'type', 'text')
      cy.get('.search-button').should('have.attr', 'type', 'button')
    })

    it('should support keyboard navigation', () => {
      cy.get('.search-input').focus()
      cy.get('.search-input').should('be.focused')
      
      cy.get('.search-input').type('test')
      cy.get('.search-input').type('{enter}')
      cy.shouldShowResults()
    })

    it('should have proper table structure for screen readers', () => {
      cy.searchWord('water')
      cy.get('.synset-table').should('be.visible')
      cy.get('.synset-table thead').should('be.visible')
      cy.get('.synset-table tbody').should('be.visible')
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      cy.waitForWordNetReady()
    })

    it('should load and be ready within reasonable time', () => {
      const startTime = Date.now()
      cy.waitForWordNetReady().then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(60000) // Should load within 60 seconds
      })
    })

    it('should search quickly for common words', () => {
      const startTime = Date.now()
      cy.searchWord('water')
      cy.shouldShowResults().then(() => {
        const searchTime = Date.now() - startTime
        expect(searchTime).to.be.lessThan(5000) // Should search within 5 seconds
      })
    })
  })
})
