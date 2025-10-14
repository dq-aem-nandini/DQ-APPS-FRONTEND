// app/admin-dashboard/employees/[id]/page.tsx (view page - handles optional fields with N/A fallback; logs for debugging)
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

const ViewEmployee = () => {
  const params = useParams();
  const { state } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!params.id) return;
      try {
        const data = await adminService.getEmployeeById(params.id as string);
        console.log('Backend Employee Response:', data); // Debug: Check console for missing fields
        setEmployee(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employee');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading employee details...</div>
      </ProtectedRoute>
    );
  }

  if (error || !employee) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center text-red-600">{error || 'Employee not found'}</div>
      </ProtectedRoute>
    );
  }

  const getFieldValue = (value: string | undefined) => value || 'N/A';

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
          <div className="space-x-2">
            <Link
              href={`/admin-dashboard/employees/${employee.employeeId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
            <Link
              href="/admin-dashboard/employees/list"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to List
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Name:</strong> {employee.firstName} {employee.lastName}</p>
                <p><strong>Personal Email:</strong> {getFieldValue(employee.personalEmail)}</p>
                <p><strong>Company Email:</strong> {getFieldValue(employee.companyEmail)}</p>
                <p><strong>Contact Number:</strong> {getFieldValue(employee.contactNumber)}</p>
                <p><strong>Date of Birth:</strong> {getFieldValue(employee.dateOfBirth)}</p>
                <p><strong>Date of Joining:</strong> {getFieldValue(employee.dateOfJoining)}</p>
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Designation:</strong> {getFieldValue(employee.designation)}</p>
                <p><strong>Currency:</strong> {getFieldValue(employee.currency)}</p>
                <p><strong>Rate Card:</strong> {employee.rateCard || 'N/A'}</p>
                <p><strong>Available Leaves:</strong> {employee.availableLeaves || 'N/A'}</p>
                <p><strong>PAN Number:</strong> {getFieldValue(employee.panNumber)}</p>
                <p><strong>Aadhar Number:</strong> {getFieldValue(employee.aadharNumber)}</p>
                <p><strong>Client:</strong> {getFieldValue(employee.clientName)}</p>
                <p><strong>Status:</strong> 
                  <span className={`inline-flex px-2 py-1 ml-2 text-xs font-semibold rounded-full ${
                    employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Account Number:</strong> {getFieldValue(employee.accountNumber)}</p>
                <p><strong>Account Holder Name:</strong> {getFieldValue(employee.accountHolderName)}</p>
                <p><strong>Bank Name:</strong> {getFieldValue(employee.bankName)}</p>
                <p><strong>IFSC Code:</strong> {getFieldValue(employee.ifscCode)}</p>
                <p><strong>Branch Name:</strong> {getFieldValue(employee.branchName)}</p>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>House No:</strong> {getFieldValue(employee.houseNo)}</p>
                <p><strong>Street Name:</strong> {getFieldValue(employee.streetName)}</p>
                <p><strong>City:</strong> {getFieldValue(employee.city)}</p>
                <p><strong>State:</strong> {getFieldValue(employee.state)}</p>
                <p><strong>Pin Code:</strong> {getFieldValue(employee.pinCode)}</p>
                <p><strong>Country:</strong> {getFieldValue(employee.country)}</p>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employee.panCardUrl && (
                  <div>
                    <p><strong>PAN Card:</strong> <a href={employee.panCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.aadharCardUrl && (
                  <div>
                    <p><strong>Aadhar Card:</strong> <a href={employee.aadharCardUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.bankPassbookUrl && (
                  <div>
                    <p><strong>Bank Passbook:</strong> <a href={employee.bankPassbookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.tenthCftUrl && (
                  <div>
                    <p><strong>10th Certificate:</strong> <a href={employee.tenthCftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.interCftUrl && (
                  <div>
                    <p><strong>Intermediate Certificate:</strong> <a href={employee.interCftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.degreeCftUrl && (
                  <div>
                    <p><strong>Degree Certificate:</strong> <a href={employee.degreeCftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
                {employee.postGraduationCftUrl && (
                  <div>
                    <p><strong>Post Graduation Certificate:</strong> <a href={employee.postGraduationCftUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ViewEmployee;