'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoggedInUser, EmployeeDTO } from '@/lib/api/types';
import { employeeService } from '@/lib/api/employeeService';
import { sessionService } from '@/lib/api/sessionService'; // ← For backend logout
import NotificationBell from "./NotificationBell";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from 'react-hot-toast';

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

  const [employeeDto, setEmployeeDto] = useState<EmployeeDTO | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch fresh profile photo
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user) return;
      try {
        const data = await employeeService.getEmployeeById();
        setEmployeeDto(data);
      } catch (err) {
        console.error("Failed to load employee", err);
      }
    };
    fetchEmployee();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  if (!user) return null;

  const dashboardTitle = DASHBOARD_TITLES[user.role.roleName] || "Dashboard";

  // SECURE BACKEND LOGOUT (Single Device Only)
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      // Call backend to invalidate this session
      await sessionService.logoutCurrent();

      toast.success("Logged out securely");

      // Clear frontend state
      await logout();
      router.push("/auth/login");
    } catch (err: any) {
      console.error("Logout failed:", err);
      toast.error("Logout failed, clearing session anyway...");

      // Fallback: still log out locally
      await logout();
      router.push("/auth/login");
    } finally {
      setIsLoggingOut(false);
      setShowDropdown(false);
    }
  };

  const handleProfile = () => {
    const path = user.role.roleName === "ADMIN" ? "/admin-dashboard/profile" : "/dashboard/profile";
    router.push(path);
    setShowDropdown(false);
  };

  const getInitials = () => {
    if (!user?.profileName) return "U";
    return user.profileName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Dashboard Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-extrabold text-gray-800 tracking-tight mt-8 mb-8">
            {dashboardTitle}
          </h1>
          <div className="flex items-center gap-6">
            <NotificationBell className="h-8 w-8 text-yellow-600 cursor-pointer" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-100 transition-all group"
              >
                {/* Avatar */}
                {employeeDto?.employeePhotoUrl ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden ring-4 ring-blue-200 shadow-md relative">
                    <img
                      key={employeeDto.employeePhotoUrl}
                      src={employeeDto.employeePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const fallback = img.parentElement?.querySelector('.fallback');
                        if (fallback) (fallback as HTMLElement).style.display = "flex";
                      }}
                    />
                    <div className="fallback hidden h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white font-bold text-sm absolute inset-0">
                      {getInitials()}
                    </div>
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg ring-4 ring-blue-200 shadow-md">
                    {getInitials()}
                  </div>
                )}

                <svg className={`h-5 w-5 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Simple, Clean Dropdown */}
              {showDropdown && (
                <Card className="absolute right-0 top-full mt-3 w-72 shadow-2xl border-0 ring-1 ring-black/5 rounded-2xl overflow-hidden z-50">
                  <div >
                    {/* Profile */}
                    <div
                      className="cursor-pointer hover:opacity-90 transition text-center"
                      onClick={handleProfile}
                    >
                      <div className="mx-auto w-24 h-24 rounded-full overflow-hidden ring-8 ring-white shadow-2xl relative">
                        {employeeDto?.employeePhotoUrl ? (
                          <img
                            key={employeeDto.employeePhotoUrl}
                            src={employeeDto.employeePhotoUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                            {getInitials()}
                          </div>
                        )}
                      </div>
                      <div className="mt-5">
                        <p className="text-xl font-bold text-gray-900">{user.profileName}</p>
                        <p className="text-sm text-gray-600">{user.companyEmail}</p>
                        <p className="text-xs font-medium text-indigo-600 mt-2 px-3 py-1 bg-indigo-100 rounded-full inline-block">
                          {user.role.roleName}
                        </p>
                      </div>
                    </div>

                    {/* Logout Only */}
                    <div className="mt-0 pt-0 border-t border-white/30">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-full justify-center text-red-600   font-medium"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-5 w-5 mr-2" />
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
  );
};

export default Header;