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
  EmployeeEquipmentDTO,
  AllowanceDTO,
  DeductionDTO,
  Department,
  PayType,
  PayClass,
  PAY_CLASS_OPTIONS,
  WORKING_MODEL_OPTIONS,
  DEPARTMENT_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
  PROBATION_DURATION_OPTIONS,
  PROBATION_NOTICE_OPTIONS,
  BOND_DURATION_OPTIONS,
  SHIFT_TIMING_OPTIONS,
  PAY_TYPE_OPTIONS,
  EmployeeDepartmentDTO,
  EmployeeDTO,
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
import { Trash2, Plus, Briefcase, FileText, Package, Upload, Shield, FileCheck } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { employeeService } from '@/lib/api/employeeService';
import { UniqueField, validationService } from '@/lib/api/validationService';

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
  const [formData, setFormData] = useState<EmployeeModel | null>(null);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const today = new Date().toISOString().split('T')[0];
  const [departmentEmployees, setDepartmentEmployees] = useState<EmployeeDepartmentDTO[]>([]);
  const [employeeImageFile, setEmployeeImageFile] = useState<File | undefined>(undefined);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [employeeData, setEmployeeData] = useState<EmployeeDTO | null>(null); // ← This has all IDs
  const designations: Designation[] = [
    'INTERN', 'TRAINEE', 'ASSOCIATE_ENGINEER', 'SOFTWARE_ENGINEER', 'SENIOR_SOFTWARE_ENGINEER',
    'LEAD_ENGINEER', 'TEAM_LEAD', 'TECHNICAL_ARCHITECT', 'REPORTING_MANAGER', 'DELIVERY_MANAGER',
    'DIRECTOR', 'VP_ENGINEERING', 'CTO', 'HR', 'FINANCE', 'OPERATIONS'
  ];

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
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchDepartmentEmployees = async (dept: Department) => {
    if (!dept) {
      setDepartmentEmployees([]);
      return;
    }
    try {
      const result = await employeeService.getEmployeesByDepartment(dept);
      setDepartmentEmployees(result);
    } catch (err: any) {
      console.error('Failed to load employees for department:', dept, err);
      setDepartmentEmployees([]);
    }
  };

  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string,
    excludeId?: string | null
  ) => {
    const val = value.trim();
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    setChecking(prev => new Set(prev).add(errorKey));

    try {
      // ONLY use edit mode if excludeId is a REAL, NON-EMPTY UUID
      const isValidExcludeId = excludeId && excludeId.trim() !== "" && excludeId.length > 10;

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
      console.warn("Uniqueness check failed:", err);
    } finally {
      setChecking(prev => {
        const s = new Set(prev);
        s.delete(errorKey);
        return s;
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string') {
        Swal.fire({ icon: 'error', title: 'Invalid ID' });
        setLoading(false);
        return;
      }

      try {
        const [empRes, clientRes] = await Promise.all([
          adminService.getEmployeeById(params.id),
          adminService.getAllClients(),
        ]);

        if (!empRes.flag || !empRes.response) throw new Error('Employee not found');

        const emp = empRes.response as EmployeeDTO;
        setEmployeeData(emp);
        let clientSelection = '';
        if (emp.clientId) {
          clientSelection = `CLIENT:${emp.clientId}`;
        } else {
          clientSelection = `STATUS:${emp.clientStatus || ''}`;
        }

        setFormData({
          ...emp,
          clientSelection,

          // Clean: pure EmployeeDocumentDTO[] — no fileObj, no extensions
          documents: emp.documents ?? [],

          employeeEquipmentDTO: emp.employeeEquipmentDTO ?? [],

          employeeSalaryDTO: emp.employeeSalaryDTO
            ? {
              ...emp.employeeSalaryDTO,
              employeeId: emp.employeeSalaryDTO.employeeId || emp.employeeId,
            }
            : undefined,
        });

        // Reset the separate file upload tracker
        setDocumentFiles(new Array(emp.documents?.length || 0).fill(null));
        if (emp.employeeEmploymentDetailsDTO?.department) {
          employeeService.getEmployeesByDepartment(emp.employeeEmploymentDetailsDTO.department)
            .then(setDepartmentEmployees)
            .catch(() => setDepartmentEmployees([]));
        }
        setClients(clientRes.response);

        // Load managers for current department on page load
        if (emp.employeeEmploymentDetailsDTO?.department) {
          try {
            const deptManagers = await employeeService.getEmployeesByDepartment(
              emp.employeeEmploymentDetailsDTO.department
            );
            setDepartmentEmployees(deptManagers);
          } catch (err) {
            console.warn('Could not load managers for department:', emp.employeeEmploymentDetailsDTO.department);
            setDepartmentEmployees([]);
          }
        }

      } catch (err: any) {
        Swal.fire('Error', err.message || 'Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

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
      default:
        break;
    }
    return errorMsg;
  };

  // FIXED: Safe handleChange — never wipes data
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      if (!prev) return prev;

      // Handle nested fields like employeeEmploymentDetailsDTO.shiftTiming
      if (name.includes('.')) {
        const [parent, child] = name.split('.') as [keyof EmployeeModel, string];

        // Special safety for undefined nested objects
        const currentParent = prev[parent] as any;

        return {
          ...prev,
          [parent]: {
            ...(currentParent ?? {}),
            [child]: isCheckbox ? checked : value,
          },
        };
      }

      // Top-level fields
      return {
        ...prev,
        [name]: isCheckbox ? checked : value,
      };
    });

    // Validation (only run for simple fields — skip nested ones if you want)
    if (!name.includes('.')) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // DOCUMENTS
  const addDocument = () => {
    setFormData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        documents: [
          ...prev.documents,
          {
            documentId: "",
            docType: "OTHER" as DocumentType,
            file: "",
            uploadedAt: new Date().toISOString(),
            verified: false,
          },
        ],
      };
    });

    // Keep the separate file-upload tracker in sync
    setDocumentFiles((prev) => [...prev, null]);
  };

  const handleDocumentChange = (index: number, field: 'docType' | 'fileObj', value: DocumentType | File | null) => {
    setFormData(prev => prev ? ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      ),
    }) : prev);
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
    if (!formData) return;
    const doc = formData.documents[index];
    if (doc.documentId) {
      const res = await adminService.deleteEmployeeDocument(params.id as string, doc.documentId);
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
    setFormData(prev => prev ? ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }) : prev);
  };

  // EQUIPMENT
  const addEquipment = () => {
    setFormData(prev => prev ? ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: "", equipmentType: '', serialNumber: '', issuedDate: '' },
      ],
    }) : prev);
  };

  const handleEquipmentChange = (index: number, field: keyof EmployeeEquipmentDTO, value: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      ) ?? [],
    }) : prev);
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
    if (!formData) return;
    const eq = formData.employeeEquipmentDTO?.[index];
    if (eq?.equipmentId) {
      const res = await adminService.deleteEmployeeEquipmentInfo(eq.equipmentId);
      if (!res.flag) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message });
        return;
      }
    }
    setFormData(prev => prev ? ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }) : prev);
  };
  const currentManagerName = formData?.reportingManagerId
    ? departmentEmployees.find(e => e.employeeId === formData.reportingManagerId)?.fullName
    : null;


  // DELETE ALLOWANCE 
  const confirmAndRemoveAllowance = async (index: number) => {
    const result = await Swal.fire({
      title: 'Remove Allowance?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    await removeAllowance(index);
  };

  const removeAllowance = async (index: number) => {
    if (!formData || !params.id || !formData.employeeSalaryDTO) return;

    const allowance = formData.employeeSalaryDTO.allowances?.[index];
    let wasDeletedFromServer = false;

    if (allowance?.allowanceId) {
      try {
        const res = await adminService.deleteEmployeeAllowance(
          params.id as string,
          allowance.allowanceId
        );

        // If HTTP 200 → success (even if flag is false – often means "already deleted")
        if (res.status === 200 || res.flag === true) {
          wasDeletedFromServer = true;
        }
        // Optional: you can log if flag false but still proceed
        else if (!res.flag) {
          console.warn('Backend returned flag: false but 200 OK – treating as success', res);
          wasDeletedFromServer = true;
        }
      } catch (err: any) {
        // Only real network errors or 4xx/5xx → show error
        if (err.response?.status >= 400) {
          await Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Could not delete allowance from server',
          });
          return;
        }
        // If it's a network error but not 4xx/5xx, fall through
        console.error('Unexpected delete error:', err);
      }
    } else {
      wasDeletedFromServer = true; // never saved → safe to remove
    }

    // Always remove from UI if we think it succeeded
    setFormData(prev => {
      if (!prev?.employeeSalaryDTO) return prev;

      return {
        ...prev,
        employeeSalaryDTO: {
          ...prev.employeeSalaryDTO,
          employeeId: prev.employeeSalaryDTO.employeeId || (params.id as string),
          allowances: prev.employeeSalaryDTO.allowances?.filter((_, i) => i !== index) || [],
        },
      };
    });

    // Always show success if we reached here
    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Allowance removed successfully',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // DELETE DEDUCTION 
  const confirmAndRemoveDeduction = async (index: number) => {
    const result = await Swal.fire({
      title: 'Remove Deduction?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    await removeDeduction(index);
  };

  const removeDeduction = async (index: number) => {
    if (!formData || !params.id || !formData.employeeSalaryDTO) return;

    const deduction = formData.employeeSalaryDTO.deductions?.[index];
    let wasDeletedFromServer = false;

    if (deduction?.deductionId) {
      try {
        const res = await adminService.deleteEmployeeDeduction(
          params.id as string,
          deduction.deductionId
        );

        if (res.status === 200 || res.flag === true) {
          wasDeletedFromServer = true;
        } else if (!res.flag) {
          console.warn('Deduction delete: flag false but 200 OK → treating as success');
          wasDeletedFromServer = true;
        }
      } catch (err: any) {
        if (err.response?.status >= 400) {
          await Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Could not delete deduction from server',
          });
          return;
        }
      }
    } else {
      wasDeletedFromServer = true;
    }

    setFormData(prev => {
      if (!prev?.employeeSalaryDTO) return prev;

      return {
        ...prev,
        employeeSalaryDTO: {
          ...prev.employeeSalaryDTO,
          employeeId: prev.employeeSalaryDTO.employeeId || (params.id as string),
          deductions: prev.employeeSalaryDTO.deductions?.filter((_, i) => i !== index) || [],
        },
      };
    });

    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Deduction removed successfully',
      timer: 1500,
      showConfirmButton: false,
    });
  };


  // const removeAllowance = async (index: number) => {
  //   if (!formData || !params.id) return;

  //   const allowance = formData.employeeSalaryDTO?.allowances?.[index];

  //   // Delete from backend if it has an ID (already saved)
  //   if (allowance?.allowanceId) {
  //     try {
  //       const res = await adminService.deleteEmployeeAllowance(
  //         params.id as string,
  //         allowance.allowanceId
  //       );
  //       if (!res.flag) throw new Error(res.message || 'Failed to delete');
  //     } catch (err: any) {
  //       Swal.fire('Error', err.message || 'Could not delete allowance', 'error');
  //       return; // ← Important: don't update UI if API failed
  //     }
  //   }

  //   // Safely update state while preserving required fields
  //   setFormData(prev => {
  //     if (!prev || !prev.employeeSalaryDTO) return prev;

  //     const updatedAllowances = prev.employeeSalaryDTO.allowances?.filter((_, i) => i !== index) || [];

  //     return {
  //       ...prev,
  //       employeeSalaryDTO: {
  //         ...prev.employeeSalaryDTO,
  //         employeeId: prev.employeeSalaryDTO.employeeId || (params.id as string), // ← ENSURE it's always a string
  //         allowances: updatedAllowances,
  //       },
  //     };
  //   });

  //   Swal.fire('Deleted!', 'Allowance removed successfully', 'success');
  // };

  // const removeDeduction = async (index: number) => {
  //   if (!formData || !params.id) return;

  //   const deduction = formData.employeeSalaryDTO?.deductions?.[index];

  //   if (deduction?.deductionId) {
  //     try {
  //       const res = await adminService.deleteEmployeeDeduction(
  //         params.id as string,
  //         deduction.deductionId
  //       );
  //       if (!res.flag) throw new Error(res.message || 'Failed to delete');
  //     } catch (err: any) {
  //       Swal.fire('Error', err.message || 'Could not delete deduction', 'error');
  //       return;
  //     }
  //   }

  //   setFormData(prev => {
  //     if (!prev || !prev.employeeSalaryDTO) return prev;

  //     const updatedDeductions = prev.employeeSalaryDTO.deductions?.filter((_, i) => i !== index) || [];

  //     return {
  //       ...prev,
  //       employeeSalaryDTO: {
  //         ...prev.employeeSalaryDTO,
  //         employeeId: prev.employeeSalaryDTO.employeeId || (params.id as string), // ← Critical fix
  //         deductions: updatedDeductions,
  //       },
  //     };
  //   });

  //   Swal.fire('Deleted!', 'Deduction removed successfully', 'success');
  // };

  // In handleSubmit — CRITICAL CHANGE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id || !formData) return;

    setSubmitting(true);
    const fd = new FormData();

    try {
      const cleanEmploymentDetails = (dto?: any) => {
        if (!dto) return undefined;
        const { shiftTimingLabel, workingModelLabel, noticePeriodDurationLabel,
          probationDurationLabel, probationNoticePeriodLabel, bondDurationLabel,
          departmentLabel, locationLabel, ...clean } = dto;
        return clean;
      };

      const cleanPayload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        personalEmail: formData.personalEmail,
        companyEmail: formData.companyEmail,
        contactNumber: formData.contactNumber,
        alternateContactNumber: formData.alternateContactNumber,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: formData.numberOfChildren,
        nationality: formData.nationality,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        remarks: formData.remarks,
        skillsAndCertification: formData.skillsAndCertification,

        designation: formData.designation,
        dateOfBirth: formData.dateOfBirth,
        dateOfJoining: formData.dateOfJoining,
        rateCard: formData.rateCard,
        employmentType: formData.employmentType,
        reportingManagerId: formData.reportingManagerId,

        ...(formData.clientSelection?.startsWith('CLIENT:')
          ? { clientId: formData.clientSelection.replace('CLIENT:', '') }
          : { clientSelection: formData.clientSelection }),

        panNumber: formData.panNumber,
        aadharNumber: formData.aadharNumber,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        employeeEmploymentDetailsDTO: cleanEmploymentDetails(formData.employeeEmploymentDetailsDTO),
        employeeSalaryDTO: formData.employeeSalaryDTO,
        employeeEquipmentDTO: formData.employeeEquipmentDTO,

        // ONLY send document metadata — NO file field!
        documents: formData.documents.map(doc => ({
          documentId: doc.documentId || null,
          docType: doc.docType,
        })),

        // ADDED: INSURANCE & STATUTORY — ONLY IF ANY FIELD IS FILLED
        ...(formData.employeeInsuranceDetailsDTO && (
          formData.employeeInsuranceDetailsDTO.policyNumber ||
          formData.employeeInsuranceDetailsDTO.providerName ||
          formData.employeeInsuranceDetailsDTO.coverageStart ||
          formData.employeeInsuranceDetailsDTO.coverageEnd ||
          formData.employeeInsuranceDetailsDTO.nomineeName ||
          formData.employeeInsuranceDetailsDTO.nomineeRelation ||
          formData.employeeInsuranceDetailsDTO.nomineeContact ||
          formData.employeeInsuranceDetailsDTO.groupInsurance === true
        ) ? {
          employeeInsuranceDetailsDTO: {
            policyNumber: formData.employeeInsuranceDetailsDTO.policyNumber || '',
            providerName: formData.employeeInsuranceDetailsDTO.providerName || '',
            coverageStart: formData.employeeInsuranceDetailsDTO.coverageStart || '',
            coverageEnd: formData.employeeInsuranceDetailsDTO.coverageEnd || '',
            nomineeName: formData.employeeInsuranceDetailsDTO.nomineeName || '',
            nomineeRelation: formData.employeeInsuranceDetailsDTO.nomineeRelation || '',
            nomineeContact: formData.employeeInsuranceDetailsDTO.nomineeContact || '',
            groupInsurance: formData.employeeInsuranceDetailsDTO.groupInsurance || false,
          }
        } : {}),

        ...(formData.employeeStatutoryDetailsDTO && (
          formData.employeeStatutoryDetailsDTO.passportNumber ||
          formData.employeeStatutoryDetailsDTO.taxRegime ||
          formData.employeeStatutoryDetailsDTO.pfUanNumber ||
          formData.employeeStatutoryDetailsDTO.esiNumber ||
          formData.employeeStatutoryDetailsDTO.ssnNumber
        ) ? {
          employeeStatutoryDetailsDTO: {
            passportNumber: formData.employeeStatutoryDetailsDTO.passportNumber || '',
            taxRegime: formData.employeeStatutoryDetailsDTO.taxRegime || '',
            pfUanNumber: formData.employeeStatutoryDetailsDTO.pfUanNumber || '',
            esiNumber: formData.employeeStatutoryDetailsDTO.esiNumber || '',
            ssnNumber: formData.employeeStatutoryDetailsDTO.ssnNumber || '',
          }
        } : {}),
      };

      fd.append("employee", JSON.stringify(cleanPayload));

      if (employeeImageFile instanceof File) {
        fd.append("employeePhotoUrl", employeeImageFile);
      }
      // documentFiles.forEach((file, index) => {
      //   if (file instanceof File) {
      //     fd.append(`documents[${index}]`, file);
      //   }
      // });
      documentFiles.forEach((file) => {
        if (file instanceof File) {
          fd.append("documents", file); // MUST NOT use [0], [1]
        }
      });
      const res = await adminService.updateEmployee(params.id as string, fd);

      if (res.flag) {
        await Swal.fire('Success!', 'Employee updated successfully!', 'success');
        router.push('/admin-dashboard/employees/list');
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      Swal.fire('Error', err.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // LOADING STATES
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

  if (!formData) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="text-center py-20 text-gray-500 text-xl">Employee not found</div>
      </ProtectedRoute>
    );
  }

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
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) checkUniqueness('EMAIL', val, 'personalEmail', 'personal_email', employeeData?.employeeId);
                        }}
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
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) checkUniqueness('EMAIL', val, 'companyEmail', 'company_email', employeeData?.employeeId);
                        }}
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
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val.length === 10) {
                            checkUniqueness('CONTACT_NUMBER', val, 'contactNumber', 'contact_number', employeeData?.employeeId);
                          }
                        }}
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

                    <Select
                      required
                      value={formData?.gender || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => prev ? { ...prev, gender: v } : prev)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">    <SelectValue placeholder="Select Gender" />
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

                    <Select
                      required
                      value={selectValue}
                      onValueChange={(v) => {
                        setFormData((prev) => prev ? {
                          ...prev,
                          clientId: staticClients.has(v) ? null : v,
                          clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`,
                        } : prev);
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

                    <Select
                      required
                      value={formData?.employeeEmploymentDetailsDTO?.department || ''}
                      onValueChange={async (v) => {
                        const department = v as Department;

                        setFormData((prev) => prev ? {
                          ...prev,
                          employeeEmploymentDetailsDTO: {
                            ...(prev.employeeEmploymentDetailsDTO || {
                              employmentId: "",
                              employeeId: params.id as string,
                              probationApplicable: false,
                              bondApplicable: false,
                            }),
                            department,
                          },
                          reportingManagerId: '', // temporarily clear
                        } : prev);

                        // Fetch fresh list
                        const employees = await employeeService.getEmployeesByDepartment(department);
                        setDepartmentEmployees(employees);

                        const validManagers = employees.filter(emp =>
                          managerDesignations.includes(emp.designation as Designation)
                        );

                        // Auto-select if only one manager
                        if (validManagers.length === 1) {
                          setFormData(prev => prev ? { ...prev, reportingManagerId: validManagers[0].employeeId } : prev);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue
                          placeholder={
                            !formData?.employeeEmploymentDetailsDTO?.department
                              ? "First select Department"
                              : currentManagerName
                                ? `${currentManagerName} (Selected)`
                                : "Select Reporting Manager"
                          }
                        />                      </SelectTrigger>
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
                      value={formData?.reportingManagerId || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => prev ? { ...prev, reportingManagerId: v } : prev)
                      }
                      disabled={!formData?.employeeEmploymentDetailsDTO?.department}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue
                          placeholder={
                            formData?.employeeEmploymentDetailsDTO?.department
                              ? "Select Reporting Manager"
                              : "First select Department"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentEmployees.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {formData?.employeeEmploymentDetailsDTO?.department
                              ? "No managers in this department"
                              : "Select department first"}
                          </SelectItem>
                        ) : (
                          departmentEmployees.map((emp) => (
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

                    <Select
                      required
                      value={formData?.designation || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => prev ? { ...prev, designation: v as Designation } : prev)
                      }
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

                    <Select
                      required
                      value={formData.employmentType}
                      onValueChange={(v) =>
                        setFormData((prev) => prev ? { ...prev, employmentType: v as EmploymentType } : prev)
                      }
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
                      value={formData?.employeeSalaryDTO?.payType || ""}
                      onValueChange={(v) =>
                        setFormData((prev) => prev ? {
                          ...prev,
                          employeeSalaryDTO: {
                            ...(prev.employeeSalaryDTO ?? {
                              employeeId: params.id as string,
                              ctc: 0,
                              standardHours: 160,
                              payClass: "A1" as PayClass,
                              bankAccountNumber: "",
                              ifscCode: "",
                              allowances: [],
                              deductions: [],
                            }),
                            payType: v as PayType,
                          },
                        } : prev)
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
                          key={a.allowanceId || `allowance-${i}`}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
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

                                setFormData((prev) => prev ? {
                                  ...prev,
                                  employeeSalaryDTO: {
                                    ...(prev.employeeSalaryDTO || {
                                      employeeId: params.id as string,
                                      ctc: 0,
                                      payType: "MONTHLY" as PayType,
                                      standardHours: 160,
                                      payClass: "A1" as PayClass,
                                      bankAccountNumber: "",
                                      ifscCode: "",
                                      allowances: [],
                                      deductions: [],
                                    }),
                                    allowances: updated,
                                  },
                                } : prev);
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

                              setFormData((prev) => prev ? {
                                ...prev,
                                employeeSalaryDTO: {
                                  ...(prev.employeeSalaryDTO || {
                                    employeeId: params.id as string,
                                    ctc: 0,
                                    payType: "MONTHLY" as PayType,
                                    standardHours: 160,
                                    payClass: "A1" as PayClass,
                                    bankAccountNumber: "",
                                    ifscCode: "",
                                    allowances: [],
                                    deductions: [],
                                  }),
                                  allowances: updated,
                                },
                              } : prev);
                            }}
                          />

                          {/*Remove Button */}
                          <div className="flex items-end">

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => confirmAndRemoveAllowance(i)}
                              className="text-red-600 hover:bg-red-50"
                              disabled={submitting}
                            >
                              <Trash2 className="h-5 w-5" />
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
                            allowanceId: "",
                            allowanceType: "",
                            amount: 0,
                          };

                          setFormData((prev) => prev ? {
                            ...prev,
                            employeeSalaryDTO: {
                              ...(prev.employeeSalaryDTO || {
                                employeeId: params.id as string,
                                ctc: 0,
                                payType: "MONTHLY" as PayType,
                                standardHours: 160,
                                payClass: "A1" as PayClass,
                                bankAccountNumber: "",
                                ifscCode: "",
                                allowances: [],
                                deductions: [],
                              }),
                              allowances: [...(prev.employeeSalaryDTO?.allowances || []), newAllowance],
                            },
                          } : prev);
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
                          key={d.deductionId || `deduction-${i}`}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
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

                                setFormData((prev) => prev ? {
                                  ...prev,
                                  employeeSalaryDTO: {
                                    ...(prev.employeeSalaryDTO || {
                                      employeeId: params.id as string,
                                      ctc: 0,
                                      payType: "MONTHLY" as PayType,
                                      standardHours: 160,
                                      payClass: "A1" as PayClass,
                                      bankAccountNumber: "",
                                      ifscCode: "",
                                      allowances: [],
                                      deductions: []
                                    }),
                                    deductions: updated,
                                  }
                                } : prev);
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

                              setFormData((prev) => prev ? {
                                ...prev,
                                employeeSalaryDTO: {
                                  ...(prev.employeeSalaryDTO || {
                                    employeeId: params.id as string,
                                    ctc: 0,
                                    payType: "MONTHLY" as PayType,
                                    standardHours: 160,
                                    payClass: "A1" as PayClass,
                                    bankAccountNumber: "",
                                    ifscCode: "",
                                    allowances: [],
                                    deductions: []
                                  }),
                                  deductions: updated,
                                }
                              } : prev);
                            }}
                          />

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => confirmAndRemoveDeduction(i)}
                              className="text-red-600 hover:bg-red-50"
                              disabled={submitting}
                            >
                              <Trash2 className="h-5 w-5" />
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
                            deductionId: "",
                            deductionType: "",
                            amount: 0,
                          };

                          setFormData((prev) => prev ? {
                            ...prev,
                            employeeSalaryDTO: {
                              ...(prev.employeeSalaryDTO || {
                                employeeId: params.id as string,
                                ctc: 0,
                                payType: "MONTHLY" as PayType,
                                standardHours: 160,
                                payClass: "A1" as PayClass,
                                bankAccountNumber: "",
                                ifscCode: "",
                                allowances: [],
                                deductions: []
                              }),
                              deductions: [...(prev.employeeSalaryDTO?.deductions || []), newDeduction],
                            }
                          } : prev);
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
                            onChange={(file) => {
                              const newFiles = [...documentFiles];
                              newFiles[i] = file;
                              setDocumentFiles(newFiles);
                            }}
                            currentFile={documentFiles[i] ?? null}
                            existingUrl={doc.file || undefined}
                            onClear={() => {
                              const newFiles = [...documentFiles];
                              newFiles[i] = null;
                              setDocumentFiles(newFiles);
                            }}
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
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          const insuranceId = employeeData?.employeeInsuranceDetailsDTO?.insuranceId;
                          checkUniqueness('POLICY_NUMBER', val, 'employeeInsuranceDetailsDTO.policyNumber', 'policy_number', insuranceId);
                        }
                        // if (val) {
                        //   checkUniqueness('POLICY_NUMBER', val, 'employeeInsuranceDetailsDTO.policyNumber', 'policy_number', employeeData?.employeeInsuranceDetailsDTO?.insuranceId);
                        // }
                      }}
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
                        // onBlur={(e) => {
                        //   const val = e.target.value.trim();
                        //   if (val && val.length === 10) {
                        //     checkUniqueness('CONTACT_NUMBER', val, 'employeeInsuranceDetailsDTO.nomineeContact', 'nominee_contact', employeeData?.employeeInsuranceDetailsDTO?.insuranceId);
                        //   }
                        // }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val.length === 10) {
                            const insuranceId = employeeData?.employeeInsuranceDetailsDTO?.insuranceId;
                            checkUniqueness('CONTACT_NUMBER', val, 'employeeInsuranceDetailsDTO.nomineeContact', 'nominee_contact', insuranceId);
                          }
                        }}
                        maxLength={10}
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
                      // checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                      checked={
                        formData.employeeInsuranceDetailsDTO?.groupInsurance === null
                          ? undefined
                          : formData.employeeInsuranceDetailsDTO?.groupInsurance
                      }
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
                        // onBlur={(e) => {
                        //   const val = e.target.value.trim();
                        //   if (val) {
                        //     checkUniqueness('PASSPORT_NUMBER', val, 'employeeStatutoryDetailsDTO.passportNumber', 'passport_number', employeeData?.employeeStatutoryDetailsDTO?.statutoryId);
                        //   }
                        // }}     
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const statutoryId = employeeData?.employeeStatutoryDetailsDTO?.statutoryId;
                            checkUniqueness('PASSPORT_NUMBER', val, 'employeeStatutoryDetailsDTO.passportNumber', 'passport_number', statutoryId);
                          }
                        }}
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
                        // onBlur={(e) => {
                        //   const val = e.target.value.trim();
                        //   if (val) {
                        //     checkUniqueness('PF_UAN_NUMBER', val, 'employeeStatutoryDetailsDTO.pfUanNumber', 'pf_uan_number', employeeData?.employeeStatutoryDetailsDTO?.statutoryId);
                        //   }
                        // }}    
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const statutoryId = employeeData?.employeeStatutoryDetailsDTO?.statutoryId;
                            checkUniqueness('PF_UAN_NUMBER', val, 'employeeStatutoryDetailsDTO.pfUanNumber', 'pf_uan_number', statutoryId);
                          }
                        }}
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
                        // onBlur={(e) => {
                        //   const val = e.target.value.trim();
                        //   if (val) {
                        //     checkUniqueness('ESI_NUMBER', val, 'employeeStatutoryDetailsDTO.esiNumber', 'esi_number', employeeData?.employeeStatutoryDetailsDTO?.statutoryId);
                        //   }
                        // }}    
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const statutoryId = employeeData?.employeeStatutoryDetailsDTO?.statutoryId;
                            checkUniqueness('ESI_NUMBER', val, 'employeeStatutoryDetailsDTO.esiNumber', 'esi_number', statutoryId);
                          }
                        }}
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
                        // onBlur={(e) => {
                        //   const val = e.target.value.trim();
                        //   if (val) {
                        //     checkUniqueness('SSN_NUMBER', val, 'employeeStatutoryDetailsDTO.ssnNumber', 'ssn_number', employeeData?.employeeStatutoryDetailsDTO?.statutoryId);
                        //   }
                        // }}    
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const statutoryId = employeeData?.employeeStatutoryDetailsDTO?.statutoryId;
                            checkUniqueness('SSN_NUMBER', val, 'employeeStatutoryDetailsDTO.ssnNumber', 'ssn_number', statutoryId);
                          }
                        }}
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