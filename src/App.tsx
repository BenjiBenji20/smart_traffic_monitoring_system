import { Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthenticationPage } from "./pages/auth/AuthenticationPage";
import { RegistrationPage } from "./pages/auth/RegistrationPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { ProtectedRoute } from "./middleware/token_filter";
import { HistoryPage } from "./pages/history/HistoryPage";
import { ManageUserPage } from "./pages/manage_user/ManageUserPage";


function App() {

    return (
        <>
            <Routes>
                <Route path="/" element={<AuthenticationPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                {/* Include landing page here... saka na pag tapos na lahat paimportante. */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute>
                        <HistoryPage />
                    </ProtectedRoute>
                } />
                <Route path="/manage-users" element={
                    <ProtectedRoute>
                        <ManageUserPage />
                    </ProtectedRoute>
                } />
            </Routes>
            <Toaster />
        </>
    );
}

export default App;