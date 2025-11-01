// components/manage_user/UserProfileContainer.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar } from "../ui/profile";
import {
    User,
    MapPin,
    Calendar,
    Shield,
    Edit,
    Archive,
    UserCheck,
    UserX,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    UserSchema,
    PendingUserSchema,
    ArchiveUserSchema,
    ArchiveActiveUserSchema
} from "@/types/user.types";
import { UpdateUserModal } from '@/components/manage_user/UpdateUserModal';

type UserType = UserSchema | PendingUserSchema | ArchiveUserSchema | ArchiveActiveUserSchema;

interface UserProfileContainerProps {
    user: UserType;
    userSource: 'Traffic Managers' | 'Archived Managers' | 'Pending Registrations' | 'Archived Registrations';
    onUserUpdate?: (updatedUser: UserSchema) => void;
}

export function UserProfileContainer({ user, userSource, onUserUpdate }: UserProfileContainerProps) {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const getSourceBadge = () => {
        const badges = {
            'Traffic Managers': {
                icon: <Users className="h-3 w-3" />,
                label: 'Traffic Management',
                variant: 'default' as const
            },
            'Archived Managers': {
                icon: <Archive className="h-3 w-3" />,
                label: 'Archived Manager',
                variant: 'secondary' as const
            },
            'Pending Registrations': {
                icon: <UserCheck className="h-3 w-3" />,
                label: 'Pending Registration',
                variant: 'outline' as const
            },
            'Archived Registrations': {
                icon: <UserX className="h-3 w-3" />,
                label: 'Archived Registration',
                variant: 'destructive' as const
            }
        };
        return badges[userSource];
    };

    const badge = getSourceBadge();
    const canUpdate = userSource === 'Traffic Managers';

    // Format date
    const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Card className="w-full">
                <CardHeader className="space-y-2 pb-2">
                    {/* Source Badge */}
                    <div className="flex items-center justify-between">
                        <Badge variant={badge.variant} className="gap-1">
                            {badge.icon}
                            {badge.label}
                        </Badge>
                    </div>

                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center space-y-2">
                        <ProfileAvatar
                            username={user.complete_name}
                            className="h-20 w-20 text-3xl"
                        />
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                {user.complete_name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                @{user.username}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Separator />

                    {/* User Details Grid */}
                    <div className="space-y-4">
                        {/* Role */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Role</p>
                                <p className="text-sm font-medium capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="text-sm font-medium">{user.complete_address}</p>
                            </div>
                        </div>

                        {/* Age */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Age</p>
                                <p className="text-sm font-medium">{user.age} years old</p>
                            </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Member Since</p>
                                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                user.is_active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            )}>
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-sm font-medium">
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>

                        {/* Show archived info if applicable */}
                        {'archived_at' in user && (
                            <>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                        <Archive className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Archived On</p>
                                        <p className="text-sm font-medium">{formatDate(user.archived_at)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            By: {user.archived_by}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Update Button (Only for Traffic Managers) */}
                    {canUpdate && (
                        <>
                            <Separator />
                            <Button
                                className="w-full"
                                variant="default"
                                onClick={() => setIsUpdateModalOpen(true)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Update User Profile
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Update Modal */}
            {canUpdate && (
                <UpdateUserModal
                    isOpen={isUpdateModalOpen}
                    onClose={() => setIsUpdateModalOpen(false)}
                    user={user as UserSchema}
                    onUserUpdate={onUserUpdate}
                />
            )}
        </>
    );
}