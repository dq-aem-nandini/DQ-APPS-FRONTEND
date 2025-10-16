'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

const EmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof EmployeeDTO; direction: 'asc' | 'desc' } | null>(null);
  const [filterDesignation, setFilterDesignation] = useState('');
  const [designations, setDesignations] = useState<string[]>([]);
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await adminService.getAllEmployees();
        // Filter to show only ACTIVE employees
        const activeEmployees = data.filter((emp) => emp.status === 'ACTIVE');
        setEmployees(activeEmployees);

        // Extract unique designations
        const uniqueDesignations = [...new Set(activeEmployees.map((emp) => emp.designation).filter(Boolean))].sort();
        setDesignations(uniqueDesignations);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.companyEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Designation filter
    if (filterDesignation) {
      filtered = filtered.filter((emp) => emp.designation === filterDesignation);
    }

    // Sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterDesignation, sortConfig]);

  const handleDelete = async (empId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This will set the status to inactive.')) return;
    setDeletingId(empId);
    try {
      await adminService.deleteEmployee(empId);
      // Filter out the deleted (now inactive) employee from local state
      setEmployees(employees.filter((emp) => emp.employeeId !== empId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  const getFieldValue = (value: string | undefined) => value || 'N/A';

  const requestSort = (key: keyof EmployeeDTO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EmployeeDTO) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading employees...</div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center text-red-600">{error}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee List (Active Only)</h2>
          <Link
            href="/admin-dashboard/employees/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add New Employee
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search by Name or Email</label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search..."
              />
            </div>
            <div>
              <label htmlFor="filterDesignation" className="block text-sm font-medium text-gray-700 mb-1">Filter by Designation</label>
              <select
                id="filterDesignation"
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Designations</option>
                {designations.map((des) => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No employees found matching the criteria.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('firstName')}
                  >
                    Name {getSortIcon('firstName')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('companyEmail')}
                  >
                    Email {getSortIcon('companyEmail')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('clientName')}
                  >
                    Client {getSortIcon('clientName')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('designation')}
                  >
                    Designation {getSortIcon('designation')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{`${employee.firstName} ${employee.lastName}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFieldValue(employee.companyEmail)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFieldValue(employee.clientName)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFieldValue(employee.designation)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link href={`/admin-dashboard/employees/${employee.employeeId}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                      <Link href={`/admin-dashboard/employees/${employee.employeeId}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                      <button 
                        onClick={() => handleDelete(employee.employeeId)}
                        disabled={deletingId === employee.employeeId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === employee.employeeId ? 'Deleting...' : 'Delete'}
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