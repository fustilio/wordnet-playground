/// <reference types="vitest" />

declare global {
  interface ImportMeta {
    vitest?: typeof import('vitest');
  }
}

export {}; 