import { ReactNode } from 'react';
import { UseWordNetReturn, UseWordNetOptions } from '../hooks/useWordNet.js';
export interface WordNetProviderProps extends UseWordNetOptions {
    children: ReactNode;
}
export interface WordNetContextValue extends UseWordNetReturn {
}
export declare function WordNetProvider({ children, ...options }: WordNetProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useWordNetContext(): WordNetContextValue;
//# sourceMappingURL=WordNetProvider.d.ts.map