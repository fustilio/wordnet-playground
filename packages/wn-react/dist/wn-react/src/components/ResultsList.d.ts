import { default as React } from 'react';
import { Synset } from '../../../wn-ts-core/src';
export interface ResultsListProps {
    className?: string;
    renderResult?: (result: Synset) => React.ReactNode;
    emptyMessage?: string;
    loadingMessage?: string;
}
export declare function ResultsList({ className, renderResult, emptyMessage, loadingMessage }: ResultsListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResultsList.d.ts.map