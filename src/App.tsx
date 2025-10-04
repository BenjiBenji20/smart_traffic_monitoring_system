import { Route, Routes } from "react-router";
import { AuthenticationPage } from "./pages/auth/AuthenticationPage";
import { RegistrationPage } from "./pages/auth/RegistrationPage";

function App() {

    return (
        <>
            <Routes>
                <Route path="/" element={<AuthenticationPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
            </Routes>
        </>
    );
}

export default App
