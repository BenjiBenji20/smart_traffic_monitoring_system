import { Skeleton } from "../ui/skeleton";
import { DashboardNavSkeleton } from "./dashboard-nav-skeleton";
import { DashboardSidebarSkeleton } from "./dashboard-sidebar-skeleton";

export function HistoryPageSkeleton() {

    return (
        <>
            <DashboardNavSkeleton />
            <DashboardSidebarSkeleton />

            {/* I'LL EMBED LIVESTREAM COMPONENT HERE */}

            {/* Main content with sidebar offset */}
            <main className="ml-64 p-6 min-h-screen">
                <div className="flex">
                    {/* Left side - Main content */}
                    <div className="flex-1 p-6">
                        <div className="space-y-6">
                            {/* ALL SECTIONS */}
                            <div className="space-y-6 max-w-[830px]">

                                {/* Prediction Summary Section */}
                                <Skeleton className="h-100 w-full" />

                                {/* Prediction Detail Section */}
                                <Skeleton className="h-100 w-full" />

                                {/* Download button */}
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="w-90 fixed right-0 top-25 h-[88vh] overflow-y-auto bg-background">
                        <Skeleton className="h-7 w-35" />
                        <Skeleton className="mt-4 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                        <Skeleton className="mt-2 h-15 w-80" />
                    </div>
                </div>
            </main>
        </>
    )
}