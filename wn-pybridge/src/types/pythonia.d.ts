declare module 'pythonia' {
  export function python(moduleName: string): Promise<any>;
  export function python(moduleName: string, options?: any): Promise<any>;
} 