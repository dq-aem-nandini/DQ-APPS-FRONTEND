'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoggedInUser } from '@/lib/api/types';
import NotificationBell from '../NotificationBell';
import Link from 'next/link';
import { LogOut, Loader2 } from 'lucide-react'; // Added Loader2
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { sessionService } from '@/lib/api/sessionService'; 
import toast from 'react-hot-toast';

const Header = () => {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // NEW: loading state
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
    if (isLoggingOut) return;
    setIsLoggingOut(true);
  
    let hasCalledBackend = false;
  
    try {
      const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;
  
      if (deviceId && !hasCalledBackend) {
        hasCalledBackend = true;
  
        // Direct axios call — no import issue
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/logout?deviceId=${deviceId}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
            "X-Device-Id": deviceId,
            "X-Device-Name": typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
          },
        });
      }
  
      toast.success("Logged out securely");
    } catch (err: any) {
      // Silently ignore all logout errors — they are safe
      console.info("Logout request failed (safe to ignore):", err.message);
    } finally {
      // Always run exactly once
      await logout();
      router.push("/auth/login");
      setIsLoggingOut(false);
      setShowDropdown(false);
    }
  };

  const handleProfile = () => {
    router.push('/admin-dashboard/profile');
    setShowDropdown(false);
  };

  if (!user) return null;

  const getInitials = () => {
    return user.profileName
      ? user.profileName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
      : 'EP';
  };

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

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-200">
                    {getInitials()}
                  </div>
                  <svg className={`h-4 w-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown — UI 100% unchanged */}
                {showDropdown && (
                  <Card className="absolute right-0 top-full mt-1.5 w-60 shadow-2xl border border-gray-200 z-50">
                    <div className="p-0 space-y-0">
                      {/* Profile Info */}
                      <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={handleProfile}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-200">
                          {getInitials()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {user.profileName || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Role: {user?.role.roleName || 'ADMIN'}
                          </p>
                        </div>
                      </div>

                      {/* Logout Button — same look, now secure */}
                      <div className="flex justify-end px-3 py-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-4 text-sm font-medium"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                        >
                          {isLoggingOut ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Logging out...
                            </>
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-2" />
                              Logout
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;