import securedRequest from "./authentication_api";
import { type UserModel } from "@/types/user_model";


export async function getUserProfile(): Promise<UserModel> {
    try {
        const response = await securedRequest.get("/dashboard/user/user-profile");
        return response.data;
    } catch (error) {
        console.error("Error while fetching user data", error);
        throw error;
    }
}
