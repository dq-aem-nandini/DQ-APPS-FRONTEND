'use client';
import EmployeeDashboard from "@/components/employee/DashboardContent";
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import HrDashboard from "@/components/hr/HrDashboard";
import DashboardContent from "@/components/manager/DashboardContent";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { state } = useAuth();
  const user = state.user;

  if (!user) return null;

  const role = user.role.roleName;

  switch (role) {
    case "MANAGER":
      return <DashboardContent />;

    case "HR":
      return <HrDashboard />;

    case "FINANCE":
      return <FinanceDashboard />;

    case "EMPLOYEE":
    default:
      return <EmployeeDashboard />;
  }
}
