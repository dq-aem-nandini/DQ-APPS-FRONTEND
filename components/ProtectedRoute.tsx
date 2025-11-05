//components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'MANAGER' |'CLIENT' | "HR" | "FINANCE")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for initialization
    if (state.isLoading) return;

    // Not authenticated
    if (!state.isAuthenticated || !state.user) {
      router.replace('/auth/login');
      return;
    }
    // Role not allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(state.user.role as any)) {
      router.replace('/auth/login');
    }

  }, [state, router, allowedRoles]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Checking authentication...</p>
      </div>
    );
  }

  if (!state.isAuthenticated || !state.user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;