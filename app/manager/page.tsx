// app/manager/page.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/manager/Header';
import Sidebar from '@/components/manager/Sidebar';
import DashboardContent from '@/components/manager/DashboardContent';
import { useAuth } from '@/context/AuthContext';

export default function ManagerDashboardPage() {
  const { state } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['MANAGER']}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
          {/* Main Content */}
          <DashboardContent/>
        </div>
      </div>
    </ProtectedRoute>
  );
}