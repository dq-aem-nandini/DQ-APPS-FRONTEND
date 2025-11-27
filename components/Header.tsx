"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LoggedInUser } from "@/lib/api/types";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card
} from "@/components/ui/card";

// Dynamic titles based on role
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  if (!user) return null;

  const dashboardTitle = DASHBOARD_TITLES[user.role.roleName] || "Dashboard";

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setShowDropdown(false);
  };

  const handleProfile = () => {
    router.push("/dashboard/profile");
    setShowDropdown(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
         {/* Responsive Dashboard Title */}
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 tracking-tight leading-tight">
  {dashboardTitle}
</h1>

          <div className="flex items-center gap-4">
            <NotificationBell className="h-7 w-7 text-yellow-600" />

            {/* Profile Dropdown - Compact & Right Aligned */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-200">
                  {user.profileName
                    ? user.profileName
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <svg
                  className={`h-4 w-4 text-gray-600 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                          ? user.profileName
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {user.profileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Role: {user.role.roleName}
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
