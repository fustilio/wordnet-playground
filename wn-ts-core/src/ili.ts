
export interface IliRecord {
  id: string;
  status: string;
  definition?: string;
  [key: string]: string | undefined;
}

export async function isILI(_filePath: string): Promise<boolean> {
  // This is a stub for the browser environment. Node.js implementation has the real logic.
  return Promise.resolve(false);
}

export async function loadILI(_filePath: string): Promise<IliRecord[]> {
  throw new Error('`loadILI` is not available in this environment. Please use `wn-ts-node`.');
}
