// app/auth/setup/page.tsx (updated with auto-fill for current password)
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

    const { state, updateUser } = useAuth();
    const router = useRouter();
    const user = state.user as LoggedInUser | null;
    const passwordService = new PasswordService();

    // NEW: Auto-fill current password from localStorage (temp password from login)
    useEffect(() => {
        if (user && user.firstLogin) {
            const tempPassword = localStorage.getItem('tempPassword') || '';
            if (tempPassword) {
                setForm(prev => ({ ...prev, currentPassword: tempPassword }));
                console.log('🧩 Auto-filled current password from temp storage');
            }
        }
    }, [user]);

    // Guard: Redirect if not first login or user not loaded
    useEffect(() => {
        if (!user || !user.firstLogin) {
            console.log('🧩 Setup guard: Redirecting (not first login)', { firstLogin: user?.firstLogin });
            const path = user?.role === 'EMPLOYEE' ? '/dashboard' :
                user?.role === 'ADMIN' ? '/admin-dashboard' :
                    user?.role === 'MANAGER' ? '/manager' :
                        user?.role === 'CLIENT' ? '/client-dashboard' :
                            user?.role === 'HR' ? '/hr' :
                                user?.role === 'FINANCE' ? '/finance' : '/dashboard';
            router.push(path);
        }
    }, [user, router]);

    if (!user || !user.firstLogin) {
        // Show loading spinner while redirecting
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-50 px-4">
                <div className="text-center">
                    <svg
                        className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p className="text-lg text-gray-600 mt-4">Redirecting...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.newPassword !== form.confirmNewPassword) {
            setError('New password and confirm new password do not match.');
            return;
        }
        if (form.newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('🧩 Submitting password setup for user:', user.userId);
            const response = await passwordService.updatePassword({
                oldPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            if (response.flag) {
                setSuccess('Password updated successfully! Redirecting to dashboard...');
                // Update local state to mark firstLogin as false (backend should also update DB)
                updateUser({ firstLogin: false });
                // PASTE THE LINES HERE (role-based redirect)
                setTimeout(() => {
                    // Role-based redirect after setup
                    const path = user.role === 'EMPLOYEE' ? '/dashboard' :
                        user.role === 'ADMIN' ? '/admin-dashboard' :
                            user.role === 'MANAGER' ? '/manager' :
                                user.role === 'CLIENT' ? '/client-dashboard' :
                                    user.role === 'HR' ? '/hr' :
                                        user.role === 'FINANCE' ? '/finance' : '/dashboard';
                    console.log('🧩 Setup complete - redirecting to:', path);
                    router.push(path);
                }, 1500);
            } else {
                setError(response.message || 'Failed to update password. Please try again.');
            }
        } catch (err: any) {
            console.error('❌ Password setup error:', err);
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        switch (field) {
            case 'current': setShowCurrentPassword(!showCurrentPassword); break;
            case 'new': setShowNewPassword(!showNewPassword); break;
            case 'confirm': setShowConfirmPassword(!showConfirmPassword); break;
        }
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
                            style={{ width: 'auto', height: 'auto' }} // FIXED: Maintain aspect ratio
                            className="rounded-full shadow-sm"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Welcome, {user.profileName}!
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        For security, please set up a new password to get started.
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Password Field - Auto-filled */}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    required
                                    value={form.currentPassword}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    placeholder="Enter your current password"
                                    className={form.currentPassword ? 'bg-gray-50' : ''} // Visual cue if auto-filled
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full p-0"
                                    onClick={() => togglePasswordVisibility('current')}
                                    disabled={isLoading}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {form.currentPassword && (
                                <p className="text-xs text-green-600">Auto-filled from login (you can edit if needed).</p>
                            )}
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    value={form.newPassword}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    placeholder="Enter a strong new password (min 6 chars)"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full p-0"
                                    onClick={() => togglePasswordVisibility('new')}
                                    disabled={isLoading}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Confirm New Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={form.confirmNewPassword}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    placeholder="Confirm your new password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full p-0"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="border-red-200">
                                <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert variant="default" className="border-green-200 bg-green-50">
                                <AlertDescription className="text-sm font-medium text-green-800">{success}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit"             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
 disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Updating...
                                </span>
                            ) : (
                                'Set New Password'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        Need help? <Link href="/auth/forgotPassword" className="text-indigo-600 hover:underline">Reset Password</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetupPassword;