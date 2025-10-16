'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { ClientModel, AddressModel } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';

const AddClientPage = () => {
  const [formData, setFormData] = useState<ClientModel>({
    companyName: '',
    contactNumber: '',
    email: '',
    gst: '',
    currency: '',
    panNumber: '',
    addressModel: {
      houseNo: '',
      streetName: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      addressType: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if (name === 'email') {
      parsedValue = value.toLowerCase().trim();
    } else if (name === 'gst' || name === 'panNumber') {
      parsedValue = value.toUpperCase().trim();
    } else if (name === 'addressModel.pincode') {
      parsedValue = value.replace(/\D/g, ''); // Only digits
    }
    if (name.startsWith('addressModel.')) {
      const fieldName = name.split('.')[1] as keyof AddressModel;
      setFormData({
        ...formData,
        addressModel: {
          ...formData.addressModel,
          [fieldName]: parsedValue,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name as keyof ClientModel]: parsedValue,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validate mandatory fields
    const requiredFields = [
      'companyName', 'contactNumber', 'email', 'currency', 
      'addressModel.city', 'addressModel.state', 'addressModel.pincode', 'addressModel.country'
    ];

    const missingFields = requiredFields.filter((field) => {
      if (field.startsWith('addressModel.')) {
        const f = field.split('.')[1] as keyof AddressModel;
        return !formData.addressModel[f] || formData.addressModel[f] === '';
      }
      return !formData[field as keyof ClientModel] || formData[field as keyof ClientModel] === '';
    });
    if (missingFields.length > 0) {
      setError(`Please fill in all mandatory fields: ${missingFields.map(field => field.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Company Name validation
    const nameRegex = /^[A-Za-z ]+$/;
    if (formData.companyName.trim().length < 3 || formData.companyName.length > 50 || !nameRegex.test(formData.companyName.trim())) {
      setError('Company name must be 3-50 characters with alphabets and spaces only');
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email must be a valid email address');
      setIsSubmitting(false);
      return;
    }

    // Contact Number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      setError('Contact number must be 10 digits starting with 6-9');
      setIsSubmitting(false);
      return;
    }

    // Currency validation
    const validCurrencies = ['USD', 'INR', 'EUR'];
    if (!validCurrencies.includes(formData.currency)) {
      setError('Please select a valid currency');
      setIsSubmitting(false);
      return;
    }

    // PAN validation (if provided)
    if (formData.panNumber) {
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.panNumber)) {
        setError('PAN must be 10 alphanumeric characters (5 letters + 4 digits + 1 letter)');
        setIsSubmitting(false);
        return;
      }
    }

    // GST validation (if provided)
    if (formData.gst) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(formData.gst)) {
        setError('GST must be in valid format (15 characters)');
        setIsSubmitting(false);
        return;
      }
    }

    // Address validations
    const addressAlphanumRegex = /^[A-Za-z0-9 ,.-]+$/; // Alphanum, spaces, common punctuation
    if (formData.addressModel.houseNo && !addressAlphanumRegex.test(formData.addressModel.houseNo)) {
      setError('House No can only contain alphanumeric characters, spaces, commas, periods, and hyphens');
      setIsSubmitting(false);
      return;
    }

    if (formData.addressModel.streetName && !addressAlphanumRegex.test(formData.addressModel.streetName)) {
      setError('Street Name can only contain alphanumeric characters, spaces, commas, periods, and hyphens');
      setIsSubmitting(false);
      return;
    }

    const cityStateRegex = /^[A-Za-z ]+$/;
    if (!cityStateRegex.test(formData.addressModel.city.trim()) || formData.addressModel.city.length < 2) {
      setError('City must be 2+ characters with alphabets and spaces only');
      setIsSubmitting(false);
      return;
    }

    if (!cityStateRegex.test(formData.addressModel.state.trim()) || formData.addressModel.state.length < 2) {
      setError('State must be 2+ characters with alphabets and spaces only');
      setIsSubmitting(false);
      return;
    }

    if (!cityStateRegex.test(formData.addressModel.country.trim()) || formData.addressModel.country.length < 2) {
      setError('Country must be 2+ characters with alphabets and spaces only');
      setIsSubmitting(false);
      return;
    }

    // Pin Code validation
    const pinCodeRegex = /^\d{6}$/;
    if (!pinCodeRegex.test(formData.addressModel.pincode)) {
      setError('Pin code must be exactly 6 digits');
      setIsSubmitting(false);
      return;
    }

    // Address Type validation (if provided)
    if (formData.addressModel.addressType) {
      const validTypes = ['BILLING', 'SHIPPING', 'OTHER'];
      if (!validTypes.includes(formData.addressModel.addressType)) {
        setError('Invalid address type');
        setIsSubmitting(false);
        return;
      }
    }

    // Check uniqueness for email and companyName
    try {
      const clientList = await adminService.getAllClients();
      const existingEmail = clientList.some((client: any) => client.email === formData.email);
      const existingCompany = clientList.some((client: any) => client.companyName.toLowerCase() === formData.companyName.toLowerCase());

      if (existingEmail) {
        setError('Email already exists');
        setIsSubmitting(false);
        return;
      }

      if (existingCompany) {
        setError('Company name already exists');
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      setError('Failed to verify uniqueness. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      await adminService.addClient(formData);
      setSuccess('Client added successfully! Redirecting to list...');
      setTimeout(() => {
        router.push('/admin-dashboard/clients/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Client</h2>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Company Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    maxLength={50}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, 3-50 characters"
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
                    pattern="[6-9]\d{9}"
                    title="10 digits starting with 6-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-2">
                    GST
                  </label>
                  <input
                    type="text"
                    id="gst"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    maxLength={15}
                    pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                    title="Valid GST format (15 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    pattern="[A-Z]{5}\d{4}[A-Z]{1}"
                    title="5 uppercase letters + 4 digits + 1 uppercase letter"
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
                  <label htmlFor="addressModel.houseNo" className="block text-sm font-medium text-gray-700 mb-2">
                    House No
                  </label>
                  <input
                    type="text"
                    id="addressModel.houseNo"
                    name="addressModel.houseNo"
                    value={formData.addressModel.houseNo}
                    onChange={handleChange}
                    pattern="[A-Za-z0-9 ,.-]+"
                    title="Alphanumeric, spaces, commas, periods, hyphens only"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.streetName" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Name
                  </label>
                  <input
                    type="text"
                    id="addressModel.streetName"
                    name="addressModel.streetName"
                    value={formData.addressModel.streetName}
                    onChange={handleChange}
                    pattern="[A-Za-z0-9 ,.-]+"
                    title="Alphanumeric, spaces, commas, periods, hyphens only"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="addressModel.city"
                    name="addressModel.city"
                    required
                    value={formData.addressModel.city}
                    onChange={handleChange}
                    minLength={2}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, 2+ characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    id="addressModel.state"
                    name="addressModel.state"
                    required
                    value={formData.addressModel.state}
                    onChange={handleChange}
                    minLength={2}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, 2+ characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.pincode" className="block text-sm font-medium text-gray-700 mb-2">
                    Pin Code *
                  </label>
                  <input
                    type="text"
                    id="addressModel.pincode"
                    name="addressModel.pincode"
                    required
                    value={formData.addressModel.pincode}
                    onChange={handleChange}
                    pattern="\d{6}"
                    title="Exactly 6 digits"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="addressModel.country"
                    name="addressModel.country"
                    required
                    value={formData.addressModel.country}
                    onChange={handleChange}
                    minLength={2}
                    pattern="[A-Za-z ]+"
                    title="Alphabets and spaces only, 2+ characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="addressModel.addressType" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <select
                    id="addressModel.addressType"
                    name="addressModel.addressType"
                    value={formData.addressModel.addressType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Address Type</option>
                    <option value="BILLING">Billing</option>
                    <option value="SHIPPING">Shipping</option>
                    <option value="OTHER">Other</option>
                  </select>
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
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddClientPage;