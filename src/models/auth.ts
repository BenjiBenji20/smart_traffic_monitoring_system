// Authentication model
export interface AuthUserModel {
    username: string;
    password: string;
}

// Authentication validation functions
export class AuthUserValidator {
    private static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
    private static readonly PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$/;

    static validateUsername(username: string): void {
        if (username.length < 3 || username.length > 50) {
            throw new Error("Username must be between 3 and 50 characters long");
        }

        if (!this.USERNAME_PATTERN.test(username)) {
            throw new Error("Username can only contain letters, numbers, and underscores, and must be 3-20 characters long");
        }
    }

    static validatePassword(password: string): void {
        if (password.length < 8 || password.length > 50) {
            throw new Error("Password must be between 8 and 50 characters long");
        }

        if (!this.PASSWORD_PATTERN.test(password)) {
            throw new Error("Password must be at least 8 characters long, include one uppercase letter and one number");
        }
    }

    static validate(authUser: AuthUserModel): void {
        this.validateUsername(authUser.username);
        this.validatePassword(authUser.password);
    }
}


// Registration model
export type Role = "admin" | "city_engineer" | "traffic_enforcer";

export interface RegisterUserModel extends AuthUserModel {
    role: Role;
    complete_name: string;
    complete_address: string;
    age: number;
}

// Registration validation functions
export class RegistrationValidator extends AuthUserValidator {
    private static readonly NAME_ADDRESS_PATTERN = /^[a-zA-Z][a-zA-Z',.\-\s]*$/;

    static validateCompleteName(complete_name: string): void {
        if (complete_name.length > 50) {
            throw new Error("Complete name must be at most 50 characters long");
        }

        if (!this.NAME_ADDRESS_PATTERN.test(complete_name)) {
            throw new Error("Complete name must be valid");
        }
    }

    static validateCompleteAddress(complete_address: string): void {
        if (complete_address.length > 100) {
            throw new Error("Complete address must be at most 100 characters long");
        }

        if (!this.NAME_ADDRESS_PATTERN.test(complete_address)) {
            throw new Error("Complete address must be valid");
        }
    }

    static validateAge(age: number): void {
        if (age <= 0 || age > 120) {
            throw new Error("Age must be between 1 and 120");
        }
    }

    static validate(registerUser: RegisterUserModel): void {
        // Validate inherited fields
        super.validateUsername(registerUser.username);
        super.validatePassword(registerUser.password);

        // Validate new fields
        this.validateCompleteName(registerUser.complete_name);
        this.validateCompleteAddress(registerUser.complete_address);
        this.validateAge(registerUser.age);
    }
}