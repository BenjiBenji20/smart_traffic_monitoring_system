import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    onQueryChange?: (query: string) => void;
    className?: string;
    autoFocus?: boolean;
    debounceMs?: number;
    value?: string;
}

export function SearchBar({
    placeholder = "Search...",
    onSearch,
    onQueryChange,
    className = "",
    autoFocus = false,
    debounceMs = 300,
    value = ""
}: SearchBarProps) {
    const [query, setQuery] = useState(value);

    // Debounce the search
    useEffect(() => {
        if (onQueryChange) {
            const timeoutId = setTimeout(() => {
                onQueryChange(query);
            }, debounceMs);

            return () => clearTimeout(timeoutId);
        }
    }, [query, debounceMs, onQueryChange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(query);
    };

    const handleClear = () => {
        setQuery("");
        onSearch?.("");
        onQueryChange?.("");
    };

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus={autoFocus}
            />
            {query && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </form>
    );
}