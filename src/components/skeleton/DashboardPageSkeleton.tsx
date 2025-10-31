import { Skeleton } from "../ui/skeleton";
import { LivestreamContainerSkeleton } from "./dashboard-livestream-section-skeleton";
import { DashboardNavSkeleton } from "./dashboard-nav-skeleton";
import { DashboardSidebarSkeleton } from "./dashboard-sidebar-skeleton";
import { RequestPredictionSkeleton } from "./request-prediction-skeleton";

interface RoleProps {
    role: string;
}

export function DashboardPageSkeleton({ role }: RoleProps) {

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
                            {role === "admin" && (
                                <div className="space-y-6">
                                    <LivestreamContainerSkeleton />
                                </div>
                            )}

                            {/* ALL SECTIONS */}
                            <div className="space-y-6 max-w-[830px]">
                                {/* Prediction Summary Section */}
                                <Skeleton className="h-100 w-full" />

                                {/* Prediction Detail Section */}
                                <Skeleton className="h-100 w-full" />

                                {/* Prediction Factors Section */}
                                <Skeleton className="h-100 w-full" />

                                {/* Download button */}
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="w-90 fixed right-5 top-20 h-[88vh] overflow-y-auto bg-background">
                        <RequestPredictionSkeleton />
                    </div>
                </div>
            </main>
        </>
    )
}