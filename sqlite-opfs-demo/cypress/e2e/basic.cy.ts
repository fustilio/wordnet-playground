/// <reference types="cypress" />

describe("SQLite OPFS Demo", () => {
  beforeEach(() => {
    Cypress.log({ name: "init", message: "Visiting app for UI smoke checks" });
    cy.visitApp();
    cy.waitForSystemReady();
    (cy as any).waitForDbOpen();
  });

  it("should load the application and display basic elements", () => {
    cy.contains("SQLite OPFS Demo").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("OPFS Files").should("be.visible");
    cy.contains("SQL").should("be.visible");
  });

  it("should be able to run a simple SQL query", () => {
    cy.log("Running simple query");
    cy.get("button")
      .contains("Run")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.get('[data-testid="sql-results"]').should("exist");

    cy.log("Query executed and results are visible");
  });

  it("can seed sample schema and query it", () => {
    cy.log("Seeding database and waiting for completion");
    cy.contains("Seed").click();
    cy.contains("Database seeded successfully").should("be.visible");

    cy.log("Querying seeded data");
    cy.get("textarea").clear().type("SELECT COUNT(*) as n FROM notes;");
    cy.get("button")
      .contains("Run")
      .should("be.visible")
      .and("not.be.disabled")
      .click();
    cy.get('[data-testid="sql-results"]', { timeout: 15000 }).contains("n");
    cy.log("Verified query against seeded data");
  });

  it("lists OPFS files", () => {
    cy.contains("OPFS Files").should("be.visible");
  });

  it("UI elements exist", () => {
    cy.get("textarea").should("exist");
    cy.get("button").contains("Run").should("exist");
  });

  it("can run DDL and SELECT", () => {
    const ddl =
      "CREATE TABLE IF NOT EXISTS t(x); INSERT INTO t(x) VALUES (42); SELECT * FROM t;";
    cy.log(`Running DDL and SELECT: ${ddl}`);
    cy.get("textarea").clear().type(ddl);
    cy.get("button")
      .contains("Run")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.log("Waiting for results and verifying content");
    cy.get('[data-testid="sql-results"]', { timeout: 15000 }).contains("x");
    cy.get('[data-testid="sql-results"]', { timeout: 15000 }).contains("42");
    cy.log("DDL and SELECT verified");
  });

  it("seed operation creates notes table", () => {
    cy.log("Seeding database and waiting for completion");
    cy.contains("Seed").click();
    cy.get('[data-testid="status-message"]', { timeout: 15000 }).should(
      "contain",
      "Database seeded successfully."
    );

    cy.log("Verifying 'notes' table exists in sqlite_master");
    cy.get("textarea")
      .clear()
      .type(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notes';"
      );
    cy.get("button")
      .contains("Run")
      .should("be.visible")
      .and("not.be.disabled")
      .click();
    cy.get('[data-testid="sql-results"]', { timeout: 15000 }).contains("notes");
    cy.log("Verified notes table creation");
  });

  it("shows OPFS file list and allows deletion button to exist", () => {
    cy.contains("OPFS Files")
      .parent()
      .within(() => {
        // There may or may not be files; just ensure list renders
        cy.get("ul").should("exist");
      });
  });

  it("basic smoke waits briefly and page remains responsive", () => {
    cy.wait(500);
    cy.contains("SQLite OPFS Demo").should("be.visible");
  });
});
