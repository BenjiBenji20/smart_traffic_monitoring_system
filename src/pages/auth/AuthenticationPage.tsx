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

import { AuthUserValidator, type AuthUserModel } from "@/models/auth";
import React from "react"

export function AuthenticationPage({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [authentication, setAuthentication] = React.useState<AuthUserModel>({
        username: "",
        password: ""
    });

    const handleInputChange = (field: keyof AuthUserModel, value: string) => {
        setAuthentication(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the data
        try {
            AuthUserValidator.validate(authentication);
            console.log("Authentication data:", authentication);
            /// Authentication fetch from api layer logic
        } catch (error) {
            if (error instanceof Error) {
                console.error("Authentication Validation failed:", error.message);
            } else {
                console.error("Authentication Validation failed:", error);
            }
        }
    };

    return (
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
                                            value={authentication.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Forgot your password?
                                            </a>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Password"
                                            required
                                            value={authentication.password}
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
                                    <a href="#" className="underline underline-offset-4">
                                        Sign up
                                    </a>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}