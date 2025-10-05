"use client"

import { useState } from "react"
import { LogOut, Settings, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfileFooterProps {
    user: {
        name: string
        email: string
        avatar?: string
        role?: string
    }
    isCollapsed?: boolean
    onLogout?: () => void
    onProfileClick?: () => void
    onSettingsClick?: () => void
}

export function UserProfileFooter({
    user,
    isCollapsed = false,
    onLogout,
    onProfileClick,
    onSettingsClick
}: UserProfileFooterProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    return (
        <div className="border-t border-sidebar-border p-3 relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                    "flex items-center w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors group",
                    isCollapsed && "justify-center"
                )}
            >
                {/* User Avatar */}
                <div className="flex-shrink-0">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* User Info - hidden when collapsed */}
                {!isCollapsed && (
                    <>
                        <div className="flex-1 min-w-0 ml-3 text-left">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.role || "User"}
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                        {user.name}
                        <br />
                        <span className="text-muted-foreground">{user.role || "User"}</span>
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className={cn(
                    "absolute bg-popover border rounded-lg shadow-lg py-2 z-50 min-w-48",
                    isCollapsed ? "left-full bottom-0 ml-1" : "bottom-full left-3 right-3 mb-1"
                )}>
                    <button
                        onClick={onProfileClick}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-foreground transition-colors"
                    >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </button>

                    <button
                        onClick={onSettingsClick}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-foreground transition-colors"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </button>

                    <div className="border-t my-1"></div>

                    <button
                        onClick={onLogout}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-destructive transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}