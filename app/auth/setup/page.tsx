'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoggedInUser } from '@/lib/api/types';
import { PasswordService } from '@/lib/api/passwordService';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const SetupPassword: React.FC = () => {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Inline validation errors
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const { state, updateUser } = useAuth();
    const router = useRouter();
    const user = state.user as LoggedInUser | null;

    const passwordService = new PasswordService();

    // ----------------------------------------------------
    // PASSWORD VALIDATION HELPER
    // ----------------------------------------------------
    const validateNewPassword = (pwd: string, currentPwd: string): string => {
        if (pwd === currentPwd && currentPwd !== '') {
            return 'New password cannot be the same as your current password.';
        }
        if (pwd.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character.';
        if (/\s/.test(pwd)) return 'Password cannot contain spaces.';
        return '';
    };

    // ----------------------------------------------------
    // AUTO-FILL OLD PASSWORD (from login tempPassword)
    // ----------------------------------------------------
    useEffect(() => {
        if (user?.firstLogin) {
            const tempPassword = localStorage.getItem('tempPassword') || '';
            if (tempPassword) {
                setForm(prev => ({ ...prev, currentPassword: tempPassword }));
                console.log('🧩 Auto-filled current password from temp storage');
            }
        }
    }, [user]);

    // ----------------------------------------------------
    // RE-VALIDATE NEW PASSWORD WHEN CURRENT CHANGES
    // ----------------------------------------------------
    useEffect(() => {
        if (form.newPassword) {
            const error = validateNewPassword(form.newPassword, form.currentPassword);
            setNewPasswordError(error);
        }
    }, [form.currentPassword, form.newPassword]);

    // ----------------------------------------------------
    // GUARD: If NOT first login → redirect to correct dashboard
    // ----------------------------------------------------
    useEffect(() => {
        if (!user) return;

        if (!user.firstLogin) {
            console.log("🛑 Not first login, redirecting away from setup");

            const isAdmin = user.role?.roleName === "ADMIN";
            router.push(isAdmin ? "/admin-dashboard" : "/dashboard");
        }
    }, [user, router]);


    if (!user || !user.firstLogin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Redirecting...</p>
            </div>
        );
    }

    // ----------------------------------------------------
    // ON CHANGE HANDLERS FOR INLINE VALIDATION
    // ----------------------------------------------------
    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPwd = e.target.value;
        setForm({ ...form, newPassword: newPwd });
        const error = validateNewPassword(newPwd, form.currentPassword);
        setNewPasswordError(error);
        // Clear confirm error if new password changes
        if (confirmPasswordError) setConfirmPasswordError('');
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const confirmPwd = e.target.value;
        setForm({ ...form, confirmNewPassword: confirmPwd });
        if (confirmPwd !== form.newPassword) {
            setConfirmPasswordError("Passwords do not match.");
        } else {
            setConfirmPasswordError('');
        }
    };

    // ----------------------------------------------------
    // SUBMIT HANDLER
    // ----------------------------------------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Inline errors already handle most cases, but double-check
        const newPwdError = validateNewPassword(form.newPassword, form.currentPassword);
        if (newPwdError) {
            setNewPasswordError(newPwdError);
            return;
        }

        if (form.newPassword !== form.confirmNewPassword) {
            setConfirmPasswordError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            console.log("🔐 Updating first-login password for", user.userId);

            const response = await passwordService.updatePassword({
                oldPassword: form.currentPassword,
                newPassword: form.newPassword,
            });

            if (response.flag) {
                setSuccess("Password updated! Redirecting...");

                // Update global user state → firstLogin = false
                updateUser({ firstLogin: false });

                setTimeout(() => {
                    const isAdmin = user.role?.roleName === "ADMIN";
                    const path = isAdmin ? "/admin-dashboard" : "/dashboard";

                    console.log("➡️ Setup complete — redirecting to", path);
                    router.push(path);
                }, 1500);
            } else {
                setError(response.message || "Failed to update password.");
            }
        } catch (err: any) {
            console.error("❌ Setup password error:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------------------------------------
    // UI
    // ----------------------------------------------------
    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        if (field === "current") setShowCurrentPassword(!showCurrentPassword);
        if (field === "new") setShowNewPassword(!showNewPassword);
        if (field === "confirm") setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/digiquad logo.jpeg"
                            alt="DigiQuad Logo"
                            width={80}
                            height={80}
                            style={{ width: "auto", height: "auto" }}
                            className="rounded-full shadow-sm"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Welcome, {user.profileName}!
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        Please set a new password to continue.
                    </p>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                         {/* Hidden username for accessibility + browser autofill */}
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={user?.companyEmail|| ""}
                        readOnly
                        hidden
                    />
                        
                        {/* CURRENT PASSWORD */}
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    name="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={form.currentPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, currentPassword: e.target.value })
                                    }
                                    required
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => togglePasswordVisibility("current")}
                                >
                                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                        </div>

                        {/* NEW PASSWORD */}
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    name="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={form.newPassword}
                                    onChange={handleNewPasswordChange}
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => togglePasswordVisibility("new")}
                                >
                                    {showNewPassword ? <EyeOff  /> : <Eye/>}
                                </Button>
                            </div>
                            {newPasswordError && (
                                <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>
                            )}
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    name="confirmNewPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={form.confirmNewPassword}
                                    onChange={handleConfirmPasswordChange}
                                    required
                                     autoComplete="new-password"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => togglePasswordVisibility("confirm")}
                                >
                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                            {confirmPasswordError && (
                                <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert variant="default" className="bg-green-50 border-green-200">
                                <AlertDescription className="text-green-700">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg"
                            disabled={isLoading || !!newPasswordError || !!confirmPasswordError}
                        >
                            {isLoading ? "Updating..." : "Set New Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetupPassword;