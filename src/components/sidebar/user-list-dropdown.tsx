/**
 * TO IMPLEMENT GROUP CHAT IF HAVE TIME LEFT BEFORE THE DEADLINE.
 * 
 */

"use client"

import { useState, useEffect } from "react";
import { Users, ChevronDown, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserListItem } from "@/components/sidebar/user-list-item";
import { getAllUsers } from "@/api/user_api";
import type { UserModel } from "@/types/user.types";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";

interface UserListDropdownProps {
    isCollapsed?: boolean;
}

export function UserListDropdown({
    isCollapsed = false,
}: UserListDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { openPersonalChat } = useChat();

    // Fetch users when dropdown opens
    useEffect(() => {
        if (isOpen && users.length === 0) {
            fetchUsers();
        }
    }, [isOpen, users.length]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const userList = await getAllUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = async (user: UserModel) => {
        await openPersonalChat(user);
    };

    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            {/* Dropdown Trigger */}
            <button
                onClick={handleDropdownToggle}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isOpen && "bg-sidebar-accent text-sidebar-accent-foreground",
                    !isOpen && "text-sidebar-foreground",
                    isCollapsed && "justify-center"
                )}
                title="Users"
            >
                <Users className="h-4 w-4 flex-shrink-0" />

                {!isCollapsed && (
                    <>
                        <span className="flex-1 truncate text-left">Users</span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                                isOpen && "rotate-180"
                            )}
                        />
                    </>
                )}

                {/* Collapsed tooltip */}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                        Users
                    </div>
                )}
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div
                    className={cn(
                        "mt-2 bg-background rounded-lg shadow-lg border overflow-hidden transition-all duration-200",
                        "max-h-80"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b bg-muted/50">
                        <h3 className="text-sm font-semibold">Online Users</h3>
                        <p className="text-xs text-muted-foreground">
                            {isLoading ? "Loading..." : `${users.length} users`}
                        </p>
                    </div>

                    {/* Users List */}
                    <div className="max-h-64 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Loading users...
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            users.map((user) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    isSelected={false}
                                    onClick={handleUserClick}
                                />
                            ))
                        )}
                    </div>

                    {/* Group Chat Button */}
                    <div className="border-t p-2 bg-muted/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                // TODO: Open group chat creation modal
                                console.log("Create group chat");
                            }}
                        >
                            <UsersRound className="h-4 w-4 mr-2" />
                            Create Group Chat
                        </Button>
                    </div>

                    {/* Close button */}
                    <div className="border-t p-2 bg-muted/30">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}