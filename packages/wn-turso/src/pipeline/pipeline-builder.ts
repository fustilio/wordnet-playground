/**
 * Fluent Pipeline builder API
 */

import type {
  PipelineSource,
  PipelineSink,
  PipelineResult,
  Operator,
  ProgressCallback,
} from './types.js';
import * as operators from './operators.js';

/**
 * Fluent pipeline builder for data transfer operations
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
  private source: PipelineSource<any>;
  private operations: Operator<any, any>[] = [];

  private constructor(source: PipelineSource<any>) {
    this.source = source;
  }

  /**
   * Create a new pipeline from a source
   */
  static from<T>(source: PipelineSource<T>): Pipeline<T> {
    return new Pipeline<T>(source);
  }

  /**
   * Filter rows based on a predicate
   */
  filter(predicate: (row: T) => boolean): Pipeline<T> {
    this.operations.push(operators.filter(predicate));
    return this;
  }

  /**
   * Map rows to a new shape
   */
  map<U>(fn: (row: T) => U): Pipeline<U> {
    this.operations.push(operators.map(fn));
    return this as unknown as Pipeline<U>;
  }

  /**
   * Transform rows, returning null to skip a row
   */
  transform<U>(fn: (row: T) => U | null | undefined): Pipeline<U> {
    this.operations.push(operators.transform(fn));
    return this as unknown as Pipeline<U>;
  }

  /**
   * Async transform for operations that need to await
   */
  transformAsync<U>(fn: (row: T) => Promise<U | null | undefined>): Pipeline<U> {
    this.operations.push(operators.transformAsync(fn));
    return this as unknown as Pipeline<U>;
  }

  /**
   * Extend rows with additional properties
   * Useful for adding columns to a "working DB" schema
   */
  extend<Ext extends Record<string, any>>(
    fn: (row: T) => Ext
  ): Pipeline<T & Ext> {
    this.operations.push(operators.extend(fn as any));
    return this as unknown as Pipeline<T & Ext>;
  }

  /**
   * Async extend for operations that need to await
   */
  extendAsync<Ext extends Record<string, any>>(
    fn: (row: T) => Promise<Ext>
  ): Pipeline<T & Ext> {
    this.operations.push(operators.extendAsync(fn as any));
    return this as unknown as Pipeline<T & Ext>;
  }

  /**
   * Batch rows into arrays
   */
  batch(size: number): Pipeline<T[]> {
    this.operations.push(operators.batch(size));
    return this as unknown as Pipeline<T[]>;
  }

  /**
   * Side effect for each row (logging, metrics)
   */
  tap(fn: (row: T) => void): Pipeline<T> {
    this.operations.push(operators.tap(fn));
    return this;
  }

  /**
   * Async side effect
   */
  tapAsync(fn: (row: T) => Promise<void>): Pipeline<T> {
    this.operations.push(operators.tapAsync(fn));
    return this;
  }

  /**
   * Take first n rows
   */
  take(n: number): Pipeline<T> {
    this.operations.push(operators.take(n));
    return this;
  }

  /**
   * Skip first n rows
   */
  skip(n: number): Pipeline<T> {
    this.operations.push(operators.skip(n));
    return this;
  }

  /**
   * Deduplicate rows by key
   */
  distinct<K>(keyFn: (row: T) => K): Pipeline<T> {
    this.operations.push(operators.distinct(keyFn));
    return this;
  }

  /**
   * Build the pipeline as an async iterable
   * Useful for manual iteration or custom sinks
   */
  build(): AsyncIterable<T> {
    let stream: AsyncIterable<any> = this.source.read();

    for (const op of this.operations) {
      stream = op(stream);
    }

    return stream;
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
