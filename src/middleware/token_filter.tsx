import { reinitializeAuth } from "@/api/authentication_api";
// import { DashboardNav } from "@/pages/dashboard/DashboardNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

// Checks auth when accessing protected pages
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to reinitialize auth using refresh token cookie
                await reinitializeAuth();
                setIsAuthenticated(true);
                console.log('Authentication check passed');
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                // No valid session, redirect to login
                console.log('Authentication check failed, redirecting to login');
                setIsAuthenticated(false);
                navigate('/', { replace: true });
            }
        };

        checkAuth();
    }, [navigate]);

    // Show loading state while checking auth
    if (isAuthenticated === null) return <div>Loading...</div>;

    // Render protected content if authenticated
    if (isAuthenticated) return <>{children}</>;

    return null;
}
