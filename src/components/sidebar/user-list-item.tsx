// components/sidebar/user-list-item.tsx
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/components/ui/profile";
import type { UserModel } from "@/types/user.types";

interface UserListItemProps {
    user: UserModel;
    isSelected?: boolean;
    onClick?: (user: UserModel) => void;
}

export function UserListItem({ user, isSelected = false, onClick }: UserListItemProps) {
    const handleClick = () => {
        onClick?.(user);
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-sm transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isSelected && "bg-sidebar-primary text-sidebar-primary-foreground",
                !isSelected && "text-sidebar-foreground"
            )}
        >
            {/* Avatar with online status indicator */}
            <div className="relative flex-shrink-0">
                <ProfileAvatar username={user.username} />
                {/* Online status indicator */}
                <div
                    className={cn(
                        "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                        user.is_active ? "bg-green-500" : "bg-gray-400"
                    )}
                />
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0 text-left">
                <p className="font-medium truncate">{user.complete_name}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                    {user.role.replace('_', ' ')}
                </p>
            </div>
        </button>
    );
}