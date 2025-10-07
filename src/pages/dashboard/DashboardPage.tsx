import { DashboardSidebar } from "./DashboardSidebar"
import { DashboardNav } from "./DashboardNav"
import { useEffect, useState } from "react"
import type { UserModel } from "@/models/user_model"
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard-page-skeleton";
import { DashboardLivestreamSection } from "./DashboardLivestreamSection";

export function DashboardPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);

                // wait for your auth context to be ready
                await new Promise(resolve => setTimeout(resolve, 1000));

                const user = await getUserProfile();
                setUserData(user);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                setError("Failed to load user data");
                toast.error("Failed to load user data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (isLoading) {
        // soon pag sinipag loading skeleton lalagay
        return <div><DashboardPageSkeleton /></div>;
    }

    if (error || !userData) {
        return <div>{error || "Failed to load profile"}</div>;
    }

    return (
        <>
            <DashboardNav userData={userData} />
            <DashboardSidebar userData={userData} />
            
            {/* I'LL EMBED LIVESTREAM COMPONENT HERE */}

            {/* Main content with sidebar offset */}
            <main className="ml-64 p-6 min-h-screen">
                <div className="space-y-6">
                    <DashboardLivestreamSection />
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