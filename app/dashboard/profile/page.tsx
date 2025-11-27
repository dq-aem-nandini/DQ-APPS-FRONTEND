'use client';

import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '@/lib/api/employeeService';
import {
  EmployeeDTO,
  AddressModel,
  BankMaster,
} from '@/lib/api/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Phone, MapPin, DollarSign, FileText, User, Edit3, Save, X, Briefcase, Shield, Building, Upload, Trash2, Download, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { DocumentType, EmployeeDocumentDTO } from '@/lib/api/types';
export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  "OFFER_LETTER", "CONTRACT", "TAX_DECLARATION_FORM", "WORK_PERMIT",
  "PAN_CARD", "AADHAR_CARD", "BANK_PASSBOOK", "TENTH_CERTIFICATE",
  "TWELFTH_CERTIFICATE", "DEGREE_CERTIFICATE", "POST_GRADUATION_CERTIFICATE", "OTHER"
] as const;
// Safe value
const safe = (val: any) => (val === null || val === undefined ? '—' : String(val));

// Format date
const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// Validate address
const isValidAddress = (addr: AddressModel): boolean =>
  !!addr.houseNo && !!addr.streetName && !!addr.city && !!addr.state && !!addr.country && !!addr.pincode && !!addr.addressType;

// Deduplicate addresses
const deduplicateAddresses = (addresses: AddressModel[]): AddressModel[] => {
  const map = new Map<string, AddressModel>();
  addresses.forEach(addr => {
    const key = `${addr.houseNo}-${addr.streetName}-${addr.city}-${addr.state}-${addr.country}-${addr.pincode}-${addr.addressType}`;
    const withId = { ...addr, addressId: addr.addressId || uuidv4() };
    if (!map.has(key)) map.set(key, withId);
  });
  return Array.from(map.values()).filter(isValidAddress);
};

