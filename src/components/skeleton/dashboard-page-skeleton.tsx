import { LivestreamContainerSkeleton } from "./dashboard-livestream-section-skeleton";
import { DashboardNavSkeleton } from "./dashboard-nav-skeleton";
import { DashboardSidebarSkeleton } from "./dashboard-sidebar-skeleton";

export function DashboardPageSkeleton() {

    return (
        <>
            <DashboardNavSkeleton />
            <DashboardSidebarSkeleton />

            {/* I'LL EMBED LIVESTREAM COMPONENT HERE */}

            {/* Main content with sidebar offset */}
            <main className="ml-64 p-6 min-h-screen">
                <div className="space-y-6">
                    <LivestreamContainerSkeleton />
                </div>
            </main>
        </>
    )
}