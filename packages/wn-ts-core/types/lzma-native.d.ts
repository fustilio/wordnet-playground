declare module 'lzma-native' {
  import { Writable } from 'stream';

  interface Decompressor extends Writable {
    on(event: 'error', handler: (err: Error) => void): this;
  }

  interface Lzma {
    createDecompressor(): Decompressor;
  }

  const lzma: Lzma;
  export default lzma;
} 