/**
 * Pipeline operators for transforming data streams
 */

import type { Operator } from './types.js';

/**
 * Filter rows based on a predicate
 */
export function filter<T>(
  predicate: (row: T) => boolean
): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    for await (const row of input) {
      if (predicate(row)) {
        yield row;
      }
    }
  };
}

/**
 * Map rows to a new shape
 */
export function map<In, Out>(
  fn: (row: In) => Out
): Operator<In, Out> {
  return async function* (input: AsyncIterable<In>): AsyncIterable<Out> {
    for await (const row of input) {
      yield fn(row);
    }
  };
}

/**
 * Transform rows, optionally filtering out nulls
 * Return null to skip a row
 */
export function transform<In, Out>(
  fn: (row: In) => Out | null | undefined
): Operator<In, Out> {
  return async function* (input: AsyncIterable<In>): AsyncIterable<Out> {
    for await (const row of input) {
      const result = fn(row);
      if (result !== null && result !== undefined) {
        yield result;
      }
    }
  };
}

/**
 * Async transform for operations that need to await
 */
export function transformAsync<In, Out>(
  fn: (row: In) => Promise<Out | null | undefined>
): Operator<In, Out> {
  return async function* (input: AsyncIterable<In>): AsyncIterable<Out> {
    for await (const row of input) {
      const result = await fn(row);
      if (result !== null && result !== undefined) {
        yield result;
      }
    }
  };
}

/**
 * Extend rows with additional properties
 * Useful for adding columns to a "working DB" schema
 */
export function extend<T extends Record<string, unknown>, Ext extends Record<string, unknown>>(
  fn: (row: T) => Ext
): Operator<T, T & Ext> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T & Ext> {
    for await (const row of input) {
      const extension = fn(row);
      yield { ...row, ...extension };
    }
  };
}

/**
 * Async extend for operations that need to await
 */
export function extendAsync<T extends Record<string, unknown>, Ext extends Record<string, unknown>>(
  fn: (row: T) => Promise<Ext>
): Operator<T, T & Ext> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T & Ext> {
    for await (const row of input) {
      const extension = await fn(row);
      yield { ...row, ...extension };
    }
  };
}

/**
 * Batch rows into arrays
 */
export function batch<T>(size: number): Operator<T, T[]> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T[]> {
    let buffer: T[] = [];

    for await (const row of input) {
      buffer.push(row);
      if (buffer.length >= size) {
        yield buffer;
        buffer = [];
      }
    }

    // Yield remaining items
    if (buffer.length > 0) {
      yield buffer;
    }
  };
}

/**
 * Flatten batches back to individual rows
 */
export function unbatch<T>(): Operator<T[], T> {
  return async function* (input: AsyncIterable<T[]>): AsyncIterable<T> {
    for await (const rows of input) {
      for (const row of rows) {
        yield row;
      }
    }
  };
}

/**
 * Side effect for each row (logging, metrics)
 */
export function tap<T>(fn: (row: T) => void): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    for await (const row of input) {
      fn(row);
      yield row;
    }
  };
}

/**
 * Async side effect
 */
export function tapAsync<T>(fn: (row: T) => Promise<void>): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    for await (const row of input) {
      await fn(row);
      yield row;
    }
  };
}

/**
 * Take first n rows
 */
export function take<T>(n: number): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    let count = 0;
    for await (const row of input) {
      if (count >= n) break;
      yield row;
      count++;
    }
  };
}

/**
 * Skip first n rows
 */
export function skip<T>(n: number): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    let count = 0;
    for await (const row of input) {
      if (count >= n) {
        yield row;
      }
      count++;
    }
  };
}

/**
 * Deduplicate rows by key
 */
export function distinct<T, K>(keyFn: (row: T) => K): Operator<T, T> {
  return async function* (input: AsyncIterable<T>): AsyncIterable<T> {
    const seen = new Set<K>();
    for await (const row of input) {
      const key = keyFn(row);
      if (!seen.has(key)) {
        seen.add(key);
        yield row;
      }
    }
  };
}

/**
 * Compose multiple operators into one
 */
export function compose<A, B, C>(
  op1: Operator<A, B>,
  op2: Operator<B, C>
): Operator<A, C>;
export function compose<A, B, C, D>(
  op1: Operator<A, B>,
  op2: Operator<B, C>,
  op3: Operator<C, D>
): Operator<A, D>;
export function compose<A, B, C, D, E>(
  op1: Operator<A, B>,
  op2: Operator<B, C>,
  op3: Operator<C, D>,
  op4: Operator<D, E>
): Operator<A, E>;
export function compose(...operators: Operator<unknown, unknown>[]): Operator<unknown, unknown> {
  return (input: AsyncIterable<unknown>) =>
    operators.reduce((acc, op) => op(acc), input);
}
