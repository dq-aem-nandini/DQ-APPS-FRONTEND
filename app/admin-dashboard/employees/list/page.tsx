'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';

const EmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
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
        const response = await adminService.getAllEmployees();
        if (response.flag && Array.isArray(response.response)) {
          // Filter to show only ACTIVE employees
          const activeEmployees = response.response.filter((emp: EmployeeDTO) => emp.status === 'ACTIVE');
          setEmployees(activeEmployees);

          // Extract unique designations
          const uniqueDesignations = [...new Set(
            activeEmployees.map((emp: EmployeeDTO) => emp.designation)
          )].sort();
          setDesignations(uniqueDesignations);
        } else {
          throw new Error(response.message || 'Failed to fetch employees');
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to fetch employees',
        });
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
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This will set the employee status to inactive.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    setDeletingId(empId);
    try {
      const response = await adminService.deleteEmployeeById(empId);
      if (response.flag) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Employee deleted successfully!',
          confirmButtonColor: '#3085d6',
        });
        // Filter out the deleted employee from local state
        setEmployees(employees.filter((emp) => emp.employeeId !== empId));
      } else {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to delete employee',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getFieldValue = (value: string | undefined) => value || 'N/A';

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          {/* Tailwind spinner */}
          <div className="w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-700 text-lg font-medium">Loading employees...</p>
        </div>
      </ProtectedRoute>
    );
  }


  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <div className="mb-10 flex items-center justify-between">
          <BackButton to="/admin-dashboard/employees" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Employee List
          </h1>
          <div className="w-20" />
        </div>

        <div className="flex justify-end items-center mb-6">

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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link href={`/admin-dashboard/employees/${employee.employeeId}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                      <Link href={`/admin-dashboard/employees/${employee.employeeId}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                      <button 
                        onClick={() => handleDelete(employee.employeeId)}
                        disabled={deletingId === employee.employeeId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === employee.employeeId ? 'Deleting...' : 'Delete'}
                      </button>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 flex items-center">
                      {/* View Button */}
                      <Link
                        href={`/admin-dashboard/employees/${employee.employeeId}`}
                        className="text-indigo-600 hover:text-indigo-900 transition"
                      >
                        View
                      </Link>

                      {/* Edit Button */}
                      <Link
                        href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 transition"
                      >
                        Edit
                      </Link>

                      {/* Delete Button with Spinner */}
                      <button
                        onClick={() => handleDelete(employee.employeeId)}
                        disabled={deletingId === employee.employeeId}
                        className="relative inline-flex items-center text-red-600 hover:text-red-900 disabled:opacity-50 transition"
                      >
                        {deletingId === employee.employeeId ? (
                          <>
                            <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2"></span>
                            Deleting...
                          </>
                        ) : (
                          'Delete'
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