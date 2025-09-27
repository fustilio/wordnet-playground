import { logger } from 'wn-ts-core/utils';

/**
 * A reusable progress logger for e2e tests that provides visual feedback
 * during long-running operations like downloading and adding lexicons.
 */
export class ProgressLogger {
  private startTime: number;
  private stage: string;
  private lastLoggedPercent: number;

  constructor(stage: string) {
    this.stage = stage;
    this.startTime = Date.now();
    this.lastLoggedPercent = -1;
    logger.info(`\n[${this.stage}] Starting...`);
  }

  update(progress: number) {
    const percent = Math.floor(progress * 100);
    // Only log every 5% to reduce verbosity
    if (percent >= this.lastLoggedPercent + 5) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      process.stdout.write(`\r[${this.stage}] ${percent}% complete (${elapsed}s)`);
      this.lastLoggedPercent = percent;
    }
  }

  finish() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    process.stdout.write(`\r[${this.stage}] 100% complete (${elapsed}s)\n`);
  }
}
