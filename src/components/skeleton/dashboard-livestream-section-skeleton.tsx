// src/components/livestream/LivestreamContainerSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function LivestreamContainerSkeleton() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 max-w-[52rem]">
                <Skeleton className="h-8 w-120" />
                <Skeleton className="h-6 w-35" />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-6 max-w-[52rem]">
                {/* Vehicle Counts Sidebar - LEFT */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-30" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>

                {/* Video Feed - RIGHT */}
                <div className="space-y-4">
                    {/* Video Player */}
                    <Skeleton className="h-90 w-full" />

                    {/* Controls */}
                    <div className="flex gap-2">
                        <Skeleton className="h-15 w-160" />
                    </div>
                </div>
            </div>
        </div>
    );
}