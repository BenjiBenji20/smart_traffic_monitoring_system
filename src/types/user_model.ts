import type { Role } from "./auth";

export type UserModel = {
    id: string;
    created_at: Date;
    username: string;
    role: Role;
    complete_name: string;
    complete_address: string;
    age: number;
}