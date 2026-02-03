// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'HR' | 'FINANCE' | 'SUPER_HR')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { state } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || state.isLoading || hasRedirected.current) return;

    const user = state.user;

    // ❌ Not logged in
    if (!state.isAuthenticated || !user) {
      console.log("🛡️ ProtectedRoute: user not authenticated → redirect");
      hasRedirected.current = true;
      router.replace("/auth/login");
      return;
    }

    const role = user.role.roleName; // 🟢 FIXED

    // 🟢 If route demands specific roles (like admin dashboard)
    if (allowedRoles.length > 0 && !allowedRoles.includes(role as any)) {
      console.log("🛡️ ProtectedRoute: role not allowed → redirect");
      hasRedirected.current = true;
      router.replace("/auth/login");
      return;
    }

    hasRedirected.current = false;
  }, [
    isMounted,
    state.isLoading,
    state.isAuthenticated,
    state.user?.role.roleName, // 🟢 FIXED dependency
    allowedRoles,
    router
  ]);

  // Loading screen
  if (!isMounted || state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
