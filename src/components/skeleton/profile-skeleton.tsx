import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function ProfileSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 p-1", className)}>
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden sm:block space-y-1">
                <Skeleton className="h-4 w-30" />
                <Skeleton className="h-3 w-25" />
            </div>
        </div>
    );
}