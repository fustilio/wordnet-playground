/// <reference types="cypress" />

describe('SQLite OPFS CRUD Stress Test', () => {
  beforeEach(() => {
    Cypress.log({ name: 'init', message: 'Visiting app for CRUD tests' });
    cy.visitApp();
    cy.waitForSystemReady();
    (cy as any).waitForDbOpen();
  });

  it('should perform CRUD operations on a batch of users', () => {
    cy.fixture('users.json').then(users => {
      Cypress.log({ name: 'SETUP', message: 'Creating users table' });
      const createTable = `
        DROP TABLE IF EXISTS users;
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          username TEXT,
          email TEXT,
          phone TEXT,
          website TEXT
        );
      `;
      cy.get('textarea').clear().type(createTable, { parseSpecialCharSequences: false, delay: 0 });
      cy.get('button').contains('Run').click();

      // CREATE
      Cypress.log({ name: 'CREATE', message: 'Batch inserting users' });
      const escape = (str: string) => str.replace(/'/g, "''");
      const values = (users as any[]).map((user: any) =>
        `(${user.id}, '${escape(user.name)}', '${escape(user.username)}', '${escape(user.email)}', '${escape(user.phone)}', '${escape(user.website)}')`
      ).join(',\n');
      const insertSql = `INSERT INTO users (id, name, username, email, phone, website) VALUES ${values};`;
      
      cy.get('textarea').clear().type(insertSql, { parseSpecialCharSequences: false, delay: 0 });
      cy.get('button').contains('Run').click();

      // VERIFY CREATE
      Cypress.log({ name: 'VERIFY', message: 'Verifying batch insert' });
      cy.get('textarea').clear().type('SELECT COUNT(*) as count FROM users;');
      cy.get('button').contains('Run').click();
      cy.get('[data-testid="sql-results"]', { timeout: 15000 }).should('contain', (users as any[]).length);

      // READ
      Cypress.log({ name: 'READ', message: 'Reading a user' });
      const userToRead = users[Math.floor((users as any[]).length / 2)];
      cy.get('textarea').clear().type(`SELECT name, email FROM users WHERE id = ${userToRead.id};`);
      cy.get('button').contains('Run').click();
      cy.get('[data-testid="sql-results"]').within(() => {
        cy.contains('th', 'name');
        cy.contains('th', 'email');
        cy.contains('td', userToRead.name);
        cy.contains('td', userToRead.email);
      });

      // UPDATE
      Cypress.log({ name: 'UPDATE', message: 'Updating a user' });
      const userToUpdate = users[0];
      const newName = 'Cypress Test User';
      cy.get('textarea').clear().type(`UPDATE users SET name = '${newName}' WHERE id = ${userToUpdate.id};`);
      cy.get('button').contains('Run').click();

      // VERIFY UPDATE
      Cypress.log({ name: 'VERIFY', message: 'Verifying update' });
      cy.get('textarea').clear().type(`SELECT name FROM users WHERE id = ${userToUpdate.id};`);
      cy.get('button').contains('Run').click();
      cy.get('[data-testid="sql-results"]').should('contain', newName);
      
      // DELETE
      Cypress.log({ name: 'DELETE', message: 'Deleting a user' });
      const userToDelete = users[0];
      cy.get('textarea').clear().type(`DELETE FROM users WHERE id = ${userToDelete.id};`);
      cy.get('button').contains('Run').click();
      
      // VERIFY DELETE
      Cypress.log({ name: 'VERIFY', message: 'Verifying delete' });
      cy.get('textarea').clear().type('SELECT COUNT(*) as count FROM users;');
      cy.get('button').contains('Run').click();
      cy.get('[data-testid="sql-results"]', { timeout: 15000 }).should('contain', (users as any[]).length - 1);
    });
  });
});
