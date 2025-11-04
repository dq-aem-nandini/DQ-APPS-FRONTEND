// app/dashboard/page.tsx
import Header from '@/components/employee/Header';
import Sidebar from '@/components/employee/Sidebar';
import DashboardContent from '@/components/employee/DashboardContent';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EmployeeDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['EMPLOYEE']}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
          {/* Main Content */}
          <DashboardContent />
        </div>
      </div>
    </ProtectedRoute>
  );
}
