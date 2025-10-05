import { Route, Routes, useNavigate } from "react-router";
import { Toaster } from "sonner";
import { AuthenticationPage } from "./pages/auth/AuthenticationPage";
import { RegistrationPage } from "./pages/auth/RegistrationPage";
import { reinitializeAuth } from "./api/authentication_api";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { useEffect, useState } from "react";
import { DashboardNav } from "./pages/dashboard/DashboardNav";

// Checks auth when accessing protected pages
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
    if (isAuthenticated === null) return <DashboardNav />;
    
    // Render protected content if authenticated
    if (isAuthenticated) return <>{children}</>;
    
    return null;
}


function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<AuthenticationPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
            </Routes>
            <Toaster />
        </>
    );
}

export default App;