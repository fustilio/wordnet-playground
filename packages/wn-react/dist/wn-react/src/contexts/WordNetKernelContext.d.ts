import { ReactNode } from 'react';
import { UseWordNetKernelOptions, UseWordNetKernelReturn } from '../hooks/useWordNetKernel.js';
export interface WordNetKernelProviderProps extends UseWordNetKernelOptions {
    children: ReactNode;
}
export declare function WordNetKernelProvider({ children, ...options }: WordNetKernelProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useWordNetKernelContext(): UseWordNetKernelReturn;
//# sourceMappingURL=WordNetKernelContext.d.ts.map