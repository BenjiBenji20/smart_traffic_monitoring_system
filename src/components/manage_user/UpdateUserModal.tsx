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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserSchema, UpdateUserProfileSchema } from "@/types/user.types";
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

    // Form data
    const [formData, setFormData] = useState({
        role: user.role,
        complete_name: user.complete_name,
        complete_address: user.complete_address,
        age: user.age,
    });

    // Admin credentials
    const [adminCredentials, setAdminCredentials] = useState({
        username: '',
        password: '',
    });

    const handleFormChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        // Validate form
        if (!formData.complete_name.trim() || !formData.complete_address.trim() || formData.age < 18) {
            toast.error("Please fill all required fields correctly");
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
            // Build update data WITHOUT password in update_info
            const updateData: UpdateUserProfileSchema = {
                username: adminCredentials.username,
                password: adminCredentials.password,
                update_info: {
                    username: user.username,
                    role: formData.role,
                    complete_name: formData.complete_name,
                    complete_address: formData.complete_address,
                    age: formData.age,
                    is_active: user.is_active
                }
            };

            const updatedUser = await userManagementApi.updateUserProfile(user.id, updateData);

            toast.success("User profile updated successfully");
            onUserUpdate?.(updatedUser);
            handleClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Failed to update user:", error);
            console.error("Error response:", error.response?.data);
            
            // Log the full error detail
            if (error.response?.data?.detail) {
                console.error("Validation errors:", JSON.stringify(error.response.data.detail, null, 2));
            }

            if (error.response?.status === 401) {
                toast.error("Invalid admin credentials");
            } else if (error.response?.status === 403) {
                toast.error("You don't have permission to update users");
            } else if (error.response?.status === 422) {
                const detail = error.response?.data?.detail;
                if (Array.isArray(detail) && detail.length > 0) {
                    // FastAPI validation error format
                    const firstError = detail[0];
                    toast.error(`Validation error: ${firstError.msg} at ${firstError.loc?.join('.')}`);
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
        setAdminCredentials({ username: '', password: '' });
        setFormData({
            role: user.role,
            complete_name: user.complete_name,
            complete_address: user.complete_address,
            age: user.age,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
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
                                min="18"
                                max="100"
                                value={formData.age}
                                onChange={(e) => handleFormChange('age', parseInt(e.target.value))}
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