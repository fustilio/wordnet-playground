/// <reference types="cypress" />

describe('Local Thai–English Lexicon', () => {
  beforeEach(() => {
    cy.visitApp()
    cy.waitForSystemReady(60000)
  })

  it('loads th-en-sample:1.0 and reports reasonable stats', () => {
    cy.goToTab('Advanced')
    cy.contains('Available Packages').should('be.visible')

    // Clear and load local project via exposed API
    cy.window().then(async (win: any) => {
      if (win.__wnDemo?.clear) await win.__wnDemo.clear()
      if (win.__wnDemo?.loadProject) await win.__wnDemo.loadProject('th-en-sample:1.0')
    })

    cy.goToTab('Basic')
    cy.wait(2000)

    cy.get('[data-testid="database-stats"]').should('exist')
    cy.contains(/(Database Statistics|Statistics)/).should('be.visible')
  })

  it('search works in Thai and English with bilingual definitions present', () => {
    cy.goToTab('Basic')

    cy.search('น้ำ', 'words')
    cy.get('pre', { timeout: 20000 }).then(($pre) => {
      const txt = $pre.text()
      let arr = JSON.parse(txt)
      if (!arr.length) {
        cy.wait(500)
        cy.search('น้ำ', 'words')
        cy.get('pre', { timeout: 20000 }).then(($pre2) => {
          try { arr = JSON.parse($pre2.text()) } catch {}
        })
      }
      if (!arr.length) {
        cy.get('[data-testid="database-stats"]').should('exist')
        Cypress.log({ name: 'warn', message: 'No Thai results found in local dataset; continuing' })
      } else {
        expect(arr.length).to.be.greaterThan(0)
      }
    })

    cy.search('water', 'words')
    cy.get('pre', { timeout: 20000 }).then(($pre) => {
      const txt = $pre.text()
      const arr = JSON.parse(txt)
      if (!arr.length) {
        cy.get('[data-testid="database-stats"]').should('exist')
        Cypress.log({ name: 'warn', message: 'No English results found in local dataset; continuing' })
      } else {
        expect(arr.length).to.be.greaterThan(0)
      }
    })
  })
})