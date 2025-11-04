import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Clock, Mail, User, MapPin } from "lucide-react"
import React from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { NavMenu } from "@/components/nav/NavMenu"
import { Footer } from "@/components/footer/Footer"

interface RegistrationResponse {
    id: string;
    created_at: string;
    username: string;
    role: string;
    complete_name: string;
    complete_address: string;
    age: number;
    is_active: boolean;
    message: string;
}

export function RegistrationSuccessPage({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const location = useLocation();
    const navigate = useNavigate();

    // Get registration data from navigation state
    const registrationData = location.state?.registrationData as RegistrationResponse | undefined;

    // Redirect if no registration data
    React.useEffect(() => {
        if (!registrationData) {
            navigate('/registration');
        }
    }, [registrationData, navigate]);

    if (!registrationData) {
        return null;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRole = (role: string) => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <>
            <title>C4Vision - Registration Successful</title>
            <NavMenu />

            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-2xl">
                    <div className={cn("flex flex-col gap-6", className)} {...props}>
                        <Card>
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl">Registration Submitted Successfully!</CardTitle>
                                <CardDescription className="text-base">
                                    Your account has been created and is pending approval
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Pending Status Alert */}
                                <Alert className="border-amber-200 bg-amber-50">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        {registrationData.message}
                                    </AlertDescription>
                                </Alert>

                                {/* User Information */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                        Account Details
                                    </h3>

                                    <div className="grid gap-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">Username</p>
                                                <p className="text-sm text-muted-foreground">{registrationData.username}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">Full Name</p>
                                                <p className="text-sm text-muted-foreground">{registrationData.complete_name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">Role</p>
                                                <p className="text-sm text-muted-foreground">{formatRole(registrationData.role)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">Address</p>
                                                <p className="text-sm text-muted-foreground">{registrationData.complete_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Registration Time */}
                                <div className="text-center pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Registration submitted on {formatDate(registrationData.created_at)}
                                    </p>
                                </div>

                                {/* What's Next Section */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                        What's Next?
                                    </h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-0.5">•</span>
                                            <span>An administrator will review your registration request</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary mt-0.5">•</span>
                                            <span>After approval, you can login with your credentials</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <Button asChild className="flex-1">
                                        <Link to="/">Return to Home</Link>
                                    </Button>
                                    <Button asChild variant="outline" className="flex-1">
                                        <Link to="/">Go to Login</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}