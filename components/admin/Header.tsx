'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoggedInUser } from '@/lib/api/types';
import NotificationBell from '../NotificationBell';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Header = () => {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user: LoggedInUser | null = state.user as LoggedInUser | null;

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
    router.push('/admin-dashboard/profile');
    setShowDropdown(false);
  };

  if (!user) return null;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-25">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-extrabold text-gray-800 tracking-tight mt-8 mb-8">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <NotificationBell className="h-8 w-8 text-yellow-600" />
              <span className="text-lg text-gray-700 hidden md:block font-semibold">
                Welcome, {user.profileName || 'Admin'}
              </span>
              {/* Profile Dropdown - Compact & Right Aligned */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-200">
                    {user.profileName
                      ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                      : 'EP'}                </div>
                  <svg className={`h-4 w-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Compact Dropdown - Reduced Height & Right Aligned */}
                {showDropdown && (
                  <Card className="absolute right-0 top-full mt-1.5 w-60 shadow-2xl border border-gray-200 z-50">
                    <div className="p-0 space-y-0">
                      {/* Profile Info */}
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={handleProfile}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-200">
                          {user.profileName
                            ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                            : 'EP'}                      </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {user.profileName || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Role: {user?.role.roleName || 'ADMIN'}
                          </p>
                        </div>
                      </div>

                      {/* Logout Button - Right Aligned */}
                      <div className="flex justify-end px-3 py-0 ">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-4 text-sm font-medium"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-2 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              {/* User Dropdown */}
              {/* <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-gray-200 text-white font-bold text-xs">
                    {user.profileName
                      ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                      : 'EP'}
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                Dropdown Menu
                {showDropdown && (
                  <Card className="absolute right-0 top-full mt-2 w-80 shadow-xl border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                    <CardHeader className="p-4 border-b border-gray-100 space-y-2">
                      <div
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors"
                        onClick={handleProfile}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-gray-200 text-white font-bold text-sm">
                          {user.profileName
                            ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                            : 'EP'}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {user.profileName || 'Admin'}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Role: {user?.role.roleName || 'ADMIN'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-sm hover:bg-red-50 text-red-600 hover:text-red-700"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Logout
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;