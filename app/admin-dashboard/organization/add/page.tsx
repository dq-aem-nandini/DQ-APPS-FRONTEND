'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Plus, Trash2, MapPin } from 'lucide-react';
import { organizationService } from '@/lib/api/organizationService';
import { employeeService } from '@/lib/api/employeeService';
import { validationService, UniqueField } from '@/lib/api/validationService';
import { Domain, CurrencyCode, OrganizationRequestDTO, AddressModel, AddressType, DOMAIN_LABELS, CURRENCY_CODE_LABELS, IndustryType, INDUSTRY_TYPE_LABELS } from '@/lib/api/types';
import useLoading from '@/hooks/useLoading';
import Spinner from '@/components/ui/Spinner';
import BackButton from '@/components/ui/BackButton';
import { maxLength } from 'zod';
import Swal from 'sweetalert2';
import TooltipHint from '@/components/ui/TooltipHint';

// Assume AddressType enum: 'PERMANENT' | 'CURRENT' | 'OFFICE' | etc.
const ADDRESS_TYPES: AddressType[] = ['PERMANENT', 'CURRENT', 'OFFICE']; // Adjust as per actual enum

// Common timezones (subset for simplicity)
const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'Europe/London',
  'Australia/Sydney',
  'Asia/Singapore',
];

