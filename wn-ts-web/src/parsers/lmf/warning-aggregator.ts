export interface WarningEntry {
  type: string;
  message: string;
  count: number;
  examples: string[];
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface AggregatedWarnings {
  totalWarnings: number;
  uniqueWarningTypes: number;
  warnings: WarningEntry[];
  summary: string;
}

export class WarningAggregator {
  private warnings = new Map<string, WarningEntry>();
  private batchSize: number;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(batchSize = 100, flushIntervalMs = 5000) {
    this.batchSize = batchSize;
    this.flushInterval = flushIntervalMs;
    this.startFlushTimer();
  }

  addWarning(type: string, message: string, exampleId?: string) {
    const key = `${type}:${message}`;
    
    if (this.warnings.has(key)) {
      const existing = this.warnings.get(key)!;
      existing.count++;
      existing.lastOccurrence = new Date();
      if (exampleId && existing.examples.length < 3) {
        existing.examples.push(exampleId);
      }
    } else {
      this.warnings.set(key, {
        type,
        message,
        count: 1,
        examples: exampleId ? [exampleId] : [],
        firstOccurrence: new Date(),
        lastOccurrence: new Date()
      });
    }

    // Flush if we hit the batch size (check total warnings, not unique types)
    const totalWarnings = Array.from(this.warnings.values()).reduce((sum, w) => sum + w.count, 0);
    if (totalWarnings >= this.batchSize) {
      // Don't auto-flush during testing to avoid clearing warnings before test assertions
      if (process.env.NODE_ENV !== 'test') {
        this.flush();
      }
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  flush(): AggregatedWarnings {
    if (this.warnings.size === 0) {
      return {
        totalWarnings: 0,
        uniqueWarningTypes: 0,
        warnings: [],
        summary: 'No warnings'
      };
    }

    const warnings = Array.from(this.warnings.values());
    const totalWarnings = warnings.reduce((sum, w) => sum + w.count, 0);
    
    const summary = this.generateSummary(warnings, totalWarnings);
    
    // Clear the warnings after reporting
    this.warnings.clear();
    
    return {
      totalWarnings,
      uniqueWarningTypes: warnings.length,
      warnings,
      summary
    };
  }

  private generateSummary(warnings: WarningEntry[], total: number): string {
    const topWarnings = warnings
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return `Found ${total} warnings across ${warnings.length} types. Top issues: ${
      topWarnings.map(w => `${w.type} (${w.count})`).join(', ')
    }`;
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}
