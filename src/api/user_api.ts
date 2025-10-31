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


export async function getUserById(id: string): Promise <UserModel> {
    try {
        const response = await securedRequest.get<UserModel>(
            `/user/action/user/${id}`
        );
        return response.data;
    } catch(error) {
        console.error("Error while fetching user data", error);
        throw error;
    }
}


export async function getAllUsers(): Promise <UserModel[]> {
    try {
        const response = await securedRequest.get<UserModel[]>(
            `/user/action/all-users`
        );
        return response.data;
    } catch(error) {
        console.error("Error while fetching all users data", error);
        throw error;
    }
}