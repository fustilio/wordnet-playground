// Progress indicator utility for CLI
export class ProgressIndicator {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private i = 0;
  private currentMessage = "";

  start(message: string) {
    this.currentMessage = message;
    // Advance the spinner on each call to show activity.
    // This avoids using setInterval, which can cause shutdown issues on Windows
    // by keeping the event loop alive.
    this.i = (this.i + 1) % this.frames.length;
    process.stdout.write(`\r${this.frames[this.i]} ${this.currentMessage}`);
  }

  stop(message?: string) {
    if (message) {
      process.stdout.write(`\r\x1b[32m✓\x1b[0m ${message}\n`);
    } else {
      process.stdout.write("\n");
    }
  }

  error(message: string) {
    process.stdout.write(`\r\x1b[31m✗\x1b[0m ${message}\n`);
  }
}
