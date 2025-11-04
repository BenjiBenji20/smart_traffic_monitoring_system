// components/manage_user/UsernameConfirmationModal.tsx
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface UsernameConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    targetUsername: string;
    title: string;
    description: string;
    actionButtonText?: string;
    actionButtonVariant?: "default" | "destructive";
}

export function UsernameConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    targetUsername,
    title,
    description,
    actionButtonText = "Confirm",
    actionButtonVariant = "default"
}: UsernameConfirmationModalProps) {
    const [inputUsername, setInputUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isUsernameMatch = inputUsername === targetUsername;

    const handleConfirm = async () => {
        if (!isUsernameMatch) {
            setError("Username does not match");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await onConfirm();
            handleClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setError(error.response?.data?.detail || "Action failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setInputUsername("");
        setError("");
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && isUsernameMatch && !isLoading) {
            handleConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            This action requires confirmation. Please type{" "}
                            <span className="font-mono font-bold">{targetUsername}</span>{" "}
                            to continue.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="username-confirm">
                            Username Confirmation
                        </Label>
                        <Input
                            id="username-confirm"
                            type="text"
                            value={inputUsername}
                            onChange={(e) => {
                                setInputUsername(e.target.value);
                                setError("");
                            }}
                            onKeyDown={handleKeyPress}
                            placeholder={`Type "${targetUsername}" to confirm`}
                            disabled={isLoading}
                            className={error ? "border-red-500" : ""}
                        />
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={actionButtonVariant}
                        onClick={handleConfirm}
                        disabled={!isUsernameMatch || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            actionButtonText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}