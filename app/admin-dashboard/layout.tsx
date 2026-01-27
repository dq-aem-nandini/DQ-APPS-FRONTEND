'use client';

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Admin UI
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

// HR / Normal UI
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useAuth();
  const role = state.user?.role.roleName;

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
      <div className="flex h-screen overflow-hidden">

        {/* SIDEBAR */}
        <div className="h-full w-64 flex-shrink-0 border-r bg-white">
          {role === "ADMIN" ? <AdminSidebar /> : <Sidebar />}
        </div>

        {/* CONTENT */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <div className="shrink-0">
            {role === "ADMIN" ? <AdminHeader /> : <Header />}
          </div>

          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {children}
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
