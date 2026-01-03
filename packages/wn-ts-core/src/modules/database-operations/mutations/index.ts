/**
 * Database Mutations Module
 * 
 * This module provides all database mutation operations for the WordNet database.
 * It includes CRUD operations, batch operations, schema management, and LMF data handling.
 * 
 * Available Categories:
 * - Insert Operations: Single and batch record insertion
 * - Update Operations: Record updates and upserts
 * - Delete Operations: Lexicon, word, synset, and general record deletion
 * - Schema Operations: Table and index creation
 * - LMF Operations: Lexical Markup Framework data handling
 * - LMF Helpers: Data preparation and validation utilities
 */

// ============================================================================
// INSERT MUTATIONS
// ============================================================================
// Single and batch record insertion operations
export {
  insertRecord,       // Insert a single record with conflict handling
  insertRecords       // Insert multiple records with conflict handling
} from './insert-mutations.js';

// ============================================================================
// UPDATE MUTATIONS
// ============================================================================
// Record update and upsert operations
export {
  updateRecordById,           // Update a single record by ID
  updateRecordsByCondition,   // Update multiple records by condition
  upsertRecord,              // Insert or update a single record
  upsertRecords              // Insert or update multiple records
} from './update-mutations.js';

// ============================================================================
// DELETE MUTATIONS
// ============================================================================
// Record deletion operations with proper foreign key constraint handling
export {
  deleteLexicon,              // Delete entire lexicon and all related data
  deleteWordsByLexicon,       // Delete all words for a specific lexicon
  deleteSynsetsByLexicon,     // Delete all synsets for a specific lexicon
  deleteAllData,              // Delete all data from all tables
  deleteRecordById,           // Delete a single record by ID
  deleteRecordsByCondition    // Delete records by specific condition
} from './delete-mutations.js';

// ============================================================================
// SCHEMA MUTATIONS
// ============================================================================
// Database schema creation and management
export {
  createTables,    // Create all database tables with proper relationships
  createIndexes    // Create performance indexes for better query performance
} from './schema-mutations.js';

// ============================================================================
// LMF DATA MUTATIONS
// ============================================================================
// Lexical Markup Framework data handling operations
export {
  clearConflictingLexiconData,  // Clear conflicting data before LMF insertion
  insertLMFDataInTransaction    // Insert LMF data in a single transaction
} from '../lmf/lmf-data-mutations.js';

// ============================================================================
// LMF DATA HELPERS
// ============================================================================
// Data preparation and validation utilities for LMF processing
export {
  prepareLexiconData,           // Prepare lexicon data for insertion
  prepareWordData,              // Prepare word data for insertion
  prepareFormData,              // Prepare form data for insertion
  prepareSynsetData,            // Prepare synset data for insertion
  prepareSenseData,             // Prepare sense data for insertion
  prepareDefinitionData,        // Prepare definition data for insertion
  validateForeignKeyReferences  // Validate foreign key relationships
} from '../lmf/helpers.js';
