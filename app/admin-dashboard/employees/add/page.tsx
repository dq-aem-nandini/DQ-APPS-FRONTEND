
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import {
  EmployeeDTO,
  ClientDTO,
  Designation,
  EmployeeDocumentDTO,
  EmployeeEquipmentDTO,
  DocumentType,
  EmploymentType,
  EmployeeModel,
  AllowanceDTO,
  DeductionDTO,
  NoticePeriodDuration,
  ProbationDuration,
  ProbationNoticePeriod,
  BondDuration,
  ShiftTiming,
  Department,
  DEPARTMENT_OPTIONS,
  SHIFT_TIMING_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
  PROBATION_DURATION_OPTIONS,
  PROBATION_NOTICE_OPTIONS,
  BOND_DURATION_OPTIONS,
  PayType,
  PayClass,
  PAY_TYPE_OPTIONS,
  PAY_CLASS_OPTIONS,
  WorkingModel,
  WORKING_MODEL_OPTIONS,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, User, Briefcase, FileText, Laptop, Shield, FileCheck, Upload, Trash2, Plus, Loader2, IndianRupee } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

// === TYPE FOR documentFiles ===
type DocumentFileKey = 'offerLetter' | 'contract' | 'taxDeclarationForm' | 'workPermit';

const AddEmployeePage = () => {
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
    documents: [],
    employeeSalaryDTO: {
      employeeId: '',
      ctc: 0,
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

  const [documentFiles, setDocumentFiles] = useState<Record<DocumentFileKey, File | null>>({
    offerLetter: null,
    contract: null,
    taxDeclarationForm: null,
    workPermit: null,
  });
  const [documentFilesList, setDocumentFilesList] = useState<(File | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];
  const maxJoiningDate = new Date();
  maxJoiningDate.setMonth(maxJoiningDate.getMonth() + 3);
  const maxJoiningDateStr = maxJoiningDate.toISOString().split('T')[0];

  const designations: Designation[] = [
    'INTERN', 'TRAINEE', 'ASSOCIATE_ENGINEER', 'SOFTWARE_ENGINEER', 'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER', 'TEAM_LEAD', 'TECHNICAL_ARCHITECT', 'REPORTING_MANAGER', 'DELIVERY_MANAGER',
    'DIRECTOR', 'VP_ENGINEERING', 'CTO', 'HR', 'FINANCE', 'OPERATIONS'
  ];

  const managerDesignations: Designation[] = [
    'REPORTING_MANAGER', 'DELIVERY_MANAGER', 'DIRECTOR', 'VP_ENGINEERING', 'CTO'
  ];

  const documentTypes: DocumentType[] = [
    'OFFER_LETTER', 'CONTRACT', 'TAX_DECLARATION_FORM', 'WORK_PERMIT', 'PAN_CARD',
    'AADHAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'INTERMEDIATE_CERTIFICATE',
    'DEGREE_CERTIFICATE', 'POST_GRADUATION_CERTIFICATE', 'OTHER'
  ];

  const employmentTypes: EmploymentType[] = ['CONTRACTOR', 'FREELANCER', 'FULLTIME'];
  const staticClients = new Set(['BENCH', 'INHOUSE', 'HR', 'NA']);

  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<EmployeeDTO[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clientResponse, managerResponses] = await Promise.all([
          adminService.getAllClients().catch(err => ({
            flag: false,
            message: `Failed to fetch clients: ${err.message}`,
            response: null,
          })),
          Promise.all(
            managerDesignations.map(des =>
              adminService.getEmployeesByDesignation(des).catch(err => {
                console.error(`Failed to fetch managers for designation ${des}:`, err);
                return [];
              })
            )
          ),
        ]);

        if (clientResponse.flag && Array.isArray(clientResponse.response)) {
          setClients(
            clientResponse.response.map((client: ClientDTO) => ({
              id: client.clientId,
              name: client.companyName,
            }))
          );
        } else {
          console.error('Client fetch failed:', clientResponse.message);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: clientResponse.message || 'Failed to fetch clients',
          });
        }

        const allManagers = managerResponses.flat().filter(manager => manager !== null);
        if (allManagers.length > 0) {
          setManagers(allManagers);
        } else {
          console.warn('No managers found for the specified designations');
          setManagers([]);
        }
      } catch (err: any) {
        console.error('Error in fetchInitialData:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to load data. Please try again.',
        });
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    if (name === 'personalEmail' || name === 'companyEmail') {
      parsedValue = value.toLowerCase();
    } else if (
      name === 'employeeSalaryDTO.ctc' ||
      name === 'employeeSalaryDTO.standardHours'
    ) {
      parsedValue = parseFloat(value) || 0;
    } else if (
      name.includes('employeeEmploymentDetailsDTO.probationApplicable') ||
      name.includes('employeeEmploymentDetailsDTO.bondApplicable') ||
      name.includes('employeeInsuranceDetailsDTO.groupInsurance')
    ) {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      const objectFields: (keyof EmployeeModel)[] = [
        'employeeSalaryDTO',
        'employeeAdditionalDetailsDTO',
        'employeeEmploymentDetailsDTO',
        'employeeInsuranceDetailsDTO',
        'employeeStatutoryDetailsDTO',
      ];

      if (objectFields.includes(parent as keyof EmployeeModel)) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof EmployeeModel] as Record<string, any> | undefined) ?? {},
            [child]: parsedValue,
          },
        }));
      } else {
        console.warn(`Attempted to update nested field on non-object: ${parent}.${child}`);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleDocumentChange = (index: number, field: 'docType' | 'file', value: DocumentType | File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index
          ? {
            ...doc,
            [field]: value,
            documentId: doc.documentId || crypto.randomUUID(),
            fileUrl: field === 'file' && value ? 'PENDING_UPLOAD' : doc.fileUrl || '',
            uploadedAt: doc.uploadedAt || new Date().toISOString(),
            verified: doc.verified || false,
          }
          : doc
      ),
    }));

    if (field === 'file') {
      setDocumentFilesList(prev => {
        const updated = [...prev];
        updated[index] = value as File | null;
        return updated;
      });
    }
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentId: crypto.randomUUID(),
          docType: 'OTHER' as DocumentType,
          fileUrl: '',
          uploadedAt: new Date().toISOString(),
          verified: false,
        },
      ],
    }));
    setDocumentFilesList(prev => [...prev, null]);
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleEquipmentChange = (index: number, field: keyof EmployeeEquipmentDTO, value: string) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      ) ?? [{ equipmentId: crypto.randomUUID(), equipmentType: '', serialNumber: '', [field]: value }],
    }));
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: crypto.randomUUID(), equipmentType: '', serialNumber: '' },
      ],
    }));
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }));
  };

  // === FIXED: Type-safe handleFileChange ===
  const handleFileChange = (field: DocumentFileKey, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // === FRONTEND VALIDATION ===
    const requiredFields: (keyof EmployeeModel)[] = [
      'firstName', 'lastName', 'personalEmail', 'contactNumber',
      'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality',
      'clientId',
    ];
  
    const missingFields = requiredFields.filter(field => {
      if (field === 'clientId') {
        return !formData.clientId && !formData.clientSelection;
      }
      return !formData[field] || formData[field] === '';
    });
  
    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: `Please fill: ${missingFields.join(', ')}`,
      });
      setIsSubmitting(false);
      return;
    }
  
    if (!/^[A-Za-z\s]+$/.test(formData.firstName) || !/^[A-Za-z\s]+$/.test(formData.lastName)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Name',
        text: 'First and last names must contain only letters and spaces.',
      });
      setIsSubmitting(false);
      return;
    }
  
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter valid email addresses.',
      });
      setIsSubmitting(false);
      return;
    }
  
    if (formData.personalEmail.trim().toLowerCase() === formData.companyEmail.trim().toLowerCase()) {
      Swal.fire({
        icon: 'error',
        title: 'Email Conflict',
        text: 'Personal and company email addresses must be different.',
      });
      setIsSubmitting(false);
      return;
    }
  
    // === UPLOAD DOCUMENT FILES ===
    const uploadedDocuments: EmployeeDocumentDTO[] = [];
    for (let i = 0; i < formData.documents.length; i++) {
      const doc = formData.documents[i];
      const file = documentFilesList[i];
  
      if (file) {
        try {
          const uploadResponse = await adminService.uploadFile(file);
          if (uploadResponse.flag && uploadResponse.response) {
            uploadedDocuments.push({
              documentId: doc.documentId,
              docType: doc.docType,
              fileUrl: uploadResponse.response,
              uploadedAt: new Date().toISOString(),
              verified: false,
            });
          } else {
            throw new Error(uploadResponse.message || 'Upload failed');
          }
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: err.message || 'Could not upload document',
          });
          setIsSubmitting(false);
          return;
        }
      }
    }
  
    // === UPLOAD ADDITIONAL FILES ===
    const additionalFiles: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(documentFiles)) {
      if (file) {
        try {
          const uploadResponse = await adminService.uploadFile(file);
          if (uploadResponse.flag && uploadResponse.response) {
            additionalFiles[key] = uploadResponse.response;
          } else {
            throw new Error(uploadResponse.message || `Failed to upload ${key}`);
          }
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: err.message || `Could not upload ${key}`,
          });
          setIsSubmitting(false);
          return;
        }
      }
    }
  
    // === PREPARE FINAL DATA ===
    const employeeData: EmployeeModel = {
      ...formData,
      documents: uploadedDocuments.length > 0 ? uploadedDocuments : formData.documents,
      employeeSalaryDTO: formData.employeeSalaryDTO?.ctc
        ? { ...formData.employeeSalaryDTO }
        : undefined,
      employeeAdditionalDetailsDTO: {
        ...formData.employeeAdditionalDetailsDTO,
        offerLetterUrl: additionalFiles.offerLetter || formData.employeeAdditionalDetailsDTO?.offerLetterUrl || '',
        contractUrl: additionalFiles.contract || formData.employeeAdditionalDetailsDTO?.contractUrl || '',
        taxDeclarationFormUrl: additionalFiles.taxDeclarationForm || formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl || '',
        workPermitUrl: additionalFiles.workPermit || formData.employeeAdditionalDetailsDTO?.workPermitUrl || '',
        remarks: formData.employeeAdditionalDetailsDTO?.remarks || formData.skillsAndCertification,
      },
      employeeEmploymentDetailsDTO: formData.employeeEmploymentDetailsDTO?.workingModel
        ? formData.employeeEmploymentDetailsDTO
        : undefined,
      employeeInsuranceDetailsDTO: formData.employeeInsuranceDetailsDTO?.policyNumber
        ? formData.employeeInsuranceDetailsDTO
        : undefined,
      employeeStatutoryDetailsDTO: formData.employeeStatutoryDetailsDTO?.passportNumber || formData.employeeStatutoryDetailsDTO?.pfUanNumber
        ? formData.employeeStatutoryDetailsDTO
        : undefined,
      employeeEquipmentDTO: formData.employeeEquipmentDTO && formData.employeeEquipmentDTO.filter(eq => eq.equipmentType).length > 0
        ? formData.employeeEquipmentDTO
        : undefined,
    };
  
    // === CALL API ===
    try {
      const response = await adminService.addEmployee(employeeData);
  
      if (response?.flag === true && response?.response) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Employee added successfully!',
          confirmButtonColor: '#3085d6',
        });
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(response?.message || 'Failed to add employee');
      }
    } catch (err: any) {
      console.error('Add employee error:', err);
  
      // CLEAN ERROR MESSAGE - NO 500 ERROR SHOWN
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Something went wrong. Please try again.';
  
      Swal.fire({
        icon: 'error',
        title: 'Failed to Add Employee',
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectValue = formData.clientSelection?.startsWith('STATUS:')
    ? formData.clientSelection.replace('STATUS:', '')
    : (formData.clientId ?? undefined);
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <BackButton to="/admin-dashboard/employees/list" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add Employee
            </h1>
            <div className="w-20" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* PERSONAL DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><Label className="mb-2 block text-sm font-medium">First Name *</Label><Input className="h-11" name="firstName" required value={formData.firstName} onChange={handleChange} maxLength={30} pattern="[A-Za-z ]+" /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Last Name *</Label><Input className="h-11" name="lastName" required value={formData.lastName} onChange={handleChange} maxLength={30} pattern="[A-Za-z ]+" /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Personal Email *</Label><Input className="h-11" type="email" name="personalEmail" required value={formData.personalEmail} onChange={handleChange} pattern="[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)" /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Company Email </Label><Input className="h-11" type="email" name="companyEmail" required value={formData.companyEmail} onChange={handleChange} /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Contact Number *</Label><Input className="h-11" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} pattern="[6-9]\d{9}" /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Date of Birth *</Label><Input className="h-11" type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleChange} max={today} /></div>
                  <div><Label className="mb-2 block text-sm font-medium">Nationality *</Label><Input className="h-11" name="nationality" required value={formData.nationality} onChange={handleChange} maxLength={50} pattern="[A-Za-z ]+" /></div>
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

            {/* EMPLOYMENT DETAILS + SALARY */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Employment & Salary Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* ----------  CLIENT SELECT  ---------- */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Client *</Label>
                    <Select
                      // `selectValue` is the string that appears in the trigger
                      value={selectValue}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          // real client → clientId, static status → clientId = null
                          clientId: staticClients.has(v) ? null : v,
                          // keep a human-readable tag so we can re-hydrate the UI later
                          clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
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
                    <Select value={formData.reportingManagerId} onValueChange={v => setFormData(p => ({ ...p, reportingManagerId: v }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{managers.map(m => <SelectItem key={m.employeeId} value={m.employeeId}>{m.firstName} {m.lastName}</SelectItem>)}</SelectContent>
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
                    <Input className="h-11" type="date" name="dateOfJoining" required value={formData.dateOfJoining} onChange={handleChange} max={maxJoiningDateStr} />
                  </div>

                  {/* Employment Type */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Employment Type *</Label>
                    <Select value={formData.employmentType} onValueChange={v => setFormData(p => ({ ...p, employmentType: v as EmploymentType }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>{employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  {/* rate card */}
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
                  {/* paytype */}
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

                  {/* ctc*/}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">CTC</Label>
                    <Input
                      className="h-11"
                      type="number"
                      min="0"
                      step="0.01"
                      name="employeeSalaryDTO.ctc"
                      required
                      value={formData.employeeSalaryDTO?.ctc?? ''}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Standard Hours */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Standard Hours *</Label>
                    <Input
                      className="h-11"
                      type="number"
                      min="1"
                      max="168"
                      name="employeeSalaryDTO.standardHours"
                      required
                      value={formData.employeeSalaryDTO?.standardHours ?? 40}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Pay Class */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Pay Class</Label>
                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ''}
                      onValueChange={v =>
                        handleChange({
                          target: { name: 'employeeSalaryDTO.payClass', value: v },
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
                      value={formData.employeeEmploymentDetailsDTO?.workingModel || ''}
                      onValueChange={v =>
                        handleChange({
                          target: {
                            name: 'employeeEmploymentDetailsDTO.workingModel',
                            value: v,
                          },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-11">
                        <SelectValue placeholder="Select Working Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKING_MODEL_OPTIONS.map(model => (
                          <SelectItem key={model} value={model}>
                            {model.charAt(0) + model.slice(1).toLowerCase().replace('_', ' ')}
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
                  <div><Label className="mb-2 block text-sm font-medium">Date of Confirmation</Label><Input className="h-11" type="date" name="employeeEmploymentDetailsDTO.dateOfConfirmation" value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''} onChange={handleChange} /></div>

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
                  <div className="flex items-center space-x-2">
                    <Checkbox id="probation" checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false} onCheckedChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.probationApplicable', checked: v } } as any)} />
                    <Label htmlFor="probation">Probation Applicable</Label>
                  </div>
                  {/* Probation Duration */}
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

                  {/* Probation Notice Period */}
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
                  <div className="flex items-center space-x-2">
                    <Checkbox id="bond" checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false} onCheckedChange={v => handleChange({ target: { name: 'employeeEmploymentDetailsDTO.bondApplicable', checked: v } } as any)} />
                    <Label htmlFor="bond">Bond Applicable</Label>
                  </div>
                  {/* Bond Duration */}
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

                  {/* === ALLOWANCES === */}
                  <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-medium">Allowances</Label>
                    {formData.employeeSalaryDTO?.allowances?.map((a, i) => (
                      <div key={a.allowanceId} className="flex gap-2 mb-2 items-center">
                        <Input
                          className="h-10"
                          placeholder="Type (e.g., HRA)"
                          value={a.allowanceType}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].allowanceType = e.target.value;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated } }));
                          }}
                        />
                        <Input
                          className="h-10"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={a.amount}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].amount = parseFloat(e.target.value) || 0;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated } }));
                          }}
                        />
                        <Input
                          className="h-10"
                          type="date"
                          value={a.effectiveDate}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                            updated[i].effectiveDate = e.target.value;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated } }));
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = formData.employeeSalaryDTO?.allowances?.filter((_, idx) => idx !== i) || [];
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated } }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                    type='button'
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

                  {/* === DEDUCTIONS === */}
                  <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-medium">Deductions</Label>
                    {formData.employeeSalaryDTO?.deductions?.map((d, i) => (
                      <div key={d.deductionId} className="flex gap-2 mb-2 items-center">
                        <Input
                          className="h-10"
                          placeholder="Type (e.g., PF)"
                          value={d.deductionType}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].deductionType = e.target.value;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated } }));
                          }}
                        />
                        <Input
                          className="h-10"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={d.amount}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].amount = parseFloat(e.target.value) || 0;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated } }));
                          }}
                        />
                        <Input
                          className="h-10"
                          type="date"
                          value={d.effectiveDate}
                          onChange={e => {
                            const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                            updated[i].effectiveDate = e.target.value;
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated } }));
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = formData.employeeSalaryDTO?.deductions?.filter((_, idx) => idx !== i) || [];
                            setFormData(p => ({ ...p, employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated } }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                    type='button'
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

            {/* DOCUMENTS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.documents.map((doc, i) => (
                  <div key={i} className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Type</Label>
                        <Select value={doc.docType} onValueChange={v => handleDocumentChange(i, 'docType', v as DocumentType)}>
                          <SelectTrigger className="w-full min-w-[200px] !h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>{documentTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Upload</Label>
                        <Input className="h-11" type="file" onChange={e => handleDocumentChange(i, 'file', e.target.files?.[0] || null)} />
                        <Button size="sm" variant="destructive" className="mt-2" onClick={() => removeDocument(i)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addDocument}>
                  <Plus className="mr-2 h-4 w-4" /> Add Document
                </Button>
              </CardContent>
            </Card>

            {/* EQUIPMENT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-teal-600" />
                  Equipment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.employeeEquipmentDTO?.map((eq, i) => (
                  <div key={i} className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input className="h-11" placeholder="Equipment Type" value={eq.equipmentType || ''} onChange={e => handleEquipmentChange(i, 'equipmentType', e.target.value)} />
                      <Input className="h-11" placeholder="Serial Number" value={eq.serialNumber || ''} onChange={e => handleEquipmentChange(i, 'serialNumber', e.target.value)} />
                      <Input className="h-11" type="date" placeholder="Issued Date" value={eq.issuedDate || ''} onChange={e => handleEquipmentChange(i, 'issuedDate', e.target.value)} max={today} />
                      <div className="md:col-span-3">
                        <Button size="sm" variant="destructive" onClick={() => removeEquipment(i)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addEquipment}>
                  <Plus className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
              </CardContent>
            </Card>

            {/* ADDITIONAL DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="Offer Letter" accept=".pdf,.doc,.docx" onFileChange={f => handleFileChange('offerLetter', f)} />
                <FileUpload label="Contract" accept=".pdf,.doc,.docx" onFileChange={f => handleFileChange('contract', f)} />
                <FileUpload label="Tax Declaration" accept=".pdf,.doc,.docx" onFileChange={f => handleFileChange('taxDeclarationForm', f)} />
                <FileUpload label="Work Permit" accept=".pdf,.doc,.docx" onFileChange={f => handleFileChange('workPermit', f)} />
                <div><Label className="mb-2 block text-sm font-medium">Skills & Certifications </Label><Textarea name="skillsAndCertification"  value={formData.skillsAndCertification} onChange={handleChange} /></div>
                <div><Label className="mb-2 block text-sm font-medium">Background Check</Label><Input className="h-11" name="employeeAdditionalDetailsDTO.backgroundCheckStatus" value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''} onChange={handleChange} /></div>
                <div><Label className="mb-2 block text-sm font-medium">Remarks</Label><Textarea name="employeeAdditionalDetailsDTO.remarks" value={formData.employeeAdditionalDetailsDTO?.remarks || ''} onChange={handleChange} /></div>
              </CardContent>
            </Card>

            {/* INSURANCE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Insurance Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Policy Number</Label>
                    <Input
                      className="h-11"
                      name="employeeInsuranceDetailsDTO.policyNumber"
                      value={formData.employeeInsuranceDetailsDTO?.policyNumber || ''}
                      onChange={handleChange}
                      placeholder="Policy Number"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Provider Name</Label>
                    <Input
                      className="h-11"
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={formData.employeeInsuranceDetailsDTO?.providerName || ''}
                      onChange={handleChange}
                      placeholder="Provider Name"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Coverage Start</Label>
                    <Input
                      className="h-11"
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageStart"
                      value={formData.employeeInsuranceDetailsDTO?.coverageStart || ''}
                      onChange={handleChange}
                      max={today}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Coverage End</Label>
                    <Input
                      className="h-11"
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageEnd"
                      value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Nominee Name</Label>
                    <Input
                      className="h-11"
                      name="employeeInsuranceDetailsDTO.nomineeName"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeName || ''}
                      onChange={handleChange}
                      placeholder="Nominee Name"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Nominee Relation</Label>
                    <Input
                      className="h-11"
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''}
                      onChange={handleChange}
                      placeholder="Nominee Relation"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Nominee Contact</Label>
                    <Input
                      className="h-11"
                      name="employeeInsuranceDetailsDTO.nomineeContact"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ''}
                      onChange={handleChange}
                      placeholder="Nominee Contact"
                      pattern="[6-9]\d{9}"
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="groupInsurance"
                      checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: 'employeeInsuranceDetailsDTO.groupInsurance',
                            checked: v,
                          },
                        } as any)
                      }
                    />
                    <Label htmlFor="groupInsurance">Group Insurance</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STATUTORY */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-red-600" />
                  Statutory Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Passport Number</Label>
                    <Input
                      className="h-11"
                      name="employeeStatutoryDetailsDTO.passportNumber"
                      value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''}
                      onChange={handleChange}
                      placeholder="Passport Number"
                      pattern="[A-Z0-9]{8,12}"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">PF UAN Number</Label>
                    <Input
                      className="h-11"
                      name="employeeStatutoryDetailsDTO.pfUanNumber"
                      value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''}
                      onChange={handleChange}
                      placeholder="PF UAN"
                      pattern="\d{12}"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">Tax Regime</Label>
                    <Input
                      className="h-11"
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''}
                      onChange={handleChange}
                      placeholder="Tax Regime"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">ESI Number</Label>
                    <Input
                      className="h-11"
                      name="employeeStatutoryDetailsDTO.esiNumber"
                      value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''}
                      onChange={handleChange}
                      placeholder="ESI Number"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium">SSN Number</Label>
                    <Input
                      className="h-11"
                      name="employeeStatutoryDetailsDTO.ssnNumber"
                      value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''}
                      onChange={handleChange}
                      placeholder="SSN Number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* SUBMIT */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push('/admin-dashboard/employees/list')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Add Employee'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AddEmployeePage;
