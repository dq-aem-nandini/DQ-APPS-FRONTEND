// components/ProtectedRoute.tsx (fixed deps, mounted ref, and timing for refresh)
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react'; // Added useState for mounted

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'CLIENT' | 'HR' | 'FINANCE')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { state } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false); // NEW: Track if component is mounted (SSR fix)

  useEffect(() => {
    setIsMounted(true); // Mark as mounted after first render
  }, []);

  useEffect(() => {
    // Skip SSR or if already redirecting
    if (!isMounted || hasRedirectedRef.current) return;
    // Wait for initialization
    if (state.isLoading) {
      console.log('🛡️ ProtectedRoute: Waiting for auth init...');
      return;
    }

    // Not authenticated or no user
    if (!state.isAuthenticated || !state.user) {
      console.log('🛡️ ProtectedRoute: Unauthenticated - redirecting to login');
      hasRedirectedRef.current = true;
      router.replace('/auth/login');
      return;
    }

    // Role not allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(state.user.role as any)) {
      console.log('🛡️ ProtectedRoute: Unauthorized role - redirecting to login');
      hasRedirectedRef.current = true;
      router.replace('/auth/login');
      return;
    }
    hasRedirectedRef.current = false;
  }, [isMounted, state.isLoading, state.isAuthenticated, state.user?.role, allowedRoles, router]); // FIXED: Specific deps (no full state object)

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4"
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
          <p className="text-lg text-gray-600">Checking authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Block rendering until auth is confirmed
  if (!state.isAuthenticated || !state.user || (allowedRoles.length > 0 && !allowedRoles.includes(state.user.role as any))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">Access Denied</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;