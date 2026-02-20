"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/lib/api/adminService";
import { EmployeeDTO } from "@/lib/api/types";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Swal from "sweetalert2";
import BackButton from "@/components/ui/BackButton";
import { employeesDownloadUploadService } from "@/lib/api/employeesDownloadUpload";
import Spinner from "@/components/ui/Spinner";

const EmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EmployeeDTO;
    direction: "asc" | "desc";
  } | null>(null);
  const [filterDesignation, setFilterDesignation] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const { state } = useAuth();
  const router = useRouter();

  const fetchEmployees = async () => {
    try {
      const response = await adminService.getAllEmployees();
      if (response.flag && Array.isArray(response.response)) {
        // Filter to show only ACTIVE employees
        const activeEmployees = response.response.filter(
          (emp: EmployeeDTO) => emp.status === "ACTIVE"
        );
        setEmployees(activeEmployees);

        // Extract unique designations
        const uniqueDesignations = [
          ...new Set(
            activeEmployees.map((emp: EmployeeDTO) => emp.designation)
          ),
        ].sort();
        setDesignations(uniqueDesignations);
      } else {
        throw new Error(response.message || "Failed to fetch employees");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to fetch employees",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          `${emp.firstName} ${emp.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          emp.companyEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Designation filter
    if (filterDesignation) {
      filtered = filtered.filter(
        (emp) => emp.designation === filterDesignation
      );
    }

    // Sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterDesignation, sortConfig]);

  const handleDelete = async (empId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This will set the employee status to inactive.",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setDeletingId(empId);
    try {
      const response = await adminService.deleteEmployeeById(empId);
      if (response.flag) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Employee deleted successfully!",
          confirmButtonColor: "#3085d6",
        });
        // Filter out the deleted employee from local state
        setEmployees(employees.filter((emp) => emp.employeeId !== empId));
      } else {
        throw new Error(response.message || "Failed to delete employee");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete employee",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getFieldValue = (value: string | undefined) => value || "N/A";

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const requestSort = (key: keyof EmployeeDTO) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EmployeeDTO) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleDownloadEmployees = async () => {
    try {
      const blob = await employeesDownloadUploadService.downloadEmployees();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Downloaded",
        text: "Employees data downloaded successfully",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to download employees",
      });
    }
  };

  const createEmployees = async (file: File) => {
    try {
      const response = await employeesDownloadUploadService.bulkCreateEmployees(
        file
      );

      const { flag, message, response: result } = response;

      //  Full success
      if (flag === true) {
        await Swal.fire({
          icon: "success",
          title: "Employees Created",
          text: `Successfully created ${result.successCount} employees.`,
        });

        await fetchEmployees(); //  Refresh list

        return;
      }

      // Build error list HTML (safe + readable)
      const errorListHtml = Array.isArray(result.errors)
        ? result.errors
            .map(
              (err: any) => `
                <div class="border-b py-1">
                  <b>Row ${err.rowNumber}</b> 
                  <span style="color:#6b7280">(${err.column})</span><br/>
                  <span style="color:#dc2626">${err.message}</span>
                </div>
              `
            )
            .join("")
        : "<div>No detailed error information available.</div>";

      // ⚠️ Partial / Failed upload with scrollable errors
      Swal.fire({
        icon: "warning",
        title: "Bulk Upload Completed with Errors",
        width: 700,
        html: `
          <p>${message}</p>
  
          <div style="margin-top:12px">
            <b>Summary</b><br/>
            ✅ Success: ${result.successCount}<br/>
            ❌ Failed: ${result.failureCount}
          </div>
  
          <hr style="margin:12px 0"/>
  
          <div style="
            max-height: 250px;
            overflow-y: auto;
            text-align: left;
            padding-right: 6px;
          ">
            ${errorListHtml}
          </div>
        `,
        confirmButtonText: "OK",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.message || "Failed to bulk create employees",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
          <div className="absolute left-0">
            <BackButton to="/admin-dashboard/employees" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent px-16 sm:px-24 md:px-32">
            Employee List
          </h1>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mb-4 sm:mb-6">
          {/* Download */}
          <button
            onClick={handleDownloadEmployees}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium transition"
          >
            Download Employees
          </button>

          {/* Upload */}
          <label className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-yellow-700 text-sm font-medium transition cursor-pointer">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  createEmployees(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
          </label>

          {/* Add */}
          <Link
            href="/admin-dashboard/employees/add"
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition"
          >
            Add New Employee
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label
                htmlFor="search"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                Search by Name or Email
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Search..."
              />
            </div>
            <div>
              <label
                htmlFor="filterDesignation"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                Filter by Designation
              </label>
              <select
                id="filterDesignation"
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Designations</option>
                {designations.map((des) => (
                  <option key={des} value={des}>
                    {des}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-center text-gray-500">
            No employees found matching the criteria.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("firstName")}
                  >
                    Name {getSortIcon("firstName")}
                  </th>
                  <th
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                    onClick={() => requestSort("companyEmail")}
                  >
                    Email {getSortIcon("companyEmail")}
                  </th>
                  <th
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden md:table-cell"
                    onClick={() => requestSort("clientName")}
                  >
                    Client {getSortIcon("clientName")}
                  </th>
                  <th
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("designation")}
                  >
                    Designation {getSortIcon("designation")}
                  </th>
                  <th
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                    onClick={() => requestSort("status")}
                  >
                    Status {getSortIcon("status")}
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.employeeId}
                    className={`transition-colors duration-200 ${
                      employee.updatedThroughForm === true
                        ? "hover:bg-gray-50"
                        : employee.createdFromExcel === true
                        ? "bg-red-50 border-l-4 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{`${employee.firstName} ${employee.lastName}`}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {getFieldValue(employee.companyEmail)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {getFieldValue(employee.clientName)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 line-clamp-1">
                      {getFieldValue(employee.designation)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          employee.status
                        )}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium space-x-1 sm:space-x-3 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-0">
                      {/* View Button */}
                      <Link
                        href={`/admin-dashboard/employees/${employee.employeeId}`}
                        className="text-indigo-600 hover:text-indigo-900 transition text-xs sm:text-sm block sm:inline"
                      >
                        View
                      </Link>

                      {/* Edit Button */}
                      <Link
                        href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 transition text-xs sm:text-sm block sm:inline"
                      >
                        Edit
                      </Link>

                      {/* Delete Button with Spinner */}
                      <button
                        onClick={() => handleDelete(employee.employeeId)}
                        disabled={deletingId === employee.employeeId}
                        className="relative inline-flex items-center text-red-600 hover:text-red-900 disabled:opacity-50 transition text-xs sm:text-sm"
                      >
                        {deletingId === employee.employeeId ? (
                          <>
                            <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-1 sm:mr-2"></span>
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default EmployeeList;

