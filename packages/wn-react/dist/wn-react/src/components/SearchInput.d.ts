/**
 * Search input component - ready-to-use search input
 */
export interface SearchInputProps {
    placeholder?: string;
    className?: string;
    onSearch?: (term: string) => void;
    debounceMs?: number;
}
export declare function SearchInput({ placeholder, className, onSearch, debounceMs }: SearchInputProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchInput.d.ts.map