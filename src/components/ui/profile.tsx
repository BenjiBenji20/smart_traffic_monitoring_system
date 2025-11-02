import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated, signOut } from "@/api/authentication_api";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { UserModel } from "@/types/user.types";

export function ProfileAvatar({ complete_name, className = "" }: { complete_name: string; className?: string }) {
    const firstLetter = complete_name.charAt(0).toUpperCase();
    const bgColor = getAvatarColor(complete_name);

    return (
        <div
            className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-white",
                bgColor,
                className
            )}
        >
            {firstLetter}
        </div>
    );
}

// Helper function to generate consistent color based on complete_name
function getAvatarColor(complete_name: string): string {
    const colors = [
        "bg-red-500", "bg-blue-500", "bg-green-500",
        "bg-yellow-500", "bg-purple-500", "bg-pink-500",
        "bg-indigo-500", "bg-teal-500", "bg-orange-500"
    ];

    // Simple hash to get consistent color for same complete_name
    let hash = 0;
    for (let i = 0; i < complete_name.length; i++) {
        hash = complete_name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
}


interface ProfileProps {
    className?: string;
    user: UserModel;
}

export function Profile(
    { className, user }: ProfileProps,
) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navigator = useNavigate();

    const handleSignOut = async () => {
        try {
            const isSuccessfull = await signOut();

            if (!isAuthenticated() && isSuccessfull) {
                toast.success("Sign-out Successfull", {
                    description: "Redirecting...\nplease wait while clearing your session..."
                });

                setTimeout(() => {
                    navigator("/"); // navigate back to signin page
                }, 3500);
            }
        } catch (error) {
            console.error("Sign-out Validation failed:", error);

            // show error prompt
            toast.error("Sign-out Failed", {
                description: "Sign-out failed...",
            });
        }
    }

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors w-full"
            >
                {/* Profile Image */}
                <ProfileAvatar complete_name={user.complete_name} />

                {/* User Info - Hidden on mobile, visible on desktop */}
                <div className="hidden sm:block text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.complete_name}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">{user.role.replace('_', ' ')}</p>
                </div>

                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border z-50 animate-in fade-in-80">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-foreground">{user.complete_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <div className="border-t my-1"></div>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent text-destructive transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}