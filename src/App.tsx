import { Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthenticationPage } from "./pages/auth/AuthenticationPage";
import { RegistrationPage } from "./pages/auth/RegistrationPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { ProtectedRoute } from "./middleware/token_filter";


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