import { cn } from "@/lib/utils";
import type { ArchiveActiveUserSchema, ArchiveUserSchema, PendingUserSchema, UserSchema } from "@/types/user.types";
import { ProfileAvatar } from "../ui/profile";

// User List Item Component
interface UserListItemProps {
    user: UserSchema | PendingUserSchema | ArchiveUserSchema | ArchiveActiveUserSchema;
    onClick: () => void;
    actions?: React.ReactNode;
    isArchived?: boolean;
    isPending?: boolean;
}

export function UserListItem({ user, onClick, actions, isArchived, isPending }: UserListItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative px-4 py-3 cursor-pointer transition-all duration-200 border-b last:border-b-0",
                "hover:bg-accent/50",
                isArchived && "bg-muted/30",
                isPending && "bg-yellow-50/50"
            )}
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <ProfileAvatar
                    username={user.complete_name}
                    className="h-10 w-10 flex-shrink-0"
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                        {user.complete_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {actions}
                </div>
            </div>
        </div>
    );
}