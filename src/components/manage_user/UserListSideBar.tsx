// components/manage_user/UserListSidebar.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Archive,
    UserCheck,
    UserX,
    Trash2,
    ArchiveRestore,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    UserSchema,
    PendingUserSchema,
    ArchiveUserSchema,
    ArchiveActiveUserSchema
} from '@/types/user.types';
import { toast } from 'sonner';
import { UserListItem } from './UserListItem';
import { UserSection } from './UserSection';
import { UsernameConfirmationModal } from './UsernameConfirmationModal';

interface UserListSidebarProps {
    activeUsers: UserSchema[];
    archivedUsers: ArchiveActiveUserSchema[];
    pendingRegistrations: PendingUserSchema[];
    archivedRegistrations: ArchiveUserSchema[];
    onAcceptRegistration: (id: string, username: string) => Promise<void>;
    onArchiveUser: (id: string, username: string) => Promise<void>;
    onRetrieveUser: (id: string, username: string) => Promise<void>;
    onDeleteUser: (id: string, username: string) => Promise<void>;
    onArchiveRegistration: (id: string) => Promise<void>;
    onRetrieveRegistration: (id: string) => Promise<void>;
    onDeleteRegistration: (id: string) => Promise<void>;
    onUserClick?: (
        user: UserSchema | PendingUserSchema | ArchiveUserSchema | ArchiveActiveUserSchema,
        source: 'Traffic Managers' | 'Archived Managers' | 'Pending Registrations' | 'Archived Registrations'
    ) => void;
    className?: string;
}

type ModalAction = {
    type: 'accept' | 'archive' | 'retrieve' | 'delete';
    user: UserSchema | PendingUserSchema | ArchiveUserSchema | ArchiveActiveUserSchema;
};

