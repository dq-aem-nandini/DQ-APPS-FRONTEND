// app/admin-dashboard/clients/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api/adminService';
import { UniqueField, validationService } from '@/lib/api/validationService';
import { v4 as uuidv4 } from 'uuid';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import Spinner from '@/components/ui/Spinner';
import useLoading from '@/hooks/useLoading';
import { Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import TooltipHint from '@/components/ui/TooltipHint';

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
  // ---- State cache for India ----
const [indiaStates, setIndiaStates] = useState<string[]>([]);
const [statesLoading, setStatesLoading] = useState(false);
const isIndia = (country?: string) =>
  country?.trim().toLowerCase() === 'india';


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
      if (value && !emailRegex.test(value.toString()))  error = 'Invalid email';
    }
     
    if (name === 'gst') {
      if (value && !gstRegex.test(value.toString())) error = 'Invalid GSTIN format';
    }
    
    if (name === 'panNumber') {
      if (value && !panRegex.test(value.toString())) error = 'Invalid PAN format';
    }
    
    if (name === 'tanNumber') {
      if (value && !tanRegex.test(value.toString())) error = 'Invalid TAN format';
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
    // if (name.includes('clientPocs') && name.includes('name') && index === 0 && !value) error = 'Name required';
    // if (name.includes('clientPocs') && name.includes('email')) {
    //   if (index === 0 && !value) error = 'Email required';
    //   else if (value && !emailRegex.test(value.toString())) error = 'Invalid email';
    // }
    // if (name.includes('clientPocs') && name.includes('contactNumber')) {
    //   if (index === 0 && !value) error = 'Contact number required';
    //   else if (value && value.toString().length > 0 && !/^\d+$/.test(value.toString())) error = 'Only digits';
    //   else if (value.toString().length === 10 && !phoneRegex.test(value.toString())) error = 'Invalid mobile';
    // }

    // POC
    if (name.includes('clientPocs') && name.includes('name') && index === 0 && !value) {
      error = 'Name required';
    }

    // OPTIONAL email — validate only if present
    if (name.includes('clientPocs') && name.includes('email')) {
      if (value && !emailRegex.test(value.toString())) {
        error = 'Invalid email';
      }
    }

    // OPTIONAL contact — validate only if present
    if (name.includes('clientPocs') && name.includes('contactNumber')) {
      if (value && !/^\d+$/.test(value.toString())) {
        error = 'Only digits';
      } else if (value && value.toString().length === 10 && !phoneRegex.test(value.toString())) {
        error = 'Invalid mobile';
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };
   
  const fetchIndiaStates = async () => {
    if (indiaStates.length > 0) return; // ✅ cache hit
  
    try {
      setStatesLoading(true);
      const response = await adminService.getStatesByCountry('india');
      setIndiaStates(response || []);
    } catch (err) {
      console.error('Failed to fetch states', err);
    } finally {
      setStatesLoading(false);
    }
  };
  
  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string  // ← ADD THIS
  ) => {
    const val = value.trim();
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    setChecking(prev => new Set(prev).add(errorKey));

    try {
      const result = await validationService.validateField({
        field,
        value: val,
        mode: "create",
        fieldColumn,
      });

      setErrors(prev => {
        const newErrors = { ...prev };
        if (result.exists) {
          newErrors[errorKey] = "Already exists in the system";
        } else {
          delete newErrors[errorKey];
        }
        return newErrors;
      });
    } catch (err) {
      console.warn("Uniqueness check failed:", err);
    } finally {
      setChecking(prev => {
        const s = new Set(prev);
        s.delete(errorKey);
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
    const mainEmail = formData.email?.toLowerCase().trim();
    const mainContact = formData.contactNumber;

    const newErrors: Record<string, string> = {};

    formData.clientPocs.forEach((poc, i) => {
      const pocEmail = poc.email.toLowerCase().trim();
      const pocContact = poc.contactNumber;

      // Main email = POC email
      if (pocEmail && mainEmail && pocEmail === mainEmail) {
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
          country: '',
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
      // { value: formData.email, name: 'email', label: 'Email' },
      // { value: formData.gst, name: 'gst', label: 'GST' },
      // { value: formData.panNumber, name: 'panNumber', label: 'PAN' },
      // { value: formData.tanNumber, name: 'tanNumber', label: 'TAN' },
      { value: formData.currency, name: 'currency', label: 'Currency' },
      // Address (first one only)
      { value: formData.addresses[0]?.city, name: 'addresses.0.city', label: 'City (Address)' },
      { value: formData.addresses[0]?.state, name: 'addresses.0.state', label: 'State (Address)' },
      { value: formData.addresses[0]?.pincode, name: 'addresses.0.pincode', label: 'Pincode (Address)' },
      { value: formData.addresses[0]?.country, name: 'addresses.0.country', label: 'Country (Address)' },
      // POC (first one only)
      { value: formData.clientPocs[0]?.name, name: 'clientPocs.0.name', label: 'POC Name' },
      // { value: formData.clientPocs[0]?.email, name: 'clientPocs.0.email', label: 'POC Email' },
      // { value: formData.clientPocs[0]?.contactNumber, name: 'clientPocs.0.contactNumber', label: 'POC Contact Number' },
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
          // email: formData.email.toLowerCase().trim(),
          email: formData.email ? formData.email.toLowerCase().trim(): null,
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
            email: p.email ? p.email.toLowerCase().trim() : '',
            contactNumber: p.contactNumber || '',
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

        // SUCCESS SWEETALERT — FROM BACKEND (IF AVAILABLE) OR DEFAULT
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Client added successfully!',
          timer: 2000,
          showConfirmButton: false,
        });

        router.push('/admin-dashboard/clients/list');
      });
    } catch (err: any) {
      let backendMessage = 'Failed to add client';

      if (err.response?.data) {
        const data = err.response.data;

        if (data.message) {
          backendMessage = data.message;
        }
        else if (data.errors && typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          backendMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
        else if (data.fieldErrors) {
          const firstError = Object.values(data.fieldErrors)[0];
          backendMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
      } else if (err.message) {
        backendMessage = err.message;
      }

      // ERROR SWEETALERT — SHOWS EXACT BACKEND MESSAGE
      await Swal.fire('Error', err.message || 'Something went wrong', 'error');
      
      // await Swal.fire({
      //   icon: 'error',
      //   title: 'Error',
      //   text: backendMessage,
      //   confirmButtonColor: '#ef4444',
      //   background: '#fef2f2',
      //   customClass: {
      //     popup: 'animate__animated animate__shakeX',
      //   },
      // });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton to="/admin-dashboard/clients" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span><TooltipHint hint="Full legal name of the company. Example: DigiQuad Technologies Private Limited" /></label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    onBlur={(e) => checkUniqueness('COMPANY_NAME', e.target.value, 'companyName', 'company_name')} placeholder="e.g. Digiquads Pvt Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                  />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  {checking.has('companyName') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-digit Indian mobile number. Must start with 6-9." />
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.contactNumber}
                    // onChange={handleChange}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        handleChange(e);
                      }
                    }}
                    required

                    onBlur={(e) => checkUniqueness('CONTACT_NUMBER', e.target.value, 'contactNumber', 'contact_number')}
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                  />
                  {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email 
                    <TooltipHint hint="Official company email. Example: info@digiquad.com" />
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    // onChange={handleChange}
                    onChange={(e) => {
                      e.target.value = e.target.value.toLowerCase().trim();
                      handleChange(e);
                      // Clear error while typing
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }}
                   
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val) {
                        // Now validate format
                        if (!emailRegex.test(val)) {
                          setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
                        }
                        // Then check uniqueness
                        checkUniqueness('EMAIL', val, 'email', 'email');
                      }
                    }}
                    // onBlur={(e) => checkUniqueness('EMAIL', e.target.value.trim(), 'email', 'email')} 
                    placeholder="e.g. info@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* GST - Now checks backend uniqueness */}
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST 
                    {/* <span className="text-red-500">*</span> */}
                    <TooltipHint hint="15-character GSTIN. Format: 27AABCU9603R1ZX (2 digits state code + PAN + entity code + Z + checksum)" />                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="gst"
                      name="gst"
                      value={formData.gst}
                      // onChange={handleChange}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                        // Clear error while typing
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.gst;
                          return newErrors;
                        });
                      }}
                      // onBlur={(e) => checkUniqueness('GST', e.target.value.trim(), 'gst', 'gst')}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          // Now validate format
                          if (!gstRegex.test(val)) {
                            setErrors(prev => ({ ...prev, gst: 'Invalid GSTIN format' }));
                          }
                          // Then check uniqueness
                          checkUniqueness('GST', val, 'gst', 'gst');
                        }
                      }}
                      maxLength={15}
                      // required
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
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
                    PAN 
                    {/* <span className="text-red-500">*</span> */}
                    <TooltipHint hint="10-character PAN number. Format: ABCDE1234F (5 letters + 4 digits + 1 letter)" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="panNumber"
                      name="panNumber"
                      value={formData.panNumber}
                      // onChange={handleChange}
                      // onBlur={(e) => checkUniqueness('PAN_NUMBER', e.target.value.trim(), 'panNumber', 'pan_number')}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.panNumber;
                          return newErrors;
                        });
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          if (!panRegex.test(val)) {
                            setErrors(prev => ({ ...prev, panNumber: 'Invalid PAN format' }));
                          }
                          checkUniqueness('PAN_NUMBER', val, 'panNumber', 'pan_number');
                        }
                      }}
                      maxLength={10}
                      // required
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
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
                    TAN 
                    {/* <span className="text-red-500">*</span> */}
                    <TooltipHint hint="10-character Tax Deduction Account Number. Format: MUMA12345B" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="tanNumber"
                      name="tanNumber"
                      value={formData.tanNumber}
                      // onChange={handleChange}
                      // onBlur={(e) => checkUniqueness('TAN_NUMBER', e.target.value.trim(), 'tanNumber', 'tan_number')}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.tanNumber;
                          return newErrors;
                        });
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          if (!tanRegex.test(val)) {
                            setErrors(prev => ({ ...prev, tanNumber: 'Invalid TAN format' }));
                          }
                          checkUniqueness('TAN_NUMBER', val, 'tanNumber', 'tan_number');
                        }
                      }}
                      maxLength={10}
                      // required
                      placeholder="e.g. MUMA12345B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                    />
                    {checking.has('tanNumber') && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                  {errors.tanNumber && <p className="text-red-500 text-xs mt-1">{errors.tanNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency 
                    <span className="text-red-500">*</span>
                    <TooltipHint hint="Primary billing currency for this client" /></label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none"
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
                <h3 className="text-lg font-semibold text-gray-900">Addresses <span className="text-red-500">*</span></h3>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City {i === 0}<span className="text-red-500">*</span>{i === 0 && <TooltipHint hint="City name as per official records" />}</label>
                      <input
                        type="text"
                        name={`addresses.${i}.city`}
                        value={addr.city || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.city`, e.target.value, i)}
                        required={i === 0}
                        placeholder="e.g. Mumbai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                      {errors[`addresses.${i}.city`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.city`]}</p>
                      )}
                    </div>

                    {/* State */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State {i === 0}<span className="text-red-500">*</span>
                        {i === 0 && <TooltipHint hint="State name as per official records" />}</label>
                      <input
                        type="text"
                        name={`addresses.${i}.state`}
                        value={addr.state || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.state`, e.target.value, i)}
                        required={i === 0}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                      {errors[`addresses.${i}.state`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.state`]}</p>
                      )}
                    </div> */}

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode {i === 0}<span className="text-red-500">*</span>
                        {i === 0 && <TooltipHint hint="Pincode as per official records" />}</label>
                      <input
                        type="text"
                        name={`addresses.${i}.pincode`}
                        value={addr.pincode || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        onBlur={(e) => validateField(`addresses.${i}.pincode`, e.target.value, i)}
                        maxLength={6}
                        required={i === 0}
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                      {errors[`addresses.${i}.pincode`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.pincode`]}</p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country {i === 0}<span className="text-red-500">*</span>
                        {i === 0 && <TooltipHint hint="Country name as per official records" />}</label>
                        <input
                          type="text"
                          name={`addresses.${i}.country`}
                          value={addr.country || ''}
                          onChange={(e) => {
                            handleChange(e, i, 'addresses');

                            if (isIndia(e.target.value)) {
                              fetchIndiaStates(); // ✅ call once
                            } else {
                              // Clear state if switching away from India
                              setFormData(prev => ({
                                ...prev,
                                addresses: prev.addresses.map((a, idx) =>
                                  idx === i ? { ...a, state: '' } : a
                                ),
                              }));
                            }
                          }}
                          onBlur={(e) => validateField(`addresses.${i}.country`, e.target.value, i)}
                          required={i === 0}
                          placeholder="e.g. India"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />

                      {errors[`addresses.${i}.country`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`addresses.${i}.country`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State {i === 0 && <span className="text-red-500">*</span>}
                        {i === 0 && <TooltipHint hint="State name as per official records" />}
                      </label>

                      {/* INDIA → DROPDOWN */}
                      {isIndia(addr.country) ? (
                        <select
                          name={`addresses.${i}.state`}
                          value={addr.state || ''}
                          onChange={(e) => handleChange(e, i, 'addresses')}
                          onBlur={(e) => validateField(`addresses.${i}.state`, e.target.value, i)}
                          required={i === 0}
                          disabled={statesLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select State</option>
                          {indiaStates.map(state => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      ) : (
                        /* OTHER COUNTRY → TEXT INPUT */
                        <input
                          type="text"
                          name={`addresses.${i}.state`}
                          value={addr.state || ''}
                          onChange={(e) => handleChange(e, i, 'addresses')}
                          onBlur={(e) => validateField(`addresses.${i}.state`, e.target.value, i)}
                          required={i === 0}
                          placeholder="Enter state"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )}

                      {errors[`addresses.${i}.state`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`addresses.${i}.state`]}
                        </p>
                      )}
                    </div>
  
                    {/* Address Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                      <select
                        name={`addresses.${i}.addressType`}
                        value={addr.addressType || ''}
                        onChange={(e) => handleChange(e, i, 'addresses')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none"
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
                <h3 className="text-lg font-semibold text-gray-900">Point of Contacts <span className="text-red-500">*</span></h3>
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
                            {i === 0 && <TooltipHint hint="Full name of the point of contact" />}
                          </label>
                          <input
                            type="text"
                            name={`clientPocs.${i}.name`}
                            value={poc.name || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onBlur={(e) => validateField(`clientPocs.${i}.name`, e.target.value, i)}
                            placeholder="e.g. Anita Sharma"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                            required={i === 0}
                          />
                          {errors[`clientPocs.${i}.name`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`clientPocs.${i}.name`]}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email 
                            {/* {i === 0 && <span className="text-red-500">*</span>} */}
                            {i === 0 && <TooltipHint hint="Official email of the contact person" />}
                          </label>
                          <input
                            type="email"
                            name={`clientPocs.${i}.email`}
                            value={poc.email || ''}
                            // onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onChange={(e) => {
                              e.target.value = e.target.value.toLowerCase().trim();
                              handleChange(e, i, 'clientPocs');
                              // Clear error while typing
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`clientPocs.${i}.email`];
                                return newErrors;
                              });
                            }}
                            // onBlur={(e) => {
                            //   const val = e.target.value.trim();
                            //   if (val) {
                            //     validateField(`clientPocs.${i}.email`, val, i);
                            //     checkUniqueness('EMAIL', val, `clientPocs.${i}.email`, 'email');
                            //   }
                            // }}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val) {
                                // Validate format
                                if (!emailRegex.test(val)) {
                                  setErrors(prev => ({ ...prev, [`clientPocs.${i}.email`]: 'Invalid email format' }));
                                }
                                // Then uniqueness
                                checkUniqueness('EMAIL', val, `clientPocs.${i}.email`, 'email');
                              }
                            }}
                            placeholder="anita.sharma@company.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                            // required={i === 0}
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
                            Contact Number 
                            {/* {i === 0 && <span className="text-red-500">*</span>} */}
                            {i === 0 && <TooltipHint hint="10-digit mobile number of the contact" />}
                          </label>
                          <input
                            type="tel"
                            name={`clientPocs.${i}.contactNumber`}
                            value={poc.contactNumber || ''}
                            onChange={(e) => handleChange(e, i, 'clientPocs')}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val && val.length === 10) {
                                validateField(`clientPocs.${i}.contactNumber`, val, i);
                                checkUniqueness('CONTACT_NUMBER', val, `clientPocs.${i}.contactNumber`, 'contact_number');
                              }
                            }}
                            maxLength={10}
                            placeholder="9876543210"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                            // required={i === 0}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
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
              <button
                type="button"
                onClick={() => router.push('/admin-dashboard/clients')}
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
}