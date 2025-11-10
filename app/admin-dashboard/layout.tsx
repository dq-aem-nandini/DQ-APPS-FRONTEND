import Header from "@/components/admin/Header";
import AdminSidebar from "@/components/admin/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar (no scroll) */}
        <div className="h-full overflow-hidden">
          <AdminSidebar />
        </div>

        {/* Right section */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          
          {/* Header (no scroll) */}
          <div className="shrink-0">
            <Header />
          </div>

          {/* MAIN CONTENT (THIS MUST SCROLL) */}
          <main className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50">
            {children}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
