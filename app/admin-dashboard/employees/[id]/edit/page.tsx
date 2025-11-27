'use client';
import { useState, useEffect, useRef } from 'react';
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
  PAY_TYPE_OPTIONS,
  EmployeeDepartmentDTO
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
import { Trash2, Plus, IndianRupee, Briefcase, FileText, Package, Upload, Shield, FileCheck } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { employeeService } from '@/lib/api/employeeService';
import { UniqueField, validationService } from '@/lib/api/validationService';
interface Manager {
  id: string;
  name: string;
}
// Form-only document type (has `file`)
interface FormDocument extends EmployeeDocumentDTO {
  fileObj?: File | null;   // temporary field only in frontend
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
      // offerLetterUrl: '',
      // contractUrl: '',
      // taxDeclarationFormUrl: '',
      // workPermitUrl: '',
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  // const [documentFiles, setDocumentFiles] = useState({
  //   offerLetter: null as File | null,
  //   contract: null as File | null,
  //   taxDeclarationForm: null as File | null,
  //   workPermit: null as File | null,
  // });
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  const [departmentEmployees, setDepartmentEmployees] = useState<EmployeeDepartmentDTO[]>([]);
  const [employeeImageFile, setEmployeeImageFile] = useState<File | null>(null);
  const [checking, setChecking] = useState<Set<string>>(new Set());

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
    'AADHAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'TWELFTH_CERTIFICATE',
    'DEGREE_CERTIFICATE', 'POST_GRADUATION_CERTIFICATE', 'OTHER'
  ];
  const employmentTypes: EmploymentType[] = ['CONTRACTOR', 'FREELANCER', 'FULLTIME'];
  // ⭐ VALIDATION: Debounce timeouts per field
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const fetchDepartmentEmployees = async (dept: Department) => {
    if (!dept) {
      setDepartmentEmployees([]);
      return;
    }

    try {
      const result = await employeeService.getEmployeesByDepartment(dept);
      setDepartmentEmployees(result); // result is EmployeeDepartmentDTO[]
      console.log(`Employees in ${dept}:`, result);
    } catch (err: any) {
      console.error('Failed to load employees for department:', dept, err);
      setDepartmentEmployees([]);
    }
  };
  // FINAL, BULLETPROOF checkUniqueness — NEVER SENDS EMPTY excludeId
  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    key: string,
    fieldColumn?: string  // NEW: Optional param, default to field
  ) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.length < 3 || checking.has(key)) return;
    setChecking(prev => new Set(prev).add(key));
    try {
      const payload: any = {
        field,
        value: trimmedValue,
        mode: 'edit' as const,
        fieldColumn: fieldColumn || field,  // ✅ Default to field if missing
      };
      if (params.id && typeof params.id === 'string' && params.id.trim() !== '') {
        payload.currentRecordId = params.id.trim();
      }
      const result = await validationService.validateField(payload);

      if (result.exists) {
        setErrors(prev => ({ ...prev, [key]: 'Already exists in system' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    } catch (error) {
      console.warn('Uniqueness check failed:', error);
      // Silently fail — don't block user
    } finally {
      setChecking(prev => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
    }
  };
  useEffect(() => {
    if (formData.employeeEmploymentDetailsDTO?.department) {
      fetchDepartmentEmployees(formData.employeeEmploymentDetailsDTO.department);
    } else {
      setDepartmentEmployees([]); // Clear if no department
    }
  }, [formData.employeeEmploymentDetailsDTO?.department]);

  // Validation functions
  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) errorMsg = `${name} is required.`;
        else if (value.length > 30) errorMsg = `${name} must not exceed 30 characters.`;
        else if (!/^[a-zA-Z\s]+$/.test(value)) errorMsg = `${name} must contain only letters and spaces.`;
        break;
      case 'personalEmail':
      case 'companyEmail':
        if (!value.trim()) errorMsg = `${name} is required.`;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = `${name} must be a valid email address.`;
        else if (value.length > 50) errorMsg = `${name} must not exceed 50 characters.`;
        break;
      case 'contactNumber':
        if (!value.trim()) errorMsg = 'Contact number is required.';
        else if (!/^[6-9]\d{9}$/.test(value)) errorMsg = 'Contact number must be a valid 10-digit number starting with 6-9.';
        break;
      // Statutory fields validations
      case 'employeeStatutoryDetailsDTO.passportNumber':
        if (value && !/^[A-Z]{1}[0-9]{7}$/.test(value)) errorMsg = 'Passport number must be in format like A1234567.';
        else if (value && value.length > 30) errorMsg = 'Passport number must not exceed 30 characters.';
        break;
      case 'employeeStatutoryDetailsDTO.pfUanNumber':
        if (value && !/^\d{12}$/.test(value)) errorMsg = 'PF UAN number must be exactly 12 digits.';
        else if (value && value.length > 30) errorMsg = 'PF UAN number must not exceed 30 characters.';
        break;
      case 'employeeStatutoryDetailsDTO.esiNumber':
        if (value && !/^\d{17}$/.test(value)) errorMsg = 'ESI number must be exactly 17 digits.';
        else if (value && value.length > 30) errorMsg = 'ESI number must not exceed 30 characters.';
        break;
      case 'employeeStatutoryDetailsDTO.ssnNumber':
        if (value && !/^\d{3}-\d{2}-\d{4}$/.test(value) && !/^\d{9}$/.test(value)) errorMsg = 'SSN number must be in format XXX-XX-XXXX or 9 digits.';
        else if (value && value.length > 30) errorMsg = 'SSN number must not exceed 30 characters.';
        break;
      case 'employeeStatutoryDetailsDTO.taxRegime':
        if (value && !/^(Old|New|old|new)$/i.test(value)) errorMsg = 'Tax regime must be "Old" or "New".';
        else if (value && value.length > 30) errorMsg = 'Tax regime must not exceed 30 characters.';
        break;
      // Insurance fields
      case 'employeeInsuranceDetailsDTO.policyNumber':
      case 'employeeInsuranceDetailsDTO.providerName':
      case 'employeeInsuranceDetailsDTO.nomineeName':
      case 'employeeInsuranceDetailsDTO.nomineeRelation':
      case 'employeeInsuranceDetailsDTO.nomineeContact':
        if (value && value.length > 30) errorMsg = `${name.split('.').pop()} must not exceed 30 characters.`;
        break;
      // Additional details
      case 'employeeAdditionalDetailsDTO.backgroundCheckStatus':
        if (value && value.length > 30) errorMsg = 'Background check status must not exceed 30 characters.';
        break;
      default:
        break;
    }
    return errorMsg;
  };
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
            ctc: 0,
            payType: emp.rateCard && emp.rateCard > 0 ? 'HOURLY' : 'MONTHLY',
            standardHours: 40,
            bankAccountNumber: '',
            ifscCode: '',
            payClass: 'A1',
            allowances: [],
            deductions: [],
          },
          employeeAdditionalDetailsDTO: emp.employeeAdditionalDetailsDTO ?? {
            // offerLetterUrl: '',
            // contractUrl: '',
            // taxDeclarationFormUrl: '',
            // workPermitUrl: '',
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
          documents: (emp.documents ?? []).map(doc => ({
            ...doc,
            fileObj: null   // keep original file (string URL), add fileObj for new upload
          })) as FormDocument[],
          // documents: (emp.documents ?? []).map(doc => ({ ...doc, file: null })) as FormDocument[],
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
  // Generic change handler with real-time validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    // Update form data
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

    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Clear timeout if exists
    if (timeouts.current[name]) {
      clearTimeout(timeouts.current[name]);
    }
    // Debounced full validation if needed
    timeouts.current[name] = setTimeout(() => {
      // Additional logic if needed
    }, 500);
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
          file: '',                    // URL field (string)
          uploadedAt: new Date().toISOString(),
          verified: false,
          fileObj: null,               // new file upload
        } as FormDocument,
      ],
    }));
  };
  // const handleDocumentChange = (index: number, field: 'docType' | 'file', value: DocumentType | File | null) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     documents: prev.documents.map((doc, i) =>
  //       i === index
  //         ? { ...doc, [field]: value, fileUrl: field === 'file' && value ? '' : doc.file || '' }
  //         : doc
  //     ),
  //   }));
  // };
  const handleDocumentChange = (index: number, field: 'docType' | 'fileObj', value: DocumentType | File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index
          ? { ...doc, [field]: value }   // DO NOT touch `file` (the URL)
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
    // Real-time validation for equipment fields
    let errorMsg = '';
    const errorKey = `equipment${field}${index}`;
    if (field === 'equipmentType' && value.length > 30) {
      errorMsg = 'Equipment type must not exceed 30 characters.';
    } else if (field === 'serialNumber' && value.length > 30) {
      errorMsg = 'Serial number must not exceed 30 characters.';
    }
    setErrors(prev => ({ ...prev, [errorKey]: errorMsg }));
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
    // Clear equipment errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`equipmentType${index}`];
      delete newErrors[`serialNumber${index}`];
      return newErrors;
    });
  };
  // const handleFileChange = (field: keyof typeof documentFiles, file: File | null) => {
  //   setDocumentFiles(prev => ({ ...prev, [field]: file }));
  // };
  // const clearAdditionalFile = (field: keyof typeof documentFiles) => {
  //   setDocumentFiles(prev => ({ ...prev, [field]: null }));
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!params.id) return;

  //   setSubmitting(true);
  //   setError('');

  //   // ────── Full validation (your existing code) ──────
  //   const formErrors: Record<string, string> = {};
  //   const required = [
  //     'firstName', 'lastName', 'personalEmail', 'contactNumber',
  //     'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality'
  //   ];

  //   if (!formData.clientSelection) {
  //     formErrors.clientSelection = 'Client is required.';
  //   }

  //   required.forEach(f => {
  //     const value = formData[f as keyof EmployeeModel] as string;
  //     const error = validateField(f, value);
  //     if (error) formErrors[f] = error;
  //   });

  //   if (formData.personalEmail === formData.companyEmail && formData.personalEmail && formData.companyEmail) {
  //     formErrors.companyEmail = 'Company email must be different from personal email.';
  //   }

  //   // Validate allowances/deductions/equipment
  //   formData.employeeSalaryDTO?.allowances?.forEach((a, i) => {
  //     if (a.allowanceType.length > 30) formErrors[`allowanceType-${i}`] = 'Allowance type must not exceed 30 characters.';
  //   });
  //   formData.employeeSalaryDTO?.deductions?.forEach((d, i) => {
  //     if (d.deductionType.length > 30) formErrors[`deductionType-${i}`] = 'Deduction type must not exceed 30 characters.';
  //   });
  //   formData.employeeEquipmentDTO?.forEach((eq, i) => {
  //     if (eq.equipmentType.length > 30) formErrors[`equipmentType${i}`] = 'Equipment type must not exceed 30 characters.';
  //     if (eq.serialNumber.length > 30) formErrors[`serialNumber${i}`] = 'Serial number must not exceed 30 characters.';
  //   });

  //   setErrors(formErrors);
  //   if (Object.keys(formErrors).length > 0) {
  //     setSubmitting(false);
  //     return;
  //   }

  //   try {
  //     const fd = new FormData();

  //     // 1. Send all data except documents
  //     const { documents, ...restData } = formData;

  //     fd.append('employeeModel', JSON.stringify({
  //       ...restData,
  //       documents: documents.map((doc: any) => {
  //         const { fileObj, ...cleanDoc } = doc;
  //         return cleanDoc; // Only send: documentId, docType, file (string URL), etc.
  //       })
  //     }));

  //     // 2. Send new document files as: documents[0].file, documents[1].file, ...
  //     documents.forEach((doc: any, index) => {
  //       if (doc.fileObj instanceof File) {
  //         fd.append(`documents[${index}].file`, doc.fileObj, doc.fileObj.name);
  //       }
  //     });

  //     // 3. Employee photo
  //     if (employeeImageFile) {
  //       fd.append('employeePhoto', employeeImageFile, employeeImageFile.name);
  //     }

  //     // 4. Send request
  //     const res = await adminService.updateEmployee(params.id as string, fd);

  //     if (res.flag) {
  //       await Swal.fire({
  //         icon: 'success',
  //         title: 'Success!',
  //         text: res.message || 'Employee updated successfully',
  //         timer: 2000,
  //         showConfirmButton: false
  //       });
  //       router.push('/admin-dashboard/employees/list');
  //     } else {
  //       throw new Error(res.message || 'Update failed');
  //     }
  //   } catch (err: any) {
  //     const message = err.message || 'Something went wrong while updating employee';
  //     setError(message);
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Error',
  //       text: message,
  //     });
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;

    setSubmitting(true);
    setError('');
    setErrors({}); // Clear previous field errors

    // ────── CLIENT-SIDE REQUIRED FIELDS WITH FOCUS & SCROLL ──────
    const requiredFields = [
      { value: formData.firstName, name: 'firstName', label: 'First Name' },
      { value: formData.lastName, name: 'lastName', label: 'Last Name' },
      { value: formData.personalEmail, name: 'personalEmail', label: 'Personal Email' },
      { value: formData.contactNumber, name: 'contactNumber', label: 'Contact Number' },
      { value: formData.dateOfBirth, name: 'dateOfBirth', label: 'Date of Birth' },
      { value: formData.dateOfJoining, name: 'dateOfJoining', label: 'Date of Joining' },
      { value: formData.gender, name: 'gender', label: 'Gender' },
      { value: formData.nationality, name: 'nationality', label: 'Nationality' },
      { value: formData.designation, name: 'designation', label: 'Designation' },
      { value: formData.clientSelection, name: 'clientSelection', label: 'Client' },
      { value: formData.employeeEmploymentDetailsDTO?.department, name: 'employeeEmploymentDetailsDTO.department', label: 'Department' },
    ];

    const missingField = requiredFields.find(f => !f.value || f.value === '');
    if (missingField) {
      const errorMsg = `${missingField.label} is required`;
      setErrors({ [missingField.name]: errorMsg });

      // Auto scroll + focus + highlight
      setTimeout(() => {
        const selector = missingField.name.includes('.')
          ? `[name="${missingField.name.split('.').pop()}"]`
          : `[name="${missingField.name}"]`;

        const input = document.querySelector(selector) as HTMLElement;
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input.focus();
          input.classList.add('error-field');
        }
      }, 100);

      setSubmitting(false);
      return;
    }

    // ────── Additional Validation (email conflict, length, etc.) ──────
    const formErrors: Record<string, string> = {};

    if (formData.personalEmail === formData.companyEmail && formData.personalEmail) {
      formErrors.companyEmail = 'Company email must be different from personal email.';
    }

    // Length validations
    formData.employeeSalaryDTO?.allowances?.forEach((a, i) => {
      if (a.allowanceType.length > 30) formErrors[`allowanceType-${i}`] = 'Allowance type must not exceed 30 characters.';
    });
    formData.employeeSalaryDTO?.deductions?.forEach((d, i) => {
      if (d.deductionType.length > 30) formErrors[`deductionType-${i}`] = 'Deduction type must not exceed 30 characters.';
    });
    formData.employeeEquipmentDTO?.forEach((eq, i) => {
      if (eq.equipmentType.length > 30) formErrors[`equipmentType${i}`] = 'Equipment type must not exceed 30 characters.';
      if (eq.serialNumber.length > 30) formErrors[`serialNumber${i}`] = 'Serial number must not exceed 30 characters.';
    });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();

      // Send main model (without fileObj)
      const { documents, ...restData } = formData;

      fd.append('employeeModel', JSON.stringify({
        ...restData,
        documents: documents.map((doc: any) => {
          const { fileObj, ...cleanDoc } = doc;
          return cleanDoc;
        })
      }));

      // Send new document files
      documents.forEach((doc: any, index) => {
        if (doc.fileObj instanceof File) {
          fd.append(`documents[${index}].file`, doc.fileObj, doc.fileObj.name);
        }
      });

      // Employee photo
      if (employeeImageFile) {
        fd.append('employeePhoto', employeeImageFile, employeeImageFile.name);
      }

      // Send request
      const res = await adminService.updateEmployee(params.id as string, fd);

      if (res.flag) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: res.message || 'Employee updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(res.message || 'Update failed');
      }
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
        }
        else if (data.errors && typeof data.errors === 'object') {
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
          const input = document.querySelector(`[name="${firstField}"]`) as HTMLElement;
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
            input.classList.add('error-field');
          }
        }, 100);
      } else {
        const message = err.message || 'Something went wrong while updating employee';
        setError(message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
        });
      }
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
  const getError = (key: string) => errors[key] || '';
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
          <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
            {/* ==================== PERSONAL DETAILS ==================== */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-indigo-800">
                  Personal Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {/* First Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      name="firstName"
                      value={formData.firstName}
                      required
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="Enter first name"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                    />
                    {getError('firstName') && (
                      <p className="text-xs text-red-600">{getError('firstName')}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      name="lastName"
                      value={formData.lastName}
                      required
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="Enter last name"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                    />

                    {getError('lastName') && (
                      <p className="text-xs text-red-600">{getError('lastName')}</p>
                    )}
                  </div>

                  {/* Personal Email - WITH UNIQUENESS CHECK & LOADING SPINNER */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Personal Email <span className="text-red-500">*</span>
                    </Label>

                    <div className="relative">
                      <Input
                        name="personalEmail"
                        type="email"
                        value={formData.personalEmail}
                        required
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('EMAIL', formData.personalEmail, 'personalEmail', 'personal_email')}
                        maxLength={30}
                        placeholder="you@gmail.com"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />

                      {/* Loading Spinner */}
                      {checking.has('personalEmail') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {getError('personalEmail') && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {getError('personalEmail')}
                      </p>
                    )}
                  </div>

                  {/* Company Email */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Company Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        name="companyEmail"
                        type="email"
                        value={formData.companyEmail}
                        required
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('EMAIL', formData.companyEmail, 'companyEmail', 'company_email')}
                        maxLength={30}
                        placeholder="you@company.com"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('companyEmail') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {/* Error Message */}
                    {getError('companyEmail') && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {getError('companyEmail')}
                      </p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        name="contactNumber"
                        type="tel"
                        value={formData.contactNumber}
                        required
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('CONTACT_NUMBER', formData.contactNumber, 'contactNumber', 'contact_number')}
                        maxLength={10}
                        placeholder="9876543210"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('contactNumber') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {/* Error Message */}
                    {getError('contactNumber') && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {getError('contactNumber')}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      required
                      onChange={handleChange}
                      max={today}
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                    />

                    {getError('dateOfBirth') && (
                      <p className="text-xs text-red-600">{getError('dateOfBirth')}</p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Nationality <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      name="nationality"
                      value={formData.nationality}
                      required
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="Indian"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                    />

                    {getError('nationality') && (
                      <p className="text-xs text-red-600">{getError('nationality')}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </Label>

                    <Select required
                      value={formData.gender}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, gender: v }));
                        setErrors((prev) => ({ ...prev, gender: "" }));
                      }}
                    >

                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {getError('gender') && (
                      <p className="text-xs text-red-600">{getError('gender')}</p>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* EMPLOYMENT & SALARY DETAILS */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-emerald-800">
                  <Briefcase className="w-7 h-7 text-emerald-600" />
                  Employment & Salary Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">

                {/* GRID START */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {/* Client */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client <span className="text-red-500">*</span>
                    </Label>

                    <Select required
                      value={selectValue}
                      onValueChange={(v) => {
                        setFormData((p) => ({
                          ...p,
                          clientId: staticClients.has(v) ? null : v,
                          clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`,
                        }));
                        setErrors((prev) => ({ ...prev, clientSelection: "" }));
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>

                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.clientId} value={c.clientId}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                        <SelectItem value="BENCH">BENCH</SelectItem>
                        <SelectItem value="INHOUSE">INHOUSE</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="NA">NA</SelectItem>
                      </SelectContent>
                    </Select>

                    {getError("clientSelection") && (
                      <p className="text-xs text-red-600">{getError("clientSelection")}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Department<span className="text-red-500">*</span></Label>

                    <Select required
                      value={formData.employeeEmploymentDetailsDTO?.department || ''}
                      onValueChange={(v) => {
                        const department = v as Department;
                        // Clear reporting manager when department changes
                        setFormData(prev => ({ ...prev, reportingManagerId: '' }));
                        handleChange({
                          target: { name: 'employeeEmploymentDetailsDTO.department', value: department }
                        } as any);
                        fetchDepartmentEmployees(department);
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reporting Manager */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Reporting Manager</Label>
                    <Select
                      value={formData.reportingManagerId}
                      onValueChange={v => setFormData(p => ({ ...p, reportingManagerId: v }))}
                      disabled={!formData.employeeEmploymentDetailsDTO?.department}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        {/* <SelectTrigger className={`w-full min-w-[200px] !h-11 ${!formData.employeeEmploymentDetailsDTO?.department ? 'opacity-50 cursor-not-allowed' : ''}`}> */}
                        <SelectValue placeholder={
                          formData.employeeEmploymentDetailsDTO?.department
                            ? "Select Reporting Manager"
                            : "First select Department"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentEmployees.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {formData.employeeEmploymentDetailsDTO?.department
                              ? "No managers in this department"
                              : "Select department first"}
                          </SelectItem>
                        ) : (
                          departmentEmployees.map(emp => (
                            <SelectItem key={emp.employeeId} value={emp.employeeId}>
                              {emp.fullName} ({emp.designation.replace(/_/g, ' ')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Designation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Designation <span className="text-red-500">*</span>
                    </Label>

                    <Select required
                      value={formData.designation}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, designation: v as Designation }));
                        setErrors((prev) => ({ ...prev, designation: "" }));
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>

                      <SelectContent>
                        {designations.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {getError("designation") && (
                      <p className="text-xs text-red-600">{getError("designation")}</p>
                    )}
                  </div>

                  {/* Date of Joining */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Joining <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      type="date"
                      name="dateOfJoining"
                      required
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                    />

                    {getError("dateOfJoining") && (
                      <p className="text-xs text-red-600">{getError("dateOfJoining")}</p>
                    )}
                  </div>

                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Employment Type <span className="text-red-500">*</span>
                    </Label>

                    <Select required
                      value={formData.employmentType}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, employmentType: v as EmploymentType }));
                        setErrors((prev) => ({ ...prev, employmentType: "" }));
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>

                      <SelectContent>
                        {employmentTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {getError("employmentType") && (
                      <p className="text-xs text-red-600">{getError("employmentType")}</p>
                    )}
                  </div>

                  {/* Rate Card */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Rate Card</Label>
                    <Input
                      type="number"
                      name="rateCard"
                      value={formData.rateCard ?? ""}
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      placeholder="45.00"
                    />
                  </div>

                  {/* Pay Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Pay Type</Label>

                    <Select
                      value={formData.employeeSalaryDTO?.payType || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          employeeSalaryDTO: { ...prev.employeeSalaryDTO!, payType: v as PayType },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        <SelectValue placeholder="Select Pay Type" />
                      </SelectTrigger>

                      <SelectContent>
                        {PAY_TYPE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Standard Hours */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Standard Hours</Label>

                    <Input
                      type="number"
                      name="employeeSalaryDTO.standardHours"
                      value={formData.employeeSalaryDTO?.standardHours ?? 40}
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                    />
                  </div>

                  {/* Pay Class */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Pay Class</Label>

                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ""}
                      onValueChange={(v) =>
                        handleChange({
                          target: { name: "employeeSalaryDTO.payClass", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">

                        <SelectValue placeholder="Select Pay Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_CLASS_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Working Model */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Working Model</Label>

                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.workingModel || ""}
                      onValueChange={(v) =>
                        handleChange({
                          target: { name: "employeeEmploymentDetailsDTO.workingModel", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Working Model" />
                      </SelectTrigger>

                      <SelectContent>
                        {WORKING_MODEL_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shift Timing */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Shift Timing</Label>

                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.shiftTiming || ""}
                      onValueChange={(v) =>
                        handleChange({
                          target: { name: "employeeEmploymentDetailsDTO.shiftTiming", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Shift" />
                      </SelectTrigger>

                      <SelectContent>
                        {SHIFT_TIMING_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date of Confirmation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date of Confirmation</Label>
                    <Input
                      type="date"
                      name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                      value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ""}
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                    />
                  </div>

                  {/* Notice Period */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Notice Period</Label>

                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ""}
                      onValueChange={(v) =>
                        handleChange({
                          target: { name: "employeeEmploymentDetailsDTO.noticePeriodDuration", value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Notice Period" />
                      </SelectTrigger>

                      <SelectContent>
                        {NOTICE_PERIOD_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Probation Applicable */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.probationApplicable",
                            value: v === true,
                          },
                        } as any)
                      }
                    />
                    <Label className="text-sm font-semibold text-gray-700">Probation Applicable</Label>
                  </div>

                  {/* Probation Duration */}
                  {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Probation Duration</Label>

                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.probationDuration || ""}
                        onValueChange={(v) =>
                          handleChange({
                            target: { name: "employeeEmploymentDetailsDTO.probationDuration", value: v },
                          } as any)
                        }
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                          <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>

                        <SelectContent>
                          {PROBATION_DURATION_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Probation Notice Period */}
                  {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Probation Notice Period</Label>

                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.probationNoticePeriod || ""}
                        onValueChange={(v) =>
                          handleChange({
                            target: {
                              name: "employeeEmploymentDetailsDTO.probationNoticePeriod",
                              value: v,
                            },
                          } as any)
                        }
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                          <SelectValue placeholder="Select Notice Period" />
                        </SelectTrigger>

                        <SelectContent>
                          {PROBATION_NOTICE_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Bond Applicable */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.bondApplicable",
                            value: v === true,
                          },
                        } as any)
                      }
                    />
                    <Label className="text-sm font-semibold text-gray-700">Bond Applicable</Label>
                  </div>

                  {/* Bond Duration */}
                  {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Bond Duration</Label>

                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.bondDuration || ""}
                        onValueChange={(v) =>
                          handleChange({
                            target: { name: "employeeEmploymentDetailsDTO.bondDuration", value: v },
                          } as any)
                        }
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                          <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>

                        <SelectContent>
                          {BOND_DURATION_OPTIONS.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {/* ALLOWANCES & DEDUCTIONS – UPDATED UI */}
                <div className="mt-10 space-y-10">
                  {/* ================= ALLOWANCES ================= */}
                  <div>
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">Allowances</Label>

                    <div className="space-y-4">
                      {formData.employeeSalaryDTO?.allowances?.map((a, i) => (
                        <div
                          key={a.allowanceId || i}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          {/* Allowance Type */}
                          <div className="space-y-2">
                            <Input
                              placeholder="Type (e.g., HRA)"
                              value={a.allowanceType}
                              maxLength={30}
                              className="h-12 text-base"
                              onChange={(e) => {
                                const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                                updated[i].allowanceType = e.target.value;
                                setFormData((p) => ({
                                  ...p,
                                  employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                                }));
                                validateField?.(`allowance_${i}_type`, e.target.value);
                              }}
                            />

                            {errors[`allowance_${i}_type`] && (
                              <p className="text-red-500 text-xs">{errors[`allowance_${i}_type`]}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={a.amount}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                              updated[i].amount = parseFloat(e.target.value) || 0;
                              setFormData((p) => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                              }));
                            }}
                          />

                          {/* Effective Date */}
                          <Input
                            type="date"
                            value={a.effectiveDate}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                              updated[i].effectiveDate = e.target.value;
                              setFormData((p) => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                              }));
                            }}
                          />

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const filtered = formData.employeeSalaryDTO?.allowances?.filter(
                                  (_, idx) => idx !== i
                                ) || [];
                                setFormData((p) => ({
                                  ...p,
                                  employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: filtered },
                                }));
                              }}
                              className="h-12"
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add Allowance Button */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 h-12"
                        onClick={() => {
                          const newAllowance: AllowanceDTO = {
                            allowanceId: crypto.randomUUID(),
                            allowanceType: "",
                            amount: 0,
                            effectiveDate: "",
                          };
                          setFormData((p) => ({
                            ...p,
                            employeeSalaryDTO: {
                              ...p.employeeSalaryDTO!,
                              allowances: [...(p.employeeSalaryDTO?.allowances || []), newAllowance],
                            },
                          }));
                        }}
                      >
                        <Plus className="h-5 w-5 mr-2" /> Add Allowance
                      </Button>
                    </div>
                  </div>

                  {/* ================= DEDUCTIONS ================= */}
                  <div>
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">Deductions</Label>

                    <div className="space-y-4">
                      {formData.employeeSalaryDTO?.deductions?.map((d, i) => (
                        <div
                          key={d.deductionId || i}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          {/* Deduction Type */}
                          <div className="space-y-2">
                            <Input
                              placeholder="Type (e.g., PF)"
                              value={d.deductionType}
                              maxLength={30}
                              className="h-12 text-base"
                              onChange={(e) => {
                                const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                                updated[i].deductionType = e.target.value;
                                setFormData((p) => ({
                                  ...p,
                                  employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated },
                                }));
                                validateField?.(`deduction_${i}_type`, e.target.value);
                              }}
                            />

                            {errors[`deduction_${i}_type`] && (
                              <p className="text-red-500 text-xs">{errors[`deduction_${i}_type`]}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={d.amount}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                              updated[i].amount = parseFloat(e.target.value) || 0;
                              setFormData((p) => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated },
                              }));
                            }}
                          />

                          {/* Effective Date */}
                          <Input
                            type="date"
                            value={d.effectiveDate}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                              updated[i].effectiveDate = e.target.value;
                              setFormData((p) => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated },
                              }));
                            }}
                          />

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const filtered = formData.employeeSalaryDTO?.deductions?.filter(
                                  (_, idx) => idx !== i
                                ) || [];
                                setFormData((p) => ({
                                  ...p,
                                  employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: filtered },
                                }));
                              }}
                              className="h-12"
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add Deduction Button */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 h-12"
                        onClick={() => {
                          const newDeduction: DeductionDTO = {
                            deductionId: crypto.randomUUID(),
                            deductionType: "",
                            amount: 0,
                            effectiveDate: "",
                          };
                          setFormData((p) => ({
                            ...p,
                            employeeSalaryDTO: {
                              ...p.employeeSalaryDTO!,
                              deductions: [...(p.employeeSalaryDTO?.deductions || []), newDeduction],
                            },
                          }));
                        }}
                      >
                        <Plus className="h-5 w-5 mr-2" /> Add Deduction
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ==================== DOCUMENTS CARD (UPDATED UI) ==================== */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-purple-800">
                  <FileText className="w-7 h-7 text-purple-600" />
                  Documents
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">
                <div className="space-y-8">
                  {formData.documents.map((doc, i) => (
                    <div
                      key={doc.documentId || i}
                      className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50 border border-gray-200 rounded-2xl shadow-sm"
                    >
                      {/* GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Document Type */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Document Type <span className="text-red-500">*</span>
                          </Label>

                          <Select
                            value={doc.docType}
                            onValueChange={(v) => handleDocumentChange(i, "docType", v as DocumentType)}
                          >
                            <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>

                            <SelectContent>
                              {documentTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Upload Document
                          </Label>

                          <FileInput
                            id={`doc-upload-${i}`}
                            onChange={(file) => handleDocumentChange(i, "fileObj", file)}
                            currentFile={(doc as FormDocument).fileObj ?? null}
                            existingUrl={typeof doc.file === 'string' && doc.file ? doc.file : undefined}
                            onClear={() => handleDocumentChange(i, "fileObj", null)}
                          />
                        </div>

                        {/* Remove Button */}
                        <div className="flex items-end">
                          <Button
                            type="button"
                            disabled={submitting}
                            onClick={() => confirmAndRemoveDocument(i)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 h-12 w-full sm:w-auto rounded-xl flex items-center gap-2 px-4 font-medium"
                          >
                            <Trash2 className="h-5 w-5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ADD DOCUMENT BUTTON */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="button"
                      onClick={addDocument}
                      variant="outline"
                      className="h-12 px-8 text-base font-semibold border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Add Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ==================== EQUIPMENT — UPDATED TO CARD UI ==================== */}
            <Card className="shadow-xl border-0 mt-10">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-green-800">
                  <Package className="w-7 h-7 text-green-600" />
                  Equipment Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">
                <div className="space-y-6">
                  {formData.employeeEquipmentDTO?.map((eq, i) => (
                    <div
                      key={eq.equipmentId || i}
                      className="p-6 bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 rounded-2xl shadow-sm"
                    >
                      {/* GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Equipment Type */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Equipment Type
                          </Label>
                          <Input
                            value={eq.equipmentType || ""}
                            onChange={(e) =>
                              handleEquipmentChange(i, "equipmentType", e.target.value)
                            }
                            placeholder="Enter Type"
                            className="h-12 text-base"
                          />
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Serial Number
                          </Label>
                          <Input
                            value={eq.serialNumber || ""}
                            onChange={(e) =>
                              handleEquipmentChange(i, "serialNumber", e.target.value)
                            }
                            placeholder="Enter Serial Number"
                            className="h-12 text-base"
                          />
                        </div>

                        {/* Issued Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Issued Date
                          </Label>
                          <Input
                            type="date"
                            value={eq.issuedDate || ""}
                            onChange={(e) =>
                              handleEquipmentChange(i, "issuedDate", e.target.value)
                            }
                            max={today}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>

                      {/* REMOVE BUTTON */}
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          disabled={submitting}
                          onClick={() => confirmAndRemoveEquipment(i)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 h-11 px-5 rounded-xl flex items-center gap-2 font-medium"
                        >
                          <Trash2 className="h-5 w-5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* ADD EQUIPMENT BUTTON */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-8 text-base font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-xl"
                      onClick={addEquipment}
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Add Equipment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ADDITIONAL DETAILS – UPDATED TO CARD UI */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-blue-800">
                  <Upload className="w-7 h-7 text-blue-600" />
                  Additional Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {/* OFFER LETTER
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Offer Letter</Label>
                    <div className="h-12 flex items-center">
                      <FileInput
                        id="offerLetter"
                        onChange={(file) => handleFileChange("offerLetter", file)}
                        currentFile={documentFiles.offerLetter}
                        existingUrl={formData.employeeAdditionalDetailsDTO?.offerLetterUrl}
                        onClear={() => clearAdditionalFile("offerLetter")}
                      />
                    </div>
                  </div>

                  CONTRACT
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Contract</Label>
                    <div className="h-12 flex items-center">
                      <FileInput
                        id="contract"
                        onChange={(file) => handleFileChange("contract", file)}
                        currentFile={documentFiles.contract}
                        existingUrl={formData.employeeAdditionalDetailsDTO?.contractUrl}
                        onClear={() => clearAdditionalFile("contract")}
                      />
                    </div>
                  </div>

                  TAX DECLARATION FORM
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Tax Declaration Form</Label>
                    <div className="h-12 flex items-center">
                      <FileInput
                        id="taxDeclarationForm"
                        onChange={(file) => handleFileChange("taxDeclarationForm", file)}
                        currentFile={documentFiles.taxDeclarationForm}
                        existingUrl={formData.employeeAdditionalDetailsDTO?.taxDeclarationFormUrl}
                        onClear={() => clearAdditionalFile("taxDeclarationForm")}
                      />
                    </div>
                  </div>

                  WORK PERMIT
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Work Permit</Label>
                    <div className="h-12 flex items-center">
                      <FileInput
                        id="workPermit"
                        onChange={(file) => handleFileChange("workPermit", file)}
                        currentFile={documentFiles.workPermit}
                        existingUrl={formData.employeeAdditionalDetailsDTO?.workPermitUrl}
                        onClear={() => clearAdditionalFile("workPermit")}
                      />
                    </div>
                  </div> */}

                  {/* SKILLS & CERTIFICATION */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">Skills & Certification</Label>
                    <textarea
                      name="skillsAndCertification"
                      value={formData.skillsAndCertification}
                      onChange={handleChange}
                      placeholder="e.g., React, Node.js, AWS Certified"
                      className="w-full min-h-32 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* BACKGROUND CHECK STATUS */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Background Check Status</Label>
                    <input
                      id="backgroundCheckStatus"
                      name="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                      value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ""}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., Cleared, Pending"
                      className={`w-full h-12 px-4 py-3 border rounded-xl text-base focus:ring-indigo-500 ${errors["employeeAdditionalDetailsDTO.backgroundCheckStatus"]
                        ? "border-red-500"
                        : "border-gray-300"
                        }`}
                    />

                    {/* Error */}
                    {errors["employeeAdditionalDetailsDTO.backgroundCheckStatus"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["employeeAdditionalDetailsDTO.backgroundCheckStatus"]}
                      </p>
                    )}
                  </div>

                  {/* ADDITIONAL REMARKS */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">Additional Remarks</Label>
                    <textarea
                      id="additionalRemarks"
                      name="employeeAdditionalDetailsDTO.remarks"
                      value={formData.employeeAdditionalDetailsDTO?.remarks || ""}
                      onChange={handleChange}
                      placeholder="Any notes..."
                      className="w-full min-h-32 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* GENERAL REMARKS */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">General Remarks</Label>
                    <textarea
                      id="generalRemarks"
                      name="remarks"
                      value={formData.remarks || ""}
                      onChange={handleChange}
                      placeholder="General notes..."
                      className="w-full min-h-32 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* INSURANCE DETAILS – UPDATED UI */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-amber-800">
                  <Shield className="w-7 h-7 text-amber-600" />
                  Insurance Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {/* Policy Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Policy Number</Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.policyNumber"
                      value={formData.employeeInsuranceDetailsDTO?.policyNumber || ""}
                      onChange={handleChange}
                      placeholder="e.g., POL123456"
                      onBlur={() => checkUniqueness('POLICY_NUMBER', formData.employeeInsuranceDetailsDTO?.policyNumber || '', 'employeeInsuranceDetailsDTO.policyNumber', 'policy_number')}
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                    {errors["employeeInsuranceDetailsDTO.policyNumber"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["employeeInsuranceDetailsDTO.policyNumber"]}
                      </p>
                    )}
                  </div>

                  {/* Provider Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Provider Name</Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={formData.employeeInsuranceDetailsDTO?.providerName || ""}
                      onChange={handleChange}
                      placeholder="e.g., Star Health"
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                    {errors["employeeInsuranceDetailsDTO.providerName"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["employeeInsuranceDetailsDTO.providerName"]}
                      </p>
                    )}
                  </div>

                  {/* Coverage Start */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Coverage Start</Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageStart"
                      value={formData.employeeInsuranceDetailsDTO?.coverageStart || ""}
                      max={today}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                  </div>

                  {/* Coverage End */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Coverage End</Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageEnd"
                      value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ""}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                  </div>

                  {/* Nominee Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Name</Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeName"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeName || ""}
                      onChange={handleChange}
                      placeholder="e.g., Priya Sharma"
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                    {errors["employeeInsuranceDetailsDTO.nomineeName"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["employeeInsuranceDetailsDTO.nomineeName"]}
                      </p>
                    )}
                  </div>

                  {/* Nominee Relation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Relation</Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ""}
                      onChange={handleChange}
                      placeholder="e.g., Spouse"
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                    {errors["employeeInsuranceDetailsDTO.nomineeRelation"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["employeeInsuranceDetailsDTO.nomineeRelation"]}
                      </p>
                    )}
                  </div>

                  {/* Nominee Contact */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Contact</Label>
                    <div className="relative">
                      <Input
                        name="employeeInsuranceDetailsDTO.nomineeContact"
                        value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ""}
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('CONTACT_NUMBER', formData.employeeInsuranceDetailsDTO?.nomineeContact || '', 'employeeInsuranceDetailsDTO.nomineeContact', 'nominee_Contact')}
                        placeholder="e.g., 123456789012"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('employeeInsuranceDetailsDTO.nomineeContact') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {errors["employeeInsuranceDetailsDTO.nomineeContact"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeInsuranceDetailsDTO.nomineeContact"]}
                      </p>
                    )}
                  </div>


                  {/* Group Insurance */}
                  <div className="flex items-center gap-3 h-12 sm:col-span-2 lg:col-span-3 xl:col-span-4 mt-4">
                    <Checkbox
                      id="groupInsurance"
                      checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeInsuranceDetailsDTO.groupInsurance",
                            checked: v,
                          },
                        } as any)
                      }
                    />
                    <Label htmlFor="groupInsurance" className="text-base font-medium cursor-pointer">
                      Group Insurance
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STATUTORY DETAILS – UPDATED UI */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-red-800">
                  <FileCheck className="w-7 h-7 text-red-600" />
                  Statutory Details
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                  {/* Passport Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">Passport Number</Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.passportNumber"
                        type="text"
                        value={formData.employeeStatutoryDetailsDTO?.passportNumber || ""}
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('PASSPORT_NUMBER', formData.employeeStatutoryDetailsDTO?.passportNumber || '', 'employeeStatutoryDetailsDTO.passportNumber', 'passport_number')}
                        placeholder="e.g., A1234567"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('employeeStatutoryDetailsDTO.passportNumber') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {errors["employeeStatutoryDetailsDTO.passportNumber"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeStatutoryDetailsDTO.passportNumber"]}
                      </p>
                    )}
                  </div>

                  {/* PF UAN Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">PF UAN Number</Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.pfUanNumber"
                        type="text"
                        value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ""}
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('PF_UAN_NUMBER', formData.employeeStatutoryDetailsDTO?.pfUanNumber || '', 'employeeStatutoryDetailsDTO.pfUanNumber', 'pf_uan_number')}
                        placeholder="e.g., 123456789012"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('employeeStatutoryDetailsDTO.pfUanNumber') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {errors["employeeStatutoryDetailsDTO.pfUanNumber"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeStatutoryDetailsDTO.pfUanNumber"]}
                      </p>
                    )}
                  </div>

                  {/* Tax Regime */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">Tax Regime</Label>
                    <Input
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      type="text"
                      value={formData.employeeStatutoryDetailsDTO?.taxRegime || ""}
                      onChange={handleChange}
                      placeholder="e.g., Old Regime / New Regime"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                    />
                    {errors["employeeStatutoryDetailsDTO.taxRegime"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeStatutoryDetailsDTO.taxRegime"]}
                      </p>
                    )}
                  </div>

                  {/* ESI Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">ESI Number</Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.esiNumber"
                        type="text"
                        value={formData.employeeStatutoryDetailsDTO?.esiNumber || ""}
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('ESI_NUMBER', formData.employeeStatutoryDetailsDTO?.esiNumber || '', 'employeeStatutoryDetailsDTO.esiNumber', 'esi_number')}
                        placeholder="e.g., 1234567890"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('employeeStatutoryDetailsDTO.esiNumber') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {errors["employeeStatutoryDetailsDTO.esiNumber"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeStatutoryDetailsDTO.esiNumber"]}
                      </p>
                    )}
                  </div>

                  {/* SSN Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">SSN Number</Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.ssnNumber"
                        type="text"
                        value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ""}
                        onChange={handleChange}
                        onBlur={() => checkUniqueness('SSN_NUMBER', formData.employeeStatutoryDetailsDTO?.ssnNumber || '', 'employeeStatutoryDetailsDTO.ssnNumber', 'ssn_number')}
                        placeholder="e.g., 123-45-6789"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"

                      />
                      {/* Loading Spinner */}
                      {checking.has('employeeStatutoryDetailsDTO.ssnNumber') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {errors["employeeStatutoryDetailsDTO.ssnNumber"] && (
                      <p className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        {errors["employeeStatutoryDetailsDTO.ssnNumber"]}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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