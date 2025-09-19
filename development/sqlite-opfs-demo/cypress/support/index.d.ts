/// <reference types="cypress" />
// Type augmentation for custom Cypress commands
// Placed in support so TypeScript picks it up automatically

declare namespace Cypress {
  interface Chainable {
    getByTestId(testId: string, options?: Partial<Loggable & Timeoutable & Withinable & Shadow>): Chainable<JQuery<HTMLElement>>
    visitApp(): Chainable<void>
    waitForSystemReady(timeout?: number): Chainable<void>
    waitForDbOpen(timeout?: number): Chainable<void>
    section(message: string): Chainable<void>
  }
}






