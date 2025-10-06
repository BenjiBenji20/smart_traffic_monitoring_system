import { DashboardNavSkeleton } from "./dashboard-nav-skeleton";
import { DashboardSidebarSkeleton } from "./dashboard-sidebar-skeleton";

export function DashboardPageSkeleton() {
    return (
        <>
            <DashboardNavSkeleton />
            <DashboardSidebarSkeleton />
        </>
    );
}