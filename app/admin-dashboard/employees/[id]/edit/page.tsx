'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeModel, EmployeeDTO, ClientDTO, Designation } from '@/lib/api/types';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Manager {
  id: string;
  name: string;
}

const EditEmployee = () => {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [formData, setFormData] = useState<EmployeeModel>({} as EmployeeModel);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({
    employeePhoto: null as File | null,
    panCard: null as File | null,
    aadharCard: null as File | null,
    bankPassbook: null as File | null,
    tenthCft: null as File | null,
    interCft: null as File | null,
    degreeCft: null as File | null,
    postGraduationCft: null as File | null,
  });

  const today = new Date().toISOString().split('T')[0];
  const maxJoiningDate = new Date();
  maxJoiningDate.setMonth(maxJoiningDate.getMonth() + 3);
  const maxJoiningDateStr = maxJoiningDate.toISOString().split('T')[0];

  const designations: Designation[] = [
    'INTERN',
    'TRAINEE',
    'ASSOCIATE_ENGINEER',
    'SOFTWARE_ENGINEER',
    'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER',
    'TEAM_LEAD',
    'TECHNICAL_ARCHITECT',
    'REPORTING_MANAGER',
    'DELIVERY_MANAGER',
    'DIRECTOR',
    'VP_ENGINEERING',
    'CTO',
    'HR',
    'FINANCE',
    'OPERATIONS'
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      try {
        const [employeeData, clientList, employeeList] = await Promise.all([
          adminService.getEmployeeById(params.id as string),
          adminService.getAllClients(),
          adminService.getAllEmployees()
        ]);
        setClients(clientList);
        setManagers(employeeList
          .filter((emp: EmployeeDTO) => emp.designation === 'REPORTING_MANAGER')
          .map((emp: EmployeeDTO) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
          })));

        // Map all fields from EmployeeDTO to EmployeeModel
        setFormData({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          personalEmail: employeeData.personalEmail,
          companyEmail: employeeData.companyEmail,
          contactNumber: employeeData.contactNumber,
          alternateContactNumber: employeeData.alternateContactNumber || '',
          gender: employeeData.gender || '',
          maritalStatus: employeeData.maritalStatus || '',
          numberOfChildren: employeeData.numberOfChildren || 0,
          employeePhotoUrl: employeeData.photoUrl || '',
          clientId: employeeData.clientId || '',
          reportingManagerId: employeeData.reportingManagerId || '',
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
          addressType: employeeData.addressType || '',
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
    let parsedValue: any = value;
    if (name === 'personalEmail' || name === 'companyEmail') {
      parsedValue = value.toLowerCase();
    } else if (name === 'rateCard') {
      parsedValue = parseFloat(value) || 0;
    } else if (name === 'numberOfChildren') {
      parsedValue = parseInt(value) || 0;
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
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
      'alternateContactNumber', 'designation', 'dateOfBirth', 'dateOfJoining', 
      'gender', 'currency', 'rateCard', 'panNumber', 'aadharNumber',
      'accountNumber', 'accountHolderName', 'bankName', 'ifscCode', 'branchName',
      'houseNo', 'streetName', 'city', 'state', 'pinCode', 'country',
    ];

    const missingFields = requiredFields.filter((field) => !formData[field] || formData[field] === '');
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields: ${missingFields.map(field => field.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}`);
      setSubmitting(false);
      return;
    }

    // Name validations (firstName, lastName)
    const nameRegex = /^[A-Za-z ]+$/;
    const names = ['firstName', 'lastName'];
    for (const name of names) {
      const value = formData[name as keyof EmployeeModel] as string;
      if (value.trim().length < 3 || value.length > 30 || !nameRegex.test(value.trim())) {
        setError(`${name.replace(/([A-Z])/g, ' $1').toLowerCase()} must be 3-30 characters with alphabets and spaces only`);
        setSubmitting(false);
        return;
      }
    }

    // Email validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.personalEmail) || !emailRegex.test(formData.companyEmail)) {
      setError('Personal and company emails must be valid email addresses');
      setSubmitting(false);
      return;
    }

    // PAN validation (read-only, but validate anyway)
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.panNumber)) {
      setError('PAN must be 10 alphanumeric characters (5 letters + 4 digits + 1 letter)');
      setSubmitting(false);
      return;
    }

    // Aadhar validation (read-only, but validate anyway)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(formData.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits');
      setSubmitting(false);
      return;
    }

    // Contact numbers validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber) || !phoneRegex.test(formData.alternateContactNumber)) {
      setError('Contact and alternative numbers must be 10 digits starting with 6-9');
      setSubmitting(false);
      return;
    }

    // Validate designation is one of the allowed values
    if (!designations.includes(formData.designation as Designation)) {
      setError('Please select a valid designation');
      setSubmitting(false);
      return;
    }

    const employeeData: EmployeeModel = {
      ...formData,
      designation: formData.designation as Designation,
      clientId: formData.clientId || undefined,
      reportingManagerId: formData.reportingManagerId || undefined,
      maritalStatus: formData.maritalStatus || undefined,
      numberOfChildren: formData.numberOfChildren,
    };

    try {
      await adminService.updateEmployee(params.id as string, employeeData);
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
                  maxLength={30}
                  pattern="[A-Za-z ]+"
                  title="Alphabets and spaces only, up to 30 characters"
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
                  maxLength={30}
                  pattern="[A-Za-z ]+"
                  title="Alphabets and spaces only, up to 30 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Email *
                </label>
                <input
                  type="email"
                  id="personalEmail"
                  name="personalEmail"
                  required
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number *
                </label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  required
                  value={formData.panNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Number *
                </label>
                <input
                  type="text"
                  id="aadharNumber"
                  name="aadharNumber"
                  required
                  value={formData.aadharNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Marital Status
                </label>
                <select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Marital Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label htmlFor="numberOfChildren" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Children
                </label>
                <input
                  type="number"
                  id="numberOfChildren"
                  name="numberOfChildren"
                  value={String(formData.numberOfChildren)}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Photo</label>
                <input
                  type="file"
                  id="employeePhoto"
                  accept="image/*"
                  onChange={(e) => handleFileChange('employeePhoto', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-sm text-gray-500 mt-1">{formData.employeePhotoUrl || 'No file uploaded'}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  required
                  value={formData.contactNumber}
                  onChange={handleChange}
                  pattern="[6-9]\d{9}"
                  title="10 digits starting with 6-9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="alternateContactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Contact Number *
                </label>
                <input
                  type="tel"
                  id="alternateContactNumber"
                  name="alternateContactNumber"
                  required
                  value={formData.alternateContactNumber}
                  onChange={handleChange}
                  pattern="[6-9]\d{9}"
                  title="10 digits starting with 6-9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  required
                  value={formData.companyEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                  Designation *
                </label>
                <select
                  id="designation"
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des} value={des}>
                      {des}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  value={formData.clientId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.clientId} value={client.clientId}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dateOfJoining" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Joining *
                </label>
                <input
                  type="date"
                  id="dateOfJoining"
                  name="dateOfJoining"
                  required
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  min={today}
                  max={maxJoiningDateStr}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="reportingManagerId" className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting Manager
                </label>
                <select
                  id="reportingManagerId"
                  name="reportingManagerId"
                  value={formData.reportingManagerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Reporting Manager (Optional)</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label htmlFor="rateCard" className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Card *
                </label>
                <input
                  type="number"
                  id="rateCard"
                  name="rateCard"
                  required
                  value={String(formData.rateCard)}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  required
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  id="accountHolderName"
                  name="accountHolderName"
                  required
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  required
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  required
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  id="branchName"
                  name="branchName"
                  required
                  value={formData.branchName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="addressType" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Type
                </label>
                <input
                  type="text"
                  id="addressType"
                  name="addressType"
                  value={formData.addressType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="houseNo" className="block text-sm font-medium text-gray-700 mb-2">
                  House No *
                </label>
                <input
                  type="text"
                  id="houseNo"
                  name="houseNo"
                  required
                  value={formData.houseNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Name *
                </label>
                <input
                  type="text"
                  id="streetName"
                  name="streetName"
                  required
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Pin Code *
                </label>
                <input
                  type="text"
                  id="pinCode"
                  name="pinCode"
                  required
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
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

          {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{success}</div>}
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