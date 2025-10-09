import { Skeleton } from "@/components/ui/skeleton";

export function RequestPredictionSkeleton() {
    return (
        <div className="w-full space-y-2">
            {/* Chart Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-65 w-full" />
            </div>

            {/* AI Recommendations Skeleton */}
            <div className="space-y-32">
                <Skeleton className="h-40 w-full" />
            </div>

            {/* Form Skeleton */}
            <div className="space-y-32">
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
}