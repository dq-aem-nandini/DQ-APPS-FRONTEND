// app/admin-dashboard/layout.tsx (layout for admin dashboard with sidebar and header)
import DashboardContent from '@/components/admin/DashboardContent';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
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