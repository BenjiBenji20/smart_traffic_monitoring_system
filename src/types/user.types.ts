import type { Role } from "./auth";

// types/user.types.ts
export interface AuthUserModel {
    username: string;
    password: string;
}

export interface RegisterUserModel extends AuthUserModel {
    role: Role;
    complete_name: string;
    complete_address: string;
    age: number;
    is_active?: boolean;
}

export interface UpdateUserModel {
    username?: string;
    password?: string; 
    role?: Role;
    complete_name?: string;
    complete_address?: string;
    age?: number;
    is_active?: boolean;
}

// Use UpdateUserModel for updates
export interface UpdateUserProfileSchema {
    username: string;
    password: string;
    update_info: UpdateUserModel; 
}


export type UserModel = {
    id: string;
    created_at: Date;
    username: string;
    role: Role;
    complete_name: string;
    complete_address: string;
    age: number;
    is_active: boolean
}


// for extends only
export interface UserSchema {
    id: string;
    created_at: Date;
    username: string;
    role: Role;
    complete_name: string;
    complete_address: string;
    age: number;
    is_active: boolean
}


// for response dto
export interface PendingUserSchema extends UserSchema {
    message: string;
}


// for response dto
export interface ArchiveUserSchema extends UserSchema {
    message: string;
}


// for response dto
export interface ArchiveActiveUserSchema extends UserSchema {
    archived_at: Date;
    archived_by: string;
    message: string;
}
