// /app/admin-dashboard/organization/[id]/edit/page.tsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Plus, Trash2 } from 'lucide-react';
import { organizationService } from '@/lib/api/organizationService';
import { employeeService } from '@/lib/api/employeeService';
import { validationService, UniqueField } from '@/lib/api/validationService';
import {adminService} from '@/lib/api/adminService';
// deleteEmployeeAddress
import {
  Domain,
  CurrencyCode,
  OrganizationRequestDTO,
  OrganizationResponseDTO,
  AddressModel,
  AddressType,
  DOMAIN_LABELS,
  CURRENCY_CODE_LABELS,
  IndustryType,
  INDUSTRY_TYPE_LABELS,
} from '@/lib/api/types';
import BackButton from '@/components/ui/BackButton';
import Swal from 'sweetalert2';
import TooltipHint from '@/components/ui/TooltipHint';
import { useMemo as reactUseMemo } from 'react';

const ADDRESS_TYPES: AddressType[] = ['PERMANENT', 'CURRENT', 'OFFICE'];
const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'Asia/Singapore'];

export default function EditOrganizationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentAddrId, setCurrentAddrId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

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
    industryType: 'OTHER' as IndustryType,
    domain: 'OTHER' as Domain,
    establishedDate: '',
    timezone: 'Asia/Kolkata',
    currencyCode: 'INR' as CurrencyCode,
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    digitalSignature: null,
    addresses: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [originalData, setOriginalData] = useState<OrganizationRequestDTO | null>(null);
  // simple patterns
  const patterns = {
    email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
    mobile: /^[6-9]\d{9}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    cin: /^[LPUA][A-Z]{3}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    accountNumber: /^\d{9,18}$/,
    pincode: /^\d{6}$/,
  };

  // load organization on mount
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res: OrganizationResponseDTO = await organizationService.getById(id);
        setCurrentOrgId(res.organizationId || null);
        setLogoPreview(res.logoUrl || "");
        setSignaturePreview(res.digitalSignatureUrl || "");

        // Map response to request DTO shape, keep addresses and fields; file inputs remain null
        const loadedData: OrganizationRequestDTO = {
          organizationName: res.organizationName ?? '',
          organizationLegalName: res.organizationLegalName ?? '',
          registrationNumber: res.registrationNumber ?? '',
          gstNumber: res.gstNumber ?? '',
          panNumber: res.panNumber ?? '',
          cinNumber: res.cinNumber ?? '',
          website: res.website ?? '',
          email: res.email ?? '',
          contactNumber: res.contactNumber ?? '',
          logo: null,
          industryType: res.industryType ?? '',
          domain: (res.domain as Domain) ?? 'OTHER',
          establishedDate: res.establishedDate ?? '',
          timezone: res.timezone ?? 'Asia/Kolkata',
          currencyCode: (res.currencyCode as CurrencyCode) ?? 'INR',
          accountNumber: res.accountNumber ?? '',
          accountHolderName: res.accountHolderName ?? '',
          bankName: res.bankName ?? '',
          ifscCode: res.ifscCode ?? '',
          branchName: res.branchName ?? '',
          digitalSignature: null,
          addresses: (res.addresses ?? []).map((a: any) => ({
            addressId: a.addressId ?? null,
            houseNo: a.houseNo ?? '',
            streetName: a.streetName ?? '',
            city: a.city ?? '',
            state: a.state ?? '',
            country: a.country ?? '',
            pincode: a.pincode ?? '',
            addressType: (a.addressType ?? 'OFFICE') as AddressType,
          })),
        };
        setFormData(loadedData);
       setOriginalData(loadedData);
      } catch (err: any) {
        setError(err?.message || 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const hasChanges = useMemo(() => {
      if (!originalData) return false;
       
       // Simple deep comparison (good enough for most cases)
       return JSON.stringify(formData) !== JSON.stringify(originalData);
     }, [formData, originalData]);

  const handleDeleteAddress = async (idx: number, addressId: string | null) => {
    // If address is not yet saved in backend (newly added)
    if (!addressId) {
      removeAddress(idx);
      return;
    }
  
    if (!currentOrgId) {
      console.error("Organization ID missing");
      return;
    }
  
    try {
      setLoading(true);
  
      await adminService.deleteEmployeeAddress(
        currentOrgId,   // entityId
        addressId       // addressId
      );
  
      // Remove from UI after successful delete
      removeAddress(idx);
    } catch (err: any) {
      setError(err?.message || "Failed to delete address");
    } finally {
      setLoading(false);
    }
  };
  


  // ---------- Handlers ----------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsed: any = value;

    // uppercase PAN & IFSC while typing
    if (name === 'panNumber' || name === 'ifscCode') parsed = value.toUpperCase();

    // addresses.* fields -> addresses.idx.field
    if (name.startsWith('addresses.')) {
      // e.g. addresses.0.city or addresses.1.pincode
      const [, idxStr, field] = name.split('.');
      const idx = parseInt(idxStr, 10);
      setFormData(prev => {
        const addrs = [...prev.addresses];
        const existing = addrs[idx] ?? {
          addressId: null,
          houseNo: '',
          streetName: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          addressType: 'OFFICE' as AddressType,
        };
        addrs[idx] = { ...existing, [field]: parsed };
        return { ...prev, addresses: addrs };
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: parsed }));
  };

  const handleAddressChange = (idx: number, field: keyof AddressModel, val: string) => {
    setFormData(prev => {
      const addrs = [...prev.addresses];
      const existing = addrs[idx] ?? {
        addressId: null,
        houseNo: '',
        streetName: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        addressType: 'OFFICE' as AddressType,
      };
      addrs[idx] = { ...existing, [field]: val };
      return { ...prev, addresses: addrs };
    });
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { addressId: null, houseNo: '', streetName: '', city: '', state: '', country: '', pincode: '', addressType: 'OFFICE' },
      ],
    }));
  };

  const removeAddress = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== idx),
    }));
    // clear any address-related errors
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`addresses.${idx}.city`];
      delete copy[`addresses.${idx}.state`];
      delete copy[`addresses.${idx}.country`];
      delete copy[`addresses.${idx}.pincode`];
      return copy;
    });
  };

  const handleFileChange = (field: 'logo' | 'digitalSignature', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  // ---------- Validation ----------

  const validateField = (name: string, value: string) => {
    const v = value?.trim() ?? '';
    const newErr = { ...errors };
    delete newErr[name];

    // required set (edit page): organizationName, organizationLegalName, email, contactNumber, accountNumber, accountHolderName, bankName, ifscCode
    const requiredCore = [
      'organizationName',
      'organizationLegalName',
      'registrationNumber',
      'gstNumber',
      'panNumber',
      'cinNumber',
      'email',
      'contactNumber',
      'industryType',
      'domain',
      'establishedDate',
      'timezone',
      'currencyCode',
      'accountNumber',
      'accountHolderName',
      'ifscCode',
      'bankName',
      'branchName'
    ];


    if (requiredCore.includes(name) && !v) {
      newErr[name] = 'This field is required';
    }

    if (name === 'email' && v && !patterns.email.test(v)) newErr[name] = 'Invalid email';
    if (name === 'contactNumber' && v && !patterns.mobile.test(v)) newErr[name] = 'Invalid mobile';
    if (name === 'panNumber' && v && !patterns.pan.test(v)) newErr[name] = 'Invalid PAN';
    if (name === 'gstNumber' && v && !patterns.gst.test(v)) newErr[name] = 'Invalid GST';
    if (name === 'cinNumber' && v && !patterns.cin.test(v)) newErr[name] = 'Invalid CIN';
    if (name === 'ifscCode' && v && !patterns.ifsc.test(v)) newErr[name] = 'Invalid IFSC';
    if (name === 'accountNumber' && v && !patterns.accountNumber.test(v)) newErr[name] = '9–18 digits only';
    if ((name === 'domain' || name === 'currencyCode') && !v) {
      newErr[name] = 'This field is required';
    }

    setErrors(newErr);
  };

  // address blur validation (optional — only validate if something provided)
  const validateAddressField = (idx: number, field: keyof AddressModel, value: string) => {
    const key = `addresses.${idx}.${field}`;
    const newErr = { ...errors };
    delete newErr[key];

    const v = String(value ?? '').trim();
    if (field === 'pincode' && v) {
      if (!patterns.pincode.test(v)) newErr[key] = 'Pincode must be 6 digits';
    }
    // city/state/country: if user entered something but blank after trim -> error
    if ((field === 'city' || field === 'state' || field === 'country') && value !== undefined && value !== null) {
      // only error if user explicitly entered blank (we don't require address)
      if (value !== '' && v === '') newErr[key] = `${String(field).charAt(0).toUpperCase() + String(field).slice(1)} cannot be empty`;
    }

    setErrors(newErr);
  };

  // uniqueness check (edit mode) — exclude current org id
  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string,
    excludeId?: string | null
  ) => {
    const val = value.trim();

    // skip if empty, too short, or already checking
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    // add to checking state using Set
    setChecking(prev => {
      const newSet = new Set(prev);
      newSet.add(errorKey);
      return newSet;
    });

    try {
      const isValidExcludeId =
        excludeId && excludeId.trim() !== "" && excludeId.length > 10;

      const mode = isValidExcludeId ? "edit" : "create";

      const result = await validationService.validateField({
        field,
        value: val,
        mode,
        excludeId: isValidExcludeId ? excludeId : undefined,
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
      console.warn("Uniqueness check failed", err);
    } finally {
      // remove from checking
      setChecking(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorKey);
        return newSet;
      });
    }
  };




  // handle blur for generic inputs
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const val = (value ?? "").toString().trim();

    // address.* fields
    if (name.startsWith("addresses.")) {
      const [, idxStr, field] = name.split(".");
      const idx = parseInt(idxStr, 10);
      validateAddressField(idx, field as keyof AddressModel, value as string);
      return;
    }

    // validate field normally
    validateField(name, val);

    // fields that require uniqueness checking
    const uniqueMap: Record<
      string,
      { field: UniqueField; column: string }
    > = {
      organizationName: { field: "COMPANY_NAME", column: "organization_name" },
      email: { field: "EMAIL", column: "email" },
      contactNumber: { field: "CONTACT_NUMBER", column: "contact_number" },
      gstNumber: { field: "GST", column: "gst_number" },
      panNumber: { field: "PAN_NUMBER", column: "pan_number" },
      cinNumber: { field: "CIN_NUMBER", column: "cin_number" },
      registrationNumber: { field: "REGISTRATION_NUMBER", column: "registration_number" },
      accountNumber: { field: "ACCOUNT_NUMBER", column: "account_number" },
    };

    const cfg = uniqueMap[name];

    if (cfg && val.length >= 3) {
      checkUniqueness(
        cfg.field,
        val,
        name,
        cfg.column,
        currentOrgId // <-- EXCLUDE ID APPLIED HERE
      );
    }
  };



  // IFSC lookup
  const handleIfscLookup = async () => {
    const code = (formData.ifscCode ?? '').trim().toUpperCase();

    // validate first
    validateField('ifscCode', code);
    if (!code || isLookingUp) return;

    setIsLookingUp(true);
    try {
      const res = await employeeService.getIFSCDetails(code);

      // Safe null check
      if (res?.flag && res.response !== null) {
        const data = res.response;

        setFormData(prev => ({
          ...prev,
          bankName: data.BANK ?? '',
          branchName: data.BRANCH ?? '',
        }));

        // clear ifsc errors
        setErrors(prev => {
          const copy = { ...prev };
          delete copy.ifscCode;
          return copy;
        });
      } else {
        setErrors(prev => ({ ...prev, ifscCode: "Invalid IFSC or lookup failed" }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, ifscCode: "Invalid IFSC or lookup failed" }));
    } finally {
      setIsLookingUp(false);
    }
  };


  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!hasChanges) {
           return;
        }
    // final basic required checks
    const required = [
      { key: 'organizationName', label: 'Organization Name' },
      { key: 'organizationLegalName', label: 'Legal Name' },
      { key: 'email', label: 'Email' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'gstNumber', label: 'GST Number' },
      { key: 'panNumber', label: 'PAN Number' },
      { key: 'cinNumber', label: 'CIN Number' },
      { key: 'contactNumber', label: 'Contact Number' },
      { key: 'domain', label: 'Domain' },
      { key: 'industryType', label: 'Industry Type' },
      { key: 'establishedDate', label: 'Established Date' },
      { key: 'currencyCode', label: 'Currency Code' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'accountHolderName', label: 'Account Holder Name' },
      { key: 'ifscCode', label: 'IFSC Code' },
      { key: 'bankName', label: 'Bank Name' },
      { key: 'branchName', label: 'Branch Name' },

    ];


    for (const r of required) {
      const val = (formData as any)[r.key];
      if (!val || String(val).trim() === '') {
        setErrors(prev => ({ ...prev, [r.key]: `${r.label} is required` }));
        // focus if possible
        const el = inputRefs.current[r.key];
        if (el) el.focus();
        return;
      }
    }

    // address validation — only validate fields that have been typed (pincode pattern)
    const addrErrs: Record<string, string> = {};
    formData.addresses.forEach((a, idx) => {
      if (a.pincode && !patterns.pincode.test(String(a.pincode))) {
        addrErrs[`addresses.${idx}.pincode`] = 'Pincode must be 6 digits';
      }
    });
    if (Object.keys(addrErrs).length) {
      setErrors(prev => ({ ...prev, ...addrErrs }));
      return;
    }

    setSaving(true);

    try {
      // build multipart form data
      const fd = new FormData();
      const payload = {
        ...formData,
        logo: null,
        digitalSignature: null,
      };
      
      /* ---------- BASIC FIELDS ---------- */
      fd.append("organizationName", formData.organizationName ?? "");
      fd.append("organizationLegalName", formData.organizationLegalName ?? "");
      fd.append("registrationNumber", formData.registrationNumber ?? "");
      fd.append("gstNumber", formData.gstNumber ?? "");
      fd.append("panNumber", formData.panNumber ?? "");
      fd.append("cinNumber", formData.cinNumber ?? "");
      fd.append("website", formData.website ?? "");
      fd.append("email", formData.email ?? "");
      fd.append("contactNumber", formData.contactNumber ?? "");
      fd.append("industryType", formData.industryType ?? "");
      fd.append("domain", formData.domain ?? "");
      fd.append("establishedDate", formData.establishedDate ?? "");
      fd.append("timezone", formData.timezone ?? "");
      fd.append("currencyCode", formData.currencyCode ?? "");
      fd.append("accountNumber", formData.accountNumber ?? "");
      fd.append("accountHolderName", formData.accountHolderName ?? "");
      fd.append("bankName", formData.bankName ?? "");
      fd.append("ifscCode", formData.ifscCode ?? "");
      fd.append("branchName", formData.branchName ?? "");
      
      /* ---------- FILES ---------- */
      if (formData.logo instanceof File) {
        fd.append("logo", formData.logo);
      }
      
      if (formData.digitalSignature instanceof File) {
        fd.append("digitalSignature", formData.digitalSignature);
      }
      
      /* ---------- ADDRESSES ---------- */
      formData.addresses.forEach((addr, index) => {
        if (addr.addressId) {
          fd.append(`addresses[${index}].addressId`, addr.addressId);
        }
      
        fd.append(`addresses[${index}].houseNo`, addr.houseNo ?? "");
        fd.append(`addresses[${index}].streetName`, addr.streetName ?? "");
        fd.append(`addresses[${index}].city`, addr.city ?? "");
        fd.append(`addresses[${index}].state`, addr.state ?? "");
        fd.append(`addresses[${index}].country`, addr.country ?? "");
        fd.append(`addresses[${index}].pincode`, addr.pincode ?? "");
        fd.append(`addresses[${index}].addressType`, addr.addressType ?? "OFFICE");
      });
      
      
      // ✅ STEP 3: send files separately
      if (formData.logo instanceof File) {
        fd.append("logo", formData.logo);
      }
      
      if (formData.digitalSignature instanceof File) {
        fd.append("digitalSignature", formData.digitalSignature);
      }

      // Call update API. According to swagger, organizationId is query param.
      // Assume organizationService.update handles sending form-data with organizationId.
      const res = await organizationService.update(id as string, fd);
      if (res.flag) {
        // setSuccess('Organization updated successfully!');
        // // keep small delay so user sees message then navigate
        // setTimeout(() => router.push('/admin-dashboard/organization/list'), 1200);
        Swal.fire({
          title: "Updated Successfully!",
          text: "Organization details have been saved.",
          icon: "success",
          confirmButtonColor: "#4F46E5",
        }).then(() => {
          router.push("/admin-dashboard/organization/list");
        });

      } else {
        Swal.fire({
          title: "Update Failed",
          text: res.message || "Something went wrong.",
          icon: "error",
          confirmButtonColor: "#DC2626",
        });

      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <BackButton to="/admin-dashboard/organization/list" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Edit Organization
          </h1>
          <div className="w-10" />
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {success && <Alert className="mb-6 text-green-700"><AlertDescription>{success}</AlertDescription></Alert>}
            {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

            <form onSubmit={handleSubmit} className="space-y-10">

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
                  <Label className="text-sm font-semibold text-gray-700">Registration Number<span className="text-red-500">*</span>
                    <TooltipHint hint="Company registration number (e.g., UDYAM-AB-12-0001234, ROC number). Alphanumeric only, converted to uppercase." />
                  </Label>


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
                    maxLength={50} />
                  {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    GST Number<span className="text-red-500">*</span>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    PAN Number<span className="text-red-500">*</span>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    CIN Number<span className="text-red-500">*</span>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Domain<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="domain"
                    value={formData.domain}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, domain: val as Domain }));
                      validateField("domain", val);
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
                      <SelectValue placeholder="Select industry type" />
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
                    Established Date<span className="text-red-500">*</span>
                    <TooltipHint hint="Date when the organization was officially incorporated." />

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
                  <Label className="text-sm font-semibold text-gray-700">Timezone<span className="text-red-500">*</span></Label>
                  <Select
                    name="timezone"
                    value={formData.timezone}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, timezone: val }));
                      validateField("timezone", val); // optional
                    }}
                  >
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
                    Currency Code<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="currencyCode"
                    value={formData.currencyCode}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, currencyCode: val as CurrencyCode }));
                      validateField("currencyCode", val); // ← ADD THIS
                    }}
                  >

                    <SelectTrigger className="w-full min-w-[200px] !h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_CODE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>

                {/* Show preview ONLY if available */}
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-24 h-24 object-cover rounded border shadow-sm mb-2"
                  />
                )}



                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleFileChange("logo", file);

                    if (file) {
                      setLogoPreview(URL.createObjectURL(file));
                    } else {
                      setLogoPreview(""); // clear preview if no file
                    }
                  }}
                  className="h-12 text-base border-gray-300"
                />
              </div>


              {/* Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Account Number<span className="text-red-500">*</span>
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
                    className="h-12 text-base border-gray-300"
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Account Holder Name<span className="text-red-500">*</span>
                    <TooltipHint hint="Full name as per bank records. Only letters and spaces allowed." />
                  </Label>
                  <Input
                    ref={el => { inputRefs.current.accountHolderName = el; }}
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    // onChange={handleChange}
                    onChange={(e) => {
                      if (/^[A-Za-z\s]*$/.test(e.target.value)) {
                        handleChange(e);
                      }
                    }}
                    onBlur={handleBlur}
                    className="h-12 text-base border-gray-300"
                    placeholder="Enter account holder name"
                  />
                  {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                </div>

                <div className="space-y-2">
                  <Label>IFSC Code<span className="text-red-500">*</span>
                    <TooltipHint hint="11-character IFSC code. Auto-fills bank & branch name on blur." />
                  </Label>
                  <div className="relative">
                    <Input
                      ref={el => { inputRefs.current.ifscCode = el; }}
                      name="ifscCode"
                      value={formData.ifscCode}
                      // onChange={handleChange}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData(prev => ({ ...prev, ifscCode: val }));
                      }}
                      onBlur={async () => {
                        validateField('ifscCode', formData.ifscCode);
                        await handleIfscLookup();
                      }}
                      className="h-12 text-base border-gray-300 pr-10"
                      placeholder="Enter IFSC"
                    />
                    {isLookingUp && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />}
                  </div>
                  {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Bank Name<span className="text-red-500">*</span></Label>
                  <Input
                    ref={el => { inputRefs.current.bankName = el; }}
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="h-12 text-base border-gray-300"
                    placeholder="Bank name"
                  />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Branch Name<span className="text-red-500">*</span></Label>
                  <Input
                    ref={el => { inputRefs.current.branchName = el; }}
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="h-12 text-base border-gray-300"
                    placeholder="Branch name"
                  />
                </div>
              </div>
              {/* Digital Signature */}
              {/* <div className="space-y-2">
                <Label>Digital Signature</Label>
                
                {signaturePreview && (
                  signaturePreview.startsWith("blob:") || signaturePreview.match(/\.(png|jpg|jpeg|gif|svg)$/i)
                    ? (
                      <img
                        src={signaturePreview}
                        alt="Digital Signature"
                        className="w-24 h-24 object-cover border rounded mb-2"
                      />
                    )
                    : (
                      <div className="px-3 py-2 bg-gray-100 border rounded text-sm text-gray-600 mb-2">
                        File: {signaturePreview.split("/").pop()}
                      </div>
                    )
                )}
                <Input
                  type="file"
                  accept=".p12,.pfx,.cer,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleFileChange("digitalSignature", file);

                    if (file) {
                      if (file.type.startsWith("image/")) {
                        setSignaturePreview(URL.createObjectURL(file)); // image preview
                      } else {
                        setSignaturePreview(file.name); // non-image -> label only
                      }
                    } else {
                      setSignaturePreview(""); // hide preview
                    }
                  }}
                  className="h-12 text-base border-gray-300"
                />
              </div> */}

                {/* Digital Signature */}
