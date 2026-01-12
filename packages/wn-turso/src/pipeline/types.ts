/**
 * Pipeline types
 */

/**
 * Pipeline result after transfer
 */
export interface PipelineResult {
  /** Total rows processed */
  processed: number;
  /** Rows successfully inserted */
  inserted: number;
  /** Rows skipped (filtered out or null from transform) */
  skipped: number;
  /** Rows that failed */
  errors: number;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Progress callback for pipeline operations
 */
export interface PipelineProgress {
  /** Current row number */
  current: number;
  /** Total rows (if known) */
  total?: number;
  /** Rows processed so far */
  processed: number;
  /** Rows skipped so far */
  skipped: number;
  /** Rows with errors so far */
  errors: number;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Pipeline source - reads data from a database
 */
export interface PipelineSource<T> {
  /** Read rows as async iterable */
  read(): AsyncIterable<T>;
  /** Get total count (optional) */
  count?(): Promise<number>;
  /** Get source name for logging */
  name?: string;
}

/**
 * Pipeline sink - writes data to a database
 */
export interface PipelineSink<T> {
  /** Write rows from async iterable */
  write(data: AsyncIterable<T>): Promise<PipelineResult>;
  /** Get sink name for logging */
  name?: string;
}

/**
 * Options for creating a source
 */
export interface SourceOptions {
  /** Batch size for reading */
  batchSize?: number;
  /** Where clause modifier */
  where?: (qb: any) => any;
  /** Order by clause */
  orderBy?: string;
  /** Limit rows */
  limit?: number;
  /** Skip rows */
  offset?: number;
}

/**
 * Options for creating a sink
 */
export interface SinkOptions {
  /** Batch size for writing */
  batchSize?: number;
  /** Conflict resolution strategy */
  onConflict?: 'ignore' | 'replace' | 'error';
  /** Progress callback */
  onProgress?: ProgressCallback;
}

/**
 * Operator function type
 * Transforms an async iterable into another async iterable
 */
export type Operator<In, Out> = (
  input: AsyncIterable<In>
) => AsyncIterable<Out>;
