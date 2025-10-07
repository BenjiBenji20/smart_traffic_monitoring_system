// src/components/error/ErrorPage.tsx
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorPageProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onGoHome?: () => void;
    showActions?: boolean;
}

export function ErrorPage({
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again.",
    onRetry,
    onGoHome,
    showActions = true
}: ErrorPageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <p className="text-muted-foreground">{message}</p>
                        </div>

                        {/* Actions */}
                        {showActions && (
                            <div className="flex gap-2 justify-center pt-4">
                                {onRetry && (
                                    <Button onClick={onRetry} variant="outline">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try Again
                                    </Button>
                                )}
                                {onGoHome && (
                                    <Button onClick={onGoHome}>
                                        <Home className="h-4 w-4 mr-2" />
                                        Go Home
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}