<div className="space-y-2">
  <Label>Digital Signature</Label>

  {/* Show preview ONLY if available */}
  {signaturePreview && (
    <img
      src={signaturePreview}
      alt="Digital Signature Preview"
      className="h-28 object-contain border rounded-xl p-3 bg-white shadow-sm"
    />
  )}

  <Input
    type="file"
    accept=".p12,.pfx,.cer,image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;
      handleFileChange("digitalSignature", file);

      if (file) {
        if (file.type.startsWith("image/")) {
          setSignaturePreview(URL.createObjectURL(file));
        } else {
          setSignaturePreview(""); // no preview for cert files
        }
      } else {
        setSignaturePreview("");
      }
    }}
    className="h-12 text-base border-gray-300"
  />
</div>


              {/* Addresses (optional) */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                    <Plus className="h-4 w-4 mr-1" /> Add Address
                  </Button>
                </div>

                {formData.addresses.length === 0 && (
                  <div className="p-6 text-gray-500 text-center border border-dashed rounded">
                    Click “Add Address” to add address
                  </div>
                )}

                {formData.addresses.map((address, idx) => (
                  console.log('Rendering address', idx, currentOrgId, address.addressId),
                  <div key={idx} className="mb-6 p-4 border rounded bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Address {idx + 1}</h4>
                      <Button type="button" variant="ghost" size="sm"  onClick={() => handleDeleteAddress(idx, address.addressId ?? null)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>House No.</Label>
                        <Input
                          name={`addresses.${idx}.houseNo`}
                          value={address.houseNo || ''}
                          onChange={handleChange}
                          placeholder="e.g. 221B"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Street Name</Label>
                        <Input
                          name={`addresses.${idx}.streetName`}
                          value={address.streetName || ''}
                          onChange={handleChange}
                          placeholder="e.g. Baker Street"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          name={`addresses.${idx}.city`}
                          value={address.city || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="e.g. Mumbai"
                        />
                        {errors[`addresses.${idx}.city`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses.${idx}.city`]}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          name={`addresses.${idx}.state`}
                          value={address.state || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="e.g. Maharashtra"
                        />
                        {errors[`addresses.${idx}.state`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses.${idx}.state`]}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input
                          name={`addresses.${idx}.pincode`}
                          value={address.pincode || ''}
                          maxLength={6}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="e.g. 400001"
                        />
                        {errors[`addresses.${idx}.pincode`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses.${idx}.pincode`]}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          name={`addresses.${idx}.country`}
                          value={address.country || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="e.g. India"
                        />
                        {errors[`addresses.${idx}.country`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses.${idx}.country`]}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Address Type</Label>
                        <Select
                          name={`addresses.${idx}.addressType`}
                          value={address.addressType || ''}
                          onValueChange={(val) => handleAddressChange(idx, 'addressType', val as AddressType)}
                        >
                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button 
         type="submit" 
         disabled={saving || !hasChanges}
         title={!hasChanges ? "No changes made" : ""}
       >
          {saving ? 'Saving...' : 'Update Organization'}
        </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
