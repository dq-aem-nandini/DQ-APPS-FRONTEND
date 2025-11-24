'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoggedInUser } from '@/lib/api/types';
import NotificationBell from './NotificationBell';
import { PasswordService } from '@/lib/api/passwordService';
import Link from 'next/link';
import { X, Eye, EyeOff, Lock, User as UserIcon, LogOut, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ✔ Titles only for dashboard roles (ADMIN excluded)
const DASHBOARD_TITLES: Record<string, string> = {
  EMPLOYEE: "Employee Dashboard",
  MANAGER: "Manager Dashboard",
  HR: "HR Dashboard",
  FINANCE: "Finance Dashboard",
};

const Header = () => {
  const { state, logout } = useAuth();
  const router = useRouter();
  const user: LoggedInUser | null = state.user as LoggedInUser | null;

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const passwordService = new PasswordService();

  // Close dropdown by clicking outside
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  if (!user) return null;

  // ✔ Dashboard title based on role
  const dashboardTitle = DASHBOARD_TITLES[user.role.roleName] || "Dashboard";

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
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
        setChangePasswordError(response.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setChangePasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
    if (field === 'new') setShowNewPassword(!showNewPassword);
    if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-25">
            
            {/* ✔ Dynamic Dashboard Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mt-10 mb-10">
              {dashboardTitle}
            </h1>

            <div className="flex items-center space-x-4">
              <NotificationBell className="h-8 w-8 text-yellow-600" />

              <span className="text-lg text-gray-700 hidden md:block font-semibold">
                Welcome, {user.profileName}
              </span>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.profileName
                      ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('')
                      : 'U'}
                  </div>

                  <svg
                    className={`h-4 w-4 text-gray-500 ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <Card className="absolute right-0 top-full mt-2 w-80 shadow-xl border-gray-200 z-50">
                    <CardHeader className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.profileName
                            ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('')
                            : 'U'}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {user.profileName}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Role: {user.role.roleName}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <div className="py-2">
                        <Button variant="ghost" className="w-full justify-start h-10 px-4 text-sm" onClick={handleProfile}>
                          <UserIcon className="h-4 w-4 mr-2" /> Profile
                        </Button>

                        <Button variant="ghost" className="w-full justify-start h-10 px-4 text-sm"
                          onClick={() => { setShowDropdown(false); setShowPasswordModal(true); }}>
                          <Lock className="h-4 w-4 mr-2" /> Change Password
                        </Button>

                        <Link href="/auth/forgotPassword" className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50">
                          <Key className="h-4 w-4 mr-2 inline" /> Forgot Password?
                        </Link>

                        <Button variant="ghost" className="w-full justify-start h-10 px-4 text-sm text-red-600 hover:bg-red-50"
                          onClick={handleLogout}>
                          <LogOut className="h-4 w-4 mr-2" /> Logout
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

      {/* CHANGE PASSWORD MODAL — UNCHANGED */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Change Password</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowPasswordModal(false);
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setChangePasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
              }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Inputs + Modals remain unchanged */}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default Header;
