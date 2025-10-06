import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSkeleton } from "./profile-skeleton";
import { SearchBarSkeleton } from "./search-bar-skeleton";

export function DashboardNavSkeleton() {
    return (
        <div className="flex w-full items-center justify-between px-70 py-2">
            <div className="flex items-center gap-3 flex-1">
                <ProfileSkeleton />

                {/* ModeToggle Skeleton */}
                <SearchBarSkeleton />
                <Skeleton className="h-10 w-10" />
            </div>

            {/* Logo Skeleton */}
            <Skeleton className="h-13 w-40" />
        </div>
    );
}