export function UserListSidebar({
    activeUsers,
    archivedUsers,
    pendingRegistrations,
    archivedRegistrations,
    onAcceptRegistration,
    onArchiveUser,
    onRetrieveUser,
    onDeleteUser,
    onArchiveRegistration,
    onRetrieveRegistration,
    onDeleteRegistration,
    onUserClick,
    className
}: UserListSidebarProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        activeUsers: true,
        archivedUsers: false,
        pendingRegistrations: false,
        archivedRegistrations: false
    });

    const [modalAction, setModalAction] = useState<ModalAction | null>(null);

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getModalConfig = () => {
        if (!modalAction) return null;

        const { type, user } = modalAction;

        switch (type) {
            case 'accept':
                return {
                    title: 'Accept Registration',
                    description: `Confirm acceptance of ${user.complete_name} as a Traffic Manager.`,
                    actionButtonText: 'Accept Registration',
                    actionButtonVariant: 'default' as const,
                    onConfirm: async () => {
                        await onAcceptRegistration(user.id, user.username);
                    }
                };
            case 'archive':
                return {
                    title: 'Archive User',
                    description: `This will archive ${user.complete_name}. They will no longer have active access.`,
                    actionButtonText: 'Archive User',
                    actionButtonVariant: 'default' as const,
                    onConfirm: async () => {
                        await onArchiveUser(user.id, user.username);
                        toast.success(`${user.complete_name} archived`);
                    }
                };
            case 'retrieve':
                return {
                    title: 'Retrieve User',
                    description: `This will restore ${user.complete_name} as an active Traffic Manager.`,
                    actionButtonText: 'Retrieve User',
                    actionButtonVariant: 'default' as const,
                    onConfirm: async () => {
                        await onRetrieveUser(user.id, user.username);
                        toast.success(`${user.complete_name} retrieved`);
                    }
                };
            case 'delete':
                return {
                    title: 'Delete User Permanently',
                    description: `This will permanently delete ${user.complete_name}. This action cannot be undone.`,
                    actionButtonText: 'Delete Permanently',
                    actionButtonVariant: 'destructive' as const,
                    onConfirm: async () => {
                        await onDeleteUser(user.id, user.username);
                        toast.success('User deleted permanently');
                    }
                };
        }
    };

    const modalConfig = getModalConfig();

    return (
        <>
            <Card className={cn("w-full h-full bg-background border-l", className)}>
                <CardContent className="h-full flex flex-col p-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                        </h2>
                    </div>

                    {/* Sections List */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Traffic Managers (Active Users) */}
                        <UserSection
                            title="Traffic Managers"
                            icon={<Users className="h-4 w-4" />}
                            count={activeUsers.length}
                            isOpen={openSections.activeUsers}
                            onToggle={() => toggleSection('activeUsers')}
                        >
                            {activeUsers.map((user) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    onClick={() => {
                                        onUserClick?.(user, 'Traffic Managers');
                                    }}
                                    actions={
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setModalAction({ type: 'archive', user });
                                            }}
                                        >
                                            <Archive className="h-3 w-3" />
                                        </Button>
                                    }
                                />
                            ))}
                        </UserSection>

                        {/* Archived Managers */}
                        <UserSection
                            title="Archived Managers"
                            icon={<Archive className="h-4 w-4" />}
                            count={archivedUsers.length}
                            isOpen={openSections.archivedUsers}
                            onToggle={() => toggleSection('archivedUsers')}
                        >
                            {archivedUsers.map((user) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    onClick={() => {
                                        onUserClick?.(user, 'Archived Managers');
                                    }}
                                    isArchived
                                    actions={
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalAction({ type: 'retrieve', user });
                                                }}
                                            >
                                                <ArchiveRestore className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalAction({ type: 'delete', user });
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    }
                                />
                            ))}
                        </UserSection>

                        {/* Pending Registrations */}
                        <UserSection
                            title="Pending Registrations"
                            icon={<UserCheck className="h-4 w-4" />}
                            count={pendingRegistrations.length}
                            isOpen={openSections.pendingRegistrations}
                            onToggle={() => toggleSection('pendingRegistrations')}
                        >
                            {pendingRegistrations.map((user) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    onClick={() => {
                                        onUserClick?.(user, 'Pending Registrations');
                                    }}
                                    isPending
                                    actions={
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalAction({ type: 'accept', user });
                                                }}
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await onArchiveRegistration(user.id);
                                                        toast.success(`${user.complete_name} archived`);
                                                    } catch (error) {
                                                        toast.error('Failed to archive registration');
                                                        console.error(error);
                                                    }
                                                }}
                                            >
                                                <Archive className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    }
                                />
                            ))}
                        </UserSection>

                        {/* Archived Registrations */}
                        <UserSection
                            title="Archived Registrations"
                            icon={<UserX className="h-4 w-4" />}
                            count={archivedRegistrations.length}
                            isOpen={openSections.archivedRegistrations}
                            onToggle={() => toggleSection('archivedRegistrations')}
                        >
                            {archivedRegistrations.map((user) => (
                                <UserListItem
                                    key={user.id}
                                    user={user}
                                    onClick={() => {
                                        onUserClick?.(user, 'Archived Registrations');
                                    }}
                                    isArchived
                                    actions={
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await onRetrieveRegistration(user.id);
                                                        toast.success(`${user.complete_name} retrieved`);
                                                    } catch (error) {
                                                        toast.error('Failed to retrieve registration');
                                                        console.error(error);
                                                    }
                                                }}
                                            >
                                                <ArchiveRestore className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Delete ${user.complete_name} permanently?`)) {
                                                        try {
                                                            await onDeleteRegistration(user.id);
                                                            toast.success('Registration deleted permanently');
                                                        } catch (error) {
                                                            toast.error('Failed to delete registration');
                                                            console.error(error);
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    }
                                />
                            ))}
                        </UserSection>
                    </div>
                </CardContent>
            </Card>

            {/* Username Confirmation Modal */}
            {modalAction && modalConfig && (
                <UsernameConfirmationModal
                    isOpen={true}
                    onClose={() => setModalAction(null)}
                    targetUsername={modalAction.user.username}
                    title={modalConfig.title}
                    description={modalConfig.description}
                    actionButtonText={modalConfig.actionButtonText}
                    actionButtonVariant={modalConfig.actionButtonVariant}
                    onConfirm={modalConfig.onConfirm}
                />
            )}
        </>
    );
}