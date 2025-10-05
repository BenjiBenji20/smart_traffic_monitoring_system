// pages/DashboardPage.tsx
import { DashboardSidebar } from "./DashboardSidebar"
import { DashboardNav } from "./DashboardNav"

export function DashboardPage() {
    return (
        <>
            <DashboardNav />
            <DashboardSidebar />

            {/* Main content with sidebar offset */}
            <main className="ml-64 mt-16 p-6 min-h-screen">
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Modern Dashboard</h1>
                    <p>Clean, borderless design for 2025</p>

                    {/* Your dashboard content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                            Card 1
                        </div>
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
                            Card 2
                        </div>
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
                            Card 3
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}