/**
 * Fluent Pipeline builder API
 */

import type {
  PipelineSource,
  PipelineSink,
  PipelineResult,
  Operator,
} from "./types.js";
import * as operators from "./operators.js";

/**
 * Fluent pipeline builder for data transfer operations
 *
 * Type Safety Strategy:
 * - Public API uses generics (T, U, etc.) for compile-time type safety
 * - Internal storage uses `unknown` for type erasure to avoid complex recursive types
 * - Type assertions (`as unknown as Pipeline<U>`) are safe because:
 *   1. Operations are stored in order and applied sequentially
 *   2. Each operation's types are validated at the call site
 *   3. The final type T is tracked through the fluent chain
 * - This pattern is similar to RxJS, Lodash chain, and other fluent APIs
 *
 * @example
 * ```typescript
 * const result = await Pipeline
 *   .from(tursoSource(sourceConfig, 'synsets'))
 *   .filter(row => row.language === 'en')
 *   .extend(row => ({
 *     cached_count: 0,
 *     custom_score: computeScore(row),
 *   }))
 *   .to(tursoSink(destConfig, 'synsets_working'));
 * ```
 */
export class Pipeline<T> {
  // Internal state uses unknown for type erasure - public API maintains type safety
  private source: PipelineSource<unknown>;
  private operations: Operator<unknown, unknown>[] = [];

  private constructor(source: PipelineSource<unknown>) {
    this.source = source;
  }

  /**
   * Create a new pipeline from a source
   */
  static from<T>(source: PipelineSource<T>): Pipeline<T> {
    return new Pipeline<T>(source as PipelineSource<unknown>);
  }

  /**
   * Filter rows based on a predicate
   */
  filter(predicate: (row: T) => boolean): Pipeline<T> {
    this.operations.push(
      operators.filter(predicate) as Operator<unknown, unknown>
    );
    return this;
  }

  /**
   * Map rows to a new shape
   */
  map<U>(fn: (row: T) => U): Pipeline<U> {
    this.operations.push(operators.map(fn) as Operator<unknown, unknown>);
    // Type assertion safe: we're changing the generic parameter to match
    // the output type of the map operation
    return this as unknown as Pipeline<U>;
  }

  /**
   * Transform rows, returning null to skip a row
   */
  transform<U>(fn: (row: T) => U | null | undefined): Pipeline<U> {
    this.operations.push(operators.transform(fn) as Operator<unknown, unknown>);
    return this as unknown as Pipeline<U>;
  }

  /**
   * Async transform for operations that need to await
   */
  transformAsync<U>(
    fn: (row: T) => Promise<U | null | undefined>
  ): Pipeline<U> {
    this.operations.push(
      operators.transformAsync(fn) as Operator<unknown, unknown>
    );
    return this as unknown as Pipeline<U>;
  }

  /**
   * Extend rows with additional properties
   * Useful for adding columns to a "working DB" schema
   */
  extend<Ext extends Record<string, unknown>>(
    fn: (row: T) => Ext
  ): Pipeline<T & Ext> {
    // Type assertion safe: we widen T to unknown for internal storage,
    // but the actual function maintains its type at runtime
    this.operations.push(
      operators.extend(
        fn as (row: unknown) => Record<string, unknown>
      ) as Operator<unknown, unknown>
    );
    return this as unknown as Pipeline<T & Ext>;
  }

  /**
   * Async extend for operations that need to await
   */
  extendAsync<Ext extends Record<string, unknown>>(
    fn: (row: T) => Promise<Ext>
  ): Pipeline<T & Ext> {
    this.operations.push(
      operators.extendAsync(
        fn as (row: unknown) => Promise<Record<string, unknown>>
      ) as Operator<unknown, unknown>
    );
    return this as unknown as Pipeline<T & Ext>;
  }

  /**
   * Batch rows into arrays
   */
  batch(size: number): Pipeline<T[]> {
    this.operations.push(operators.batch(size) as Operator<unknown, unknown>);
    return this as unknown as Pipeline<T[]>;
  }

  /**
   * Side effect for each row (logging, metrics)
   */
  tap(fn: (row: T) => void): Pipeline<T> {
    this.operations.push(operators.tap(fn) as Operator<unknown, unknown>);
    return this;
  }

  /**
   * Async side effect
   */
  tapAsync(fn: (row: T) => Promise<void>): Pipeline<T> {
    this.operations.push(operators.tapAsync(fn) as Operator<unknown, unknown>);
    return this;
  }

  /**
   * Take first n rows
   */
  take(n: number): Pipeline<T> {
    this.operations.push(operators.take(n) as Operator<unknown, unknown>);
    return this;
  }

  /**
   * Skip first n rows
   */
  skip(n: number): Pipeline<T> {
    this.operations.push(operators.skip(n) as Operator<unknown, unknown>);
    return this;
  }

  /**
   * Deduplicate rows by key
   */
  distinct<K>(keyFn: (row: T) => K): Pipeline<T> {
    this.operations.push(
      operators.distinct(keyFn) as Operator<unknown, unknown>
    );
    return this;
  }

  /**
   * Deduplicate rows by comparing checksums
   * Skips rows that haven't changed based on checksum comparison
   */
  deduplicateByChecksum(options: {
    keyField: string;
    checksumFields?: string[];
    existingChecksums: Map<string, string>;
  }): Pipeline<T> {
    this.operations.push(
      operators.deduplicateByChecksum(options) as Operator<unknown, unknown>
    );
    return this;
  }

  /**
   * Build the pipeline as an async iterable
   * Useful for manual iteration or custom sinks
   */
  build(): AsyncIterable<T> {
    let stream: AsyncIterable<unknown> = this.source.read();

    for (const op of this.operations) {
      stream = op(stream);
    }

    return stream as AsyncIterable<T>;
  }

  /**
   * Execute the pipeline and write to a sink
   */
  async to(sink: PipelineSink<T>): Promise<PipelineResult> {
    const stream = this.build();
    return sink.write(stream);
  }

  /**
   * Execute the pipeline and collect results into an array
   */
  async toArray(): Promise<T[]> {
    const results: T[] = [];
    const stream = this.build();

    for await (const row of stream) {
      results.push(row);
    }

    return results;
  }

  /**
   * Count the rows that pass through the pipeline
   */
  async count(): Promise<number> {
    let count = 0;
    const stream = this.build();

    for await (const _row of stream) {
      count++;
    }

    return count;
  }

  /**
   * Execute a function for each row
   */
  async forEach(fn: (row: T) => void): Promise<void> {
    const stream = this.build();

    for await (const row of stream) {
      fn(row);
    }
  }

  /**
   * Execute an async function for each row
   */
  async forEachAsync(fn: (row: T) => Promise<void>): Promise<void> {
    const stream = this.build();

    for await (const row of stream) {
      await fn(row);
    }
  }

  /**
   * Get the source count (if available)
   */
  async sourceCount(): Promise<number | undefined> {
    return this.source.count?.();
  }
}
