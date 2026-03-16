"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoggedInUser } from "@/lib/api/types";
import { employeeService } from "@/lib/api/employeeService";
import { adminService } from "@/lib/api/adminService";
import Swal from "sweetalert2";
const formatPermission = (permission: string) => {
  return permission
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export default function PermissionsPage() {
  const { state } = useAuth();
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeePermissions, setEmployeePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // LOAD DATA
  // ===============================
  useEffect(() => {
    if (!state.user) return;
    const user = state.user as LoggedInUser;
    loadRolePermissions(user.role.roleName);
    loadEmployees();
  }, [state.user]);

  // ===============================
  // GET ROLE PERMISSIONS
  // ===============================
  const loadRolePermissions = async (roleName: any) => {
    try {
      const res = await employeeService.getPermissionsByRole(roleName);
      setRolePermissions(res.response || []);
    } catch (error) {
      console.error("Role permissions error", error);
    }
  };

  // ===============================
  // GET EMPLOYEES
  // ===============================
  const loadEmployees = async () => {
    try {
      const res = await adminService.getAllEmployees();
      setEmployees(res.response || []);
    } catch (error) {
      console.error("Employees fetch error", error);
    }
  };

  // ===============================
  // GET EMPLOYEE PERMISSIONS
  // ===============================
  const loadEmployeePermissions = async (employeeId: string) => {
    try {
      setSelectedEmployee(employeeId);
      const res = await employeeService.getPermissionsByEmployee(employeeId);
      setEmployeePermissions(res.response || []);
    } catch (error) {
      console.error("Employee permissions error", error);
    }

  };

  // =============================== 
  // TOGGLE PERMISSION
  // ===============================
  const togglePermission = (permission: string) => {
    if (employeePermissions.includes(permission)) {
      setEmployeePermissions(employeePermissions.filter(p => p !== permission));
    } else {
      setEmployeePermissions([...employeePermissions, permission]);
    }
  };

  // ===============================
  // UPDATE PERMISSIONS
  // ===============================
  const updatePermissions = async () => {
   if (!selectedEmployee) return;
    try {
      setLoading(true);
      const res = await employeeService.updateEmployeePermissions(
        selectedEmployee,
        employeePermissions
      );
      Swal.fire({
        icon: res.flag ? "success" : "error",
        title: res.flag ? "Success" : "Error",
        text: res.message,
        confirmButtonColor: "#6366f1",
      });
    } catch (error: any) {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Permissions Management
      </h1>
      {/* ROLE PERMISSIONS */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">
          Role Permissions
        </h2>
        <div className="flex flex-wrap gap-2">
          {rolePermissions.map((perm) => (
            <span
              key={perm}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
            {formatPermission(perm)}
            </span>
          ))}
        </div>
      </div>
      {/* EMPLOYEE SELECT */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">
          Employee Permissions
        </h2>
        <select
          className="border p-2 rounded mb-4"
          value={selectedEmployee}
          onChange={(e) => loadEmployeePermissions(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((emp: any) => (
            <option
              key={emp.employeeId}
              value={emp.employeeId}
            >
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        {/* PERMISSIONS */}
        <div className="grid grid-cols-3 gap-2">
          {rolePermissions.map((perm) => (
            <label
              key={perm}
              className="flex items-center gap-2 border p-2 rounded"
            >
              <input
                type="checkbox"
                checked={employeePermissions.includes(perm)}
                onChange={() => togglePermission(perm)}
              />
             {formatPermission(perm)}
            </label>
          ))}
        </div>
        <button
          onClick={updatePermissions}
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Updating..." : "Update Permissions"}
        </button>
      </div>
    </div>
  );

}