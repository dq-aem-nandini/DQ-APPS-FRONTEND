'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, Plus, Trash2 } from 'lucide-react';
import { organizationService } from '@/lib/api/organizationService';
import { employeeService } from '@/lib/api/employeeService';
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
import { useUniquenessCheck } from '@/hooks/useUniqueCheck';
import { useOrganizationFieldValidation } from '@/hooks/organizationValidator';
import { useFormFieldHandlers } from '@/hooks/useFormFieldHandlers';

const ADDRESS_TYPES: AddressType[] = ['PERMANENT', 'CURRENT', 'OFFICE'];
const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'Asia/Singapore'];

export default function EditOrganizationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id; // string | undefined
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");

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
    prefix: '',
    sequenceNumber: undefined,
    companyType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<OrganizationRequestDTO | null>(null);
  const [success, setSuccess] = useState('');

  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const { validateField } = useOrganizationFieldValidation();

  const {
    handleValidatedChange,
    handleUniqueBlur,
    fieldError,
  } = useFormFieldHandlers(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let formatted = value;

      if (['panNumber', 'gstNumber', 'cinNumber', 'ifscCode'].includes(name)) {
        formatted = value.toUpperCase();
      }
      if (name === 'email') {
        formatted = value.toLowerCase();
      }
      if (name === 'contactNumber' || name === 'accountNumber') {
        formatted = value.replace(/[^0-9]/g, '');
      }
      if (name === 'registrationNumber') {
        formatted = value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
      }
      if (name === 'accountHolderName') {
        formatted = value.replace(/[^A-Za-z\s.,&()-]/g, '');
      }

      setFormData(prev => ({ ...prev, [name]: formatted }));
    },
    setErrors,
    checkUniqueness,
    () => formData,
    validateField
  );

  // Load organization data
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await organizationService.getById(id);

        const loaded: OrganizationRequestDTO = {
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
          industryType: res.industryType ?? 'OTHER',
          domain: res.domain ?? 'OTHER',
          establishedDate: res.establishedDate ?? '',
          timezone: res.timezone ?? 'Asia/Kolkata',
          currencyCode: res.currencyCode ?? 'INR',
          accountNumber: res.accountNumber ?? '',
          accountHolderName: res.accountHolderName ?? '',
          bankName: res.bankName ?? '',
          ifscCode: res.ifscCode ?? '',
          branchName: res.branchName ?? '',
          digitalSignature: null,
          addresses: res.addresses?.map(a => ({
            addressId: a.addressId ?? null,
            houseNo: a.houseNo ?? '',
            streetName: a.streetName ?? '',
            city: a.city ?? '',
            state: a.state ?? '',
            country: a.country ?? '',
            pincode: a.pincode ?? '',
            addressType: a.addressType ?? 'OFFICE' as AddressType,
          })) ?? [],
          prefix: res.prefix ?? '',
          sequenceNumber: res.sequenceNumber ?? undefined,
          companyType: res.companyType ?? '',
        };

        setFormData(loaded);
        setOriginalData(loaded);
        setLogoPreview(res.logoUrl ?? "");
        setSignaturePreview(res.digitalSignatureUrl ?? "");
      } catch (err: any) {
        Swal.fire("Error", "Failed to load organization", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  // IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    const code = String(ifsc ?? '').trim().toUpperCase();

    // Skip if empty, already looking up, or already has error
    if (!code || isLookingUp || errors.ifscCode) return;

    setIsLookingUp(true);

    try {
      const res = await employeeService.getIFSCDetails(code);

      if (res?.flag && res.response) {
        const data = res.response;

        setFormData(prev => ({
          ...prev,
          bankName: data.BANK ?? '',
          branchName: data.BRANCH ?? '',
          ifscCode: code, // store cleaned version
        }));

        setSuccess('Bank details auto-filled!');
        setErrors(prev => {
          const n = { ...prev };
          delete n.ifscCode;
          return n;
        });
      } else {
        setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC or lookup failed' }));
      }
    } catch (err: any) {
      console.error('IFSC lookup error:', err);
      setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC or lookup failed' }));
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddressChange = (index: number, field: keyof AddressModel, value: string) => {
    setFormData(prev => {
      const addrs = [...prev.addresses];
      addrs[index] = { ...addrs[index], [field]: value };
      return { ...prev, addresses: addrs };
    });

    const path = `addresses.${index}.${field}`;
    const error = validateField(path, value, formData);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[path] = error;
      else delete next[path];
      return next;
    });
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { addressId: null, houseNo: '', streetName: '', city: '', state: '', country: '', pincode: '', addressType: 'OFFICE' as AddressType },
      ],
    }));
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));

    setErrors(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.startsWith(`addresses.${index}.`)) delete next[key];
      });
      return next;
    });
  };

  const handleFileChange = (field: 'logo' | 'digitalSignature', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (file) {
      const preview = URL.createObjectURL(file);
      if (field === 'logo') setLogoPreview(preview);
      if (field === 'digitalSignature') setSignaturePreview(preview);
    } else {
      if (field === 'logo') setLogoPreview("");
      if (field === 'digitalSignature') setSignaturePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges || !id) return;

    setSaving(true);
    setErrors({});

    // Client-side validation
    const tempErrors: Record<string, string> = {};

    const fieldsToValidate = [
      "organizationName", "organizationLegalName", "registrationNumber",
      "gstNumber", "panNumber", "cinNumber", "email", "contactNumber",
      "domain", "industryType", "establishedDate", "currencyCode",
      "accountNumber", "accountHolderName", "ifscCode", "prefix",
      "sequenceNumber", "companyType"
    ];

    fieldsToValidate.forEach(name => {
      const value = (formData as any)[name];
      const error = validateField(name, value, formData);
      if (error) tempErrors[name] = error;
    });

    // Validate addresses
    formData.addresses.forEach((addr, idx) => {
      ["city", "state", "country", "pincode"].forEach(sub => {
        const value = (addr as any)[sub];
        const path = `addresses.${idx}.${sub}`;
        const error = validateField(path, value, formData);
        if (error) tempErrors[path] = error;
      });
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      const firstError = Object.keys(tempErrors)[0];
      document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setSaving(false);
      return;
    }

    try {
      const fd = new FormData();

      fd.append("organizationName", formData.organizationName || "");
      fd.append("organizationLegalName", formData.organizationLegalName || "");
      fd.append("registrationNumber", formData.registrationNumber || "");
      fd.append("gstNumber", formData.gstNumber || "");
      fd.append("panNumber", formData.panNumber || "");
      fd.append("cinNumber", formData.cinNumber || "");
      fd.append("website", formData.website || "");
      fd.append("email", formData.email || "");
      fd.append("contactNumber", formData.contactNumber || "");
      fd.append("domain", formData.domain || "");
      fd.append("industryType", formData.industryType || "");
      fd.append("establishedDate", formData.establishedDate || "");
      fd.append("timezone", formData.timezone || "");
      fd.append("currencyCode", formData.currencyCode || "");
      fd.append("accountNumber", formData.accountNumber || "");
      fd.append("accountHolderName", formData.accountHolderName || "");
      fd.append("bankName", formData.bankName || "");
      fd.append("ifscCode", formData.ifscCode || "");
      fd.append("branchName", formData.branchName || "");
      fd.append("prefix", formData.prefix || "");
      fd.append("sequenceNumber", String(formData.sequenceNumber ?? ""));
      fd.append("companyType", formData.companyType || "");

      if (formData.logo) fd.append("logo", formData.logo);
      if (formData.digitalSignature) fd.append("digitalSignature", formData.digitalSignature);

      formData.addresses.forEach((addr, i) => {
        if (addr.addressId) fd.append(`addresses[${i}].addressId`, addr.addressId);
        fd.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        fd.append(`addresses[${i}].streetName`, addr.streetName || "");
        fd.append(`addresses[${i}].city`, addr.city || "");
        fd.append(`addresses[${i}].state`, addr.state || "");
        fd.append(`addresses[${i}].country`, addr.country || "");
        fd.append(`addresses[${i}].pincode`, addr.pincode || "");
        fd.append(`addresses[${i}].addressType`, addr.addressType || "OFFICE");
      });

      const res = await organizationService.update(id, fd);

      if (res.flag) {
        Swal.fire({
          title: "Success",
          text: "Organization updated successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => router.push("/admin-dashboard/organization/list"));
      } else {
        Swal.fire("Error", res.message || "Update failed", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
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
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Organization Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Display name of the organization. Must be unique." />
                  </Label>
                  <Input
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter organization name"
                    maxLength={100}
                    required
                  />
                  {fieldError(errors, "organizationName")}
                </div>

                {/* Legal Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Legal Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full legal name as registered with government authorities." />
                  </Label>
                  <Input
                    name="organizationLegalName"
                    value={formData.organizationLegalName}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter legal name"
                    maxLength={100}
                    required
                  />
                  {fieldError(errors, "organizationLegalName")}
                </div>

                {/* Registration Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Registration Number <span className="text-red-500">*</span>
                    <TooltipHint hint="Company registration number (e.g., UDYAM-AB-12-0001234, ROC number). Alphanumeric only, converted to uppercase." />
                  </Label>
                  <Input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "REGISTRATION_NUMBER",
                        "registration_number",
                        "registrationNumber",
                        id,
                        3
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="e.g., UDYAM-AB-12-0001234"
                    maxLength={50}
                    required
                  />
                  {fieldError(errors, "registrationNumber")}
                </div>

                {/* GST Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    GST Number <span className="text-red-500">*</span>
                    <TooltipHint hint="15-digit GSTIN (e.g., 22AAAAA0000A1Z5). Automatically converted to uppercase." />
                  </Label>
                  <Input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "GST",
                        "gst_number",
                        "gstNumber",
                        id,
                        15
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter GST number"
                    maxLength={15}
                    required
                  />
                  {fieldError(errors, "gstNumber")}
                </div>

                {/* PAN Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    PAN Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-character PAN (e.g., ABCDE1234F). Automatically converted to uppercase." />
                  </Label>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "PAN_NUMBER",
                        "pan_number",
                        "panNumber",
                        id,
                        10
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter PAN number"
                    maxLength={10}
                    required
                  />
                  {fieldError(errors, "panNumber")}
                </div>

                {/* CIN Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    CIN Number <span className="text-red-500">*</span>
                    <TooltipHint hint="21-character Corporate Identity Number (e.g., L12345MH2020PLC123456). Automatically uppercase." />
                  </Label>
                  <Input
                    name="cinNumber"
                    value={formData.cinNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "CIN_NUMBER",
                        "cin_number",
                        "cinNumber",
                        id,
                        21
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter CIN number"
                    maxLength={21}
                    required
                  />
                  {fieldError(errors, "cinNumber")}
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Website
                    <TooltipHint hint="Official website URL (include https://). Example: https://company.com" />
                  </Label>
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="https://example.com"
                  />
                  {fieldError(errors, "website")}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                    <TooltipHint hint="Official organization email. Must be unique and in lowercase only." />
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "EMAIL",
                        "email",
                        "email",
                        id
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter email"
                    required
                  />
                  {fieldError(errors, "email")}
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Contact Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-digit Indian mobile number starting with 6-9." />
                  </Label>
                  <Input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "CONTACT_NUMBER",
                        "contact_number",
                        "contactNumber",
                        id,
                        10
                      )(e);
                    }}
                    maxLength={10}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter 10-digit mobile"
                    required
                  />
                  {fieldError(errors, "contactNumber")}
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Domain <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="domain"
                    value={formData.domain}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, domain: val as Domain }));
                      const error = validateField("domain", val, formData);
                      setErrors(prev => {
                        const next = { ...prev };
                        error ? next.domain = error : delete next.domain;
                        return next;
                      });
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
                  {fieldError(errors, "domain")}
                </div>

                {/* Industry Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Industry Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="industryType"
                    value={formData.industryType}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, industryType: val as IndustryType }));
                      const error = validateField("industryType", val, formData);
                      setErrors(prev => {
                        const next = { ...prev };
                        error ? next.industryType = error : delete next.industryType;
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger className="w-full min-w-[200px] !h-12">
                      <SelectValue placeholder="Select Industry Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INDUSTRY_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError(errors, "industryType")}
                </div>

                {/* Established Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Established Date <span className="text-red-500">*</span>
                    <TooltipHint hint="Date when the organization was officially incorporated." />
                  </Label>
                  <Input
                    name="establishedDate"
                    type="date"
                    value={formData.establishedDate}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  {fieldError(errors, "establishedDate")}
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Timezone</Label>
                  <Select
                    name="timezone"
                    value={formData.timezone}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, timezone: val }))}
                  >
                    <SelectTrigger className="w-full min-w-[200px] !h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Currency Code <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="currencyCode"
                    value={formData.currencyCode}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, currencyCode: val as CurrencyCode }));
                      const error = validateField("currencyCode", val, formData);
                      setErrors(prev => {
                        const next = { ...prev };
                        error ? next.currencyCode = error : delete next.currencyCode;
                        return next;
                      });
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
                  {fieldError(errors, "currencyCode")}
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
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
                    if (file) setLogoPreview(URL.createObjectURL(file));
                    else setLogoPreview("");
                  }}
                  className="h-12 text-base border-gray-300"
                />
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Account Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Account Number <span className="text-red-500">*</span>
                    <TooltipHint hint="Bank account number (9-18 digits only)." />
                  </Label>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber ?? ''}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "ACCOUNT_NUMBER",
                        "account_number",
                        "accountNumber",
                        id,
                        9
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter account number"
                    required
                  />
                  {fieldError(errors, "accountNumber")}
                </div>

                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Account Holder Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full name as per bank records. Only letters and spaces allowed." />
                  </Label>
                  <Input
                    name="accountHolderName"
                    value={formData.accountHolderName ?? ''}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "ACCOUNT_HOLDER_NAME",
                        "account_holder_name",
                        "accountHolderName",
                        id,
                        3
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="ABC Company Private Limited"
                    required
                  />
                  {fieldError(errors, "accountHolderName")}
                </div>

                {/* IFSC Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    IFSC Code <span className="text-red-500">*</span>
                    <TooltipHint hint="11-character IFSC code. Auto-fills bank & branch name on blur." />
                  </Label>

                  <div className="relative">
                    <Input
                      name="ifscCode"
                      value={formData.ifscCode ?? ''}
                      onChange={handleValidatedChange}
                      onBlur={() => handleIfscLookup(formData.ifscCode ?? '')}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10 uppercase"
                      placeholder="Enter IFSC (auto-fills bank/branch)"
                      maxLength={11}
                      required
                    />
                    {isLookingUp && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>

                  {fieldError(errors, "ifscCode")}
                </div>

                {/* Bank Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="bankName"
                    value={formData.bankName ?? ''}
                    readOnly
                    className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                    placeholder="auto-filled"
                    required
                  />
                  {fieldError(errors, "bankName")}
                </div>

                {/* Branch Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="branchName"
                    value={formData.branchName ?? ''}
                    readOnly
                    className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                    placeholder="auto-filled"
                    required
                  />
                  {fieldError(errors, "branchName")}
                </div>
              </div>

              {/* Digital Signature */}
              <div className="space-y-2">
                <Label>Digital Signature</Label>
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
                        setSignaturePreview("");
                      }
                    } else {
                      setSignaturePreview("");
                    }
                  }}
                  className="h-12 text-base border-gray-300"
                />
              </div>

              {/* Addresses */}
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
                  <div key={idx} className="mb-6 p-4 border rounded bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Address {idx + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddress(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>House No.</Label>
                        <Input
                          value={address.houseNo || ""}
                          onChange={(e) => handleAddressChange(idx, "houseNo", e.target.value)}
                          placeholder="e.g. 221B"
                        />
                        {fieldError(errors, `addresses.${idx}.houseNo`)}
                      </div>

                      <div className="space-y-2">
                        <Label>Street Name</Label>
                        <Input
                          value={address.streetName || ""}
                          onChange={(e) => handleAddressChange(idx, "streetName", e.target.value)}
                          placeholder="e.g. Baker Street"
                        />
                        {fieldError(errors, `addresses.${idx}.streetName`)}
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={address.city || ""}
                          onChange={(e) => handleAddressChange(idx, "city", e.target.value)}
                          placeholder="e.g. Mumbai"
                        />
                        {fieldError(errors, `addresses.${idx}.city`)}
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={address.state || ""}
                          onChange={(e) => handleAddressChange(idx, "state", e.target.value)}
                          placeholder="e.g. Maharashtra"
                        />
                        {fieldError(errors, `addresses.${idx}.state`)}
                      </div>

                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input
                          value={address.pincode || ""}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            handleAddressChange(idx, "pincode", digitsOnly);
                          }}
                          maxLength={6}
                          placeholder="e.g. 400001"
                        />
                        {fieldError(errors, `addresses.${idx}.pincode`)}
                      </div>

                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={address.country || ""}
                          onChange={(e) => handleAddressChange(idx, "country", e.target.value)}
                          placeholder="e.g. India"
                        />
                        {fieldError(errors, `addresses.${idx}.country`)}
                      </div>

                      <div className="space-y-2">
                        <Label>Address Type</Label>
                        <Select
                          value={address.addressType || ""}
                          onValueChange={(val) => handleAddressChange(idx, "addressType", val as AddressType)}
                        >
                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_TYPES.map(t => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldError(errors, `addresses.${idx}.addressType`)}
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
                  disabled={saving || !hasChanges || !id}
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