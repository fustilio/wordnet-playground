// Color utilities for CLI output
const useColor = () => !process.env.NO_COLOR;

export const colors = {
  green: (text: string) => (useColor() ? `\x1b[32m${text}\x1b[0m` : text),
  red: (text: string) => (useColor() ? `\x1b[31m${text}\x1b[0m` : text),
  yellow: (text: string) => (useColor() ? `\x1b[33m${text}\x1b[0m` : text),
  blue: (text: string) => (useColor() ? `\x1b[34m${text}\x1b[0m` : text),
  cyan: (text: string) => (useColor() ? `\x1b[36m${text}\x1b[0m` : text),
  magenta: (text: string) => (useColor() ? `\x1b[35m${text}\x1b[0m` : text),
  bold: (text: string) => (useColor() ? `\x1b[1m${text}\x1b[0m` : text),
  dim: (text: string) => (useColor() ? `\x1b[2m${text}\x1b[0m` : text),
  gray: (text: string) => (useColor() ? `\x1b[90m${text}\x1b[0m` : text),
};
