'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { EmployeeModel, ClientDTO } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Client {
  id: string;
  name: string;
}

const AddEmployeePage = () => {
  const [formData, setFormData] = useState<EmployeeModel>({
    firstName: '',
    lastName: '',
    personalEmail: '',
    companyEmail: '',
    contactNumber: '',
    clientId: '',
    designation: '',
    dateOfBirth: '',
    dateOfJoining: '',
    currency: '',
    rateCard: 0,
    panNumber: '',
    aadharNumber: '',
    accountNumber: '',
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
    panCardUrl: '',
    aadharCardUrl: '',
    bankPassbookUrl: '',
    tenthCftUrl: '',
    interCftUrl: '',
    degreeCftUrl: '',
    postGraduationCftUrl: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [documentFiles, setDocumentFiles] = useState({
    panCard: null as File | null,
    aadharCard: null as File | null,
    bankPassbook: null as File | null,
    tenthCft: null as File | null,
    interCft: null as File | null,
    degreeCft: null as File | null,
    postGraduationCft: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientList = await adminService.getAllClients();
        setClients(clientList.map((client: ClientDTO) => ({
          id: client.clientId,
          name: client.companyName,
        })));
      } catch (err: any) {
        console.error('Failed to fetch clients:', err);
        setError('Failed to load clients. Please try again.');
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'rateCard' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleFileChange = async (field: keyof typeof documentFiles, file: File | null) => {
    setDocumentFiles((prev) => ({
      ...prev,
      [field]: file,
    }));

    if (file) {
      try {
        const url = await adminService.uploadFile(file); // Upload to backend
        const urlField = `${field}Url` as keyof EmployeeModel;
        setFormData((prev) => ({
          ...prev,
          [urlField]: url,
        }));
      } catch (err: any) {
        setError(`Failed to upload ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${err.message}`);
      }
    } else {
      // Clear the URL if no file is selected
      const urlField = `${field}Url` as keyof EmployeeModel;
      setFormData((prev) => ({
        ...prev,
        [urlField]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validate mandatory fields (excluding document URLs)
    const requiredFields: (keyof EmployeeModel)[] = [
      'firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber',
      'clientId', 'designation', 'dateOfBirth', 'dateOfJoining', 'currency',
      'rateCard', 'panNumber', 'aadharNumber', 'accountNumber', 'accountHolderName',
      'bankName', 'ifscCode', 'branchName', 'houseNo', 'streetName', 'city',
      'state', 'pinCode', 'country',
    ];

    const missingFields = requiredFields.filter((field) => !formData[field] || formData[field] === '');
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields: ${missingFields.map(field => field.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Validate aadharNumber (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(formData.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits');
      setIsSubmitting(false);
      return;
    }

    // Validate contactNumber (10 digits)
    const contactRegex = /^\d{10}$/;
    if (!contactRegex.test(formData.contactNumber)) {
      setError('Contact number must be exactly 10 digits');
      setIsSubmitting(false);
      return;
    }

    try {
      await adminService.addEmployee(formData);
      setSuccess('Employee added successfully!');
      setTimeout(() => {
        router.push('/admin-dashboard/employees/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h2>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
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
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
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
                    pattern="\d{10}"
                    title="Contact number must be 10 digits"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
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
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                    Designation *
                  </label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
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
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
                    value={formData.rateCard}
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
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    required
                    value={formData.panNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    onChange={handleChange}
                    pattern="\d{12}"
                    title="Aadhar number must be 12 digits"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Card
                  </label>
                  <input
                    type="file"
                    id="panCard"
                    name="panCard"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('panCard', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.panCardUrl && <p className="text-sm text-gray-500 mt-1">{formData.panCardUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Card
                  </label>
                  <input
                    type="file"
                    id="aadharCard"
                    name="aadharCard"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('aadharCard', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.aadharCardUrl && <p className="text-sm text-gray-500 mt-1">{formData.aadharCardUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Passbook
                  </label>
                  <input
                    type="file"
                    id="bankPassbook"
                    name="bankPassbook"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('bankPassbook', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.bankPassbookUrl && <p className="text-sm text-gray-500 mt-1">{formData.bankPassbookUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    10th Certificate
                  </label>
                  <input
                    type="file"
                    id="tenthCft"
                    name="tenthCft"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('tenthCft', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.tenthCftUrl && <p className="text-sm text-gray-500 mt-1">{formData.tenthCftUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intermediate Certificate
                  </label>
                  <input
                    type="file"
                    id="interCft"
                    name="interCft"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('interCft', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.interCftUrl && <p className="text-sm text-gray-500 mt-1">{formData.interCftUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree Certificate
                  </label>
                  <input
                    type="file"
                    id="degreeCft"
                    name="degreeCft"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('degreeCft', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.degreeCftUrl && <p className="text-sm text-gray-500 mt-1">{formData.degreeCftUrl}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Graduation Certificate
                  </label>
                  <input
                    type="file"
                    id="postGraduationCft"
                    name="postGraduationCft"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('postGraduationCft', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.postGraduationCftUrl && <p className="text-sm text-gray-500 mt-1">{formData.postGraduationCftUrl}</p>}
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm p-2 bg-green-50 rounded">{success}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddEmployeePage;