import { Route, Routes } from "react-router";

import { Toaster } from "sonner";

import { AuthenticationPage } from "./pages/auth/AuthenticationPage";
import { RegistrationPage } from "./pages/auth/RegistrationPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";

function App() {

    return (
        <>
            <Routes>
                <Route path="/" element={<AuthenticationPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>

            <Toaster />
        </>
    );
}

export default App
