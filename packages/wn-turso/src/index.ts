/**
 * wn-turso - Turso/libsql database backend and data pipeline utilities for WordNet
 *
 * @packageDocumentation
 */

// Main WordNet class
export { TursoWordnet, type TursoWordnetOptions } from './wordnet/index.js';

// Database components
export {
  TursoDatabase,
  TursoQueryService,
  createTursoDialect,
  TursoDriver,
  TursoConnection,
  type Database,
} from './database/index.js';

// Adapters
export {
  RemoteTursoAdapter,
  EmbeddedTursoAdapter,
  type TursoAdapter,
  type TursoAdapterInfo,
} from './adapters/index.js';

// Configuration
export {
  type TursoDatabaseConfig,
  type TursoConnectionMode,
  type SyncConfig,
  defaultSyncConfig,
  validateTursoConfig,
} from './config.js';

// Pipeline (re-export from subpath for convenience)
export { Pipeline } from './pipeline/index.js';
