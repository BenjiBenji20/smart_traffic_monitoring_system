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
import { toast } from "sonner"

import React from "react"
import { Link, useNavigate } from "react-router"

import { type AuthUserModel } from "@/types/auth";
import { authenticate, isAuthenticated } from "@/api/authentication_api"
import { NavMenu } from "@/components/nav/NavMenu"
import { Footer } from "@/components/footer/Footer"


export function AuthenticationPage({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [credentials, setCredentials] = React.useState<AuthUserModel>({
        username: "",
        password: ""
    });

    const handleInputChange = (field: keyof AuthUserModel, value: string) => {
        setCredentials(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const navigator = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the data
        try {
            // process authentication
            await authenticate(credentials);

            if (isAuthenticated()) {
                // show success prompt
                toast.success("Sign-in Successful!", {
                    description: "Redirecting to your dashboard account.",
                });

                // Redirect after a brief delay to show the toast
                setTimeout(() => {
                    navigator('/dashboard');
                }, 3500);
            }
        } catch (error) {
            console.error("Authentication Validation failed:", error);

            // show error prompt (unsuccessful Sign-in)
            toast.error("Authentication Failed", {
                description: "Invalid username or password",
            });
        }
    };

    return (
        <>
            <NavMenu />

            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className={cn("flex flex-col gap-6", className)} {...props}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Login to your account</CardTitle>
                                <CardDescription>
                                    Enter your credentials to login to your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                placeholder="username"
                                                required
                                                value={credentials.username}
                                                onChange={(e) => handleInputChange('username', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <div className="flex items-center">
                                                <Label htmlFor="password">Password</Label>
                                                <Link
                                                    to="#"
                                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                                >
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Password"
                                                required
                                                value={credentials.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                            />
                                        </div>

                                        {/* OAUTH2 SOCIAL LOGIN COMING SOON */}

                                        <div className="flex flex-col gap-3">
                                            <Button type="submit" className="w-full">
                                                Login
                                            </Button>
                                            <Button variant="outline" className="w-full">
                                                Login with Google
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-center text-sm">
                                        Don&apos;t have an account?{" "}
                                        <Link to="/registration" className="underline underline-offset-4">
                                            Sign up
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