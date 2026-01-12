/**
 * Pipeline module exports
 */

// High-level pipeline builder
export { Pipeline } from "./pipeline-builder.js";

// Sources
export { tursoSource, kyselySource, arraySource } from "./source.js";

// Sinks
export { tursoSink, kyselySink, arraySink } from "./sink.js";

// Operators
export {
  filter,
  map,
  transform,
  transformAsync,
  extend,
  extendAsync,
  batch,
  unbatch,
  tap,
  tapAsync,
  take,
  skip,
  distinct,
  deduplicateByChecksum,
  compose,
} from "./operators.js";

// Low-level streaming utilities
export { streamTable, writeBatches, countRows } from "./streams.js";

// Checksum utilities
export {
  computeChecksum,
  checksumBatch,
  loadChecksumsFromTable,
  compareChecksums,
  filterChangedRows,
} from "./checksum.js";

// Types
export type {
  PipelineSource,
  PipelineSink,
  PipelineResult,
  PipelineProgress,
  ProgressCallback,
  SourceOptions,
  SinkOptions,
  ChecksumDeduplication,
  Operator,
} from "./types.js";
export type { ChecksumComparison } from "./checksum.js";
