import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { RegistrationValidator, type RegisterUserModel, type Role } from "@/models/auth";
import React from "react"

export function RegistrationPage({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [registration, setRegistration] = React.useState<RegisterUserModel>({
        username: "",
        password: "",
        role: "admin",
        complete_name: "",
        complete_address: "",
        age: 18
    });

    const handleInputChange = (field: keyof RegisterUserModel, value: string | number) => {
        setRegistration(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the data
        try {
            RegistrationValidator.validate(registration);
            console.log("Registration data:", registration);
            // Registration fetch from api layer logic
        } catch (error) {
            if (error instanceof Error) {
                console.error("Registration Validation failed:", error.message);
            } else {
                console.error("VaRegistration lidation failed:", error);
            }
        }
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create your account</CardTitle>
                            <CardDescription>
                                Enter your details below to create your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-4">
                                    {/* COMPLETE NAME INPUT */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="complete_name">Full Name</Label>
                                        <Input
                                            id="complete_name"
                                            type="text"
                                            required
                                            value={registration.complete_name}
                                            onChange={(e) => handleInputChange('complete_name', e.target.value)}
                                        />
                                    </div>

                                    {/* COMPLETE ADDRESS INPUT */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="complete_address">Address</Label>
                                        <Input
                                            id="complete_address"
                                            type="text"
                                            required
                                            value={registration.complete_address}
                                            onChange={(e) => handleInputChange('complete_address', e.target.value)}
                                        />
                                    </div>

                                    {/* USERNAME AND PASSWORD INPUT */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                required
                                                value={registration.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                value={registration.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* AGE AND ROLE INPUT */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                required
                                                value={registration.age}
                                                onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="role">Role</Label>
                                            <select
                                                id="role"
                                                value={registration.role}
                                                onChange={(e) => handleInputChange('role', e.target.value as Role)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="city_engineer">City Engineer</option>
                                                <option value="traffic_enforcer">Traffic Enforcer</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full mt-4">
                                        Create Account
                                    </Button>
                                </div>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            OR CONTINUE WITH
                                        </span>
                                    </div>
                                </div>

                                {/* OAUTH2 SOCIAL LOGIN COMING SOON */}

                                <Button variant="outline" className="w-full">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </Button>
                                <div className="mt-4 text-center text-xs text-muted-foreground">
                                    By clicking continue, you agree to our{" "}
                                    <a href="#" className="underline underline-offset-4">Terms of Service</a>
                                    {" "}and{" "}
                                    <a href="#" className="underline underline-offset-4">Privacy Policy</a>.
                                </div>

                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}