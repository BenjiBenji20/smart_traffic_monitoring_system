import securedRequest from "./authentication_api";
import type {
    UserSchema,
    PendingUserSchema,
    ArchiveUserSchema,
    ArchiveActiveUserSchema,
    UpdateUserProfileSchema
} from "@/types/user.types";

// === PROCESS USER REGISTRATIONS ===
export const userManagementApi = {
    // Get all pending registrations
    async getAllPendingRegistrations(): Promise<PendingUserSchema[]> {
        const response = await securedRequest.get<PendingUserSchema[]>(
            "/user/all-pending-registrations"
        );
        return response.data;
    },


    // Accept pending registration
    async acceptPendingRegistration(id: string, username: string): Promise<UserSchema> {
        const response = await securedRequest.post<UserSchema>(
            `/user/accept-pending-registration?id=${id}&username=${username}`
        );
        return response.data;
    },


    // Archive pending registration
    async archivePendingRegistration(id: string): Promise<ArchiveUserSchema> {
        const response = await securedRequest.post<ArchiveUserSchema>(
            `/user/archive-pending-registration?id=${id}`
        );
        return response.data;
    },


    // Get all archived registrations
    async getAllArchivedRegistrations(): Promise<ArchiveUserSchema[]> {
        const response = await securedRequest.get<ArchiveUserSchema[]>(
            "/user/all-archived-registrations"
        );
        return response.data;
    },


    // Retrieve archived registration back to pending
    async retrieveArchivedRegistration(id: string): Promise<PendingUserSchema> {
        const response = await securedRequest.post<PendingUserSchema>(
            `/user/retrieve-archived-registration?id=${id}`
        );
        return response.data;
    },


    // Delete pending registration permanently
    async deletePendingRegistration(id: string): Promise<{ message: string; status: boolean }> {
        const response = await securedRequest.delete(
            `/user/delete-pending-registration?id=${id}`
        );
        return response.data;
    },


    // === PROCESS ACTIVE USERS ===
    // Get all active users
    async getAllActiveUsers(): Promise<UserSchema[]> {
        const response = await securedRequest.get<UserSchema[]>(
            "/user/all-active-users"
        );
        return response.data;
    },


    // Get active user by ID
    async getActiveUserById(id: string): Promise<UserSchema> {
        const response = await securedRequest.get<UserSchema>(
            `/user/active-user/${id}`
        );
        return response.data;
    },


    // Archive active user
    async archiveActiveUser(id: string, username: string): Promise<ArchiveActiveUserSchema> {
        const response = await securedRequest.post<ArchiveActiveUserSchema>(
            `/user/archive-active-user?id=${id}&username=${username}`
        );
        return response.data;
    },


    // Get all archived active users
    async getAllArchivedActiveUsers(): Promise<ArchiveActiveUserSchema[]> {
        const response = await securedRequest.get<ArchiveActiveUserSchema[]>(
            "/user/all-archived-active-users"
        );
        return response.data;
    },


    // Retrieve archived active user back to active
    async retrieveArchivedActiveUser(id: string, username: string): Promise<UserSchema> {
        const response = await securedRequest.post<UserSchema>(
            `/user/retrieve-archived-active-user?id=${id}&username=${username}`
        );
        return response.data;
    },


    // Delete active user permanently
    async deleteActiveUser(id: string, username: string): Promise<{ message: string; status: boolean }> {
        const response = await securedRequest.delete(
            `/user/delete-active-user?id=${id}&username=${username}`
        );
        return response.data;
    },


    // Update user profile
    async updateUserProfile(id: string, updateData: UpdateUserProfileSchema): Promise<UserSchema> {
        const response = await securedRequest.put<UserSchema>(
            `/user/update-user?id=${id}`,
            updateData
        );
        return response.data;
    },
};