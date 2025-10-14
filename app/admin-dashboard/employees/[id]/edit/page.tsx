// app/admin-dashboard/employees/[id]/edit/page.tsx (updated edit to populate all fields from backend)
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeModel, EmployeeDTO, ClientDTO } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

const EditEmployee = () => {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [formData, setFormData] = useState<EmployeeModel>({} as EmployeeModel);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({
    panCard: null as File | null,
    aadharCard: null as File | null,
    bankPassbook: null as File | null,
    tenthCft: null as File | null,
    interCft: null as File | null,
    degreeCft: null as File | null,
    postGraduationCft: null as File | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      try {
        const [employeeData, clientList] = await Promise.all([
          adminService.getEmployeeById(params.id as string),
          adminService.getAllClients()
        ]);
        setClients(clientList);

        // Map all fields from EmployeeDTO to EmployeeModel
        setFormData({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          personalEmail: employeeData.personalEmail,
          companyEmail: employeeData.companyEmail,
          contactNumber: employeeData.contactNumber,
          clientId: employeeData.clientId,
          designation: employeeData.designation,
          dateOfBirth: employeeData.dateOfBirth,
          dateOfJoining: employeeData.dateOfJoining,
          currency: employeeData.currency,
          rateCard: employeeData.rateCard,
          panNumber: employeeData.panNumber,
          aadharNumber: employeeData.aadharNumber,
          accountNumber: employeeData.accountNumber || '',
          accountHolderName: employeeData.accountHolderName || '',
          bankName: employeeData.bankName || '',
          ifscCode: employeeData.ifscCode || '',
          branchName: employeeData.branchName || '',
          houseNo: employeeData.houseNo || '',
          streetName: employeeData.streetName || '',
          city: employeeData.city || '',
          state: employeeData.state || '',
          pinCode: employeeData.pinCode || '',
          country: employeeData.country || '',
          panCardUrl: employeeData.panCardUrl || '',
          aadharCardUrl: employeeData.aadharCardUrl || '',
          bankPassbookUrl: employeeData.bankPassbookUrl || '',
          tenthCftUrl: employeeData.tenthCftUrl || '',
          interCftUrl: employeeData.interCftUrl || '',
          degreeCftUrl: employeeData.degreeCftUrl || '',
          postGraduationCftUrl: employeeData.postGraduationCftUrl || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'rateCard' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleFileChange = async (field: string, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field as keyof typeof documentFiles]: file }));
    if (file) {
      try {
        const url = await adminService.uploadFile(file);
        setFormData(prev => ({ ...prev, [`${field}Url` as keyof EmployeeModel]: url }));
      } catch (err: any) {
        setError(`Failed to upload ${field}: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate mandatory fields
    const requiredFields: (keyof EmployeeModel)[] = [
      'firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber',
      'clientId', 'designation', 'dateOfBirth', 'dateOfJoining', 'currency',
      'rateCard', 'panNumber', 'aadharNumber', 'accountNumber', 'accountHolderName',
      'bankName', 'ifscCode', 'branchName', 'houseNo', 'streetName', 'city',
      'state', 'pinCode', 'country',
    ];

    const missingFields = requiredFields.filter((field) => !formData[field] || formData[field] === '');
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields: ${missingFields.join(', ')}`);
      setSubmitting(false);
      return;
    }

    // Validate aadharNumber (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(formData.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits');
      setSubmitting(false);
      return;
    }

    // Validate contactNumber (10 digits)
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(formData.contactNumber)) {
      setError('Contact number must be exactly 10 digits');
      setSubmitting(false);
      return;
    }

    try {
      await adminService.updateEmployee(params.id as string, formData);
      setSuccess('Employee updated successfully!');
      setTimeout(() => {
        router.push('/admin-dashboard/employees/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-8 text-center">Loading...</div>
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
          <h2 className="text-2xl font-bold text-gray-900">Edit Employee</h2>
          <Link
            href="/admin-dashboard/employees/list"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to List
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-6xl">
          {/* Personal Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input type="text" id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input type="text" id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-2">Personal Email *</label>
                <input type="email" id="personalEmail" name="personalEmail" required value={formData.personalEmail} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-2">Company Email *</label>
                <input type="email" id="companyEmail" name="companyEmail" required value={formData.companyEmail} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                <input type="tel" id="contactNumber" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} pattern="\d{10}" title="10 digits" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select id="clientId" name="clientId" required value={formData.clientId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.clientId} value={client.clientId}>{client.companyName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
                <input type="text" id="designation" name="designation" required value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input type="date" id="dateOfBirth" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleChange} max="2025-10-14" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700 mb-2">Date of Joining *</label>
                <input type="date" id="dateOfJoining" name="dateOfJoining" required value={formData.dateOfJoining} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                <select id="currency" name="currency" required value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label htmlFor="rateCard" className="block text-sm font-medium text-gray-700 mb-2">Rate Card *</label>
                <input type="number" id="rateCard" name="rateCard" required value={formData.rateCard} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                <input type="text" id="panNumber" name="panNumber" required value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number *</label>
                <input type="text" id="aadharNumber" name="aadharNumber" required value={formData.aadharNumber} onChange={handleChange} pattern="\d{12}" title="12 digits" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                <input type="text" id="accountNumber" name="accountNumber" required value={formData.accountNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name *</label>
                <input type="text" id="accountHolderName" name="accountHolderName" required value={formData.accountHolderName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <input type="text" id="bankName" name="bankName" required value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
                <input type="text" id="ifscCode" name="ifscCode" required value={formData.ifscCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-2">Branch Name *</label>
                <input type="text" id="branchName" name="branchName" required value={formData.branchName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="houseNo" className="block text-sm font-medium text-gray-700 mb-2">House No *</label>
                <input type="text" id="houseNo" name="houseNo" required value={formData.houseNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-2">Street Name *</label>
                <input type="text" id="streetName" name="streetName" required value={formData.streetName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input type="text" id="city" name="city" required value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input type="text" id="state" name="state" required value={formData.state} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-2">Pin Code *</label>
                <input type="text" id="pinCode" name="pinCode" required value={formData.pinCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <input type="text" id="country" name="country" required value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Card</label>
                <input type="file" id="panCard" accept="image/*,application/pdf" onChange={(e) => handleFileChange('panCard', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.panCardUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Card</label>
                <input type="file" id="aadharCard" accept="image/*,application/pdf" onChange={(e) => handleFileChange('aadharCard', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.aadharCardUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Passbook</label>
                <input type="file" id="bankPassbook" accept="image/*,application/pdf" onChange={(e) => handleFileChange('bankPassbook', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.bankPassbookUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">10th Certificate</label>
                <input type="file" id="tenthCft" accept="image/*,application/pdf" onChange={(e) => handleFileChange('tenthCft', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.tenthCftUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intermediate Certificate</label>
                <input type="file" id="interCft" accept="image/*,application/pdf" onChange={(e) => handleFileChange('interCft', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.interCftUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Certificate</label>
                <input type="file" id="degreeCft" accept="image/*,application/pdf" onChange={(e) => handleFileChange('degreeCft', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.degreeCftUrl || 'No file uploaded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Graduation Certificate</label>
                <input type="file" id="postGraduationCft" accept="image/*,application/pdf" onChange={(e) => handleFileChange('postGraduationCft', e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <p className="text-sm text-gray-500 mt-1">{formData.postGraduationCftUrl || 'No file uploaded'}</p>
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 p-2 bg-red-50 rounded">{error}</div>}
          {success && <div className="text-green-600 p-2 bg-green-50 rounded">{success}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Employee'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default EditEmployee;