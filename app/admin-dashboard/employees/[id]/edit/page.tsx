// app/admin-dashboard/employees/[id]/edit/page.tsx (edit with backend update)
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeModel, EmployeeDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';

const EditEmployeeForm = () => {
  const [formData, setFormData] = useState<EmployeeModel>({} as EmployeeModel);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state } = useAuth();
  const router = useRouter();
  const params = useParams();
  const empId = params.id as string;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const employee: EmployeeDTO = await adminService.getEmployeeById(empId);
        // Map DTO to Model (adjust as needed for missing fields)
        setFormData({
          firstName: employee.firstName,
          lastName: employee.lastName,
          personalEmail: employee.personalEmail,
          companyEmail: employee.companyEmail,
          contactNumber: employee.contactNumber,
          clientId: employee.clientId,
          designation: employee.designation,
          dateOfBirth: employee.dateOfBirth,
          dateOfJoining: employee.dateOfJoining,
          currency: employee.currency,
          rateCard: employee.rateCard,
          panNumber: employee.panNumber,
          aadharNumber: employee.aadharNumber,
          accountNumber: '', // Fill from full Employee if backend provides
          accountHolderName: '',
          bankName: '',
          ifscCode: '',
          branchName: '',
          houseNo: '',
          streetName: '',
          city: '',
          state: '',
          pinCode: '',
          country: '',
          panCardUrl: employee.panCardUrl,
          aadharCardUrl: employee.aadharCardUrl,
          bankPassbookUrl: employee.bankPassbookUrl,
          tenthCftUrl: employee.tenthCftUrl,
          interCftUrl: employee.interCftUrl,
          degreeCftUrl: employee.degreeCftUrl,
          postGraduationCftUrl: employee.postGraduationCftUrl,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employee');
      }
    };
    if (empId) fetchEmployee();
  }, [empId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'rateCard' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await adminService.updateEmployee(empId, formData);
      setSuccess('Employee updated successfully!');
      setTimeout(() => {
        router.push('/admin-dashboard/employees/list'); // Redirect to list after success
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Employee</h2>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            {/* Repeat all other fields from AddEmployeeForm, pre-filled */}
            {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{success}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Employee'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditEmployeeForm;