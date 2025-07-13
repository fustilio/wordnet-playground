// Progress indicator utility for CLI
export class ProgressIndicator {
  private interval: NodeJS.Timeout | null = null;
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private i = 0;

  start(message: string) {
    process.stdout.write(`\r${this.frames[this.i]} ${message}`);
    this.interval = setInterval(() => {
      this.i = (this.i + 1) % this.frames.length;
      process.stdout.write(`\r${this.frames[this.i]} ${message}`);
    }, 80);
  }

  stop(message?: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (message) {
      process.stdout.write(`\r\x1b[32m✓\x1b[0m ${message}\n`);
    } else {
      process.stdout.write("\n");
    }
  }

  error(message: string) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`\r\x1b[31m✗\x1b[0m ${message}\n`);
  }
}
