/// <reference types="cypress" />

// Sequential Runner E2E
describe('Sequential Runner', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady()
    cy.goToTab('Examples')
    cy.contains('Sequential Runner').click()
    cy.getByTestId('sequential-runner').should('be.visible')
  })

  it('runs all steps and validates outputs', () => {
    cy.section('Run All steps')
    cy.getByTestId('run-all').click()

    // initialize
    cy.getByTestId('step-output-initialize', { timeout: 120000 })
      .should('be.visible')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((o) => {
        expect(o.initialized).to.be.true
        expect(o.hasDataLoader).to.be.true
      })

    // load-demo
    cy.getByTestId('step-output-load-demo')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((stats) => {
        // sanity checks: non-trivial counts
        expect(stats.totalWords).to.be.greaterThan(1000)
        expect(stats.totalSynsets).to.be.greaterThan(500)
      })

    // stats
    cy.getByTestId('step-output-stats')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((stats) => {
        expect(stats.totalWords).to.be.greaterThan(1000)
        expect(stats.totalSynsets).to.be.greaterThan(500)
      })

    // query-words
    cy.getByTestId('step-output-query-words')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((res) => {
        expect(res.durationMs).to.be.a('number')
        expect(res.count).to.be.greaterThan(0)
        expect(res.sample).to.be.an('array')
      })

    // query-synsets
    cy.getByTestId('step-output-query-synsets')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((res) => {
        expect(res.durationMs).to.be.a('number')
        expect(res.count).to.be.greaterThan(0)
        expect(res.sample).to.be.an('array')
      })

    // cache-info
    cy.getByTestId('step-output-cache-info')
      .invoke('text')
      .then((txt) => JSON.parse(txt)).should((info) => {
        expect(info).to.have.keys('isSupported', 'totalFiles', 'totalSizeMB', 'availableSpaceMB')
      })

    // OPFS widget sanity if supported
    cy.getByTestId('opfs-status').then(($el) => {
      const supported = $el.text().includes('Supported')
      if (supported) {
        cy.wrap($el).contains('Used:')
        cy.wrap($el).contains('Available:')
        cy.wrap($el).contains('Total:')
      }
    })
  })
})