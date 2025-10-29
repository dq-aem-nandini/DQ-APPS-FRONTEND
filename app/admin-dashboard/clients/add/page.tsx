'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { ClientModel, AddressModel, ClientPocModel, ClientTaxDetail, ClientDTO, AddressType } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { v4 as uuidv4 } from 'uuid';
import BackButton from '@/components/ui/BackButton';
import Spinner from '@/components/ui/Spinner';
import useLoading from '@/hooks/useLoading';

const AddClientPage = () => {
  const [formData, setFormData] = useState<ClientModel>({
    companyName: '',
    contactNumber: '',
    email: '',
    gst: '',
    currency: '',
    panNumber: '',
    tanNumber: '',
    addresses: [
      {
        addressId: uuidv4(),
        houseNo: '',
        streetName: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        addressType: 'CURRENT' as AddressType,   // default – you can change to 'CURRENT' etc.
      },
    ],
    clientPocs: [
      {
        name: '',
        email: '',
        contactNumber: '',
        designation: '',
      },
    ],
    clientTaxDetails: [
      {
        taxId: uuidv4(),
        taxName: '',
        taxPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state } = useAuth();
  const router = useRouter();
  const { loading, withLoading } = useLoading();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    index?: number,
    section?: 'addresses' | 'clientPocs' | 'clientTaxDetails'
  ) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === 'email' || name.includes('.email')) {
      parsedValue = value.toLowerCase().trim();
    } else if (name === 'gst' || name === 'panNumber' || name === 'tanNumber') {
      parsedValue = value.toUpperCase().trim();
    } else if (name.includes('.pincode') || name.includes('.contactNumber')) {
      parsedValue = value.replace(/\D/g, '');
    }

    if (section && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        [section]: prev[section]!.map((item, i) =>
          i === index ? { ...item, [name.split('.').pop()!]: parsedValue } : item
        ),
      }));
    } else if (name.startsWith('addressModel.')) {
      const field = name.split('.')[1] as keyof AddressModel;
      setFormData((prev) => ({
        ...prev,
        addresses: prev.addresses!.map((addr, i) =>
          i === 0 ? { ...addr, [field]: parsedValue } : addr
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name as keyof ClientModel]: parsedValue,
      }));
    }
  };
  const emptyAddress = (): AddressModel => ({
    addressId: uuidv4(),
    houseNo: '',
    streetName: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    addressType: 'OFFICE' as AddressType, // or 'CURRENT' | 'PERMANENT'
  });
  const addItem = (
    section: 'addresses' | 'clientPocs' | 'clientTaxDetails'
  ) => {
    if (section === 'addresses') {
      setFormData(prev => ({
        ...prev,
        addresses: [...(prev.addresses ?? []), emptyAddress()],
      }));
    } else if (section === 'clientPocs') {
      setFormData(prev => ({
        ...prev,
        clientPocs: [
          ...(prev.clientPocs ?? []),
          { name: '', email: '', contactNumber: '', designation: '' },
        ],
      }));
    } else if (section === 'clientTaxDetails') {
      setFormData(prev => ({
        ...prev,
        clientTaxDetails: [
          ...(prev.clientTaxDetails ?? []),
          {
            taxId: uuidv4(),
            taxName: '',
            taxPercentage: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));
    }
  };

  const removeItem = (section: 'addresses' | 'clientPocs' | 'clientTaxDetails', index: number) => {
    if (section === 'addresses' && formData.addresses!.length === 1) {
      setError('At least one address is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section]!.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    await withLoading(async () => {
      // ────────────────────── Required Fields ──────────────────────
      const required = ['companyName', 'contactNumber', 'email', 'currency'] as const;
      const missing = required.filter(f => !formData[f]);
      if (missing.length) throw new Error(`Please fill: ${missing.join(', ')}`);
  
      // ────────────────────── Primary Address ──────────────────────
      const primary = formData.addresses?.[0];
      if (!primary?.city || !primary.state || !primary.country || !primary.pincode) {
        throw new Error('Primary address: city, state, country, and pincode required');
      }
  
      // ────────────────────── Regex ──────────────────────
      const nameRegex = /^[A-Za-z ]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9]\d{9}$/;
      const pinRegex = /^\d{6}$/;
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      const tanRegex = /^[A-Z]{4}\d{5}[A-Z]{1}$/;
  
      if (!nameRegex.test(formData.companyName) || formData.companyName.length < 3 || formData.companyName.length > 30) {
        throw new Error('Company name must be 3–30 letters only');
      }
      if (!emailRegex.test(formData.email)) throw new Error('Invalid email');
      if (!phoneRegex.test(formData.contactNumber)) throw new Error('Contact: 10 digits (6-9 start)');
      if (!['USD', 'INR', 'EUR'].includes(formData.currency)) throw new Error('Invalid currency');
      if (formData.panNumber && !panRegex.test(formData.panNumber)) throw new Error('Invalid PAN');
      if (formData.gst && !gstRegex.test(formData.gst)) throw new Error('Invalid GST');
      if (formData.tanNumber && !tanRegex.test(formData.tanNumber)) throw new Error('Invalid TAN');
      if (!pinRegex.test(primary.pincode)) throw new Error('Pincode: 6 digits');
  
      // ────────────────────── POC Validation ──────────────────────
      for (const poc of formData.clientPocs || []) {
        if (poc.name && !nameRegex.test(poc.name)) throw new Error('POC name: letters only');
        if (poc.email && !emailRegex.test(poc.email)) throw new Error('Invalid POC email');
        if (poc.contactNumber && !phoneRegex.test(poc.contactNumber)) throw new Error('POC contact: 10 digits');
      }
  
      // ────────────────────── Tax Validation ──────────────────────
      for (const tax of formData.clientTaxDetails || []) {
        if (tax.taxName && tax.taxPercentage <= 0) throw new Error('Tax percentage must be > 0');
      }
  
      // ────────────────────── Uniqueness Check ──────────────────────
      const clients = await adminService.getAllClients(); // ClientDTO[]
      const exists = clients.response?.some(
        (c) =>
          c.email?.toLowerCase() === formData.email?.toLowerCase() ||
          c.companyName?.toLowerCase() === formData.companyName?.toLowerCase()
      );
      
      if (exists) throw new Error('Client with this email or company name already exists');
  
      // ────────────────────── Submit ──────────────────────
      await adminService.addClient(formData);
      setSuccess('Client added successfully!');
      setTimeout(() => router.push('/admin-dashboard/clients/list'), 1500);
    }).catch((err: any) => {
      setError(err.message || 'Failed to add client');
    });
  };
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        {/* <BackButton fallback="/admin-dashboard/clients" /> */}
        <div className="relative flex items-center justify-center mb-8">
            <div className="absolute left-0">
              <BackButton fallback="/admin-dashboard/clients/list" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add Client
            </h1>
          </div>

        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <Spinner size="lg" />
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-8">

            {/* Company Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    placeholder="e.g. Digiquads Pvt Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    pattern="[6-9]\d{9}"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="e.g. info@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* GST */}
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST
                  </label>
                  <input
                    type="text"
                    id="gst"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    maxLength={15}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* PAN */}
                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* TAN */}
                <div>
                  <label htmlFor="tanNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    TAN
                  </label>
                  <input
                    type="text"
                    id="tanNumber"
                    name="tanNumber"
                    value={formData.tanNumber}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g. MUMA12345B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select currency</option>
                    <option value="INR">INR – Indian Rupee</option>
                    <option value="USD">USD – US Dollar</option>
                    <option value="EUR">EUR – Euro</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Addresses */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                <button
                  type="button"
                  onClick={() => addItem('addresses')}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Address
                </button>
              </div>

              {formData.addresses?.map((addr, i) => (
                <div key={addr.addressId || i} className="mb-6 p-4 border rounded bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* House No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House No</label>
                      <input
                        type="text"
                        name={`addresses.${i}.houseNo`}
                        value={addr.houseNo}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        placeholder="e.g. 221B"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <input
                        type="text"
                        name={`addresses.${i}.streetName`}
                        value={addr.streetName}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        placeholder="e.g. Baker Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        name={`addresses.${i}.city`}
                        value={addr.city}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        required={i === 0}
                        placeholder="e.g. Mumbai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        name={`addresses.${i}.state`}
                        value={addr.state}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        required={i === 0}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        name={`addresses.${i}.pincode`}
                        value={addr.pincode}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        required={i === 0}
                        maxLength={6}
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <input
                        type="text"
                        name={`addresses.${i}.country`}
                        value={addr.country}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        required={i === 0}
                        placeholder="e.g. India"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Address Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                      <select
                        name={`addresses.${i}.addressType`}
                        value={addr.addressType || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={i === 0}
                      >
                        <option value="" disabled>Select type</option>
                        <option value="CURRENT">Current</option>
                        <option value="PERMANENT">Permanent</option>
                        <option value="OFFICE">Office</option>
                      </select>
                    </div>
                  </div>

                  {formData.addresses!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem('addresses', i)}
                      className="mt-2 text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>


            {/* Client POCs */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Point of Contacts</h3>
                <button
                  type="button"
                  onClick={() => addItem('clientPocs')}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add POC
                </button>
              </div>

              {formData.clientPocs?.map((poc, i) => (
                <div key={i} className="mb-4 p-4 border rounded bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        name={`clientPocs.${i}.name`}
                        value={poc.name}
                        onChange={(e) => handleChange(e, i, 'clientPocs')}
                        placeholder="e.g. Anita Sharma"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={i === 0}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name={`clientPocs.${i}.email`}
                        value={poc.email}
                        onChange={(e) => handleChange(e, i, 'clientPocs')}
                        placeholder="e.g. anita.sharma@company.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={i === 0}
                      />
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                      <input
                        type="tel"
                        name={`clientPocs.${i}.contactNumber`}
                        value={poc.contactNumber}
                        onChange={(e) => handleChange(e, i, 'clientPocs')}
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        pattern="[6-9]\d{9}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={i === 0}
                      />
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        name={`clientPocs.${i}.designation`}
                        value={poc.designation}
                        onChange={(e) => handleChange(e, i, 'clientPocs')}
                        placeholder="e.g. Procurement Manager"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  {formData.clientPocs!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem('clientPocs', i)}
                      className="mt-2 text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Tax Details */}
            <div className="pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tax Details</h3>
                <button
                  type="button"
                  onClick={() => addItem('clientTaxDetails')}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Tax
                </button>
              </div>
              {formData.clientTaxDetails?.map((tax, i) => (
                <div key={tax.taxId} className="mb-4 p-4 border rounded bg-gray-50 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                    <input
                      type="text"
                      name={`clientTaxDetails.${i}.taxName`}
                      value={tax.taxName}
                      onChange={(e) => handleChange(e, i, 'clientTaxDetails')}
                      placeholder="e.g., GST"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">%</label>
                    <input
                      type="number"
                      name={`clientTaxDetails.${i}.taxPercentage`}
                      value={tax.taxPercentage}
                      onChange={(e) => handleChange(e, i, 'clientTaxDetails')}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {formData.clientTaxDetails!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem('clientTaxDetails', i)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}
            {success && <div className="text-green-600 bg-green-50 p-3 rounded">{success}</div>}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin-dashboard/clients/list')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddClientPage;