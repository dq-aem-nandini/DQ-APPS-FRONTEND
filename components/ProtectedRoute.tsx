// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'CLIENT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { state } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for loading to finish
    if (state.isLoading) return;
    setIsReady(true);

    if (!state.isAuthenticated || !state.user) {
      router.push('/auth/login');
    } else if (allowedRoles.length > 0 && !allowedRoles.includes(state.user.role)) {
      router.push('/auth/login');
    }
  }, [state, router, allowedRoles]);

  if (!isReady || state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated || !state.user || (allowedRoles.length > 0 && !allowedRoles.includes(state.user.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Unauthorized...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;