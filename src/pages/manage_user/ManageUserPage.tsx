import { getUserProfile } from "@/api/user_api";
import { DashboardPageSkeleton } from "@/components/skeleton/DashboardPageSkeleton";
import type { UserModel } from "@/types/user_model";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import { DashboardNav } from "@/components/nav/DashboardNav";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";

/**
 * use states
 * use effects
 * skeleton
 * return component
 * - header nav
 * - sidebar
 * - main content
 * -- right sidebar
 * --- user list
 * --- pending registration list
 * -- main section
 * --- update profile box 
 */

export function ManageUserPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const navigator = useNavigate();

    useEffect(() => {
        const fetchAllDashboardData = async () => {
            try {
                setIsLoading(true);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const user = await getUserProfile();
                setUserData(user);
                setIsError(false);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setShowErrorPage(true);
                setIsError(true);
                toast.error("Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDashboardData();
    }, []);

    // skeleton
    if (isLoading) {
        return <div><DashboardPageSkeleton role={userData?.role ?? ""} /></div>;
    }

    // Show error page if there's an error or no user data
    if (!userData || isError || showErrorPage) {
        return (
            <>
                <title>C4Vision - Manage Users</title>
                <ErrorPage
                    title="Failed to load data"
                    message="Could not connect to the server. Please check your connection."
                    onRetry={() => window.location.reload()}
                    onGoHome={() => navigator('/')}
                />
            </>
        );
    }

    return (
        <>
            <title>C4Vision - Manage Users</title>
            <ChatProvider currentUserId={userData.id}>
                <div className="fixed top-0 left-0 right-0 z-50">
                    <DashboardNav userData={userData} />
                </div>

                <main className="ml-64 pt-16 min-h-screen">
                    <div className="flex">
                        <div className="flex-1 p-6">
                            <div className="space-y-6">
                                <DashboardSidebar userData={userData} />

                                <div className="space-y-6 max-w-[845px]">
                                    {/* Main section component here */}
                                </div>
                            </div>
                        </div>
                        <div className="w-90 fixed right-5 top-20 h-[88vh] overflow-y-auto bg-background">
                            {/* Right sidebar here */}
                        </div>
                    </div>
                </main>

                {/* Chat Container - renders all open chats */}
                <ChatContainer />
            </ChatProvider>
        </>
    );
}