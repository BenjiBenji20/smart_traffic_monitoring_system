import { Skeleton } from "../ui/skeleton";

export function SearchBarSkeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* Search icon skeleton */}
            <Skeleton className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded" />
            
            {/* Input field skeleton */}
            <Skeleton className="h-10 w-70 pl-10" />
        </div>
    );
}