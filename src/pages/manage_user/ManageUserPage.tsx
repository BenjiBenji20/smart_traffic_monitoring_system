// pages/ManageUserPage.tsx
import { getUserProfile } from "@/api/user_api";
import { userManagementApi } from "@/api/crud_api";
import { DashboardPageSkeleton } from "@/components/skeleton/DashboardPageSkeleton";
import type { 
    UserModel, 
    UserSchema, 
    PendingUserSchema, 
    ArchiveUserSchema, 
    ArchiveActiveUserSchema 
} from "@/types/user.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorPage } from "../error/ErrorPage";
import { useNavigate } from "react-router";
import { DashboardNav } from "@/components/nav/DashboardNav";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";
import { UserListSidebar } from "@/components/manage_user/UserListSideBar"
import { UserProfileContainer } from "@/components/manage_user/UserProfileContainer";
import { Footer } from "@/components/footer/Footer";

type UserType = UserSchema | PendingUserSchema | ArchiveUserSchema | ArchiveActiveUserSchema;
type UserSource = 'Traffic Managers' | 'Archived Managers' | 'Pending Registrations' | 'Archived Registrations';

export function ManageUserPage() {
    const [userData, setUserData] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    // User management states
    const [activeUsers, setActiveUsers] = useState<UserSchema[]>([]);
    const [archivedUsers, setArchivedUsers] = useState<ArchiveActiveUserSchema[]>([]);
    const [pendingRegistrations, setPendingRegistrations] = useState<PendingUserSchema[]>([]);
    const [archivedRegistrations, setArchivedRegistrations] = useState<ArchiveUserSchema[]>([]);

    // Selected user state
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [selectedUserSource, setSelectedUserSource] = useState<UserSource>('Traffic Managers');

    const navigator = useNavigate();

    useEffect(() => {
        const fetchAllDashboardData = async () => {
            try {
                setIsLoading(true);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const user = await getUserProfile();
                setUserData(user);

                // Fetch all user management data
                const [active, archived, pending, archivedReg] = await Promise.all([
                    userManagementApi.getAllActiveUsers(),
                    userManagementApi.getAllArchivedActiveUsers(),
                    userManagementApi.getAllPendingRegistrations(),
                    userManagementApi.getAllArchivedRegistrations()
                ]);

                setActiveUsers(active);
                setArchivedUsers(archived);
                setPendingRegistrations(pending);
                setArchivedRegistrations(archivedReg);

                // Set first active user as default selected
                if (active.length > 0) {
                    setSelectedUser(active[0]);
                    setSelectedUserSource('Traffic Managers');
                }

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

    // Action handlers
    const handleArchiveUser = async (id: string, username: string) => {
        const archived = await userManagementApi.archiveActiveUser(id, username);
        setActiveUsers(prev => prev.filter(u => u.id !== id));
        setArchivedUsers(prev => [...prev, archived]);
        
        // If archived user was selected, select first active user
        if (selectedUser?.id === id && activeUsers.length > 1) {
            const nextUser = activeUsers.find(u => u.id !== id);
            if (nextUser) {
                setSelectedUser(nextUser);
            }
        }
    };

    const handleRetrieveUser = async (id: string, username: string) => {
        const retrieved = await userManagementApi.retrieveArchivedActiveUser(id, username);
        setArchivedUsers(prev => prev.filter(u => u.id !== id));
        setActiveUsers(prev => [...prev, retrieved]);
    };

    const handleDeleteUser = async (id: string, username: string) => {
        await userManagementApi.deleteActiveUser(id, username);
        setArchivedUsers(prev => prev.filter(u => u.id !== id));
        
        // If deleted user was selected, select first archived user
        if (selectedUser?.id === id && archivedUsers.length > 1) {
            const nextUser = archivedUsers.find(u => u.id !== id);
            if (nextUser) {
                setSelectedUser(nextUser);
            }
        }
    };

    const handleArchiveRegistration = async (id: string) => {
        const archived = await userManagementApi.archivePendingRegistration(id);
        setPendingRegistrations(prev => prev.filter(u => u.id !== id));
        setArchivedRegistrations(prev => [...prev, archived]);
        
        if (selectedUser?.id === id && pendingRegistrations.length > 1) {
            const nextUser = pendingRegistrations.find(u => u.id !== id);
            if (nextUser) {
                setSelectedUser(nextUser);
            }
        }
    };

    const handleRetrieveRegistration = async (id: string) => {
        const retrieved = await userManagementApi.retrieveArchivedRegistration(id);
        setArchivedRegistrations(prev => prev.filter(u => u.id !== id));
        setPendingRegistrations(prev => [...prev, retrieved]);
    };

    const handleDeleteRegistration = async (id: string) => {
        await userManagementApi.deletePendingRegistration(id);
        setArchivedRegistrations(prev => prev.filter(u => u.id !== id));
        
        if (selectedUser?.id === id && archivedRegistrations.length > 1) {
            const nextUser = archivedRegistrations.find(u => u.id !== id);
            if (nextUser) {
                setSelectedUser(nextUser);
            }
        }
    };

    const handleUserClick = (user: UserType, source: UserSource) => {
        setSelectedUser(user);
        setSelectedUserSource(source);
    };

    const handleUserUpdate = (updatedUser: UserSchema) => {
        // Update in active users list
        setActiveUsers(prev => 
            prev.map(u => u.id === updatedUser.id ? updatedUser : u)
        );
        // Update selected user
        setSelectedUser(updatedUser);
        toast.success("User list updated");
    };

    if (isLoading) {
        return <div><DashboardPageSkeleton role={userData?.role ?? ""} /></div>;
    }

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

                <main className="ml-64 pt-16 min-h-screen pb-20">
                    <div className="flex">
                        <div className="flex-1 p-6">
                            <div className="space-y-6">
                                <DashboardSidebar userData={userData} />

                                <div className="space-y-6 max-w-[845px]">
                                    {selectedUser ? (
                                        <UserProfileContainer
                                            user={selectedUser}
                                            userSource={selectedUserSource}
                                            onUserUpdate={handleUserUpdate}
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground py-12">
                                            No user selected
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Right sidebar */}
                        <div className="w-90 sticky right-5 top-20 self-start h-[calc(100vh-6rem)] overflow-y-auto bg-background">
                            <UserListSidebar
                                activeUsers={activeUsers}
                                archivedUsers={archivedUsers}
                                pendingRegistrations={pendingRegistrations}
                                archivedRegistrations={archivedRegistrations}
                                onArchiveUser={handleArchiveUser}
                                onRetrieveUser={handleRetrieveUser}
                                onDeleteUser={handleDeleteUser}
                                onArchiveRegistration={handleArchiveRegistration}
                                onRetrieveRegistration={handleRetrieveRegistration}
                                onDeleteRegistration={handleDeleteRegistration}
                                onUserClick={handleUserClick}
                            />
                        </div>
                    </div>
                </main>

                <Footer/>

                <ChatContainer />
            </ChatProvider>
        </>
    );
}