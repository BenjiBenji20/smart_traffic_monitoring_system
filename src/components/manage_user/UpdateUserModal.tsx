// components/manage_user/UpdateUserModal.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePasswordToggle } from "@/hooks/use-password-toggle"
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import type { UserSchema, UpdateUserProfileSchema, UpdateUserModel } from "@/types/user.types";
import { userManagementApi } from "@/api/crud_api";
import type { Role } from "@/types/auth";

interface UpdateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserSchema;
    onUserUpdate?: (updatedUser: UserSchema) => void;
}

export function UpdateUserModal({ isOpen, onClose, user, onUserUpdate }: UpdateUserModalProps) {
    const [step, setStep] = useState<'form' | 'verify'>('form');
    const [isLoading, setIsLoading] = useState(false);

    // Form data - all optional except what user changes
    const [formData, setFormData] = useState({
        username: user.username,
        password: '',
        passwordConfirm: '',
        role: user.role,
        complete_name: user.complete_name,
        complete_address: user.complete_address,
        age: user.age,
    });

    const {
        passwordInputType,
        PasswordIcon,
        togglePasswordVisibility
    } = usePasswordToggle();

    // Track which fields changed
    const [changePassword, setChangePassword] = useState(false);

    // Admin credentials
    const [adminCredentials, setAdminCredentials] = useState({
        username: '',
        password: '',
    });

    const handleFormChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        // Username validation (if changed)
        if (formData.username !== user.username) {
            const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernamePattern.test(formData.username)) {
                toast.error("Username must be 3-20 characters and contain only letters, numbers, and underscores");
                return false;
            }
        }

        // Password validation (if changing)
        if (changePassword) {
            if (!formData.password) {
                toast.error("Please enter a new password");
                return false;
            }

            if (formData.password.length < 8) {
                toast.error("Password must be at least 8 characters");
                return false;
            }

            const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@#$%^&+=]{8,}$/;
            if (!passwordPattern.test(formData.password)) {
                toast.error("Password must include at least one uppercase letter and one number");
                return false;
            }

            if (formData.password !== formData.passwordConfirm) {
                toast.error("Passwords do not match");
                return false;
            }
        }

        // Complete name validation
        const namePattern = /^[a-zA-Z][a-zA-Z'\-,. ]*$/;
        if (!namePattern.test(formData.complete_name)) {
            toast.error("Complete name contains invalid characters");
            return false;
        }

        // Complete address validation
        if (!namePattern.test(formData.complete_address)) {
            toast.error("Complete address contains invalid characters");
            return false;
        }

        // Age validation
        if (formData.age < 1 || formData.age > 120) {
            toast.error("Age must be between 1 and 120");
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (!validateForm()) {
            return;
        }
        setStep('verify');
    };

    const handleBack = () => {
        setStep('form');
        setAdminCredentials({ username: '', password: '' });
    };

    const handleSubmit = async () => {
        if (!adminCredentials.username.trim() || !adminCredentials.password.trim()) {
            toast.error("Please enter admin credentials");
            return;
        }

        setIsLoading(true);
        try {
            // Build update_info with only changed fields
            const update_info: UpdateUserModel = {};

            // Only include username if changed
            if (formData.username !== user.username) {
                update_info.username = formData.username;
            }

            // Only include password if changing
            if (changePassword && formData.password) {
                update_info.password = formData.password;
            }

            // Only include role if changed
            if (formData.role !== user.role) {
                update_info.role = formData.role;
            }

            // Only include name if changed
            if (formData.complete_name !== user.complete_name) {
                update_info.complete_name = formData.complete_name;
            }

            // Only include address if changed
            if (formData.complete_address !== user.complete_address) {
                update_info.complete_address = formData.complete_address;
            }

            // Only include age if changed
            if (formData.age !== user.age) {
                update_info.age = formData.age;
            }

            // Check if anything changed
            if (Object.keys(update_info).length === 0) {
                toast.info("No changes detected");
                setIsLoading(false);
                return;
            }

            const updateData: UpdateUserProfileSchema = {
                username: adminCredentials.username,
                password: adminCredentials.password,
                update_info: update_info
            };

            console.log('Sending update data:', updateData);

            const updatedUser = await userManagementApi.updateUserProfile(user.id, updateData);

            toast.success("User profile updated successfully");
            onUserUpdate?.(updatedUser);
            handleClose();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Failed to update user:", error);
            console.error("Error response:", error.response?.data);

            if (error.response?.status === 401) {
                toast.error("Invalid admin credentials");
            } else if (error.response?.status === 403) {
                toast.error("You don't have permission to update users");
            } else if (error.response?.status === 422) {
                const detail = error.response?.data?.detail;
                if (Array.isArray(detail) && detail.length > 0) {
                    const firstError = detail[0];
                    toast.error(`Validation error: ${firstError.msg}`);
                } else {
                    toast.error("Invalid data format. Please check all fields.");
                }
            } else {
                toast.error("Failed to update user profile");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('form');
        setChangePassword(false);
        setAdminCredentials({ username: '', password: '' });
        setFormData({
            username: user.username,
            password: '',
            passwordConfirm: '',
            role: user.role,
            complete_name: user.complete_name,
            complete_address: user.complete_address,
            age: user.age,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'form' ? 'Update User Profile' : 'Admin Verification Required'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'form'
                            ? `Update profile information for ${user.complete_name}`
                            : 'Please enter your admin credentials to confirm this action'
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <div className="space-y-4 py-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Only fill in the fields you want to update. Leave others unchanged.
                            </AlertDescription>
                        </Alert>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleFormChange('username', e.target.value)}
                                placeholder="Enter username (3-20 chars, letters, numbers, underscore)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Current: {user.username}
                            </p>
                        </div>

                        {/* Change Password Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="change-password"
                                checked={changePassword}
                                onCheckedChange={(checked: boolean) => {
                                    setChangePassword(checked as boolean);
                                    if (!checked) {
                                        setFormData(prev => ({
                                            ...prev,
                                            password: '',
                                            passwordConfirm: ''
                                        }));
                                    }
                                }}
                            />
                            <Label
                                htmlFor="change-password"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Change Password
                            </Label>
                        </div>

                        {/* Password Fields (only show if checkbox is checked) */}
                        {changePassword && (
                            <>
                                <div className="relative pt-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type={passwordInputType}
                                        value={formData.password}
                                        onChange={(e) => handleFormChange('password', e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <PasswordIcon className="h-4 w-4" />
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        Min 8 characters, 1 uppercase, 1 number
                                    </p>
                                </div>

                                <div className="relative pb-2">
                                    <Label htmlFor="passwordConfirm">Confirm New Password</Label>
                                    <Input
                                        id="passwordConfirm"
                                        type={passwordInputType}
                                        value={formData.passwordConfirm}
                                        onChange={(e) => handleFormChange('passwordConfirm', e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <PasswordIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: Role) => handleFormChange('role', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="city_engineer">City Engineer</SelectItem>
                                    <SelectItem value="traffic_enforcer">Traffic Enforcer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Complete Name */}
                        <div className="space-y-2">
                            <Label htmlFor="complete_name">Complete Name</Label>
                            <Input
                                id="complete_name"
                                value={formData.complete_name}
                                onChange={(e) => handleFormChange('complete_name', e.target.value)}
                                placeholder="Enter full name"
                            />
                        </div>

                        {/* Complete Address */}
                        <div className="space-y-2">
                            <Label htmlFor="complete_address">Complete Address</Label>
                            <Input
                                id="complete_address"
                                value={formData.complete_address}
                                onChange={(e) => handleFormChange('complete_address', e.target.value)}
                                placeholder="Enter complete address"
                            />
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                min="1"
                                max="120"
                                value={formData.age}
                                onChange={(e) => handleFormChange('age', parseInt(e.target.value) || 1)}
                                placeholder="Enter age"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertDescription>
                                This action requires admin verification. Please enter your credentials to continue.
                            </AlertDescription>
                        </Alert>

                        <Separator />

                        {/* Admin Username */}
                        <div className="space-y-2">
                            <Label htmlFor="admin_username">Admin Username</Label>
                            <Input
                                id="admin_username"
                                type="text"
                                value={adminCredentials.username}
                                onChange={(e) => setAdminCredentials(prev => ({
                                    ...prev,
                                    username: e.target.value
                                }))}
                                placeholder="Enter your admin username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Admin Password */}
                        <div className="space-y-2">
                            <Label htmlFor="admin_password">Admin Password</Label>
                            <Input
                                id="admin_password"
                                type="password"
                                value={adminCredentials.password}
                                onChange={(e) => setAdminCredentials(prev => ({
                                    ...prev,
                                    password: e.target.value
                                }))}
                                placeholder="Enter your admin password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'form' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleNext}>
                                Next: Verify
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                                Back
                            </Button>
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Confirm Update'
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}