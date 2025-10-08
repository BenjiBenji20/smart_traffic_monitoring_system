import { RegistrationValidator, type RegisterUserModel } from "@/types/auth";
import axios from "axios";


export async function register(registrationData: RegisterUserModel) {
    try {
        RegistrationValidator.validate(registrationData);

        const response = await axios.post("/api/user/register", registrationData, {
            headers: { "Content-Type": "application/json" }
        });

        return response.data;
    } catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
}
