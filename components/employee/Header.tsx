'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/api/types';
import NotificationBell from '../NotificationBell';
import { PasswordService } from '@/lib/api/passwordService';
import Link from 'next/link';
import { X, Eye, EyeOff, Lock, User as UserIcon, LogOut, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Header = () => {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const user: User | null = state.user;
  const passwordService = new PasswordService();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
    setShowDropdown(false);
  };

  const handleProfile = () => {
    router.push('/dashboard/profile');
    setShowDropdown(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    if (changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword) {
      setChangePasswordError('New password and confirm new password do not match.');
      return;
    }
    if (changePasswordForm.newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await passwordService.updatePassword({
        oldPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      });
      if (response.flag) {
        setChangePasswordSuccess('Password changed successfully!');
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setChangePasswordSuccess('');
        }, 2000);
      } else {
        setChangePasswordError(response.message || 'Failed to change password. Please try again.');
      }
    } catch (err: any) {
      setChangePasswordError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Employee Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-gray-600 hidden md:block font-medium">
                Welcome, {user?.userName || 'Employee'}
              </span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-gray-200"
                    src="https://via.placeholder.com/32?text=U"
                    alt="Profile"
                  />
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown && (
                  <Card className="absolute right-0 top-full mt-2 w-80 shadow-xl border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                    <CardHeader className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <img
                          className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                          src="https://via.placeholder.com/40?text=U"
                          alt="Profile"
                        />
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {user?.userName || 'Employee'}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Role: {user?.role || 'EMPLOYEE'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="py-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 px-4 text-sm hover:bg-gray-50"
                          onClick={handleProfile}
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 px-4 text-sm hover:bg-gray-50"
                          onClick={() => {
                            setShowDropdown(false);
                            setShowPasswordModal(true);
                          }}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                        <Link
                          href="/auth/forgotPassword"
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          <span>Forgot Password?</span>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 px-4 text-sm hover:bg-red-50 text-red-600 hover:text-red-700"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Change Password</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPasswordModal(false);
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                  setChangePasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={changePasswordForm.currentPassword}
                      onChange={handleInputChange}
                      disabled={isChangingPassword}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full p-0 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                      disabled={isChangingPassword}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={changePasswordForm.newPassword}
                      onChange={handleInputChange}
                      disabled={isChangingPassword}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full p-0 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                      disabled={isChangingPassword}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={changePasswordForm.confirmNewPassword}
                      onChange={handleInputChange}
                      disabled={isChangingPassword}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full p-0 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                      disabled={isChangingPassword}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {changePasswordError && (
                  <Alert variant="destructive" className="border-red-200">
                    <AlertDescription className="text-sm">{changePasswordError}</AlertDescription>
                  </Alert>
                )}

                {changePasswordSuccess && (
                  <Alert variant="default" className="border-green-200 bg-green-50">
                    <AlertDescription className="text-sm font-medium text-green-800">{changePasswordSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setChangePasswordError('');
                      setChangePasswordSuccess('');
                      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Changing...
                      </span>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default Header;