# Logging and Debugging Documentation

## E2E Test Hanging Issue

### Problem Description
The E2E test (`wn-ts-node/tests/e2e/basic.e2e.test.ts`) was getting stuck during the database insertion phase, specifically after LMF parsing completed and "Add OEWN to DB" reached 50% complete. The process would hang without further progress updates.

### Debugging Approach Implemented

#### 1. Enhanced Progress Tracking in LMF Loading
**File**: `wn-ts-core/src/lmf.ts`
- Added more frequent progress updates (every 500-1000 elements or 2 seconds)
- Implemented 30-second timeout mechanism to prevent indefinite hangs
- Added detailed debug logging to show element processing and progress percentage

#### 2. Staged Progress Tracking in Database Insertion
**File**: `wn-ts-node/src/data-management-node.ts`
- Implemented staged progress tracking for the `add` function:
  - LMF parsing: 0-50%
  - Lexicon insertion: 50-51%
  - Word insertion: 51-71%
  - Form insertion: 71-81%
  - Synset insertion: 81-91%
  - Definition insertion: 91-96%
  - Relation insertion: 96-98%
  - Sense insertion: 98-99%
  - Example insertion: 99-100%

#### 3. Enhanced Database Logging
**File**: `wn-ts-node/src/db/batch-insert.ts`
- Added detailed logging for each batch insert operation
- Log chunk processing progress and completion status
- Enhanced error logging with SQL queries and data samples

**File**: `wn-ts-node/src/db/better-sqlite3-adapter.ts`
- Added SQL operation logging with parameter counts
- Enhanced error reporting with full SQL queries and parameter samples
- Added success/failure logging for each database operation

#### 4. Database Configuration Improvements
**File**: `wn-ts-node/src/db/better-sqlite3-adapter.ts`
- **FIXED**: Removed 30-second timeout from database initialization to match working `wn-ts` implementation
- Enabled WAL (Write-Ahead Logging) mode for better concurrency
- Set synchronous mode to NORMAL for balance between safety and performance

### Debug Logging Levels

#### DEBUG Level Logs
- `[DEBUG _addLmf]`: LMF data processing and insertion progress
- `[DEBUG batchInsert]`: Batch insertion operations and chunk processing
- `[DEBUG db.run]`: Individual SQL operations and results
- `[DEBUG]`: Database initialization and configuration

#### Error Logging
- Detailed error messages with context
- SQL queries and parameter samples
- Data structure information for debugging

### Key Findings

#### 1. Progress Tracking
- **FIXED**: LMF parsing timeout issue resolved by removing the 30-second timeout mechanism from `wn-ts-core/src/lmf.ts`
- **ROOT CAUSE**: The `wn-ts-core` version had a timeout mechanism that the working `wn-ts` version didn't have
- **SOLUTION**: Removed timeout code and simplified progress tracking to match the working implementation
- **RESULT**: LMF parsing now completes successfully (0-100% progress)

#### 2. Database Insertion Issue
- **FIXED**: Database insertion issue resolved by updating `wn-ts-node/src/db/batch-insert.ts` to match the working `wn-ts` implementation
- **ROOT CAUSE**: The `wn-ts-node` version was missing:
  - Transaction wrapper (`db.transaction(() => { ... })`)
  - Proper batch size calculation (`MAX_VARS = 900` and `batchSize = Math.floor(MAX_VARS / columns.length)`)
  - Larger default chunk size (`transactionChunkSize = 10000` vs `1000`)
- **SOLUTION**: Updated `batchInsert` to use the same sophisticated batching logic as the working version
- **ADDITIONAL FIX**: Added `transaction` method to `wn-ts-node/src/db/manager.ts` to support transaction operations
- **RESULT**: Database insertion should now work correctly with proper transaction handling and batching

#### 3. Database Timeout Issue
- **FIXED**: Database timeout issue resolved by removing the 30-second timeout from `wn-ts-node/src/db/better-sqlite3-adapter.ts`
- **ROOT CAUSE**: The `wn-ts-node` version had a `timeout: 30000` option that the working `wn-ts` version didn't have
- **SOLUTION**: Removed timeout configuration to match the working implementation
- **RESULT**: Database operations should no longer hang due to timeout issues

#### 4. Transaction Method Issue
- **FIXED**: Transaction method error resolved by updating `wn-ts-node/src/db/manager.ts`
- **ROOT CAUSE**: The `transaction` method was trying to call `(this.db as any).transaction(fn)()` but the `DatabaseInterface` doesn't have a `transaction` method
- **SOLUTION**: Updated to cast to `BetterSqlite3Database` and call the transaction method directly: `(this.db as BetterSqlite3Database).transaction(fn)`
- **RESULT**: Transaction operations should now work correctly

#### 5. Database Performance
- WAL mode improves concurrency but may not prevent all locking issues
- Large batch insertions (1000+ rows) can cause temporary locks
- Timeout configuration helps prevent indefinite hangs

#### 6. Data Volume
- OEWN data contains significant volume of lexicons, words, and related entities
- Batch processing with 1000-row chunks balances performance and memory usage
- Progress tracking reveals which data types cause delays

### Troubleshooting Steps

#### 1. Monitor Progress
```bash
cd wn-ts-node
pnpm vitest basic.e2e
```
Watch for:
- LMF parsing progress (0-50%)
- Database insertion progress (50-100%)
- Any error messages or hanging points

#### 2. Check Database State
- Verify database file exists and is not locked
- Check for any error messages in the logs
- Monitor memory usage during large operations

#### 3. Debug Database Operations
- Enable detailed logging with `WN_TS_LOG_LEVEL=5`
- Monitor SQL operations and parameter counts
- Check for transaction failures or timeouts

### Current Status
- **LMF Parsing**: ✅ Fixed - completes successfully
- **Database Timeout**: ✅ Fixed - removed timeout configuration
- **Transaction Method**: ✅ Fixed - updated method call
- **Batch Insertion**: ✅ Fixed - updated to match working implementation
- **E2E Test**: 🔄 Testing - awaiting final verification

### Next Steps
1. Run the E2E test to verify all fixes are working
2. Monitor for any remaining issues during database insertion
3. Update documentation if test passes successfully
4. Consider performance optimizations if needed
