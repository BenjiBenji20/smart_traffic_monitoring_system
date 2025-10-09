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

import { type RegisterUserModel, type Role } from "@/types/auth";
import React from "react"
import { Link, useNavigate } from "react-router"
import { register } from "@/api/registration_api"
import { toast } from "sonner"
import { NavMenu } from "@/components/nav/NavMenu"
import { Footer } from "@/components/footer/Footer"

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

    const navigator = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log("Registration data:", registration);

            // Registration fetch from api layer logic
            await register(registration);

            // on success registration
            toast.success("Registration Successful!", {
                description: "Your account has been successfully registered!",
            });

            navigator("/");
        } catch (error) {
            console.error("Registration failed:", error);

            // show error prompt
            toast.error("Registration Failed", {
                description: "Invalid registration form data",
            });
        }
    };

    return (
        <>
            <title>C4Vision - Sign-up</title>
            <NavMenu />

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
                                        <svg
                                            className="mr-2 h-4 w-4"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            focusable="false"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M21.35 11.1h-9.18v2.92h5.59c-.24 1.48-1.69 4.34-5.59 4.34-3.36 0-6.09-2.78-6.09-6.22s2.73-6.22 6.09-6.22c1.91 0 3.19.82 3.93 1.53l2.68-2.59C17.36 3.01 15.13 2 12.17 2 6.79 2 2.5 6.26 2.5 11.64S6.79 21.28 12.17 21.28c7.01 0 9.67-4.9 9.67-8.12 0-.55-.06-.97-.14-1.39z"
                                            />
                                        </svg>
                                        Google
                                    </Button>

                                    <div className="mt-4 text-center text-xs text-muted-foreground">
                                        By clicking continue, you agree to our{" "}
                                        <Link to="#" className="underline underline-offset-4">Terms of Service</Link>
                                        {" "}and{" "}
                                        <Link to="#" className="underline underline-offset-4">Privacy Policy</Link>.
                                    </div>

                                    <div className="mt-4 text-center text-sm">
                                        Already have an account?{" "}
                                        <Link to="/" className="underline underline-offset-4">
                                            Sign in
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}