const ProfilePage = () => {
  const { state: { user } } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeDTO | null>(null);
  const [formData, setFormData] = useState<EmployeeDTO | null>(null);
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingAddresses, setDeletingAddresses] = useState<Set<string>>(new Set());

  // Bank search
  const [bankSearch, setBankSearch] = useState('');
  const [bankOptions, setBankOptions] = useState<BankMaster[]>([]);
  const [bankSearchTimeout, setBankSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [documents, setDocuments] = useState<FormDocument[]>([]);
  // IFSC local state (prevents focus loss)
  const [localIfsc, setLocalIfsc] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  interface FormDocument extends EmployeeDocumentDTO {
    fileObj?: File | null;
    tempId?: string;
  }
  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const res = await employeeService.getEmployeeById();
      if (!res?.employeeId) throw new Error('Invalid profile');

      const clean: EmployeeDTO = {
        ...res,
        addresses: (res.addresses || []).map(a => ({ ...a, addressId: a.addressId || uuidv4() })),
        documents: res.documents || [],
        employeeSalaryDTO: res.employeeSalaryDTO || undefined,
        employeeInsuranceDetailsDTO: res.employeeInsuranceDetailsDTO || undefined,
        employeeEquipmentDTO: res.employeeEquipmentDTO || [],
        employeeStatutoryDetailsDTO: res.employeeStatutoryDetailsDTO || undefined,
        employeeEmploymentDetailsDTO: res.employeeEmploymentDetailsDTO || undefined,
        employeeAdditionalDetailsDTO: res.employeeAdditionalDetailsDTO || undefined,
      };

      setProfile(clean);
      setFormData(clean);
      setAddresses(clean.addresses || []);
      setLocalIfsc(clean.ifscCode || ''); // Sync local IFSC
      setDocuments((clean.documents || []).map(d => ({
        ...d,
        fileObj: null,
        tempId: uuidv4(),

      })));
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user, router]);
  const addDocument = () => {
    setDocuments(prev => [...prev, {
      documentId: '',
      docType: 'OTHER' as DocumentType,
      file: '',
      uploadedAt: '',
      verified: false,
      fileObj: null,
      tempId: uuidv4(),
    } as FormDocument]);
  };
  const updateDocument = (index: number, field: 'docType' | 'fileObj', value: any) => {
    setDocuments(prev => prev.map((d, i) =>
      i === index ? { ...d, [field]: value } : d
    ));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };
  // Handle IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    if (isLookingUp || !formData) return;
    setIsLookingUp(true);
    console.log('Looking up IFSC:', ifsc); // DEBUG LOG

    try {
      const res = await employeeService.getIFSCDetails(ifsc);
      console.log('API Response:', res); // SEE EXACT RESPONSE

      if (res.flag && res.response) {
        const data = res.response;

        const bankName = data.BANK;
        const branchName = data.BRANCH;

        console.log('Auto-filling → Bank:', bankName, '| Branch:', branchName);

        setFormData(prev => prev ? {
          ...prev,
          bankName: bankName,
          branchName: branchName,
        } : null);

        setSuccess('Bank details auto-filled!');
        setBankSearch('');
        setBankOptions([]);
      }
    } catch (err: any) {
      console.log('IFSC lookup failed:', err);
    } finally {
      setIsLookingUp(false);
    }
  };


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !profile) return;

    // Only validate 5 required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus', 'nationality'];
    for (const field of requiredFields) {
      if (!formData[field as keyof EmployeeDTO]) {
        setError(`Please fill ${field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' :
          field === 'dateOfBirth' ? 'Date of Birth' : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    setUpdating(true);
    setError(null);

    try {
      const payload = new FormData();

      // Required & basic fields
      payload.append('firstName', formData.firstName);
      payload.append('lastName', formData.lastName);
      payload.append('dateOfBirth', formData.dateOfBirth);
      payload.append('gender', formData.gender);
      payload.append('maritalStatus', formData.maritalStatus);
      payload.append('nationality', formData.nationality);

      // Optional fields
      payload.append('personalEmail', formData.personalEmail || '');
      payload.append('contactNumber', formData.contactNumber || '');
      payload.append('alternateContactNumber', formData.alternateContactNumber || '');
      payload.append('emergencyContactName', formData.emergencyContactName || '');
      payload.append('emergencyContactNumber', formData.emergencyContactNumber || '');
      payload.append('panNumber', formData.panNumber || '');
      payload.append('aadharNumber', formData.aadharNumber || '');
      payload.append('accountNumber', formData.accountNumber || '');
      payload.append('accountHolderName', formData.accountHolderName || '');
      payload.append('bankName', formData.bankName || '');
      payload.append('ifscCode', localIfsc);
      payload.append('branchName', formData.branchName || '');

      // Addresses
      addresses.forEach((addr, i) => {
        if (addr.addressId && !addr.addressId.startsWith('temp-')) {
          payload.append(`addresses[${i}].addressId`, addr.addressId);
        }
        payload.append(`addresses[${i}].houseNo`, addr.houseNo || '');
        payload.append(`addresses[${i}].streetName`, addr.streetName || '');
        payload.append(`addresses[${i}].city`, addr.city || '');
        payload.append(`addresses[${i}].state`, addr.state || '');
        payload.append(`addresses[${i}].country`, addr.country || '');
        payload.append(`addresses[${i}].pincode`, addr.pincode || '');
        payload.append(`addresses[${i}].addressType`, addr.addressType || '');
      });

      // Documents - only new uploads
      documents
        .filter(d => d.fileObj instanceof File)
        .forEach((doc, i) => {
          if (doc.documentId) payload.append(`documents[${i}].documentId`, doc.documentId);
          payload.append(`documents[${i}].docType`, doc.docType);
          payload.append(`documents[${i}].file`, doc.fileObj!);
        });

      const res = await employeeService.submitUpdateRequest(payload);
      if (!res.flag) throw new Error(res.message || 'Update failed');

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your update request has been sent to admin.',
        confirmButtonColor: '#4F46E5',
      });

      await fetchProfile();
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setUpdating(false);
    }
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const normalizedValue = name === 'gender' || name === 'maritalStatus'
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : value;

    setFormData(prev => prev ? { ...prev, [name]: normalizedValue } : null);
  };
  const addAddress = () => {
    const newAddr: AddressModel = {
      addressId: `temp-${uuidv4()}`,
      houseNo: '',
      streetName: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      addressType: undefined,
    };
    setAddresses(prev => [...prev, newAddr]);
  };

  const updateAddress = (i: number, field: keyof AddressModel, value: string) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const removeAddress = async (index: number) => {
    const address = addresses[index];
    const addressId = address.addressId;

    if (!addressId || addressId.startsWith('temp-')) {
      setAddresses(prev => prev.filter((_, i) => i !== index));
      return;
    }

    setDeletingAddresses(prev => new Set(prev).add(addressId));
    try {
      await employeeService.deleteEmployeeAddressGlobal(profile!.employeeId, addressId);
      setAddresses(prev => prev.filter((_, i) => i !== index));
      setSuccess('Address removed successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingAddresses(prev => {
        const next = new Set(prev);
        next.delete(addressId);
        return next;
      });
    }
  };

  // Sync localIfsc when profile loads
  useEffect(() => {
    if (profile?.ifscCode) {
      setLocalIfsc(profile.ifscCode);
    }
  }, [profile?.ifscCode]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Live Bank Search
  useEffect(() => {
    if (bankSearch.length < 2) {
      setBankOptions([]);
      return;
    }

    if (bankSearchTimeout) clearTimeout(bankSearchTimeout);

    const timeout = setTimeout(async () => {
      try {
        const res = await employeeService.searchBankMaster(bankSearch);
        if (res.flag && res.response) {
          const filtered = res.response.filter(bank =>
            !formData?.bankName || bank.bankName.toLowerCase() !== formData.bankName.toLowerCase()
          );
          setBankOptions(filtered.slice(0, 10));
        }
      } catch (err) {
        setBankOptions([]);
      }
    }, 300);

    setBankSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [bankSearch, formData?.bankName]);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div></div>;
  if (error && !profile) return <div className="container mx-auto p-6"><div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl"><p>{error}</p><button onClick={fetchProfile} className="mt-3 px-5 py-2 bg-red-600 text-white rounded-lg">Retry</button></div></div>;
  if (!profile || !formData) return <div className="container mx-auto p-6 text-gray-500">No profile data</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3"><User className="w-8 h-8" />{profile.firstName} {profile.lastName}</h1>
                <p className="opacity-90 mt-1">{profile.designation?.replace('_', ' ')}</p>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition shadow-lg">
                  <Edit3 className="w-5 h-5" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex justify-between items-center">
                <span className="font-medium">{success}</span>
                <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800"><X className="w-5 h-5" /></button>
              </div>
            )}

            {editing ? (
              // EDIT MODE
              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Personal Information */}
                <Card title="Personal Information" icon={<User className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* REQUIRED FIELDS WITH RED STAR */}
                    <Input label="First Name" name="firstName" value={formData.firstName} onChange={onChange} required />
                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={onChange} required />
                    <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={onChange} required />
                    <Select label="Gender" name="gender" value={formData.gender || ''} onChange={onChange} options={['MALE', 'FEMALE', 'OTHER']} required />
                    <Select label="Marital Status" name="maritalStatus" value={formData.maritalStatus || ''} onChange={onChange} options={['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']} required />
                    <Input label="Nationality" name="nationality" value={formData.nationality} onChange={onChange} required />

                    {/* OPTIONAL FIELDS */}
                    <Input label="Personal Email Address" name="personalEmail" type="email" value={formData.personalEmail} onChange={onChange} />
                    <Input label="Primary Contact Number" name="contactNumber" value={formData.contactNumber} onChange={onChange} pattern="[0-9]{10}" />
                    <Input label="Alternate Contact Number" name="alternateContactNumber" value={formData.alternateContactNumber} onChange={onChange} pattern="[0-9]{10}" />
                    <Input label="Number of Children" name="numberOfChildren" type="number" value={formData.numberOfChildren} onChange={onChange} min="0" />

                  </div>
                </Card>

                {/* Emergency Contact */}
                <Card title="Emergency Contact" icon={<Phone className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={onChange} />
                    <Input label="Emergency Contact Number" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={onChange} pattern="[0-9]{10}" />
                  </div>
                </Card>

                {/* Bank Details */}
                <Card title="Bank Details" icon={<DollarSign className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={onChange} pattern="[A-Z0-9]{10}" />
                    <Input label="Aadhaar Number" name="aadharNumber" value={formData.aadharNumber} onChange={onChange} pattern="[0-9]{12}" />

                    {/* IFSC Code */}
                    <div className="relative">
                      <Input
                        label="IFSC Code"
                        value={localIfsc ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                          setLocalIfsc(val);
                          if (val.length === 11) handleIfscLookup(val);
                        }}
                        placeholder="HDFC0000123"
                        maxLength={11}
                        autoComplete="off"
                      />
                      {(localIfsc?.length ?? 0) === 11 && (
                        <div className="absolute right-3 top-10 text-green-600 text-xs font-medium pointer-events-none">
                          Valid
                        </div>
                      )}
                    </div>

                    {/* Bank Name Search */}
                    <div className="relative">
                      <Input
                        label="Bank Name"
                        name="bankName"
                        value={formData.bankName || ''}
                        onChange={(e) => { onChange(e); setBankSearch(e.target.value); }}
                        onFocus={() => formData.bankName && setBankSearch(formData.bankName)}
                        placeholder="Type to search bank..."
                        autoComplete="off"
                      />
                      {bankSearch && bankOptions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 top-full bg-white border border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          {bankOptions.map((bank) => (
                            <button
                              key={bank.bankCode}
                              type="button"
                              onClick={() => {
                                setFormData(prev => prev ? { ...prev, bankName: bank.bankName } : null);
                                setBankSearch('');
                                setBankOptions([]);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition font-medium"
                            >
                              {bank.bankName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={onChange} />
                    <Input label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={onChange} />
                    <Input label="Branch Name" name="branchName" value={formData.branchName || ''} onChange={onChange} />
                  </div>
                </Card>

                {/* Addresses */}
                <Card title="Addresses" icon={<MapPin className="w-5 h-5" />}>
                  {addresses.map((addr, i) => (
                    <div key={addr.addressId} className="border rounded-xl p-5 mb-5 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-700">Address {i + 1}</h4>
                        <button type="button" onClick={() => removeAddress(i)} className="text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="House Number" value={addr.houseNo || ''} onChange={(e) => updateAddress(i, 'houseNo', e.target.value)} />
                        <Input label="Street Name" value={addr.streetName || ''} onChange={(e) => updateAddress(i, 'streetName', e.target.value)} />
                        <Input label="City" value={addr.city || ''} onChange={(e) => updateAddress(i, 'city', e.target.value)} />
                        <Input label="State" value={addr.state || ''} onChange={(e) => updateAddress(i, 'state', e.target.value)} />
                        <Input label="Country" value={addr.country || ''} onChange={(e) => updateAddress(i, 'country', e.target.value)} />
                        <Input label="PIN Code" value={addr.pincode || ''} onChange={(e) => updateAddress(i, 'pincode', e.target.value)} />
                        <Select
                          label="Address Type"
                          value={addr.addressType ?? ''}
                          onChange={(e) => updateAddress(i, 'addressType', e.target.value)}
                          options={['PERMANENT', 'CURRENT']}
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addAddress} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Add Address
                  </button>
                </Card>

                {/* Upload Documents */}
                <Card title="Upload Documents" icon={<Upload className="w-5 h-5" />}>
                  {documents.map((doc, i) => (
                    <div
                      key={doc.tempId || doc.documentId}
                      className="flex flex-wrap items-end gap-4 p-5 bg-gray-50 rounded-xl mb-4 border border-gray-200"
                    >
                      {/* Document Type */}
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          label="Document Type"
                          value={doc.docType}
                          onChange={(e) => updateDocument(i, 'docType', e.target.value as DocumentType)}
                          options={DOCUMENT_TYPE_OPTIONS}
                        />
                      </div>

                      {/* File Input */}
                      <div className="flex-1 min-w-[280px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => updateDocument(i, 'fileObj', e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                        />
                      </div>

                      {/* Current File or Selected File */}
                      <div className="flex-1 min-w-[200px]">
                        {doc.fileObj ? (
                          <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{doc.fileObj.name}</span>
                          </div>
                        ) : doc.file ? (
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Current File
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm italic">No file selected</span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeDocument(i)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Document Button */}
                  <button
                    type="button"
                    onClick={addDocument}
                    className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Add Another Document
                  </button>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setAddresses(profile.addresses.map(a => ({ ...a })));
                      setFormData({ ...profile });
                      setLocalIfsc(profile.ifscCode || '');
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {updating ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE - SAME AS BEFORE */
              <div className="space-y-8">
                <InfoCard title="Personal" icon={<User className="w-6 h-6 text-blue-600" />}>
                  <Info label="Full Name" value={`${profile.firstName} ${profile.lastName}`} required />
                  <Info label="Date of Birth" value={formatDate(profile.dateOfBirth)} required />
                  <Info label="Gender" value={profile.gender} required />
                  <Info label="Marital Status" value={profile.maritalStatus} required />
                  <Info label="Nationality" value={profile.nationality} required />

                  <Info label="Number of Children" value={profile.numberOfChildren} />
                  <Info label="Personal Email Address" value={profile.personalEmail} />
                  <Info label="Company Email Address" value={profile.companyEmail} />
                  <Info label="Primary Contact Number" value={profile.contactNumber} />
                  <Info label="Alternate Contact Number" value={profile.alternateContactNumber} />
                </InfoCard>

                <InfoCard title="Professional" icon={<Briefcase className="w-6 h-6 text-indigo-600" />}>
                  <Info label="Designation" value={profile.designation?.replace('_', ' ')} />
                  <Info label="Date of Joining" value={formatDate(profile.dateOfJoining)} />
                  <Info label="Employment Type" value={profile.employmentType} />
                  <Info label="Client Name" value={profile.clientName} />
                  <Info label="Reporting Manager" value={profile.reportingManagerName} />
                </InfoCard>

                <InfoCard title="Emergency Contact" icon={<Phone className="w-6 h-6 text-red-600" />}>
                  <Info label="Emergency Contact Name" value={profile.emergencyContactName} />
                  <Info label="Emergency Contact Number" value={profile.emergencyContactNumber} />
                </InfoCard>

                <InfoCard title="Bank Details" icon={<DollarSign className="w-6 h-6 text-green-600" />}>
                  <Info label="PAN Number" value={profile.panNumber} />
                  <Info label="Aadhaar Number" value={profile.aadharNumber} />
                  <Info label="Bank Name" value={profile.bankName} />
                  <Info label="Account Number" value={profile.accountNumber} />
                  <Info label="Account Holder Name" value={profile.accountHolderName} />
                  <Info label="IFSC Code" value={profile.ifscCode} />
                  <Info label="Branch Name" value={profile.branchName} />
                </InfoCard>

                <InfoCard title="Addresses" icon={<MapPin className="w-6 h-6 text-purple-600" />}>
                  {profile.addresses.length > 0 ? (
                    profile.addresses.map((a, i) => (
                      <div key={a.addressId} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-4">
                        <p className="font-semibold text-blue-900">{a.addressType} Address</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {a.houseNo}, {a.streetName}, {a.city}, {a.state} - {a.pincode}, {a.country}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No addresses added</p>
                  )}
                </InfoCard>

                {profile.documents && profile.documents.length > 0 && (
                  <InfoCard title="Documents" icon={<FileText className="w-6 h-6 text-indigo-600" />}>
                    <div className="space-y-3">
                      {profile.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl">
                          <div>
                            <p className="font-medium">{doc.docType.replace(/_/g, ' ')}</p>
                          </div>

                          {doc.file ? (
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                            >
                              <Eye className="w-5 h-5" />
                              <span className="text-sm">View</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm italic">No file</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}


                {profile.employeeSalaryDTO && (
                  <InfoCard title="Salary" icon={<DollarSign className="w-6 h-6 text-green-600" />}>
                    <Info label="CTC" value={`₹${profile.employeeSalaryDTO.ctc}`} />
                    <Info label="Pay Type" value={profile.employeeSalaryDTO.payType} />
                    <Info label="Standard Working Hours" value={profile.employeeSalaryDTO.standardHours} />
                    <Info label="Pay Class" value={profile.employeeSalaryDTO.payClass} />

                    {profile.employeeSalaryDTO.allowances && profile.employeeSalaryDTO.allowances.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="font-medium text-green-700 mb-2">Allowances</p>
                        {profile.employeeSalaryDTO.allowances.map((a, i) => (
                          <p key={i} className="text-sm">• {a.allowanceType}: ₹{a.amount}</p>
                        ))}
                      </div>
                    )}
                    {profile.employeeSalaryDTO.deductions && profile.employeeSalaryDTO.deductions.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="font-medium text-red-700 mb-2">Deductions</p>
                        {profile.employeeSalaryDTO.deductions.map((d, i) => (
                          <p key={i} className="text-sm">• {d.deductionType}: ₹{d.amount}</p>
                        ))}
                      </div>
                    )}
                  </InfoCard>
                )}

                {profile.employeeInsuranceDetailsDTO && (
                  <InfoCard title="Insurance" icon={<Shield className="w-6 h-6 text-teal-600" />}>
                    <Info label="Policy Number" value={profile.employeeInsuranceDetailsDTO.policyNumber} />
                    <Info label="Insurance Provider" value={profile.employeeInsuranceDetailsDTO.providerName} />
                    <Info label="Coverage Period" value={`${formatDate(profile.employeeInsuranceDetailsDTO.coverageStart)} to ${formatDate(profile.employeeInsuranceDetailsDTO.coverageEnd)}`} />
                    <Info label="Nominee Details" value={`${profile.employeeInsuranceDetailsDTO.nomineeName} (${profile.employeeInsuranceDetailsDTO.nomineeRelation})`} />
                    <Info label="Nominee Contact Number" value={profile.employeeInsuranceDetailsDTO.nomineeContact} />
                    <Info label="Group Insurance" value={profile.employeeInsuranceDetailsDTO.groupInsurance ? 'Yes' : 'No'} />

                  </InfoCard>
                )}

                {profile.employeeEquipmentDTO && profile.employeeEquipmentDTO.length > 0 && (
                  <InfoCard title="Equipment" icon={<Building className="w-6 h-6 text-orange-600" />}>
                    {profile.employeeEquipmentDTO.map((eq, i) => (
                      <div key={i} className="bg-orange-50 p-4 rounded-xl text-sm">
                        <strong>{eq.equipmentType}</strong>: {eq.serialNumber} <br />
                        <span className="text-gray-600">Issued: {formatDate(eq.issuedDate || '')}</span>
                      </div>
                    ))}
                  </InfoCard>
                )}

                {profile.employeeStatutoryDetailsDTO && (
                  <InfoCard title="Statutory" icon={<FileText className="w-6 h-6 text-gray-600" />}>
                    <Info label="Passport Number" value={profile.employeeStatutoryDetailsDTO.passportNumber} />
                    <Info label="Tax Regime" value={profile.employeeStatutoryDetailsDTO.taxRegime} />
                    <Info label="PF UAN Number" value={profile.employeeStatutoryDetailsDTO.pfUanNumber} />
                    <Info label="ESI Number" value={profile.employeeStatutoryDetailsDTO.esiNumber} />
                    <Info label="SSN Number" value={profile.employeeStatutoryDetailsDTO.ssnNumber} />

                  </InfoCard>
                )}

                {profile.employeeEmploymentDetailsDTO && (
                  <InfoCard title="Employment Details" icon={<Briefcase className="w-6 h-6 text-purple-600" />}>
                    <Info label="Department" value={profile.employeeEmploymentDetailsDTO.department} />
                    <Info label="Work Location" value={profile.employeeEmploymentDetailsDTO.location} />
                    <Info label="Working Model" value={profile.employeeEmploymentDetailsDTO.workingModel} />
                    <Info label="Shift Timing" value={profile.employeeEmploymentDetailsDTO.shiftTiming} />
                    <Info label="Notice Period Duration" value={profile.employeeEmploymentDetailsDTO.noticePeriodDuration} />

                  </InfoCard>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const Card = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
    <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">{icon}{title}</h3>
    {children}
  </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
    <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">{icon}{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">{children}</div>
  </div>
);

const Input = ({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-600 ml-1 font-bold">*</span>}
    </label>
    <input
      {...props}
      required={required}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    />
  </div>
);
const Select = ({
  label,
  options,
  required,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[]
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-600 ml-1 font-bold">*</span>}
    </label>
    <select
      {...props}
      required={required}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0) + opt.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  </div>
);
const Info = ({ label, value, required }: { label: string; value?: any; required?: boolean }) => (
  <div>
    <p className="text-gray-600 font-medium">
      {label}
      {required && <span className="text-red-600 ml-1 font-bold">*</span>}
    </p>
    <p className="font-bold text-gray-900 mt-1">
      {safe(value)}
    </p>
  </div>
);

export default ProfilePage;