'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import { validationService } from '@/lib/api/validationService';
import { v4 as uuidv4 } from 'uuid';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import Spinner from '@/components/ui/Spinner';
import useLoading from '@/hooks/useLoading';
import { Loader2 } from 'lucide-react';

type Address = {
  addressId: string;
  houseNo?: string;
  streetName?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType: 'CURRENT' | 'PERMANENT' | 'OFFICE';
};

type POC = {
  pocId: string;
  name: string;
  email: string;
  contactNumber: string;
  designation: string;
};

type TaxDetail = {
  taxId: string;
  taxName: string;
  taxPercentage: number;
  createdAt: string;
  updatedAt: string;
};

export default function AddClientPage() {
  const router = useRouter();
  const { loading, withLoading } = useLoading();

  const [formData, setFormData] = useState({
    companyName: '',
    contactNumber: '',
    email: '',
    gst: '',
    panNumber: '',
    tanNumber: '',
    currency: 'INR' as 'INR' | 'USD' | 'EUR',
    addresses: [] as Address[],
    clientPocs: [] as POC[],
    clientTaxDetails: [] as TaxDetail[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Validation regex patterns
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z ]+$/;
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
  const gstRegex = /^[0-9]{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]$/;
  const tanRegex = /^[A-Z]{4}\d{5}[A-Z]$/;

  // Real-time validation while typing
  const validateField = (name: string, value: string | number, index?: number) => {
    let error = '';

    if (name === 'companyName') {
      if (!value) error = 'Company name is required';
      else if (value.toString().length < 3) error = 'Minimum 3 characters';
      else if (!nameRegex.test(value.toString())) error = 'Only letters and spaces';
    }
    if (name === 'contactNumber') {
      if (!value) error = 'Contact number required';
      else if (value.toString().length > 0 && !/^\d+$/.test(value.toString())) error = 'Only digits';
      else if (value.toString().length === 10 && !phoneRegex.test(value.toString())) error = 'Invalid mobile number';
    }
    if (name === 'email') {
      if (!value) error = 'Email required';
      else if (!emailRegex.test(value.toString())) error = 'Invalid email';
    }
    if (name === 'gst') {
      if (!value) error = 'GSTIN is required';
      else if (!gstRegex.test(value.toString())) error = 'Invalid GSTIN format';
    }
    if (name === 'panNumber') {
      if (!value) error = 'PAN is required';
      else if (!panRegex.test(value.toString())) error = 'Invalid PAN format';
    }
    if (name === 'tanNumber') {
      if (!value) error = 'TAN is required';
      else if (!tanRegex.test(value.toString())) error = 'Invalid TAN format';
    }

    // Address
    if (name.includes('city') && index === 0 && !value) error = 'City required';
    if (name.includes('state') && index === 0 && !value) error = 'State required';
    if (name.includes('country') && index === 0 && !value) error = 'Country required';
    if (name.includes('pincode') && index === 0) {
      if (!value) error = 'Pincode required';
      else if (value.toString().length > 0 && !/^\d+$/.test(value.toString())) error = 'Only digits';
      else if (value.toString().length === 6 && !/^\d{6}$/.test(value.toString())) error = 'Must be 6 digits';
    }

    // POC
    if (name.includes('clientPocs') && name.includes('name') && index === 0 && !value) error = 'Name required';
    if (name.includes('clientPocs') && name.includes('email')) {
      if (index === 0 && !value) error = 'Email required';
      else if (value && !emailRegex.test(value.toString())) error = 'Invalid email';
    }
    if (name.includes('clientPocs') && name.includes('contactNumber')) {
      if (index === 0 && !value) error = 'Contact number required';
      else if (value && value.toString().length > 0 && !/^\d+$/.test(value.toString())) error = 'Only digits';
      else if (value.toString().length === 10 && !phoneRegex.test(value.toString())) error = 'Invalid mobile';
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Global uniqueness check on blur
  const checkUniqueness = async (field: any, value: string, key: string) => {
    if (!value || value.length < 3 || checking.has(key)) return;

    setChecking(prev => new Set(prev).add(key));
    try {
      const result = await validationService.validateField({
        field,
        value,
        mode: 'create',
      });
      if (result.exists) {
        setErrors(prev => ({ ...prev, [key]: 'Already exists in system' }));
      }
    } catch (e) {
      console.warn('Uniqueness check failed', e);
    } finally {
      setChecking(prev => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    index?: number,
    section?: 'addresses' | 'clientPocs' | 'clientTaxDetails'
  ) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    // Formatting
    if (name === 'email' || name.includes('.email')) {
      parsedValue = value.toLowerCase().trim();
    } else if (name === 'gst' || name === 'panNumber' || name === 'tanNumber') {
      parsedValue = value.toUpperCase().trim();
    } else if (name.includes('.pincode') || name.includes('.contactNumber')) {
      parsedValue = value.replace(/\D/g, '');
    } else if (name.includes('taxPercentage')) {
      parsedValue = parseFloat(value) || 0;
    }

    // Update form data
    if (section && index !== undefined) {
      setFormData(prev => ({
        ...prev,
        [section]: prev[section]!.map((item, i) =>
          i === index
            ? { ...item, [name.split('.').pop()!]: parsedValue }
            : item
        ),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue,
      }));
    }

    // Trigger validation
    validateField(name, parsedValue, section && index !== undefined ? index : undefined);
  };
// Real-time duplicate detection between main fields and POCs
const checkDuplicateInForm = () => {
  const mainEmail = formData.email.toLowerCase().trim();
  const mainContact = formData.contactNumber;

  const newErrors: Record<string, string> = {};

  formData.clientPocs.forEach((poc, i) => {
    const pocEmail = poc.email.toLowerCase().trim();
    const pocContact = poc.contactNumber;

    // Main email = POC email
    if (pocEmail && pocEmail === mainEmail) {
      newErrors[`clientPocs.${i}.email`] = 'Same as company email';
      newErrors.email = 'Same as POC email';
    }

    // Main contact = POC contact
    if (pocContact && pocContact === mainContact) {
      newErrors[`clientPocs.${i}.contactNumber`] = 'Same as company contact';
      newErrors.contactNumber = 'Same as POC contact';
    }

    // POC vs POC duplicates
    formData.clientPocs.forEach((otherPoc, j) => {
      if (i !== j) {
        if (poc.email && poc.email === otherPoc.email) {
          newErrors[`clientPocs.${i}.email`] = 'Duplicate POC email';
        }
        if (poc.contactNumber && poc.contactNumber === otherPoc.contactNumber) {
          newErrors[`clientPocs.${i}.contactNumber`] = 'Duplicate POC contact';
        }
      }
    });
  });

  setErrors(prev => ({ ...prev, ...newErrors }));
};
// Run duplicate check whenever email, contact, or POCs change
useEffect(() => {
  checkDuplicateInForm();
}, [formData.email, formData.contactNumber, formData.clientPocs]);

  const addItem = (section: 'addresses' | 'clientPocs' | 'clientTaxDetails') => {
    if (section === 'addresses') {
      setFormData(prev => ({
        ...prev,
        addresses: [...prev.addresses, {
          addressId: uuidv4(),
          houseNo: '',
          streetName: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          addressType: 'OFFICE',
        }],
      }));
    } else if (section === 'clientPocs') {
      setFormData(prev => ({
        ...prev,
        clientPocs: [...prev.clientPocs, {
          pocId: '',
          name: '',
          email: '',
          contactNumber: '',
          designation: '',
        }],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientTaxDetails: [...prev.clientTaxDetails, {
          taxId: uuidv4(),
          taxName: '',
          taxPercentage: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      }));
    }
  };

  const removeItem = (section: 'addresses' | 'clientPocs' | 'clientTaxDetails', index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section]!.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setErrors({}); // Clear previous errors
    setIsSubmitting(true);
  
    // ────── REQUIRED FIELDS WITH AUTO-FOCUS & SCROLL ──────
    const requiredFields = [
      { value: formData.companyName, name: 'companyName', label: 'Company Name' },
      { value: formData.contactNumber, name: 'contactNumber', label: 'Contact Number' },
      { value: formData.email, name: 'email', label: 'Email' },
      { value: formData.gst, name: 'gst', label: 'GST' },
      { value: formData.panNumber, name: 'panNumber', label: 'PAN' },
      { value: formData.tanNumber, name: 'tanNumber', label: 'TAN' },
      { value: formData.currency, name: 'currency', label: 'Currency' },
      // Address (first one only)
      { value: formData.addresses[0]?.city, name: 'addresses.0.city', label: 'City (Address)' },
      { value: formData.addresses[0]?.state, name: 'addresses.0.state', label: 'State (Address)' },
      { value: formData.addresses[0]?.pincode, name: 'addresses.0.pincode', label: 'Pincode (Address)' },
      { value: formData.addresses[0]?.country, name: 'addresses.0.country', label: 'Country (Address)' },
      // POC (first one only)
      { value: formData.clientPocs[0]?.name, name: 'clientPocs.0.name', label: 'POC Name' },
      { value: formData.clientPocs[0]?.email, name: 'clientPocs.0.email', label: 'POC Email' },
      { value: formData.clientPocs[0]?.contactNumber, name: 'clientPocs.0.contactNumber', label: 'POC Contact Number' },
    ];
  
    const missingField = requiredFields.find(f => !f.value || f.value.toString().trim() === '');
    if (missingField) {
      const errorMsg = `${missingField.label} is required`;
      setErrors({ [missingField.name]: errorMsg });
  
      setTimeout(() => {
        const input = document.querySelector(
          `[name="${missingField.name.split('.').pop()}"]`
        ) as HTMLElement;
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input.focus();
          input.classList.add('error-field');
        }
      }, 100);
  
      setIsSubmitting(false);
      return;
    }
  
    try {
      await withLoading(async () => {
        const payload = {
          companyName: formData.companyName.trim(),
          contactNumber: formData.contactNumber,
          email: formData.email.toLowerCase().trim(),
          gst: formData.gst.toUpperCase(),
          panNumber: formData.panNumber.toUpperCase(),
          tanNumber: formData.tanNumber.toUpperCase(),
          currency: formData.currency,
  
          addresses: formData.addresses.map(a => ({
            addressId: a.addressId,
            houseNo: a.houseNo?.trim() || '',
            streetName: a.streetName?.trim() || '',
            city: a.city.trim(),
            state: a.state.trim(),
            pincode: a.pincode,
            country: a.country.trim(),
            addressType: a.addressType,
          })),
  
          clientPocs: formData.clientPocs.map(p => ({
            pocId: uuidv4(),
            name: p.name.trim(),
            email: p.email.toLowerCase().trim(),
            contactNumber: p.contactNumber,
            designation: p.designation?.trim() || '',
          })),
  
          clientTaxDetails: formData.clientTaxDetails.map(t => ({
            taxId: t.taxId || uuidv4(),
            taxName: t.taxName?.trim() || '',
            taxPercentage: t.taxPercentage ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        };
  
        await adminService.addClient(payload);
        setSuccess('Client added successfully!');
        setTimeout(() => router.push('/admin-dashboard/clients/list'), 1500);
      });
    } catch (err: any) {
      let fieldErrors: Record<string, string> = {};
  
      if (err.response?.data) {
        const data = err.response.data;
  
        if (data.fieldErrors) {
          fieldErrors = Object.fromEntries(
            Object.entries(data.fieldErrors).map(([field, msg]) => [
              field,
              Array.isArray(msg) ? msg[0] : msg
            ])
          );
        } else if (data.errors && typeof data.errors === 'object') {
          fieldErrors = Object.fromEntries(
            Object.entries(data.errors).map(([field, msg]) => [
              field.toLowerCase(),
              Array.isArray(msg) ? msg[0] : msg
            ])
          );
        }
      }
  
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setTimeout(() => {
          const firstField = Object.keys(fieldErrors)[0];
          const input = document.querySelector(`[name="${firstField.split('.').pop()}"]`) as HTMLElement;
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
            input.classList.add('error-field');
          }
        }, 100);
      } else {
        setError(err.message || 'Failed to add client');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setSuccess('');
  //   setIsSubmitting(true);

  //   await withLoading(async () => {
  //     const payload = {
  //       companyName: formData.companyName,
  //       contactNumber: formData.contactNumber,
  //       email: formData.email,
  //       gst: formData.gst,
  //       panNumber: formData.panNumber,
  //       tanNumber: formData.tanNumber,
  //       currency: formData.currency,

  //       addresses: formData.addresses.map(a => ({
  //         addressId: a.addressId,
  //         houseNo: a.houseNo || '',
  //         streetName: a.streetName || '',
  //         city: a.city,
  //         state: a.state,
  //         pincode: a.pincode,
  //         country: a.country,
  //         addressType: a.addressType,
  //       })),

  //       clientPocs: formData.clientPocs.map(p => ({
  //         pocId: uuidv4(),
  //         name: p.name,
  //         email: p.email,
  //         contactNumber: p.contactNumber,
  //         designation: p.designation || '',
  //       })),

  //       clientTaxDetails: formData.clientTaxDetails.map(t => ({
  //         taxId: t.taxId,
  //         taxName: t.taxName || '',
  //         taxPercentage: t.taxPercentage ?? 0,
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //       })),
  //     };

  //     await adminService.addClient(payload);
  //     setSuccess('Client added successfully!');
  //     setTimeout(() => router.push('/admin-dashboard/clients/list'), 1500);
  //   }).catch((err: any) => {
  //     setError(err.message || 'Failed to add client');
  //   }).finally(() => {
  //     setIsSubmitting(false);
  //   });
  // };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton to="/admin-dashboard/clients/list" />
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    onBlur={() => checkUniqueness('COMPANY_NAME', formData.companyName, 'companyName')}
                    placeholder="e.g. Digiquads Pvt Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  {checking.has('companyName') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    onBlur={() => checkUniqueness('CONTACT_NUMBER', formData.contactNumber, 'contactNumber')}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    onBlur={() => checkUniqueness('EMAIL', formData.email, 'email')}
                    placeholder="e.g. info@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* GST - Now checks backend uniqueness */}
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="gst"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                      onBlur={() => checkUniqueness('GST', formData.gst, 'gst')}
                      maxLength={15}
                      required
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {checking.has('gst') && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                  {errors.gst && <p className="text-red-500 text-xs mt-1">{errors.gst}</p>}
                </div>

                {/* PAN - Now checks backend uniqueness */}
                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    PAN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="panNumber"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      onBlur={() => checkUniqueness('PAN_NUMBER', formData.panNumber, 'panNumber')}
                      maxLength={10}
                      required
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {checking.has('panNumber') && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                  {errors.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
                </div>

                {/* TAN - Now checks backend uniqueness */}
                <div>
                  <label htmlFor="tanNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    TAN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="tanNumber"
                      name="tanNumber"
                      value={formData.tanNumber}
                      onChange={handleChange}
                      onBlur={() => checkUniqueness('TAN_NUMBER', formData.tanNumber, 'tanNumber')}
                      maxLength={10}
                      required
                      placeholder="e.g. MUMA12345B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {checking.has('tanNumber') && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                  {errors.tanNumber && <p className="text-red-500 text-xs mt-1">{errors.tanNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency <span className="text-red-500">*</span></label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select currency</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
            {/* ==================== ADDRESSES ==================== */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                <button
                  type="button"
                  onClick={() => addItem("addresses")}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Address
                </button>
              </div>

              {(!formData.addresses || formData.addresses.length === 0) && (
                <div className="p-6 text-gray-500 text-center border border-dashed rounded">
                  Click “Add Address” to add address
                </div>
              )}

              {(formData.addresses || []).map((addr, i) => (
                <div key={addr.addressId || i} className="mb-6 p-4 border rounded bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* House No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House No</label>
                      <input
                        type="text"
                        name={`addresses.${i}.houseNo`}
                        value={addr.houseNo || ''}
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
                        value={addr.streetName || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        placeholder="e.g. Baker Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City {i === 0}<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name={`addresses.${i}.city`}
                        value={addr.city || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.city`, e.target.value, i)}
                        required={i === 0}
                        placeholder="e.g. Mumbai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors[`addresses.${i}.city`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.city`]}</p>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State {i === 0}<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name={`addresses.${i}.state`}
                        value={addr.state || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.state`, e.target.value, i)}
                        required={i === 0}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors[`addresses.${i}.state`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.state`]}</p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode {i === 0}<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name={`addresses.${i}.pincode`}
                        value={addr.pincode || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.pincode`, e.target.value, i)}
                        maxLength={6}
                        required={i === 0}
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors[`addresses.${i}.pincode`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.pincode`]}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country {i === 0}<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name={`addresses.${i}.country`}
                        value={addr.country || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.country`, e.target.value, i)}
                        required={i === 0}
                        placeholder="e.g. India"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors[`addresses.${i}.country`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.country`]}</p>
                      )}
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

                  {formData.addresses!.length > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem("addresses", i)}
                      className="mt-2 text-red-600 text-sm hover:underline"
                    >
                      Remove Address
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ==================== POINT OF CONTACTS (POCs) ==================== */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Point of Contacts</h3>
                <button
                  type="button"
                  onClick={() => addItem("clientPocs")}
                  className="text-indigo-600 text-sm hover:underline font-medium"
                >
                  + Add POC
                </button>
              </div>

              {/* Show this message ONLY when there are ZERO POCs */}
              {(!formData.clientPocs || formData.clientPocs.length === 0) && (
                <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  Click “Add POC” to add point of contact
                </div>
              )}

              {/* Show POC fields only if at least one exists */}
              {formData.clientPocs.length > 0 && (
                <div className="space-y-6">
                  {formData.clientPocs.map((poc, i) => (
                    <div key={poc.pocId || i} className="p-6 border rounded-lg bg-gray-50 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name {i === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            name={`clientPocs.${i}.name`}
                            value={poc.name || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onBlur={(e) => validateField(`clientPocs.${i}.name`, e.target.value, i)}
                            placeholder="e.g. Anita Sharma"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={i === 0}
                          />
                          {errors[`clientPocs.${i}.name`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`clientPocs.${i}.name`]}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email {i === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="email"
                            name={`clientPocs.${i}.email`}
                            value={poc.email || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onBlur={(e) => {
                              validateField(`clientPocs.${i}.email`, e.target.value, i);
                              checkUniqueness('EMAIL', e.target.value, `clientPocs.${i}.email`);
                            }}
                            placeholder="anita.sharma@company.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={i === 0}
                          />
                          {checking.has(`clientPocs.${i}.email`) && (
                            <Loader2 className="absolute right-3 top-10 h-4 w-4 animate-spin text-gray-500" />
                          )}
                          {errors[`clientPocs.${i}.email`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`clientPocs.${i}.email`]}</p>
                          )}
                        </div>

                        {/* Contact Number */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number {i === 0 && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="tel"
                            name={`clientPocs.${i}.contactNumber`}
                            value={poc.contactNumber || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onBlur={(e) => {
                              validateField(`clientPocs.${i}.contactNumber`, e.target.value, i);
                              checkUniqueness('CONTACT_NUMBER', e.target.value, `clientPocs.${i}.contactNumber`);
                            }}
                            maxLength={10}
                            placeholder="9876543210"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={i === 0}
                          />
                          {checking.has(`clientPocs.${i}.contactNumber`) && (
                            <Loader2 className="absolute right-3 top-10 h-4 w-4 animate-spin text-gray-500" />
                          )}
                          {errors[`clientPocs.${i}.contactNumber`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`clientPocs.${i}.contactNumber`]}</p>
                          )}
                        </div>

                        {/* Designation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                          <input
                            type="text"
                            name={`clientPocs.${i}.designation`}
                            value={poc.designation || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            placeholder="e.g. Procurement Manager"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Remove Button - Only show if more than 1 POC */}
                      {formData.clientPocs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeItem("clientPocs", i)}
                          className="text-red-600 hover:underline text-sm font-medium"
                        >
                          Remove POC
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==================== TAX DETAILS ==================== */}
            <div className="pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tax Details</h3>
                <button
                  type="button"
                  onClick={() => addItem("clientTaxDetails")}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Tax
                </button>
              </div>

              {(!formData.clientTaxDetails || formData.clientTaxDetails.length === 0) && (
                <div className="p-6 text-gray-500 text-center border border-dashed rounded">
                  Click “Add Tax” to add tax details
                </div>
              )}

              {(formData.clientTaxDetails || []).map((tax, i) => (
                <div key={tax.taxId} className="mb-4 p-4 border rounded bg-gray-50 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                    <input
                      type="text"
                      name={`clientTaxDetails.${i}.taxName`}
                      value={tax.taxName || ''}
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
                      value={tax.taxPercentage || ''}
                      onChange={(e) => handleChange(e, i, 'clientTaxDetails')}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {formData.clientTaxDetails!.length > 0 && (
                    <button
                      type="button"
                      onClick={() => removeItem("clientTaxDetails", i)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove Tax
                    </button>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}
            {success && <div className="text-green-600 bg-green-50 p-3 rounded">{success}</div>}

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => router.push('/admin-dashboard/clients/list')} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}