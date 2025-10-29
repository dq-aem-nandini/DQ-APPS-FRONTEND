// components/employee/Header.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/api/types';

const Header = () => {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const user: User | null = state.user;

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
    router.push('/admin-dashboard/profile');  // Adjust path as needed for employee profile
    setShowDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500 hidden md:block">Welcome, {user?.userName || 'Admin'}</span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative focus:outline-none flex items-center space-x-2"
          >
            <img
              className="h-8 w-8 rounded-full ring-2 ring-gray-200"
              src="https://via.placeholder.com/32?text=U" // Use user avatar if available
              alt="Profile"
            />
            <svg className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-2 z-50 border border-gray-200">
              {/* Profile Details */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                    src="https://via.placeholder.com/40?text=U"
                    alt="Profile"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{user?.userName || 'Employee'}</div>
                    {/* <div className="text-sm text-gray-500">{user?.companyEmail || 'No email'}</div> */}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">Role: {user?.role || 'EMPLOYEE'}</div>
              </div>
              {/* Menu Items */}
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  onClick={handleProfile}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;