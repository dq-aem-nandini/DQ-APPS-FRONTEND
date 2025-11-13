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
import { Phone, MapPin, DollarSign, FileText, User, Edit3, Save, X, Briefcase, Shield, Building } from 'lucide-react';
import Swal from 'sweetalert2';

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

  // IFSC local state (prevents focus loss)
  const [localIfsc, setLocalIfsc] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user || user.role !== 'EMPLOYEE') {
      router.push('/auth/login');
      return;
    }

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
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

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

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const merged = deduplicateAddresses([...profile.addresses, ...addresses]);
      if (addresses.length > 0 && merged.length === 0) throw new Error('Complete all address fields');

      const payload: Partial<EmployeeDTO> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        personalEmail: formData.personalEmail,
        contactNumber: formData.contactNumber,
        alternateContactNumber: formData.alternateContactNumber,
        gender: formData.gender,
        companyEmail: formData.companyEmail,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: formData.numberOfChildren,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        panNumber: formData.panNumber,
        aadharNumber: formData.aadharNumber,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        ifscCode: localIfsc, // Use localIfsc (always up to date)
        branchName: formData.branchName,
        employeePhotoUrl: formData.employeePhotoUrl,
        addresses: merged.map(addr => {
          const { addressId, ...rest } = addr;
          return addressId && !addressId.startsWith('temp-') ? addr : rest;
        }),
      };

      const res = await employeeService.submitUpdateRequest(payload);
      if (!res.flag) throw new Error(res.message || "Failed to submit update request");

      await Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "Your update request has been sent to the admin for review.",
        confirmButtonColor: "#4F46E5",
      });
      await fetchProfile(); // THIS IS THE KEY
      setEditing(false);
      // setSuccess('Update request sent successfully!');
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setUpdating(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
    console.log('localIfsc:', value, 'formData.ifscCode:', formData?.ifscCode);
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
              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Personal Info */}
                <Card title="Personal Information" icon={<User className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="First Name" name="firstName" value={formData.firstName} onChange={onChange} required />
                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={onChange} required />
                    <Input label="Personal Email Address" name="personalEmail" type="email" value={formData.personalEmail} onChange={onChange} required />
                    <Input label="Primary Contact Number" name="contactNumber" value={formData.contactNumber} onChange={onChange} pattern="[0-9]{10}" required />
                    <Input label="Alternate Contact Number" name="alternateContactNumber" value={formData.alternateContactNumber} onChange={onChange} pattern="[0-9]{10}" />
                    <Select label="Gender" name="gender" value={formData.gender} onChange={onChange} options={['Male', 'Female', 'Other']} required />
                    <Select label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={onChange} options={['Single', 'Married', 'Divorced']} required />
                    <Input label="Number of Children" name="numberOfChildren" type="number" value={formData.numberOfChildren} onChange={onChange} min="0" required />
                    <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={onChange} required />
                    <Input label="Nationality" name="nationality" value={formData.nationality} onChange={onChange} required />
                  </div>
                </Card>

                {/* Emergency Contact */}
                <Card title="Emergency Contact" icon={<Phone className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={onChange} required />
                    <Input label="Emergency Contact Number" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={onChange} pattern="[0-9]{10}" required />
                  </div>
                </Card>

                {/* Bank Details - FINAL FIXED */}
                <Card title="Bank Details" icon={<DollarSign className="w-5 h-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={onChange} pattern="[A-Z0-9]{10}" required />
                    <Input label="Aadhaar Number" name="aadharNumber" value={formData.aadharNumber} onChange={onChange} pattern="[0-9]{12}" required />

                    {/* IFSC Code - NO FOCUS LOSS EVER (FINAL) */}
                    <div className="relative">
                      <Input
                        label="IFSC Code"
                        value={localIfsc ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                          setLocalIfsc(val);

                          // ONLY CALL API, DO NOT TOUCH formData YET
                          if (val.length === 11) {
                            console.log('IFSC complete, calling lookup...');
                            handleIfscLookup(val);
                          }
                        }}
                        placeholder="HDFC0000123"
                        maxLength={11}
                        autoComplete="off"
                        required
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
                        onChange={(e) => {
                          onChange(e);
                          setBankSearch(e.target.value);
                        }}
                        onFocus={() => formData.bankName && setBankSearch(formData.bankName)}
                        placeholder="Type to search bank..."
                        autoComplete="off"
                        required
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
                                setTimeout(() => {
                                  const input = document.querySelector('input[name="bankName"]') as HTMLInputElement | null;
                                  input?.focus();
                                }, 0);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition font-medium"
                            >
                              {bank.bankName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={onChange} required />
                    <Input label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={onChange} required />
                    <Input label="Branch Name" name="branchName" value={formData.branchName || ''} onChange={onChange} required />
                  </div>
                </Card>

                {/* Photo, Addresses, Submit */}
                <Card title="Photo" icon={<FileText className="w-5 h-5" />}>
                  <Input label="Employee Photo URL" name="employeePhotoUrl" value={formData.employeePhotoUrl} onChange={onChange} />
                </Card>

                <Card title="Addresses" icon={<MapPin className="w-5 h-5" />}>
                  {addresses.map((addr, i) => (
                    <div key={addr.addressId} className="border rounded-xl p-5 mb-5 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-700">Address {i + 1}</h4>
                        <button type="button" onClick={() => removeAddress(i)} disabled={!!addr.addressId && deletingAddresses.has(addr.addressId)} className="text-red-600 hover:text-red-800 disabled:text-gray-400">
                          {deletingAddresses.has(addr.addressId!) ? 'Deleting...' : 'Remove'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="House Number" value={addr.houseNo} onChange={(e) => updateAddress(i, 'houseNo', e.target.value)} required />
                        <Input label="Street Name" value={addr.streetName} onChange={(e) => updateAddress(i, 'streetName', e.target.value)} required />
                        <Input label="City" value={addr.city} onChange={(e) => updateAddress(i, 'city', e.target.value)} required />
                        <Input label="State" value={addr.state} onChange={(e) => updateAddress(i, 'state', e.target.value)} required />
                        <Input label="Country" value={addr.country} onChange={(e) => updateAddress(i, 'country', e.target.value)} required />
                        <Input label="PIN Code" value={addr.pincode} onChange={(e) => updateAddress(i, 'pincode', e.target.value)} required />
                        <Select
                          label="Address Type"
                          value={addr.addressType ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateAddress(i, 'addressType', e.target.value)
                          }
                          options={['PERMANENT', 'CURRENT']}
                          required
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addAddress} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Add Address
                  </button>
                </Card>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button type="button" onClick={() => { setEditing(false); setAddresses(profile.addresses.map(a => ({ ...a }))); setFormData({ ...profile }); setLocalIfsc(profile.ifscCode || ''); }} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={updating} className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-5 h-5" /> {updating ? 'Submitting...' : 'Update Request'}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE - SAME AS BEFORE */
              <div className="space-y-8">
                <InfoCard title="Personal" icon={<User className="w-6 h-6 text-blue-600" />}>
                  <Info label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
                  <Info label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                  <Info label="Gender" value={profile.gender} />
                  <Info label="Marital Status" value={profile.maritalStatus} />
                  <Info label="Number of Children" value={profile.numberOfChildren} />
                  <Info label="Nationality" value={profile.nationality} />
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

const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <input {...props} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${className}`} value={props.value ?? ''} />
  </div>
);

// const Select = ({ label, options, ...props }: any) => (
//   <div>
//     <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
//     <select className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" {...props}>
//       <option value="">Select</option>
//       {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
//     </select>
//   </div>
// );
const Select = ({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <select
      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      {...props}
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Info = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <p className="text-gray-600 font-medium">{label}</p>
    <p className="font-bold text-gray-900 mt-1">{safe(value)}</p>
  </div>
);

export default ProfilePage;