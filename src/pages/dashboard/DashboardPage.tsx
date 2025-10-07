import { DashboardSidebar } from "../../components/sidebar/DashboardSidebar"
import { DashboardNav } from "../../components/nav/DashboardNav"
import { useEffect, useState } from "react"
import type { UserModel } from "@/models/user_model"
import { getUserProfile } from "@/api/user_api";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard-page-skeleton";
import { DashboardLivestreamSection } from "@/components/livestream/LivestreamContainer";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";

export function DashboardPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const navigator = useNavigate();

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
                setShowErrorPage(true);
                toast.error("Failed to load user data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (isLoading) {
        // show dashboard skeleton during 1sec timeout
        return <div><DashboardPageSkeleton /></div>;
    }

    return (
        <>
            {/* Guard against malicious entry */}
            {!userData || showErrorPage ? (
                <ErrorPage
                    title="Failed to load data"
                    message="Could not connect to the server. Please check your connection."
                    onRetry={() => window.location.reload()}
                    onGoHome={() => navigator('/')}
                />
            ) : (
                <>
                    <DashboardNav userData={userData} />

                    {/* Main content with sidebar offset */}
                    <main className="ml-64 p-6 min-h-screen">
                        <div className="space-y-6">
                            <DashboardSidebar userData={userData} />
                            <DashboardLivestreamSection />
                            <h1 className="text-3xl font-bold">Modern Dashboard</h1>
                            <p>Clean, borderless design for 2025</p>

                            {/* dashboard content here */}
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
            )}

        </>
    )
}