export default function AddOrganizationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OrganizationRequestDTO>({
    organizationName: '',
    organizationLegalName: '',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    cinNumber: '',
    website: '',
    email: '',
    contactNumber: '',
    logo: null,
    industryType: 'HEALTHCARE' as IndustryType,
    domain: 'OTHER' as Domain, // Default
    establishedDate: '',
    timezone: 'Asia/Kolkata', // Default
    currencyCode: 'INR' as CurrencyCode, // Default
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    digitalSignature: null,
    addresses: [], // Initially empty
    prefix: '',
    sequenceNumber: undefined,
    companyType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { loading } = useLoading?.() ?? { loading: false, withLoading: (fn: any) => fn() };

  // Regex patterns (shared)
  const patterns = {
    onlyLetters: /^[A-Za-z\s&.,]+$/,
    email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
    mobile: /^[6-9]\d{9}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
    cin: /^[LPUA][A-Z]{3}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    website: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    pincode: /^\d{6}$/,
    accountNumber: /^\d{9,18}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  };

  // Generic field validator (call this onBlur)
  // Generic field validator (call onBlur)
  const validateField = (name: keyof OrganizationRequestDTO | string, value: any) => {
    const val = String(value ?? '').trim();
    const newErrors = { ...errors };

    // Clear any old error for this field
    delete newErrors[name as string];

    // Required fields list (address NOT included)
    const requiredFields: (keyof OrganizationRequestDTO)[] = [
      'organizationName',
      'organizationLegalName',
      'email',
      'registrationNumber',
      'gstNumber',
      'panNumber',
      'cinNumber',
      'contactNumber',
      'domain',
      'industryType',
      'establishedDate',
      'currencyCode',
      'accountNumber',
      'accountHolderName',
      'ifscCode',
    ];

    // Required field validation
    if (requiredFields.includes(name as keyof OrganizationRequestDTO) && !val) {
      newErrors[name as string] = 'This field is required';
    }


    // -------- FIELD-SPECIFIC VALIDATIONS ----------
    switch (name) {
      case 'organizationName':
      case 'organizationLegalName':
      case 'industryType':
        if (val && !patterns.onlyLetters.test(val))
          newErrors[name] = 'Only letters, spaces, and common symbols allowed';
        else if (val.length > 100)
          newErrors[name] = 'Maximum 100 characters allowed';
        break;

      case 'email':
        if (val && !patterns.email.test(val))
          newErrors[name] = 'Invalid email format';
        break;

      case 'contactNumber':
        if (val && !patterns.mobile.test(val))
          newErrors[name] = 'Enter valid 10-digit Indian mobile number';
        break;

      case 'panNumber':
        if (val && !patterns.pan.test(val))
          newErrors[name] = 'Invalid PAN format (e.g., ABCDE1234F)';
        break;

      case 'gstNumber':
        if (val && !patterns.gst.test(val))
          newErrors[name] = 'Invalid GST format';
        break;

      case 'cinNumber':
        if (val && !patterns.cin.test(val))
          newErrors[name] = 'Invalid CIN format';
        break;

      case 'website':
        if (val && !patterns.website.test(val))
          newErrors[name] = 'Invalid website URL';
        break;

      case 'accountNumber':
        if (val && !patterns.accountNumber.test(val))
          newErrors[name] = 'Account number must be 9-18 digits';
        break;

      case 'ifscCode':
        if (val && !patterns.ifsc.test(val))
          newErrors[name] = 'Invalid IFSC format (e.g., SBIN0000123)';
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };




  // Uniqueness check (call onBlur)
  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn?: string
  ) => {
    const val = String(value ?? '').trim();
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    setChecking(prev => new Set([...prev, errorKey]));

    try {
      const result = await validationService.validateField({
        field,
        value: val,
        mode: 'create',
        fieldColumn,
      });

      setErrors(prev => {
        const newErrors = { ...prev };
        if (result.exists) {
          newErrors[errorKey] = result.message || 'Already exists in the system';
        } else {
          delete newErrors[errorKey];
        }
        return newErrors;
      });
    } catch (err) {
      console.warn('Uniqueness check failed:', err);
    } finally {
      setChecking(prev => {
        const s = new Set(prev);
        s.delete(errorKey);
        return s;
      });
    }
  };

  // Generic handleChange: ONLY update state (no validation / no uniqueness)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    // keep PAN uppercase while typing
    if (name === 'panNumber') {
      parsedValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  // Generic handleBlur: validate field + run uniqueness where required
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const trimmed = String(value ?? '').trim();

    // Validate the field (common validations)
    validateField(name as keyof OrganizationRequestDTO, trimmed);

    // Map form field name -> UniqueField + optional db column
    switch (name) {
      case 'organizationName':
        checkUniqueness('COMPANY_NAME' as UniqueField, trimmed, 'organizationName', 'company_name');
        break;
      case 'email':
        checkUniqueness('EMAIL' as UniqueField, trimmed, 'email', 'email');
        break;
      case 'contactNumber':
        checkUniqueness('CONTACT_NUMBER' as UniqueField, trimmed, 'contactNumber', 'contact_number');
        break;
      case 'gstNumber':
        checkUniqueness('GST' as UniqueField, trimmed, 'gstNumber', 'gst_number');
        break;
      case 'panNumber':
        checkUniqueness('PAN_NUMBER' as UniqueField, trimmed, 'panNumber', 'pan_number');
        break;
      case 'cinNumber':
        checkUniqueness('CIN_NUMBER' as UniqueField, trimmed, 'cinNumber', 'cin_number');
        break;
      case 'registrationNumber':
        checkUniqueness('REGISTRATION_NUMBER' as UniqueField, trimmed, 'registrationNumber', 'registration_number');
        break;
      case 'accountNumber':
        checkUniqueness('ACCOUNT_NUMBER' as UniqueField, trimmed, 'accountNumber', 'account_number');
        break;
      case 'accountHolderName':
        checkUniqueness('ACCOUNT_HOLDER_NAME' as UniqueField, trimmed, 'accountHolderName', 'account_holder_name');
        break;
      default:
        break;
    }
  };

  // Handle file change - just update state, optionally basic check
  const handleFileChange = (name: 'logo' | 'digitalSignature', file: File | null) => {
    setFormData(prev => ({ ...prev, [name]: file }));
  };

  // IFSC Lookup - called on blur for IFSC field
  const handleIfscLookup = async (ifsc: string) => {
    const code = String(ifsc ?? '').trim().toUpperCase();
    // run local validation first
    validateField('ifscCode', code);

    if (!code || isLookingUp) return;

    setIsLookingUp(true);

    try {
      const res = await employeeService.getIFSCDetails(code);

      if (res?.flag && res.response) {
        const data = res.response;
        const bankName = data.BANK || '';
        const branchName = data.BRANCH || '';

        setFormData(prev => ({
          ...prev,
          bankName,
          branchName,
          ifscCode: code,
        }));

        setSuccess('Bank details auto-filled!');
        // clear any IFSC error if successful
        setErrors(prev => {
          const n = { ...prev };
          delete n['ifscCode'];
          return n;
        });
      } else {
        setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC or lookup failed' }));
      }
    } catch (err: any) {
      console.log('IFSC lookup error', err);
      setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC or lookup failed' }));
    } finally {
      setIsLookingUp(false);
    }
  };

  // Address field change (only update state while typing)
  const handleAddressChange = (index: number, field: keyof AddressModel, value: string) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData(prev => ({ ...prev, addresses: newAddresses }));
  };



  // Add/Remove address
  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, { addressId: null, houseNo: '', streetName: '', city: '', state: '', country: '', pincode: '', addressType: 'OFFICE' as AddressType }],
    }));
  };
  const removeAddress = (index: number) => {
    const updated = [...formData.addresses];
    updated.splice(index, 1);

    setFormData(prev => ({ ...prev, addresses: updated }));

    // Clean errors for that index
    setErrors(prev => {
      const newErr = { ...prev };
      delete newErr[`address_city_${index}`];
      delete newErr[`address_state_${index}`];
      delete newErr[`address_country_${index}`];
      delete newErr[`address_pincode_${index}`];
      return newErr;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ==== BASIC REQUIRED VALIDATION ====
    const requiredFields = [
      formData.organizationName,
      formData.organizationLegalName,
      formData.email,
      formData.contactNumber,
      formData.domain,
      formData.industryType,
      formData.establishedDate,
      formData.currencyCode,
      formData.accountNumber,
      formData.accountHolderName,
      formData.bankName,
      formData.ifscCode,
    ];

    if (requiredFields.some(f => !String(f).trim())) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill all required fields",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const form = new FormData();

      // ===== Append fields =====
      form.append("organizationName", formData.organizationName);
      form.append("organizationLegalName", formData.organizationLegalName);
      form.append("registrationNumber", formData.registrationNumber || "");
      form.append("gstNumber", formData.gstNumber || "");
      form.append("panNumber", formData.panNumber || "");
      form.append("cinNumber", formData.cinNumber || "");
      form.append("website", formData.website || "");
      form.append("email", formData.email);
      form.append("contactNumber", formData.contactNumber);
      form.append("domain", formData.domain);
      form.append("industryType", formData.industryType);
      form.append("establishedDate", formData.establishedDate);
      form.append("timezone", formData.timezone);
      form.append("currencyCode", formData.currencyCode);
      form.append("accountNumber", formData.accountNumber);
      form.append("accountHolderName", formData.accountHolderName);
      form.append("bankName", formData.bankName);
      form.append("ifscCode", formData.ifscCode);
      form.append("branchName", formData.branchName);
      form.append("prefix", formData.prefix || "");
      form.append("sequenceNumber", String(formData.sequenceNumber ?? ""));
      form.append("companyType", formData.companyType || "");

      if (formData.logo) form.append("logo", formData.logo);
      if (formData.digitalSignature) form.append("digitalSignature", formData.digitalSignature);

      formData.addresses.forEach((addr, i) => {
        form.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        form.append(`addresses[${i}].streetName`, addr.streetName || "");
        form.append(`addresses[${i}].city`, addr.city || "");
        form.append(`addresses[${i}].state`, addr.state || "");
        form.append(`addresses[${i}].country`, addr.country || "");
        form.append(`addresses[${i}].pincode`, addr.pincode || "");
        form.append(`addresses[${i}].addressType`, addr.addressType || "OFFICE");
      });

      // ===== API CALL =====
      const response = await organizationService.add(form);

      if (!response.flag) {
        throw response; // pass backend error to catch block
      }

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Organization added successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin-dashboard/organization/list");
    } catch (err: any) {
      console.log("Backend error:", err);

      let backendMessage = "Something went wrong";
      let fieldErrors: Record<string, string> = {};

      // === Backend validation errors (Spring Boot @Valid) ===
      if (err?.fieldErrors) {
        fieldErrors = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([field, msg]) => [
            field,
            Array.isArray(msg) ? msg[0] : msg,
          ])
        );
      }

      // === Custom backend errors → { errors: { field: "msg" } } ===
      if (err?.errors && typeof err.errors === "object") {
        fieldErrors = Object.fromEntries(
          Object.entries(err.errors).map(([field, msg]) => [
            field,
            Array.isArray(msg) ? msg[0] : msg,
          ])
        );
      }

      // Show field errors below inputs
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);

        setTimeout(() => {
          const firstField = Object.keys(fieldErrors)[0];
          const input = document.querySelector(`[name="${firstField}"]`) as HTMLElement;

          input?.scrollIntoView({ behavior: "smooth", block: "center" });
          input?.focus();
        }, 100);

        setIsSubmitting(false);
        return;
      }

      // === Simple backend error message ===
      if (err?.message) backendMessage = err.message;

      Swal.fire({
        icon: "error",
        title: "Error",
        text: backendMessage,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="container mx-auto py-6">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0">
          <BackButton to="/admin-dashboard/organization/list" />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Add Organization
        </h1>
      </div>
      <Card>
        <CardContent>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <Spinner size="lg" />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Organization Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Display name of the organization. Must be unique." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.organizationName = el; }}
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter organization name"
                  maxLength={100}
                />
                {errors.organizationName && <p className="text-red-500 text-xs mt-1">{errors.organizationName}</p>}
                {checking.has('organizationName') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Legal Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Full legal name as registered with government authorities." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.organizationLegalName = el; }}
                  name="organizationLegalName"
                  value={formData.organizationLegalName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter legal name"
                  maxLength={100}
                />
                {errors.organizationLegalName && <p className="text-red-500 text-xs mt-1">{errors.organizationLegalName}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Registration Number<span className="text-red-500">*
                  <TooltipHint hint="Company registration number (e.g., UDYAM-AB-12-0001234, ROC number). Alphanumeric only, converted to uppercase." /></span></Label>
                <Input
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  // onChange={handleChange}
                  onChange={(e) => {
                    // Allow only letters, numbers, and hyphen; convert to uppercase
                    const value = e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
                    e.target.value = value;
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., UDYAM-AB-12-0001234"
                  maxLength={50}
                />
                {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  GST Number <span className="text-red-500">*</span>
                  <TooltipHint hint="15-digit GSTIN (e.g., 22AAAAA0000A1Z5). Automatically converted to uppercase." />
                </Label>
                <Input
                  name="gstNumber"
                  value={formData.gstNumber}
                  // onChange={handleChange}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter GST number"
                  maxLength={15}
                />
                {errors.gstNumber && <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>}
                {checking.has('gstNumber') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  PAN Number <span className="text-red-500">*</span>
                  <TooltipHint hint="10-character PAN (e.g., ABCDE1234F). Automatically converted to uppercase." />
                </Label>
                <Input
                  name="panNumber"
                  value={formData.panNumber}
                  // onChange={handleChange}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  maxLength={10}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter PAN number"
                />
                {errors.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
                {checking.has('panNumber') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  CIN Number <span className="text-red-500">*</span>
                  <TooltipHint hint="21-character Corporate Identity Number (e.g., L12345MH2020PLC123456). Automatically uppercase." />
                </Label>
                <Input
                  name="cinNumber"
                  value={formData.cinNumber}
                  // onChange={handleChange}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter CIN number"
                  maxLength={21}
                />
                {errors.cinNumber && <p className="text-red-500 text-xs mt-1">{errors.cinNumber}</p>}
                {checking.has('cinNumber') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Website
                  <TooltipHint hint="Official website URL (include https://). Example: https://company.com" />

                </Label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://example.com"
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Email <span className="text-red-500">*</span>
                  <TooltipHint hint="Official organization email. Must be unique and in lowercase only." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.email = el; }}
                  name="email"
                  type="email"
                  value={formData.email}
                  // onChange={handleChange}
                  onChange={(e) => {
                    e.target.value = e.target.value.toLowerCase();
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                {checking.has('email') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                  <TooltipHint hint="10-digit Indian mobile number starting with 6-9." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.contactNumber = el; }}
                  name="contactNumber"
                  value={formData.contactNumber}
                  maxLength={10}
                  // onChange={handleChange}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 10-digit mobile"
                />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                {checking.has('contactNumber') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Domain <span className="text-red-500">*</span>
                </Label>
                <Select
                  name="domain"
                  value={formData.domain}
                  onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, domain: val as Domain }));
                    validateField('domain', val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.domain && <p className="text-red-500 text-xs mt-1">{errors.domain}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Industry Type <span className="text-red-500">*</span>
                </Label>

                <Select
                  name="industryType"
                  value={formData.industryType}
                  onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, industryType: val as IndustryType }));
                    validateField("industryType", val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue placeholder="Select Industry Type" />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.entries(INDUSTRY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.industryType && (
                  <p className="text-red-500 text-xs mt-1">{errors.industryType}</p>
                )}
              </div>


              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Established Date <span className="text-red-500">*
                    <TooltipHint hint="Date when the organization was officially incorporated." />
                  </span>
                </Label>
                <Input
                  ref={el => { inputRefs.current.establishedDate = el; }}
                  name="establishedDate"
                  type="date"
                  value={formData.establishedDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.establishedDate && <p className="text-red-500 text-xs mt-1">{errors.establishedDate}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Timezone</Label>
                <Select name="timezone" value={formData.timezone} onValueChange={(val) => setFormData(prev => ({ ...prev, timezone: val }))}>
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Currency Code <span className="text-red-500">*</span>
                </Label>
                <Select name="currencyCode" value={formData.currencyCode} onValueChange={(val) => {
                  setFormData(prev => ({ ...prev, currencyCode: val as CurrencyCode }));
                  validateField('currencyCode', val);
                }}>
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_CODE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currencyCode && <p className="text-red-500 text-xs mt-1">{errors.currencyCode}</p>}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Logo
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {formData.logo && <p className="text-sm text-gray-600">Selected: {formData.logo.name}</p>}
              {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
            </div>

            {/* Bank Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                  <TooltipHint hint="Bank account number (9-18 digits only)." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.accountNumber = el; }}
                  name="accountNumber"
                  value={formData.accountNumber}
                  // onChange={handleChange}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter account number"
                />
                {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                {checking.has('accountNumber') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Account Holder Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Full name as per bank records. Only letters and spaces allowed." />
                </Label>
                <Input
                  ref={el => { inputRefs.current.accountHolderName = el; }}
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => {
                    if (/^[A-Za-z\s]*$/.test(e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="ABC Company Private Limited" />
                {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  IFSC Code <span className="text-red-500">*</span>
                  <TooltipHint hint="11-character IFSC code. Auto-fills bank & branch name on blur." />
                </Label>
                <div className="relative">
                  <Input
                    ref={el => { inputRefs.current.ifscCode = el; }}
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, ifscCode: val }));
                    }}
                    onBlur={() => handleIfscLookup(formData.ifscCode)}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                    placeholder="Enter IFSC (auto-fills bank/branch)"
                  />
                  {isLookingUp && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />}
                </div>
                {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
                {checking.has('ifscCode') && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={el => { inputRefs.current.bankName = el; }}
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="auto-filled"
                  readOnly
                />
                {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Branch Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={el => { inputRefs.current.branchName = el; }}
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="auto-filled"
                  readOnly
                />
                {errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName}</p>}
              </div>
            </div>

            {/* Prefix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="space-y-2">
  <Label className="text-sm font-semibold text-gray-700">
    Prefix <span className="text-red-500">*</span>
    <TooltipHint hint="Invoice or organization prefix (e.g., INV, ORG)" />
  </Label>
  <Input
    name="prefix"
    value={formData.prefix}
    onChange={handleChange}
    onBlur={handleBlur}
    maxLength={10}
    className="h-12"
    placeholder="INV"
  />
  {errors.prefix && <p className="text-red-500 text-xs">{errors.prefix}</p>}
</div>

{/* Sequence Number */}
<div className="space-y-2">
  <Label className="text-sm font-semibold text-gray-700">
    Sequence Number <span className="text-red-500">*</span>
    <TooltipHint hint="Starting sequence number (e.g., 1001)" />
  </Label>
  <Input
    name="sequenceNumber"
    type="number"
    value={formData.sequenceNumber ?? ''}
    onChange={(e) =>
      setFormData(prev => ({
        ...prev,
        sequenceNumber: Number(e.target.value),
      }))
    }
    onBlur={handleBlur}
    className="h-12"
    placeholder="1001"
  />
  {errors.sequenceNumber && <p className="text-red-500 text-xs">{errors.sequenceNumber}</p>}
</div>

{/* Company Type */}
<div className="space-y-2">
  <Label className="text-sm font-semibold text-gray-700">
    Company Type <span className="text-red-500">*</span>
    <TooltipHint hint="e.g. Private Limited, LLP, Partnership" />
  </Label>
  <Input
    name="companyType"
    value={formData.companyType}
    onChange={handleChange}
    onBlur={handleBlur}
    maxLength={50}
    className="h-12"
    placeholder="Private Limited"
  />
  {errors.companyType && <p className="text-red-500 text-xs">{errors.companyType}</p>}
</div>
</div>

            {/* Digital Signature Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Digital Signature</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('digitalSignature', e.target.files?.[0] || null)}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {formData.digitalSignature && <p className="text-sm text-gray-600">Selected: {formData.digitalSignature.name}</p>}
              {errors.digitalSignature && <p className="text-red-500 text-xs mt-1">{errors.digitalSignature}</p>}
            </div>

            {/* ==================== ADDRESSES (OPTIONAL) ==================== */}
            <div className="border-t border-gray-200 pt-10 pb-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <MapPin className="h-7 w-7 text-indigo-600" />
                  Addresses
                  <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </h3>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={addAddress}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-medium shadow-sm"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Address
                </Button>
              </div>
              {formData.addresses.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
                  <MapPin className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
                  <p className="text-xl font-medium text-gray-700">No addresses added yet</p>
                  <p className="text-sm text-gray-500 mt-3">
                    Click the button above to add a registered or office address
                  </p>
                </div>
              )}

              {/* Dynamic Address Forms — Appear only when added */}
              {formData.addresses.map((address, index) => (
                <div
                  key={index}
                  className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                        Address {index + 1}
                        {address.addressType && (
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 shadow-sm">
                            {address.addressType}
                          </span>
                        )}
                      </h4>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddress(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">House No. / Flat</Label>
                        <Input
                          value={address.houseNo || ""}
                          onChange={(e) => handleAddressChange(index, "houseNo", e.target.value)}
                          placeholder="e.g. 221B, Flat 4A"
                          className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Street / Locality</Label>
                        <Input
                          value={address.streetName || ""}
                          onChange={(e) => handleAddressChange(index, "streetName", e.target.value)}
                          placeholder="e.g. Baker Street"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">City</Label>
                        <Input
                          value={address.city || ""}
                          onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                          placeholder="e.g. Mumbai"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">State</Label>
                        <Input
                          value={address.state || ""}
                          onChange={(e) => handleAddressChange(index, "state", e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Pincode</Label>
                        <Input
                          value={address.pincode || ""}
                          onChange={(e) => handleAddressChange(index, "pincode", e.target.value.replace(/\D/g, ''))}
                          placeholder="400001"
                          maxLength={6}
                          className="h-12 font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Country</Label>
                        <Input
                          value={address.country || ""}
                          onChange={(e) => handleAddressChange(index, "country", e.target.value)}
                          placeholder="India"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Address Type</Label>
                        <Select
                          value={address.addressType || ""}
                          onValueChange={(val) => handleAddressChange(index, "addressType", val as AddressType)}
                        >
                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isSubmitting ? 'Adding...' : 'Add Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
