/// <reference types="cypress" />

describe('SQLite OPFS Feature Tests', () => {
  beforeEach(() => {
    Cypress.log({ name: 'init', message: 'Visiting app for feature tests' });
    cy.visitApp();
    cy.waitForSystemReady();
  });

  it('should run the "Kitchen Sink" end-to-end test', () => {
    cy.section('Running Kitchen Sink test');
    cy.contains('button', 'Kitchen Sink').click();

    cy.get('.break-all', { timeout: 13000 }).should('be.visible').and(($text) => {
      const text = $text.text();
      const output = JSON.parse(text);
      expect(output).to.have.property('res');
      expect(output.res.rows[0].n).to.equal(2);
      // currently doesn't work since opfs doesn't work with cypress browser yet
      // expect(output.files.some((f: any) => f.name === 'kitchen.sqlite3')).to.be.true;
      // expect(output).to.have.property('persistent', true);
      // expect(output).to.have.property('opfsSupported', true);
    });
  });

  it.skip('should persist data across page reloads', () => {
    (cy as any).waitForDbOpen();
    cy.section('Testing data persistence');
    
    const testValue = `persistent-test-${Date.now()}`;
    const setupSql = `
      CREATE TABLE IF NOT EXISTS persistence(id INTEGER PRIMARY KEY, val TEXT);
      DELETE FROM persistence;
      INSERT INTO persistence(val) VALUES ('${testValue}');
      PRAGMA wal_checkpoint(FULL);
      VACUUM;
    `;

    cy.get('textarea').clear().type(setupSql, { parseSpecialCharSequences: false, delay: 0 });
    cy.contains('button', 'Run').click();


    cy.contains('SQL executed successfully.').should('be.visible')
    // // Verify insert before reload
    cy.get('textarea').clear().type('SELECT val FROM persistence;');
    cy.contains('button', 'Run').click();

    cy.get('[data-testid="sql-results"]').should('contain', testValue);

    cy.section('Reloading page');
    cy.reload();

    cy.section('Verifying data after reload');
    cy.waitForSystemReady();
    (cy as any).waitForDbOpen();
    cy.get('textarea').clear().type('SELECT val FROM persistence;');
    cy.contains('button', 'Run').click();
    cy.get('[data-testid="sql-results"]').should('contain', testValue);
  });

  it.skip('should delete a database file from OPFS', () => {
    (cy as any).waitForDbOpen();
    cy.section('Testing file deletion');

    // Ensure the default file exists by seeding
    cy.contains('Seed').click();
    cy.get('[data-testid="status-message"]', { timeout: 15000 }).should('contain', 'Database seeded successfully');

    // Verify file exists in the list
    cy.contains('.truncate', 'demo.sqlite3').should('be.visible');

    cy.section('Deleting file');
    cy.contains('li', 'demo.sqlite3').within(() => {
      cy.get('button').contains('Delete').click();
    });

    cy.section('Verifying file is deleted');
    cy.contains('.truncate', 'demo.sqlite3').should('not.exist');
    cy.contains('DB: not open').should('be.visible');
  });

  it('should display an error for invalid SQL', () => {
    (cy as any).waitForDbOpen();
    cy.section('Testing error handling for invalid SQL');
    
    cy.get('textarea').clear().type('SELECT * FROM table_that_does_not_exist;');
    cy.contains('button', 'Run').click();

    cy.get('.text-red-600').should('be.visible').and('contain', 'no such table');
  });
});
