import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import { config, download, add, Wordnet } from '../../src/index.js';
import { decompressXz } from '../../src/utils/archive.js';
import { logger } from 'wn-ts-core/utils';
import { ProgressLogger } from '../../utils/progress-logger.js';

export interface TestContext {
  e2eDataDir: string;
  wordnetClient: Wordnet;
  cleanup: () => Promise<void>;
}

/**
 * Setup a shared test environment with common lexicons
 */
export async function setupTestEnvironment(
  testName: string,
  lexicons: string[] = ['oewn:2024']
): Promise<TestContext> {
  // Setup a persistent data directory for all e2e tests
  const e2eDataDir = mkdtempSync(join(tmpdir(), `wn-ts-${testName}-e2e-`));
  config.dataDirectory = e2eDataDir;

  // Initialize by creating a Wordnet instance - this will handle database initialization
  new Wordnet('*');

  // Download and add CILI if needed for ILI-based tests
  if (lexicons.some(l => l.includes('cili'))) {
    const ciliDownloadProgress = new ProgressLogger('Download CILI');
    const ciliPath = await download('cili:1.0', {
      force: true,
      progress: ciliDownloadProgress.update.bind(ciliDownloadProgress),
    });
    ciliDownloadProgress.finish();

    // Decompress the CILI .tsv.xz file before adding
    const { basename, dirname } = await import('path');
    const decompressedCiliPath = join(dirname(ciliPath), basename(ciliPath, '.xz'));
    logger.info(`Decompressing ${ciliPath} to ${decompressedCiliPath}...`);
    await decompressXz(ciliPath, decompressedCiliPath);
    logger.success('Decompression complete.');

    const ciliAddProgress = new ProgressLogger('Add CILI to DB');
    await add(decompressedCiliPath, {
      force: true,
      progress: ciliAddProgress.update.bind(ciliAddProgress),
    });
    ciliAddProgress.finish();
  }

  // Download and add requested lexicons
  for (const lexicon of lexicons) {
    if (lexicon.includes('cili')) continue; // Already handled above

    const downloadProgress = new ProgressLogger(`Download ${lexicon}`);
    const path = await download(lexicon, {
      force: true,
      progress: downloadProgress.update.bind(downloadProgress),
    });
    downloadProgress.finish();

    const addProgress = new ProgressLogger(`Add ${lexicon} to DB`);
    await add(path, {
      force: true,
      progress: addProgress.update.bind(addProgress),
    });
    addProgress.finish();
  }

  // Initialize the wordnet client once for all tests
  const wordnetClient = new Wordnet('*');

  const cleanup = async () => {
    if (e2eDataDir && existsSync(e2eDataDir)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        rmSync(e2eDataDir, { recursive: true, force: true });
        logger.info(`🗑️ Cleaned up test directory: ${e2eDataDir}`);
      } catch (error) {
        logger.warn(`Failed to clean up test directory: ${error}`);
      }
    }
  };

  logger.success(`${testName} e2e setup complete.`);
  return { e2eDataDir, wordnetClient, cleanup };
}
