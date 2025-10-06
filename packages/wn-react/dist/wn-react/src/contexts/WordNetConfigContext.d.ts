import { ReactNode } from 'react';
export interface WordNetConfig {
    workerUrl?: string;
    enableWorkers?: boolean;
    fallbackToMainThread?: boolean;
    storage?: 'opfs' | 'indexeddb' | 'memory';
    cache?: boolean;
}
export interface WordNetConfigProviderProps {
    children: ReactNode;
    config?: Partial<WordNetConfig>;
}
export declare function WordNetConfigProvider({ children, config }: WordNetConfigProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useWordNetConfig(): WordNetConfig;
//# sourceMappingURL=WordNetConfigContext.d.ts.map