'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import {
  EmployeeModel,
  ClientDTO,
  Designation,
  DocumentType,
  EmploymentType,
  EmployeeDocumentDTO,
  EmployeeEquipmentDTO,
  AllowanceDTO, DeductionDTO,
  EmployeeDTO,
  Department,
  NoticePeriodDuration,
  ProbationDuration,
  ProbationNoticePeriod,
  BondDuration,
  ShiftTiming,
  PayType,
  PayClass,
  WorkingModel,
  PAY_CLASS_OPTIONS,
  WORKING_MODEL_OPTIONS,
  DEPARTMENT_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
  PROBATION_DURATION_OPTIONS,
  PROBATION_NOTICE_OPTIONS,
  BOND_DURATION_OPTIONS,
  SHIFT_TIMING_OPTIONS,
  PAY_TYPE_OPTIONS
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, IndianRupee, Briefcase } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
interface Manager {
  id: string;
  name: string;
}
// Form-only document type (has `file`)
interface FormDocument extends EmployeeDocumentDTO {
  file?: File | null;
}
// ────── Custom File Input (Choose file / No file chosen) ──────
type FileInputProps = {
  id: string;
  onChange: (file: File | null) => void;
  currentFile?: File | null;
  existingUrl?: string;
  onClear?: () => void;
};
const FileInput: React.FC<FileInputProps> = ({ id, onChange, currentFile, existingUrl, onClear }) => {
  const [fileName, setFileName] = useState<string>('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? '');
    onChange(file);
  };
  const displayName = fileName || (existingUrl ? existingUrl.split('/').pop() : 'No file chosen');
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
      >
        Choose file
        <input id={id} type="file" className="hidden" onChange={handleChange} />
      </label>
      <span className="text-sm text-gray-600 truncate max-w-[180px]">{displayName}</span>
      {(currentFile || existingUrl) && onClear && (
        <button type="button" onClick={onClear} className="text-red-600 hover:underline text-sm">
          Remove
        </button>
      )}
    </div>
  );
};
const EditEmployeePage = () => {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [formData, setFormData] = useState<EmployeeModel>({
    firstName: '',
    lastName: '',
    personalEmail: '',
    companyEmail: '',
    contactNumber: '',
    alternateContactNumber: '',
    gender: '',
    maritalStatus: '',
    numberOfChildren: 0,
    employeePhotoUrl: '',
    nationality: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    remarks: '',
    skillsAndCertification: '',
    clientId: '',
    clientSelection: '',
    reportingManagerId: '',
    designation: '' as Designation,
    dateOfBirth: '',
    dateOfJoining: '',
    rateCard: 0,
    employmentType: 'FULLTIME' as EmploymentType,
    panNumber: '',
    aadharNumber: '',
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    addresses: [],
    documents: [] as FormDocument[],
    employeeSalaryDTO: {
      employeeId: '',
      basicPay: 0,
      payType: 'MONTHLY' as PayType,
      standardHours: 40,
      bankAccountNumber: '',
      ifscCode: '',
      payClass: 'A1' as PayClass,
      allowances: [] as AllowanceDTO[],
      deductions: [] as DeductionDTO[],
    },
    employeeAdditionalDetailsDTO: {
      offerLetterUrl: '',
      contractUrl: '',
      taxDeclarationFormUrl: '',
      workPermitUrl: '',
      backgroundCheckStatus: '',
      remarks: '',
    },
    employeeEmploymentDetailsDTO: {
      employmentId: '',
      employeeId: '',
      noticePeriodDuration: undefined as NoticePeriodDuration | undefined,
      noticePeriodDurationLabel: '',
      probationApplicable: false,
      probationDuration: undefined as ProbationDuration | undefined,
      probationDurationLabel: '',
      probationNoticePeriod: undefined as ProbationNoticePeriod | undefined,
      probationNoticePeriodLabel: '',
      bondApplicable: false,
      bondDuration: undefined as BondDuration | undefined,
      bondDurationLabel: '',
      workingModel: undefined as WorkingModel | undefined,
      shiftTiming: undefined as ShiftTiming | undefined,
      shiftTimingLabel: '',
      department: undefined as Department | undefined,
      dateOfConfirmation: '',
      location: '',
    },
    employeeInsuranceDetailsDTO: {
      insuranceId: '',
      employeeId: '',
      policyNumber: '',
      providerName: '',
      coverageStart: '',
      coverageEnd: '',
      nomineeName: '',
      nomineeRelation: '',
      nomineeContact: '',
      groupInsurance: false,
    },
    employeeStatutoryDetailsDTO: {
      statutoryId: '',
      employeeId: '',
      passportNumber: '',
      taxRegime: '',
      pfUanNumber: '',
      esiNumber: '',
      ssnNumber: '',
    },
    employeeEquipmentDTO: [],
  });
  const [documentFiles, setDocumentFiles] = useState({
    offerLetter: null as File | null,
    contract: null as File | null,
    taxDeclarationForm: null as File | null,
    workPermit: null as File | null,
  });
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  const designations: Designation[] = [
    'INTERN', 'TRAINEE', 'ASSOCIATE_ENGINEER', 'SOFTWARE_ENGINEER', 'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER', 'TEAM_LEAD', 'TECHNICAL_ARCHITECT', 'REPORTING_MANAGER', 'DELIVERY_MANAGER',
    'DIRECTOR', 'VP_ENGINEERING', 'CTO', 'HR', 'FINANCE', 'OPERATIONS'
  ];
  // Update the constant
  const staticClients = new Set(['BENCH', 'INHOUSE', 'HR', 'NA']);
  const managerDesignations: Designation[] = [
    'REPORTING_MANAGER', 'DELIVERY_MANAGER', 'DIRECTOR', 'VP_ENGINEERING', 'CTO'
  ];
  const documentTypes: DocumentType[] = [
    'OFFER_LETTER', 'CONTRACT', 'TAX_DECLARATION_FORM', 'WORK_PERMIT', 'PAN_CARD',
    'AADHAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'INTERMEDIATE_CERTIFICATE',
    'DEGREE_CERTIFICATE', 'POST_GRADUATION_CERTIFICATE', 'OTHER'
  ];
  const employmentTypes: EmploymentType[] = ['CONTRACTOR', 'FREELANCER', 'FULLTIME'];
  // Fetch employee + clients + managers
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({ icon: 'error', title: 'Invalid ID' });
        setLoading(false);
        return;
      }
      try {
        const [empRes, clientRes, empListRes] = await Promise.all([
          adminService.getEmployeeById(params.id),
          adminService.getAllClients(),
          adminService.getAllEmployees(),
        ]);
        if (!empRes.flag || !empRes.response) throw new Error('Employee not found');
        if (!clientRes.flag || !clientRes.response) throw new Error('Failed to load clients');
        const emp = empRes.response as EmployeeDTO;
        // Compute clientSelection based on clientId and clientStatus
        let clientSelection = '';
        if (emp.clientId) {
          clientSelection = `CLIENT:${emp.clientId}`;
        } else {
          clientSelection = `STATUS:${emp.clientStatus}`;
        }
        setFormData({
          ...emp,
          clientSelection, // Add the computed clientSelection
          employeeSalaryDTO: emp.employeeSalaryDTO ?? {
            employeeId: '',
            basicPay: 0,
            payType: emp.rateCard && emp.rateCard > 0 ? 'HOURLY' : 'MONTHLY',
            standardHours: 40,
            bankAccountNumber: '',
            ifscCode: '',
            payClass: 'A1',
            allowances: [],
            deductions: [],
          },
          employeeAdditionalDetailsDTO: emp.employeeAdditionalDetailsDTO ?? {
            offerLetterUrl: '',
            contractUrl: '',
            taxDeclarationFormUrl: '',
            workPermitUrl: '',
            backgroundCheckStatus: '',
            remarks: '',
          },
          employeeEmploymentDetailsDTO: emp.employeeEmploymentDetailsDTO ?? {
            employmentId: '',
            employeeId: '',
            noticePeriodDuration: undefined,
            noticePeriodDurationLabel: '',
            probationApplicable: false,
            probationDuration: undefined,
            probationDurationLabel: '',
            probationNoticePeriod: undefined,
            probationNoticePeriodLabel: '',
            bondApplicable: false,
            bondDuration: undefined,
            bondDurationLabel: '',
            workingModel: undefined,
            shiftTiming: undefined,
            shiftTimingLabel: '',
            department: undefined,
            dateOfConfirmation: '',
            location: '',
          },

          employeeInsuranceDetailsDTO: emp.employeeInsuranceDetailsDTO ?? {
            insuranceId: '',
            employeeId: '',
            policyNumber: '',
            providerName: '',
            coverageStart: '',
            coverageEnd: '',
            nomineeName: '',
            nomineeRelation: '',
            nomineeContact: '',
            groupInsurance: false,
          },
          employeeStatutoryDetailsDTO: emp.employeeStatutoryDetailsDTO ?? {
            statutoryId: '',
            employeeId: '',
            passportNumber: '',
            taxRegime: '',
            pfUanNumber: '',
            esiNumber: '',
            ssnNumber: '',
          },
          employeeEquipmentDTO: emp.employeeEquipmentDTO ?? [],
          documents: (emp.documents ?? []).map(doc => ({ ...doc, file: null })) as FormDocument[],
        } as EmployeeModel);
        setClients(clientRes.response);
        const allManagers = empListRes.response
          .filter((e: any) => managerDesignations.includes(e.designation))
          .map((e: any) => ({ id: e.employeeId, name: `${e.firstName} ${e.lastName}` }));
        setManagers(allManagers);
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);
  // Generic change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EmployeeModel] as any),
          [child]: isCheckbox ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    }
  };
  // ────── DOCUMENTS ──────
  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentId: "",
          docType: 'OTHER' as DocumentType,
          fileUrl: '',
          uploadedAt: new Date().toISOString(),
          verified: false,
          file: null,
        },
      ],
    }));
  };
  const handleDocumentChange = (index: number, field: 'docType' | 'file', value: DocumentType | File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index
          ? { ...doc, [field]: value, fileUrl: field === 'file' && value ? '' : doc.fileUrl || '' }
          : doc
      ),
    }));
  };
  const confirmAndRemoveDocument = async (index: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      await removeDocument(index);
      Swal.fire('Deleted!', 'Document has been removed.', 'success');
    }
  };
  const removeDocument = async (index: number) => {
    const doc = formData.documents[index];
    if (doc.documentId) {
      const res = await adminService.deleteEmployeeDocument(params.id as string, doc.documentId);
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };
  // ────── EQUIPMENT ──────
  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: "", equipmentType: '', serialNumber: '', issuedDate: '' },
      ],
    }));
  };
  const handleEquipmentChange = (index: number, field: keyof EmployeeEquipmentDTO, value: string) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      ) ?? [],
    }));
  };
  const confirmAndRemoveEquipment = async (index: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this equipment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      await removeEquipment(index);
      Swal.fire('Deleted!', 'Equipment has been removed.', 'success');
    }
  };
  const removeEquipment = async (index: number) => {
    const eq = formData.employeeEquipmentDTO?.[index];
    if (eq?.equipmentId) {
      const res = await adminService.deleteEmployeeEquipmentInfo(eq.equipmentId); // Only 1 arg
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }));
  };
  const handleFileChange = (field: keyof typeof documentFiles, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };
  const clearAdditionalFile = (field: keyof typeof documentFiles) => {
    setDocumentFiles(prev => ({ ...prev, [field]: null }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;
    setSubmitting(true);
    setError(''); // Clear previous errors
    const required = [
      'firstName', 'lastName', 'personalEmail', 'contactNumber',
      'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality',
    ];
    // Special validation for client (use clientSelection instead of clientId)
    if (!formData.clientSelection) {
      required.push('clientSelection');
    }
    const missing = required.filter(f => {
      if (f === 'clientSelection') {
        return !formData.clientSelection;
      }
      return !formData[f as keyof EmployeeModel] || formData[f as keyof EmployeeModel] === '';
    });
    if (missing.length > 0) {
      setError(`Please fill in all mandatory fields: ${missing.join(', ')}`);
      setSubmitting(false);
      return;
    }
    // Validate emails are different
    if (formData.personalEmail === formData.companyEmail && formData.personalEmail && formData.companyEmail) {
      setError('Personal email and company email must be different.');
      setSubmitting(false);
      return;
    }
    // Upload dynamic documents
    const uploadedDocuments: EmployeeDocumentDTO[] = [];
    for (const doc of formData.documents) {
      let fileUrl = doc.fileUrl;
      if ((doc as FormDocument).file) {
        const fileToUpload = (doc as FormDocument).file!;
        const uploadResponse = await adminService.uploadFile(fileToUpload);
        if (!uploadResponse.flag || !uploadResponse.response) {
          throw new Error(uploadResponse.message || `Failed to upload ${doc.docType}`);
        }
        fileUrl = uploadResponse.response;
      }
      if (fileUrl) {
        const { file, ...rest } = doc as any;
        if (!rest.documentId) {
          const { documentId, ...noId } = rest;
          uploadedDocuments.push(noId);
        } else {
          uploadedDocuments.push(rest);
        }
      }
    }
    // Upload additional files
    const additionalFiles: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(documentFiles)) {
      if (file) {
        const uploadResponse = await adminService.uploadFile(file);
        if (uploadResponse.flag && uploadResponse.response) {
          additionalFiles[key] = uploadResponse.response;
        } else {
          throw new Error(uploadResponse.message || `Failed to upload ${key}`);
        }
      }
    }
    // Clean equipment
    const finalEquip: EmployeeEquipmentDTO[] = (formData.employeeEquipmentDTO ?? []).map(eq => {
      if (!eq.equipmentId) {
        return { ...eq, equipmentId: '' };
      }
      return eq;
    });
    // Final payload
    const payload: EmployeeModel = {
      ...formData,
      documents: uploadedDocuments,
      employeeEquipmentDTO: finalEquip,
      employeeAdditionalDetailsDTO: {
        ...formData.employeeAdditionalDetailsDTO,
        offerLetterUrl: additionalFiles.offerLetter || (documentFiles.offerLetter === null ? '' : formData.employeeAdditionalDetailsDTO?.offerLetterUrl || ''),
        contractUrl: additionalFiles.contract || (documentFiles.contract === null ? '' : formData.employeeAdditionalDetailsDTO?.contractUrl || ''),
        taxDeclarationFormUrl: additionalFiles.taxDeclarationForm || (documentFiles.taxDeclarationForm === null ? '' : formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl || ''),
        workPermitUrl: additionalFiles.workPermit || (documentFiles.workPermit === null ? '' : formData.employeeAdditionalDetailsDTO?.workPermitUrl || ''),
      },
    };
    try {
      const res = await adminService.updateEmployee(params.id as string, payload);
      if (res.flag) {
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Employee updated!', timer: 1500 });
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-lg font-medium text-gray-700">Loading employee data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  const hasFile = (doc: EmployeeDocumentDTO): doc is FormDocument => {
    return 'file' in doc;
  };
  const selectValue = formData.clientSelection?.startsWith('STATUS:')
    ? formData.clientSelection.replace('STATUS:', '')
    : (formData.clientId ?? undefined);
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <BackButton to="/admin-dashboard/employees/list" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Employee
            </h1>
            <div className="w-20" />
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-8">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">First Name *</Label>
                    <Input name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Last Name *</Label>
                    <Input name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Personal Email *</Label>
                    <Input name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Company Email *</Label>
                    <Input name="companyEmail" type="email" value={formData.companyEmail} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Contact Number *</Label>
                    <Input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Date of Birth *</Label>
                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Nationality *</Label>
                    <Input name="nationality" value={formData.nationality} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Gender *</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* EMPLOYMENT & SALARY DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Employment & Salary Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Client */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Client *</Label>
                    <Select
                      value={selectValue}
                      onValueChange={v => setFormData(p => ({
                        ...p,
                        clientId: staticClients.has(v) ? null : v,
                        clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`
                      }))}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.clientId} value={c.clientId}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                        {/* Static Options - use uppercase values matching the Set */}
                        <SelectItem value="BENCH">BENCH</SelectItem>
                        <SelectItem value="INHOUSE">INHOUSE</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="NA">NA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Reporting Manager */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Reporting Manager </Label>
                    <Select value={formData.reportingManagerId ?? ''} onValueChange={v => setFormData(p => ({ ...p, reportingManagerId: v }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Manager" /></SelectTrigger>
                      <SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* Designation */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Designation *</Label>
                    <Select value={formData.designation} onValueChange={v => setFormData(p => ({ ...p, designation: v as Designation }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{designations.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* Date of Joining */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Date of Joining *</Label>
                    <Input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} required />
                  </div>
                  {/* Employment Type */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Employment Type *</Label>
                    <Select value={formData.employmentType} onValueChange={v => setFormData(p => ({ ...p, employmentType: v as EmploymentType }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>{employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* RATE CARD*/}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Rate Card</Label>
                    <Input
                      className="h-11"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="45.00"
                      name="rateCard"
                      value={formData.rateCard ?? ''}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Pay Type */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Pay Type</Label>

                    <Select
                      value={formData.employeeSalaryDTO?.payType || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          employeeSalaryDTO: {
                            ...prev.employeeSalaryDTO!,
                            payType: v as PayType,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select Pay Type" />
                      </SelectTrigger>

                      <SelectContent>
                        {PAY_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                  {/* Basic Pay */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Basic Pay</Label>
                    <Input type="number" name="employeeSalaryDTO.basicPay" value={formData.employeeSalaryDTO?.basicPay ?? ''} onChange={handleChange} />
                  </div>
                  {/* Standard Hours */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Standard Hours </Label>
                    <Input type="number" name="employeeSalaryDTO.standardHours" value={formData.employeeSalaryDTO?.standardHours ?? 40} onChange={handleChange} />
                  </div>
                  {/* Pay Class */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Pay Class</Label>
                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ""}
                      onValueChange={v =>
                        handleChange({
                          target: { name: "employeeSalaryDTO.payClass", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select Pay Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_CLASS_OPTIONS.map(cls => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Working Model */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Working Model</Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.workingModel || ""}
                      onValueChange={v =>
                        handleChange({
                          target: { name: "employeeEmploymentDetailsDTO.workingModel", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select Working Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKING_MODEL_OPTIONS.map(model => (
                          <SelectItem key={model} value={model}>
                            {model === "NA" ? "Not Applicable" : model.charAt(0) + model.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Department */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Department</Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.department || ''}
                      onValueChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.department', value: v } } as any)}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Shift Timing */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Shift Timing</Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.shiftTiming || ''}
                      onValueChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.shiftTiming', value: v } } as any)}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Shift" /></SelectTrigger>
                      <SelectContent>
                        {SHIFT_TIMING_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Date of Confirmation */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Date of Confirmation</Label>
                    <Input type="date" name="employeeEmploymentDetailsDTO.dateOfConfirmation" value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''} onChange={handleChange} />
                  </div>
                  {/* Notice Period */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Notice Period</Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ''}
                      onValueChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.noticePeriodDuration', value: v } } as any)}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Notice Period" /></SelectTrigger>
                      <SelectContent>
                        {NOTICE_PERIOD_OPTIONS.map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Probation */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false}
                      onCheckedChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.probationApplicable', checked: v } } as any)}
                    />
                    <Label className="mb-2 block text-sm font-medium">Probation Applicable</Label>
                  </div>
                  {/* Probation Duration – only if probation is checked */}
                  {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.probationDuration || ''}
                      onValueChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.probationDuration', value: v } } as any)}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Duration" /></SelectTrigger>
                      <SelectContent>
                        {PROBATION_DURATION_OPTIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {/* Probation Notice Period – only if probation is checked */}
                  {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Probation Notice</Label>
                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.probationNoticePeriod || ''}
                        onValueChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.probationNoticePeriod', value: v } } as any)}>
                        <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select Notice" /></SelectTrigger>
                        <SelectContent>
                          {PROBATION_NOTICE_OPTIONS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Bond */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false}
                      onCheckedChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.bondApplicable', checked: v } } as any)}
                    />
                    <Label className="mb-2 block text-sm font-medium">Bond Applicable</Label>
                  </div>
                  {/* Bond Duration – only if bond is checked */}
                  {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Bond Duration</Label>
                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.bondDuration || ''}
                        onValueChange={v => handleChange({
                          target: { name: 'employeeEmploymentDetailsDTO.bondDuration', value: v }
                        } as any)}
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-11">
                          <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {BOND_DURATION_OPTIONS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* ALLOWANCES */}
                  <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-medium">Allowances</Label>
                    {formData.employeeSalaryDTO?.allowances?.map((a, i) => (
                      <div
                        key={a.allowanceId || `allowance-${i}`}
                        className="flex gap-2 mb-2 items-center"
                      >
                        <Input
                          placeholder="Type (e.g., HRA)"
                          value={a.allowanceType}
                          onChange={(e) => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].allowanceType = e.target.value;
                            setFormData((p) => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                            }));
                          }}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={a.amount}
                          onChange={(e) => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].amount = parseFloat(e.target.value) || 0;
                            setFormData((p) => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                            }));
                          }}
                        />
                        <Input
                          type="date"
                          value={a.effectiveDate}
                          onChange={(e) => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].effectiveDate = e.target.value;
                            setFormData((p) => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                            }));
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated =
                              formData.employeeSalaryDTO?.allowances?.filter((_, idx) => idx !== i) || [];
                            setFormData((p) => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newAllowance: AllowanceDTO = {
                          allowanceId: crypto.randomUUID(),
                          allowanceType: '',
                          amount: 0,
                          effectiveDate: '',
                        };
                        setFormData(p => ({
                          ...p,
                          employeeSalaryDTO: {
                            ...p.employeeSalaryDTO!,
                            allowances: [...(p.employeeSalaryDTO?.allowances || []), newAllowance],
                          },
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Allowance
                    </Button>
                  </div>
                  {/* DEDUCTIONS */}
                  <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-medium">Deductions</Label>
                    {formData.employeeSalaryDTO?.deductions?.map((d, i) => (
                      <div key={d.deductionId || `deduction-${i}`} className="flex gap-2 mb-2 items-center">
                        <Input
                          placeholder="Type (e.g., PF)"
                          value={d.deductionType}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].deductionType = e.target.value;
                            setFormData(p => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated }
                            }));
                          }}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={d.amount}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].amount = parseFloat(e.target.value) || 0;
                            setFormData(p => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated }
                            }));
                          }}
                        />
                        <Input
                          type="date"
                          value={d.effectiveDate}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].effectiveDate = e.target.value;
                            setFormData(p => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated }
                            }));
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = formData.employeeSalaryDTO?.deductions?.filter((_, idx) => idx !== i) || [];
                            setFormData(p => ({
                              ...p,
                              employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated }
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newDeduction: DeductionDTO = {
                          deductionId: crypto.randomUUID(),
                          deductionType: '',
                          amount: 0,
                          effectiveDate: '',
                        };
                        setFormData(p => ({
                          ...p,
                          employeeSalaryDTO: {
                            ...p.employeeSalaryDTO!,
                            deductions: [...(p.employeeSalaryDTO?.deductions || []), newDeduction],
                          },
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Deduction
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* ==================== DOCUMENTS ==================== */}
            <section className="border-b border-gray-200 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                  Documents
                </h3>
                <button
                  type="button"
                  onClick={addDocument}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  + Add Document
                </button>
              </div>
              <div className="space-y-6">
                {formData.documents.map((doc, i) => (
                  <div
                    key={doc.documentId || i}
                    className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50 relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Document Type</label>
                        <select
                          value={doc.docType}
                          onChange={e => handleDocumentChange(i, 'docType', e.target.value as DocumentType)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Type</option>
                          {documentTypes.map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Upload Document</label>
                        <FileInput
                          id={`doc-upload-${i}`}
                          onChange={file => handleDocumentChange(i, 'file', file)}
                          currentFile={(doc as FormDocument).file ?? null}
                          existingUrl={doc.fileUrl}
                          onClear={() => handleDocumentChange(i, 'file', null)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => confirmAndRemoveDocument(i)}
                      className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
            {/* ==================== EQUIPMENT ==================== */}
            <section className="border-b border-gray-200 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                  Equipment Details
                </h3>
                <button
                  type="button"
                  onClick={addEquipment}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  + Add Equipment
                </button>
              </div>
              <div className="space-y-6">
                {formData.employeeEquipmentDTO?.map((eq, i) => (
                  <div
                    key={eq.equipmentId || i}
                    className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-green-50 relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Equipment Type</label>
                        <input
                          value={eq.equipmentType || ''}
                          onChange={e => handleEquipmentChange(i, 'equipmentType', e.target.value)}
                          placeholder="Enter Type"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Serial Number</label>
                        <input
                          value={eq.serialNumber || ''}
                          onChange={e => handleEquipmentChange(i, 'serialNumber', e.target.value)}
                          placeholder="Enter Serial"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Issued Date</label>
                        <input
                          type="date"
                          value={eq.issuedDate || ''}
                          onChange={e => handleEquipmentChange(i, 'issuedDate', e.target.value)}
                          max={today}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => confirmAndRemoveEquipment(i)}
                      className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
            {/* Additional Details */}
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter</label>
                  <FileInput
                    id="offerLetter"
                    onChange={file => handleFileChange('offerLetter', file)}
                    currentFile={documentFiles.offerLetter}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.offerLetterUrl}
                    onClear={() => clearAdditionalFile('offerLetter')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                  <FileInput
                    id="contract"
                    onChange={file => handleFileChange('contract', file)}
                    currentFile={documentFiles.contract}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.contractUrl}
                    onClear={() => clearAdditionalFile('contract')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Declaration Form</label>
                  <FileInput
                    id="taxDeclarationForm"
                    onChange={file => handleFileChange('taxDeclarationForm', file)}
                    currentFile={documentFiles.taxDeclarationForm}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl}
                    onClear={() => clearAdditionalFile('taxDeclarationForm')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit</label>
                  <FileInput
                    id="workPermit"
                    onChange={file => handleFileChange('workPermit', file)}
                    currentFile={documentFiles.workPermit}
                    existingUrl={formData.employeeAdditionalDetailsDTO?.workPermitUrl}
                    onClear={() => clearAdditionalFile('workPermit')}
                  />
                </div>
                <div>
                  <label htmlFor="additionalRemarks" className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
                  <textarea id="additionalRemarks" name="employeeAdditionalDetailsDTO.remarks" value={formData.employeeAdditionalDetailsDTO?.remarks || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="generalRemarks" className="block text-sm font-medium text-gray-700 mb-1">General Remarks</label>
                  <textarea id="generalRemarks" name="remarks" value={formData.remarks ?? ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div >
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Skills & Certification </Label>
                  <textarea
                    name="skillsAndCertification"
                    value={formData.skillsAndCertification}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="backgroundCheckStatus" className="block text-sm font-medium text-gray-700 mb-1">Background Check Status</label>
                  <input id="backgroundCheckStatus" name="employeeAdditionalDetailsDTO.backgroundCheckStatus" value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </section>
            {/* Insurance & Statutory */}
            <section className="pb-6 space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label><input type="text" name="employeeInsuranceDetailsDTO.policyNumber" value={formData.employeeInsuranceDetailsDTO?.policyNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label><input type="text" name="employeeInsuranceDetailsDTO.providerName" value={formData.employeeInsuranceDetailsDTO?.providerName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Coverage Start</label><input type="date" name="employeeInsuranceDetailsDTO.coverageStart" value={formData.employeeInsuranceDetailsDTO?.coverageStart || ''} onChange={handleChange} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Coverage End</label><input type="date" name="employeeInsuranceDetailsDTO.coverageEnd" value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Name</label><input type="text" name="employeeInsuranceDetailsDTO.nomineeName" value={formData.employeeInsuranceDetailsDTO?.nomineeName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Relation</label><input type="text" name="employeeInsuranceDetailsDTO.nomineeRelation" value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominee Contact</label><input type="tel" name="employeeInsuranceDetailsDTO.nomineeContact" value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-700">Group Insurance</label><input type="checkbox" name="employeeInsuranceDetailsDTO.groupInsurance" checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false} onChange={handleChange} className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" /></div>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label><input type="text" name="employeeStatutoryDetailsDTO.passportNumber" value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">PF UAN Number</label><input type="text" name="employeeStatutoryDetailsDTO.pfUanNumber" value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Tax Regime</label><input type="text" name="employeeStatutoryDetailsDTO.taxRegime" value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">ESI Number</label><input type="text" name="employeeStatutoryDetailsDTO.esiNumber" value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">SSN Number</label><input type="text" name="employeeStatutoryDetailsDTO.ssnNumber" value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
              </div>
            </section>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/admin-dashboard/employees/list" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</Link>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
                {submitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {submitting ? 'Updating...' : 'Update Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};
export default EditEmployeePage;