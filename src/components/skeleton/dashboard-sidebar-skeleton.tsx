import { Skeleton } from "../ui/skeleton";
import { ProfileSkeleton } from "./profile-skeleton";

export function DashboardSidebarSkeleton() {
    return (
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background z-40 w-64">
            <div className="flex flex-col h-full space-y-4 p-4">
                {/* Menu Items */}
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded" />
                    <Skeleton className="h-10 w-full rounded" />
                    <Skeleton className="h-10 w-full rounded" />
                    <Skeleton className="h-10 w-4/5 rounded" />
                    <Skeleton className="h-10 w-3/4 rounded" />
                </div>
                
                {/* Footer Profile */}
                <div className="mt-auto flex items-center gap-3 p-2">
                    <ProfileSkeleton />
                </div>
            </div>
        </div>
    );
}