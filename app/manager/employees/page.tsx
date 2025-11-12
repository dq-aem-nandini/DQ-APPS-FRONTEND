'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { adminService } from '@/lib/api/adminService';
import { leaveService } from '@/lib/api/leaveService';
import { EmployeeDTO, LeaveResponseDTO, LeaveStatus, LeaveCategoryType, FinancialType, WebResponseDTOPageLeaveResponseDTO } from '@/lib/api/types';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const ManagerEmployeesPage: React.FC = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter options (only non-managerial designations)
  const designations: string[] = [
    'All',
    'INTERN',
    'TRAINEE',
    'ASSOCIATE_ENGINEER',
    'SOFTWARE_ENGINEER',
    'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER',
    'TEAM_LEAD',
    'TECHNICAL_ARCHITECT',
  ];

  // Check authentication and fetch employees
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('⚠️ No access token found, redirecting to login');
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const managerId = localStorage.getItem('userId') || 'manager-id-placeholder';
        console.log('🧩 Manager ID:', managerId);

        const employeeResponse = await adminService.getAllManagerEmployees();
        console.log('🧩 Employees Response:', employeeResponse);
        if (employeeResponse.flag && employeeResponse.response) {
          const filteredEmployees = employeeResponse.response.filter(
            (employee: EmployeeDTO) =>
              (employee.reportingManagerId === managerId || managerId === 'manager-id-placeholder') &&
              designations.includes(employee.designation)
          );
          setEmployees(filteredEmployees);
        } else {
          throw new Error(employeeResponse.message || 'Failed to fetch employees');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch data';
        let errorStatus: number | undefined;
        if (err instanceof Error) {
          try {
            const parsedError = JSON.parse(err.message);
            errorMessage = parsedError.message;
            errorStatus = parsedError.status;
          } catch {
            errorMessage = err.message;
          }
        }
        setError({ message: errorMessage, status: errorStatus });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter employees by designation and search term
  const filteredEmployees = employees.filter(
    (employee: EmployeeDTO) =>
      (selectedDesignation === 'All' || employee.designation === selectedDesignation) &&
      (`${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format designation
  const formatType = (type?: string): string => {
    if (!type) return 'N/A';
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="relative flex items-center justify-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Employees List
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
        <div className="flex gap-6 flex-col sm:flex-row">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="block w-48 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-200 p-2"
            >
              {designations.map((designation) => (
                <option key={designation} value={designation}>
                  {formatType(designation)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search by Name</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter employee name"
              className="block w-full sm:w-64 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-200 p-2"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <span className="ml-4 text-lg font-medium text-gray-600">Loading employees...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-lg mb-8 shadow-md">
          <p className="font-semibold">
            {error.status === 500
              ? 'Server error occurred. Please try again later.'
              : error.message}
            {error.status && ` (Error code: ${error.status})`}
          </p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              const managerId = localStorage.getItem('userId') || 'manager-id-placeholder';
              adminService.getAllManagerEmployees()
                .then((employeeResponse) => {
                  if (employeeResponse.flag && employeeResponse.response) {
                    const filteredEmployees = employeeResponse.response.filter(
                      (employee: EmployeeDTO) =>
                        (employee.reportingManagerId === managerId || managerId === 'manager-id-placeholder') &&
                        designations.includes(employee.designation)
                    );
                    setEmployees(filteredEmployees);
                  }
                  setError(null);
                  setLoading(false);
                })
                .catch((err: unknown) => {
                  let errorMessage = 'Failed to fetch data';
                  let errorStatus: number | undefined;
                  if (err instanceof Error) {
                    try {
                      const parsedError = JSON.parse(err.message);
                      errorMessage = parsedError.message;
                      errorStatus = parsedError.status;
                    } catch {
                      errorMessage = err.message;
                    }
                  }
                  setError({ message: errorMessage, status: errorStatus });
                  setLoading(false);
                });
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition duration-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Employee Table */}
      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Available Leaves
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeId} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatType(employee.designation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.availableLeaves?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/manager/employeeLeave/${employee.employeeId}`)}
                      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                    >
                      View Leaves
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerEmployeesPage;