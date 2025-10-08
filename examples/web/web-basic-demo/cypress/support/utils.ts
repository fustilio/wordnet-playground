/// <reference types="cypress" />

/**
 * Utility functions for WordNet Basic Demo tests
 * Following Cypress Real World App best practices
 * https://github.com/cypress-io/cypress-realworld-app
 */

export const selectors = {
  // App structure
  app: '[data-testid="app"]',
  header: 'h1',
  status: '.status',
  searchForm: '.search-form',
  searchInput: '.search-input',
  searchButton: '.search-button',
  results: '.results',
  synsetTable: '.synset-table',
  noResults: '.no-results',
  
  // Status states
  statusLoading: '.status.loading',
  statusReady: '.status.ready',
  statusError: '.status.error',
  
  // Table elements
  tableHeader: '.synset-table thead',
  tableBody: '.synset-table tbody',
  tableRow: '.synset-table tbody tr',
  posTag: '.pos-tag',
  definitionCell: '.definition-cell',
  idCell: '.id-cell',
  iliCell: '.ili-cell',
} as const;

export const testData = {
  commonWords: ['water', 'computer', 'happy', 'run', 'cat', 'dog'],
  invalidWords: ['nonexistentword123', '!@#$%^&*()'],
  emptyString: '',
} as const;

export const timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  veryLong: 60000,
} as const;

/**
 * Wait for WordNet to be ready with proper error handling
 */
export function waitForWordNetReady(timeout = timeouts.veryLong): void {
  cy.get(selectors.statusReady, { timeout })
    .should('be.visible')
    .and('contain', 'Ready to search!');
}

/**
 * Perform a word search with proper error handling
 */
export function performSearch(word: string): void {
  cy.get(selectors.searchInput)
    .clear()
    .type(word);
  
  cy.get(selectors.searchButton)
    .click();
}

/**
 * Check if results are displayed properly
 */
export function validateResults(): void {
  cy.get(selectors.synsetTable)
    .should('be.visible');
  
  cy.get(selectors.tableRow)
    .should('have.length.greaterThan', 0);
  
  // Validate table structure
  cy.get(selectors.tableHeader)
    .should('contain', 'POS')
    .and('contain', 'Definition')
    .and('contain', 'Synset ID')
    .and('contain', 'ILI ID');
}

/**
 * Check if no results message is displayed
 */
export function validateNoResults(): void {
  cy.get(selectors.noResults)
    .should('be.visible');
  
  cy.get(selectors.synsetTable)
    .should('not.exist');
}

/**
 * Validate part of speech tags
 */
export function validatePosTags(): void {
  cy.get(selectors.posTag)
    .should('be.visible')
    .and('have.class', 'pos-tag');
}

/**
 * Check accessibility features
 */
export function validateAccessibility(): void {
  // Check form structure
  cy.get(selectors.searchInput)
    .should('have.attr', 'type', 'text');
  
  cy.get(selectors.searchButton)
    .should('have.attr', 'type', 'button');
  
  // Check keyboard navigation
  cy.get(selectors.searchInput)
    .focus()
    .should('be.focused');
}

/**
 * Test responsive design
 */
export function testResponsiveDesign(): void {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ];
  
  viewports.forEach(({ width, height, name }) => {
    cy.viewport(width, height);
    cy.get(selectors.searchInput).should('be.visible');
    cy.log(`✅ ${name} viewport (${width}x${height}) works correctly`);
  });
}

/**
 * Measure performance of operations
 */
export function measurePerformance<T>(
  operation: () => T,
  maxDuration: number
): Cypress.Chainable<T> {
  const startTime = Date.now();
  
  return cy.wrap(null).then(() => {
    const result = operation();
    const duration = Date.now() - startTime;
    
    expect(duration).to.be.lessThan(maxDuration);
    cy.log(`⏱️ Operation completed in ${duration}ms (max: ${maxDuration}ms)`);
    
    return result;
  });
}
