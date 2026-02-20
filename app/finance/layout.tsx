import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["FINANCE"]}>
      <div className="flex h-screen overflow-hidden">
        <div className="h-full overflow-hidden">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <div className="shrink-0">
            <Header />
          </div>

          <main className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
