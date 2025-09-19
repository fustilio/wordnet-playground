/**
 * Environment-agnostic interfaces for wn-ts-core
 * 
 * These interfaces define the operations needed by wn-ts-core without
 * specifying how they should be implemented. The actual implementations
 * are provided by environment-specific packages (wn-ts-node, wn-ts-web).
 */

export interface FileSystemInterface {
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: any): Promise<void>;
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  stat(path: string): Promise<FileStats>;
  readdir(path: string): Promise<string[]>;
  copyFile(src: string, dest: string): Promise<void>;
}

export interface FileStats {
  isDirectory(): boolean;
  isFile(): boolean;
  size: number;
}

export interface StreamInterface {
  on(event: string, callback: (data: any) => void): this;
  pipe(destination: any): any;
  destroy(): void;
}

export interface ReadStreamInterface extends StreamInterface {
  // Additional read stream specific methods if needed
}

export interface WriteStreamInterface extends StreamInterface {
  // Additional write stream specific methods if needed
}

export interface FileSystemFactory {
  createReadStream(path: string, options?: any): ReadStreamInterface;
  createWriteStream(path: string, options?: any): WriteStreamInterface;
}

export interface ProcessInterface {
  exec(command: string): Promise<{ stdout: string; stderr: string }>;
}

export interface PathInterface {
  join(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;
  extname(path: string): string;
}

export interface CompressionInterface {
  decompressXz(sourcePath: string, destPath: string): Promise<void>;
  decompressGz(sourcePath: string, destPath: string): Promise<void>;
}

export interface XMLParserInterface {
  createParser(options?: any): XMLParser;
}

export interface XMLParser {
  on(event: string, callback: (data: any) => void): this;
  write(data: string): this;
  close(): void;
}

export interface EnvironmentProvider {
  fileSystem: FileSystemInterface;
  fileSystemFactory: FileSystemFactory;
  process: ProcessInterface;
  path: PathInterface;
  compression: CompressionInterface;
  xmlParser: XMLParserInterface;
}

/**
 * Global environment provider that will be set by environment-specific packages
 */
export let environmentProvider: EnvironmentProvider | null = null;

export function setEnvironmentProvider(provider: EnvironmentProvider): void {
  environmentProvider = provider;
}

export function getEnvironmentProvider(): EnvironmentProvider {
  if (!environmentProvider) {
    throw new Error('Environment provider not set. Make sure to initialize the environment-specific package first.');
  }
  return environmentProvider;
} 