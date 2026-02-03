'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
import { validationService, type UniqueField } from '@/lib/api/validationService';
import {
  EmployeeDTO,
  ClientDTO,
  Designation,
  EmployeeEquipmentDTO,
  DocumentType,
  EmploymentType,
  EmployeeModel,
  AllowanceDTO,
  DeductionDTO,
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
  WORKING_MODEL_OPTIONS,
  EmployeeDepartmentDTO,
} from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { User, Briefcase, FileText, Laptop, Shield, FileCheck, Upload, Trash2, Plus, Loader2 } from 'lucide-react';
import { employeeService } from '@/lib/api/employeeService';
import TooltipHint from '@/components/ui/TooltipHint';
interface Client {
  id: string;
  name: string;
}
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
    numberOfChildren: null,
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
    dateOfOnboardingToClient: '',
    dateOfOffboardingToClient: '',
    clientBillingStartDate: '',
    clientBillingStopDate: '',  
    rateCard: null,
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
      ctc: null,
      payType: 'MONTHLY' as PayType,
      standardHours: null,
      bankAccountNumber: '',
      ifscCode: '',
      payClass: 'A1' as PayClass,
      allowances: [],
      deductions: [],
    },
    employeeAdditionalDetailsDTO: {
      backgroundCheckStatus: '',
      remarks: '',
    },
    employeeEmploymentDetailsDTO: {
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
  const [documentFilesList, setDocumentFilesList] = useState<(File | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useAuth();
  const router = useRouter();
  // Real-time validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departmentEmployees, setDepartmentEmployees] = useState<EmployeeDepartmentDTO[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const maxJoiningDate = new Date();
  maxJoiningDate.setMonth(maxJoiningDate.getMonth() + 3);
  const maxJoiningDateStr = maxJoiningDate.toISOString().split('T')[0];
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<EmployeeDTO[]>([]);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  // REAL-TIME VALIDATION
  const validateField = (name: string, value: string | number | boolean) => {
    const val = String(value).trim();
    const newErrors: Record<string, string> = { ...errors };
    delete newErrors[name];
    // Required fields
    const required = ['firstName', 'lastName', 'personalEmail', 'companyEmail', 'contactNumber', 'designation', 'dateOfBirth', 'dateOfJoining', 'gender', 'nationality'];
    if (required.includes(name) && !val) {
      newErrors[name] = 'This field is required';
    }
    // First & Last Name
    if (['firstName', 'lastName'].includes(name)) {
      if (val && !/^[A-Za-z\s]+$/.test(val)) newErrors[name] = 'Only letters and spaces allowed';
      if (val && val.length > 30) newErrors[name] = 'Maximum 30 characters';
    }
    // Email
    if (['personalEmail', 'companyEmail'].includes(name)) {
      if (val && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(val)) {
        newErrors[name] = "Invalid email format (use only lowercase letters)";
      }
      if (name === 'companyEmail' && val.toLowerCase() === formData.personalEmail.toLowerCase() && formData.personalEmail)
        newErrors[name] = 'Cannot be same as personal email';
    }
    // Contact Numbers
    if (['contactNumber', 'emergencyContactNumber'].includes(name)) {
      if (val && !/^[6-9]\d{9}$/.test(val)) newErrors[name] = 'Invalid Indian mobile number';
    }
    // Max 30 Characters
    const max30Fields = [
      'allowanceType', 'deductionType', 'equipmentType', 'serialNumber',
      'employeeAdditionalDetailsDTO.backgroundCheckStatus',
      'employeeInsuranceDetailsDTO.policyNumber', 'employeeInsuranceDetailsDTO.providerName',
      'employeeInsuranceDetailsDTO.nomineeName', 'employeeInsuranceDetailsDTO.nomineeRelation',
      // 'employeeStatutoryDetailsDTO.passportNumber', 'employeeStatutoryDetailsDTO.pfUanNumber',
      'employeeStatutoryDetailsDTO.taxRegime', 'employeeStatutoryDetailsDTO.esiNumber',
      'employeeStatutoryDetailsDTO.ssnNumber',
    ];
    if (max30Fields.some(f => name.includes(f))) {
      if (val && val.length > 30) newErrors[name] = 'Maximum 30 characters';
    }
    // Special Rules
    if (name === 'employeeStatutoryDetailsDTO.pfUanNumber' && val && !/^\d{12}$/.test(val))
      newErrors[name] = 'PF UAN must be 12 digits';
    if (name === 'employeeStatutoryDetailsDTO.passportNumber' && val && !/^[A-Z0-9]{8,12}$/.test(val))
      newErrors[name] = 'Invalid passport number';
    setErrors(newErrors);
  };

  const handleChange = (e: any) => {
    const { name } = e.target;

    // Support manual values (very important)
    let parsedValue =
      e.target.value !== undefined ? e.target.value : e.target.checked;

    // Convert checkbox values: true / null
    if (typeof parsedValue === "boolean") {
      parsedValue = parsedValue === true ? true : null;
    }

    // Convert numeric fields
    // if (['ctc', 'standardHours', 'rateCard'].some(f => name.includes(f))) {
    //   parsedValue = parseFloat(parsedValue) || 0;
    // }
    if (['ctc', 'standardHours', 'rateCard', 'numberOfChildren'].some(f => name.includes(f))) {
      if (parsedValue === '' || parsedValue == null) {
        parsedValue = null;
      } else {
        const num = parseFloat(parsedValue);
        parsedValue = isNaN(num) ? null : num;
      }
    }

    // Handle nested dto fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof EmployeeModel] === "object" && prev[parent as keyof EmployeeModel] !== null
            ? (prev[parent as keyof EmployeeModel] as any)
            : {}), // safe fallback object
          [child]: parsedValue,
        },
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }

    validateField(name, parsedValue);
  };

  const fetchDepartmentEmployees = async (dept: Department) => {
    if (!dept) {
      setDepartmentEmployees([]);
      return;
    }
    try {
      const result = await employeeService.getEmployeesByDepartment(dept);
      setDepartmentEmployees(result);
    } catch (err) {
      setDepartmentEmployees([]);
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
        fieldColumn,  // ← SEND THIS
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
  // ⭐ VALIDATION: State for real-time results
  const [validationResults, setValidationResults] = useState<Record<string, { exists: boolean; message: string }>>({});

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
    'AADHAAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'TWELFTH_CERTIFICATE',
    'DEGREE_CERTIFICATE', 'POST_GRADUATION_CERTIFICATE', 'OTHER'
  ];
  const employmentTypes: EmploymentType[] = ['CONTRACTOR', 'FREELANCER', 'FULLTIME'];
  const staticClients = new Set(['BENCH', 'INHOUSE', 'HR', 'NA']);
  const realManagers = departmentEmployees.filter(
    (emp) => emp.employeeId && emp.designation
  );
  
  const hasNoManagerOption = departmentEmployees.some(
    (emp) => emp.employeeId === null
  );
  // ⭐ VALIDATION: Debounce timeouts per field
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const debouncedValidate = useCallback(async (key: string, value: string, field: UniqueField) => {
    if (timeouts.current[key]) clearTimeout(timeouts.current[key]);
    timeouts.current[key] = setTimeout(async () => {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[key];
          return newResults;
        });
        return;
      }
      try {
        const result = await validationService.validateField({
          field,
          value: trimmedValue,
          mode: 'create' as const,
        });

        // ← THIS LINE WAS THE PROBLEM — result.message can be undefined
        setValidationResults(prev => ({
          ...prev,
          [key]: {
            exists: result.exists,
            message: result.message ?? "Validation unavailable", // ← ALWAYS provide string
          },
        }));
      } catch (error) {
        console.warn('Validation failed:', error);
        setValidationResults(prev => ({
          ...prev,
          [key]: { exists: false, message: "Validation unavailable" },
        }));
      }
    }, 500);
  }, []);
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
  const handleDocumentChange = (
    index: number,
    field: "docType" | "file",
    value: DocumentType | File | null
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;

      const updatedDocs = prev.documents.map((doc, i) => {
        if (i !== index) return doc;

        // When changing the file
        if (field === "file") {
          return {
            ...doc,
            file: value as File | null, // ✅ only assign File here
            fileUrl: value ? "PENDING_UPLOAD" : doc.fileUrl ?? null, // ✅ keep string | null
            documentId: doc.documentId ?? null,
            uploadedAt: doc.uploadedAt || new Date().toISOString(),
            verified: doc.verified || false,
          };
        }

        // When changing docType
        if (field === "docType") {
          return {
            ...doc,
            docType: value as DocumentType,
          };
        }

        return doc;
      });

      return {
        ...prev,
        documents: updatedDocs,
      };
    });

    // Update separate File list for uploading
    if (field === "file") {
      setDocumentFilesList((prev) => {
        const updated = [...prev];
        updated[index] = value as File | null;
        return updated;
      });
    }
  };
  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentId: null,
          docType: "OTHER" as DocumentType,
          file: null, // ✅ must be null, not ''
          fileUrl: null, // ✅ must be null
          uploadedAt: new Date().toISOString(),
          verified: false,
        },
      ],
    }));
    setDocumentFilesList((prev) => [...prev, null]);
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
    // ⭐ VALIDATION: Trigger for serialNumber
    if (field === 'serialNumber') {
      const key = `equipment_${index}_serialNumber`;
      debouncedValidate(key, value, 'SERIAL_NUMBER');
    }
  };
  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: null, equipmentType: '', serialNumber: '' },
      ],
    }));
  };
  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
    }));
    // ⭐ VALIDATION: Clear serial validation on remove
    const key = `equipment_${index}_serialNumber`;
    if (timeouts.current[key]) clearTimeout(timeouts.current[key]);
    setValidationResults(prev => {
      const newResults = { ...prev };
      delete newResults[key];
      return newResults;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Clear previous errors
    setErrors({});
    // document.querySelectorAll('.error-field').forEach(el => el.classList.remove('error-field'));
    try {
      // === CLIENT-SIDE REQUIRED FIELDS (Silent Focus) ===
      const requiredFields = [
        { value: formData.firstName, name: 'firstName', label: 'First Name' },
        { value: formData.lastName, name: 'lastName', label: 'Last Name' },
        { value: formData.personalEmail, name: 'personalEmail', label: 'Personal Email' },
        { value: formData.companyEmail, name: 'companyEmail', label: 'Company Email' },
        { value: formData.contactNumber, name: 'contactNumber', label: 'Contact Number' },
        { value: formData.dateOfBirth, name: 'dateOfBirth', label: 'Date of Birth' },
        { value: formData.nationality, name: 'nationality', label: 'Nationality' },
        { value: formData.gender, name: 'gender', label: 'Gender' },
        { value: formData.clientId || formData.clientSelection, name: 'clientSelection', label: 'Client' },
        { value: formData.employeeEmploymentDetailsDTO?.department, name: 'department', label: 'Department' },
        { value: formData.designation, name: 'designation', label: 'Designation' },
        { value: formData.dateOfJoining, name: 'dateOfJoining', label: 'Date of Joining' },
        { value: formData.dateOfOnboardingToClient, name: 'dateOfOnboardingToClient', label: 'Date of Onboarding to Client' },
        { value: formData.employmentType, name: 'employmentType', label: 'Employment Type' },
        { value: formData.employeeSalaryDTO?.ctc, name: 'employeeSalaryDTO.ctc', label: 'CTC' },
      ];
      const payload = {
        ...formData,
        // Convert "NO_MANAGER" / "none" → null
        reportingManagerId:
          formData.reportingManagerId === "NO_MANAGER" ||
          formData.reportingManagerId === "none" ||
          formData.reportingManagerId === ""
            ? null
            : formData.reportingManagerId,
        // ... you can add similar normalization for other optional IDs if needed
      };
      const missingField = requiredFields.find(f => !f.value);
      if (missingField) {
        setErrors({ [missingField.name]: 'This field is required' });
        setTimeout(() => {
          const input = document.querySelector(`[name="${missingField.name}"]`) as HTMLInputElement;
          input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input?.focus();
          // input?.classList.add('error-field');
        }, 100);
        setIsSubmitting(false);
        return;
      }
      // === CALL BACKEND ===
      const response = await adminService.addEmployee(
        payload,
        documentFilesList.filter((f): f is File => f !== null)
      );
      if (!response.flag) {
        throw new Error(response.message || 'Validation failed');
      }
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Employee added successfully!',
        timer: 2000,
        showConfirmButton: false,
      });
      router.push('/admin-dashboard/employees/list');
    } catch (err: any) {
      let fieldErrors: Record<string, string> = {};
      if (err.response?.data) {
        const data = err.response.data;
        // Handle Spring Boot @Valid errors
        if (data.fieldErrors) {
          fieldErrors = Object.fromEntries(
            Object.entries(data.fieldErrors).map(([field, msg]) => [
              field,
              Array.isArray(msg) ? msg[0] : msg
            ])
          );
        }
        // Handle custom errors like { personalEmail: "Already exists" }
        else if (data.errors && typeof data.errors === 'object') {
          fieldErrors = Object.fromEntries(
            Object.entries(data.errors).map(([field, msg]) => [
              field.toLowerCase(),
              Array.isArray(msg) ? msg[0] : msg
            ])
          );
        }
      }
      // Set errors for display below fields
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        // Auto scroll to first error
        setTimeout(() => {
          const firstField = Object.keys(fieldErrors)[0];
          const input = document.querySelector(`[name="${firstField}"]`) as HTMLInputElement;
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
            // input.classList.add('error-field');
          }
        }, 100);
      } else {
        // Fallback generic error
        Swal.fire('Error', err.message || 'Something went wrong', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // useEffect(() => {
  //   if (Object.keys(errors).length > 0) {
  //     setTimeout(() => {
  //       Object.keys(errors).forEach(field => {
  //         const input = document.querySelector(`[name="${field}"]`);
  //         if (input) input.classList.add('error-field');
  //       });
  //     }, 100);
  //   }
  // }, [errors]);
  // ⭐ VALIDATION: Helper to get validation for a field key
  const getValidation = (key: string) => validationResults[key];
  const selectValue = formData.clientSelection?.startsWith('STATUS:')
    ? formData.clientSelection.replace('STATUS:', '')
    : (formData.clientId ?? undefined);
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <BackButton to="/admin-dashboard/employees/list" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add Employee
            </h1>
            <div className="w-20" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
            {/* PERSONAL DETAILS */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-indigo-800">
                  <User className="w-7 h-7 text-indigo-600" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      First Name <span className="text-red-500">*</span>
                      <TooltipHint hint="Employee's first name as per official documents. Example: Manoj" />
                    </Label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      required
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      maxLength={30}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                      <TooltipHint hint="Employee's last name/surname. Example: Sharma" />
                    </Label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      required
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      maxLength={30}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  {/* Personal Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Personal Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Personal email for communication. Must be unique in the system." />
                    </Label>
                    <Input
                      type="email"
                      name="personalEmail"
                      value={formData.personalEmail}
                      required
                      // onChange={handleChange}
                      // onChange={(e) => {
                      //   e.target.value = e.target.value.toLowerCase();
                      //   handleChange(e);
                      // }}
                      onChange={(e) => {
                        e.target.value = e.target.value.toLowerCase();
                        handleChange(e);
                        // Clear error while typing
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.personalEmail;
                          return newErrors;
                        });
                      }}
                      // onBlur={(e) => checkUniqueness('EMAIL', e.target.value, 'personalEmail', 'personal_email')}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        // Validate format
                        if (val && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(val)) {
                          setErrors(prev => ({ ...prev, personalEmail: "Invalid email format (use only lowercase letters)" }));
                        }
                        // Uniqueness check
                        if (val) checkUniqueness('EMAIL', val, 'personalEmail', 'personal_email');
                      }}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="you@gmail.com"
                    />
                    {errors.personalEmail && <p className="text-red-500 text-xs mt-1">{errors.personalEmail}</p>}
                  </div>
                  {/* Company Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Company Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Official work email provided by company. Must be unique." />
                    </Label>
                    <Input
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail}
                      required
                      // onChange={handleChange}
                      // onChange={(e) => {
                      //   e.target.value = e.target.value.toLowerCase();
                      //   handleChange(e);
                      // }}
                      onChange={(e) => {
                        e.target.value = e.target.value.toLowerCase();
                        handleChange(e);
                        // Clear error while typing
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.companyEmail;
                          return newErrors;
                        });
                      }}
                      // onBlur={(e) => checkUniqueness('EMAIL', e.target.value, 'companyEmail', 'company_email')}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        // Validate format
                        if (val && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(val)) {
                          setErrors(prev => ({ ...prev, companyEmail: "Invalid email format (use only lowercase letters)" }));
                        }
                        // Check if same as personal email
                        if (val.toLowerCase() === formData.personalEmail.toLowerCase() && formData.personalEmail) {
                          setErrors(prev => ({ ...prev, companyEmail: 'Cannot be same as personal email' }));
                        }
                        // Uniqueness check
                        if (val) checkUniqueness('EMAIL', val, 'companyEmail', 'company_email');
                      }}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="you@company.com"
                    />
                    {errors.companyEmail && <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>}
                  </div>
                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                      <TooltipHint hint="10-digit Indian mobile number. Must start with 6-9." />
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="contactNumber"
                      value={formData.contactNumber}
                      required
                      maxLength={10}
                      // onChange={handleChange}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          handleChange(e);
                        }
                      }}
                      onBlur={(e) => checkUniqueness('CONTACT_NUMBER', e.target.value, 'contactNumber', 'contact_number')}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="9876543210"
                    />
                    {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                  </div>
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Birth <span className="text-red-500">*</span>
                      <TooltipHint hint="Select from calendar. Employee must be at least 18 years old." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      required
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      max={today}
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Nationality <span className="text-red-500">*</span>
                      <TooltipHint hint="Usually 'Indian'. Enter as per passport or official ID." />
                    </Label>
                    <Input
                      name="nationality"
                      value={formData.nationality}
                      required
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      maxLength={50}
                      placeholder="Indian"
                    />
                    {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                  </div>
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Gender <span className="text-red-500">*</span>
                      <TooltipHint hint="Select from dropdown: Male, Female, or Other." />
                    </Label>
                    <Select required value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* EMPLOYMENT & SALARY - PERFECT UNIFORM FIELDS */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-emerald-800">
                  <Briefcase className="w-7 h-7 text-emerald-600" />
                  Employment & Salary Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                {/* Main Grid - All fields same width */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Client */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client <span className="text-red-500">*</span>
                      <TooltipHint hint="Select the client/project the employee is assigned to. Use BENCH/INHOUSE if not assigned." />
                    </Label>
                    <Select required value={selectValue} onValueChange={(v) => setFormData(p => ({
                      ...p,
                      clientId: staticClients.has(v) ? null : v,
                      clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`,
                    }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        <SelectItem value="BENCH">BENCH</SelectItem>
                        <SelectItem value="INHOUSE">INHOUSE</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="NA">NA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Department<span className="text-red-500">*</span>
                      <TooltipHint hint="Department where employee works (e.g., Development, QA, HR)." />
                    </Label>
                    <Select required
                      value={formData.employeeEmploymentDetailsDTO?.department || ''}
                      onValueChange={(v) => {
                        const dept = v as Department;
                        handleChange({ target: { name: 'employeeEmploymentDetailsDTO.department', value: dept } } as any);
                        fetchDepartmentEmployees(dept);
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Reporting Manager */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Reporting Manager
                      <TooltipHint hint="Select the employee's direct reporting manager from the same department." />
                    </Label>
                    <Select
                      value={formData.reportingManagerId ?? undefined}
                      onValueChange={v => setFormData(p => ({ ...p, reportingManagerId: v }))}
                      disabled={!formData.employeeEmploymentDetailsDTO?.department}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder={formData.employeeEmploymentDetailsDTO?.department ? "Select Manager" : "Select Department First"} />
                      </SelectTrigger>
                      <SelectContent>
                      {/* No department selected */}
                      {!formData?.employeeEmploymentDetailsDTO?.department ? (
                        <SelectItem value="none" disabled>
                          First select Department
                        </SelectItem>
                      ) : realManagers.length === 0 && hasNoManagerOption ? (
                        /* Only N/A came from backend */
                        <SelectItem value="NO_MANAGER" disabled>
                          No manager
                        </SelectItem>
                      ) : (
                        <>
                          {/* Real managers */}
                          {realManagers.map((emp) => (
                            <SelectItem
                              key={emp.employeeId}
                              value={emp.employeeId}
                            >
                              {emp.fullName}
                            </SelectItem>
                          ))}

                          {/* Explicit "No manager" option */}
                          {hasNoManagerOption && (
                            <SelectItem value="NO_MANAGER">
                              No manager
                            </SelectItem>
                          )}
                        </>
                      )}
                    </SelectContent>
                    </Select>
                  </div>
                  {/* Designation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Designation <span className="text-red-500">*</span>
                      <TooltipHint hint="Employee's job title. Example: Software Engineer, Senior Developer" />
                    </Label>
                    <Select required value={formData.designation ?? ''} onValueChange={v => setFormData(p => ({ ...p, designation: v as Designation }))}>
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Date of Joining */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Joining <span className="text-red-500">*</span>
                      <TooltipHint hint="First working day at the company. Cannot be future date." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      required
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      max={maxJoiningDateStr}
                    />
                  </div>
                  {/* Date of onboarding*/}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date Of Onboarding To Client 
                      <span className="text-red-500">*</span> 
                      <TooltipHint hint="First working day at the company. Cannot be future date." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfOnboardingToClient"
                      value={formData.dateOfOnboardingToClient}
                      
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      max={maxJoiningDateStr}
                    />
                  </div>
                  {/* Date of Offboarding To Client*/}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                    Date Of Offboarding To Client 
                    {/* <span className="text-red-500">*</span> */}
                      <TooltipHint hint="First working day at the company. Cannot be future date." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfOffboardingToClient"
                      value={formData.dateOfOffboardingToClient}
                      
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      max={maxJoiningDateStr}
                    />
                  </div>
                  {/* Client Billing Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                    Client Billing Start Date 
                    {/* <span className="text-red-500">*</span> */}
                      <TooltipHint hint="First working day at the company. Cannot be future date." />
                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStartDate"
                      value={formData.clientBillingStartDate}
                      
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      max={maxJoiningDateStr}
                    />
                  </div>
                  {/* client Billing Stop Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                    Client Billing End Date 
                    {/* <span className="text-red-500">*</span> */}
                      <TooltipHint hint="First working day at the company. Cannot be future date." />
                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStopDate"
                      value={formData.clientBillingStopDate}
                      
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                      max={maxJoiningDateStr}
                    />
                  </div>
                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Employment Type <span className="text-red-500">*</span>
                      <TooltipHint hint="Full-time, Part-time, Contract, Intern, etc." />
                    </Label>
                    <Select required
                      value={formData.employmentType}
                      onValueChange={(v) => setFormData(p => ({ ...p, employmentType: v as EmploymentType }))}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Employment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Rate Card */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Rate Card
                      <TooltipHint hint="Hourly or daily billing rate for client projects (in selected currency). Leave blank if not applicable." />
                    </Label>
                    <Input
                      className="h-12 text-base w-full"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="45.00"
                      name="rateCard"
                      value={formData.rateCard ?? ''}
                      onChange={handleChange}
                    />
                  </div>
                  {/* CTC - Mandatory */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      CTC <span className="text-red-500">*</span>
                      <TooltipHint hint="Cost to Company - Annual gross salary in rupees (before deductions)." />
                    </Label>
                    <Input
                      className="h-12 text-base w-full"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 1200000"
                      name="employeeSalaryDTO.ctc"
                      value={formData.employeeSalaryDTO?.ctc ?? ''}
                      onChange={handleChange}
                      required
                    />
                    {errors['employeeSalaryDTO.ctc'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeSalaryDTO.ctc']}</p>
                    )}
                  </div>
                  {/* Pay Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Pay Type
                      <TooltipHint hint="How salary is structured: Fixed, Variable, Hourly, etc." />
                    </Label>
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
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Pay Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Standard Hours */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Standard Hours
                      <TooltipHint hint="Expected working hours per week. Default is 40." />
                    </Label>
                    <Input
                      className="h-12 text-base w-full"
                      type="number"
                      min="1"
                      max="168"
                      name="employeeSalaryDTO.standardHours"
                      value={formData.employeeSalaryDTO?.standardHours ?? ''}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Pay Class */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Pay Class
                      <TooltipHint hint="Salary classification: Salaried, Hourly, Contractor, etc." />
                    </Label>
                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ''}
                      onValueChange={(v) =>
                        handleChange({ target: { name: 'employeeSalaryDTO.payClass', value: v } } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Pay Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_CLASS_OPTIONS.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Working Model */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Working Model
                      <TooltipHint hint="Work arrangement: Remote, Hybrid, Onsite, etc." />
                    </Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.workingModel || ''}
                      onValueChange={(v) =>
                        handleChange({ target: { name: 'employeeEmploymentDetailsDTO.workingModel', value: v } } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
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
                  {/* Shift Timing */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Shift Timing
                      <TooltipHint hint="Employee's work shift: General, US Shift, UK Shift, etc." />
                    </Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.shiftTiming || ''}
                      onValueChange={(v) =>
                        handleChange({ target: { name: 'employeeEmploymentDetailsDTO.shiftTiming', value: v } } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Shift Timing" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_TIMING_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Date of Confirmation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date of Confirmation
                      <TooltipHint hint="Date when employee moved from probation to permanent. Leave blank if still on probation." />
                    </Label>
                    <Input
                      className="h-12 text-base w-full"
                      type="date"
                      name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                      value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation || ''}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Notice Period */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Notice Period
                      <TooltipHint hint="Number of days/months required for resignation after confirmation." />
                    </Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.noticePeriodDuration || ''}
                      onValueChange={(v) =>
                        handleChange({
                          target: { name: 'employeeEmploymentDetailsDTO.noticePeriodDuration', value: v },
                        } as any)
                      }
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Notice Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTICE_PERIOD_OPTIONS.map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Probation Applicable */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="probation"
                      checked={formData.employeeEmploymentDetailsDTO?.probationApplicable || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.probationApplicable",
                            value: v === true, // ✅ FIXED
                          },
                        } as any)
                      }
                    />
                    <Label htmlFor="probation" className="text-sm font-semibold text-gray-700">
                      Probation Applicable
                      <TooltipHint hint="Check if the employee is currently on probation period." />
                    </Label>
                  </div>
                  {/* Probation Duration */}
                  {formData.employeeEmploymentDetailsDTO?.probationApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Probation Duration
                        <TooltipHint hint="Length of probation period (e.g., 3 months, 6 months)." />
                      </Label>
                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.probationDuration || ""}
                        onValueChange={(v) =>
                          handleChange({
                            target: {
                              name: "employeeEmploymentDetailsDTO.probationDuration",
                              value: v,
                            },
                          } as any)
                        }
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-12">
                          <SelectValue placeholder="Select Probation Duration" />
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
                      <Label className="text-sm font-semibold text-gray-700">
                        Probation Notice Period
                        <TooltipHint hint="Notice period required during probation (usually shorter)." />
                      </Label>
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
                        <SelectTrigger className="w-full min-w-[200px] !h-12">
                          <SelectValue placeholder="Select Probation Notice" />
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bond"
                      checked={formData.employeeEmploymentDetailsDTO?.bondApplicable || false}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.bondApplicable",
                            value: v === true, // ✅ FIXED
                          },
                        } as any)
                      }
                    />
                    <Label htmlFor="bond" className="text-sm font-semibold text-gray-700">
                      Bond Applicable
                      <TooltipHint hint="Check if employee signed a service bond (e.g., training bond)." />
                    </Label>
                  </div>
                  {/* Bond Duration */}
                  {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Bond Duration
                        <TooltipHint hint="Duration employee must serve after training or bond period." />
                      </Label>
                      <Select
                        value={formData.employeeEmploymentDetailsDTO?.bondDuration || ''}
                        onValueChange={(v) =>
                          handleChange({
                            target: { name: 'employeeEmploymentDetailsDTO.bondDuration', value: v },
                          } as any)
                        }
                      >
                        <SelectTrigger className="w-full min-w-[200px] !h-12">
                          <SelectValue placeholder="Select Bond Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {BOND_DURATION_OPTIONS.map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {/* Allowances & Deductions - Full Width with Uniform Fields */}
                <div className="mt-10 space-y-10">
                  {/* Allowances */}
                  <div>
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">Allowances
                      <TooltipHint hint="Common allowances: HRA (House Rent), Travel, Medical, Special Allowance, Conveyance, LTA" />
                    </Label>

                    <div className="space-y-4">
                      {formData.employeeSalaryDTO?.allowances?.map((a, i) => (
                        <div
                          // key={a.allowanceId}
                          key={a.allowanceId ?? `temp-${i}`}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          {/* Allowance Type */}
                          <div className="space-y-2">

                            <Input
                              placeholder="Type (e.g., HRA)"
                              value={a.allowanceType}
                              onChange={e => {
                                const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                                updated[i].allowanceType = e.target.value;
                                setFormData(p => ({
                                  ...p,
                                  employeeSalaryDTO: {
                                    ...p.employeeSalaryDTO!,
                                    allowances: updated,
                                  },
                                }));
                                validateField(`allowance_${i}_type`, e.target.value);
                              }}
                              maxLength={30}
                              className="h-12 text-base"
                            />
                            {errors[`allowance_${i}_type`] && (
                              <p className="text-red-500 text-xs">{errors[`allowance_${i}_type`]}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={a.amount ?? ''}
                            onChange={e => {
                              const updated = [...(formData.employeeSalaryDTO?.allowances || [])];
                              updated[i].amount = e.target.value === '' ? null : (parseFloat(e.target.value) || null); setFormData(p => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, allowances: updated },
                              }));
                            }}
                            className="h-12 text-base"
                          />

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const filtered = formData.employeeSalaryDTO?.allowances?.filter((_, idx) => idx !== i) || [];
                                setFormData(p => ({
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

                      {/* Add Allowance */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 h-12"
                        onClick={() => {
                          const newAllowance: AllowanceDTO = {
                            allowanceId: null,
                            allowanceType: "",
                            amount: null,
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
                        <Plus className="h-5 w-5 mr-2" /> Add Allowance
                      </Button>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">Deductions
                      <TooltipHint hint="Add mandatory or voluntary deductions from salary, like PF, Professional Tax, TDS, etc." />
                    </Label>

                    <div className="space-y-4">
                      {formData.employeeSalaryDTO?.deductions?.map((d, i) => (
                        <div
                          key={d.deductionId ?? `temp-${i}`}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          {/* Deduction Type */}
                          <div className="space-y-2">
                            <Input
                              placeholder="Type (e.g., PF)"
                              value={d.deductionType}
                              onChange={e => {
                                const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                                updated[i].deductionType = e.target.value;
                                setFormData(p => ({
                                  ...p,
                                  employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated },
                                }));
                                validateField(`deduction_${i}_type`, e.target.value);
                              }}
                              maxLength={30}
                              className="h-12 text-base"
                            />
                            {errors[`deduction_${i}_type`] && (
                              <p className="text-red-500 text-xs">{errors[`deduction_${i}_type`]}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={d.amount ?? ''}
                            onChange={e => {
                              const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                              // updated[i].amount = parseFloat(e.target.value) || 0;
                              updated[i].amount = e.target.value === '' ? null : (parseFloat(e.target.value) || null);
                              setFormData(p => ({
                                ...p,
                                employeeSalaryDTO: { ...p.employeeSalaryDTO!, deductions: updated },
                              }));
                            }}
                            className="h-12 text-base"
                          />

                          {/* Remove */}
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const filtered = formData.employeeSalaryDTO?.deductions?.filter((_, idx) => idx !== i) || [];
                                setFormData(p => ({
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

                      {/* Add Deduction */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 h-12"
                        onClick={() => {
                          const newDeduction: DeductionDTO = {
                            deductionId: null,
                            deductionType: "",
                            amount: null,
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
                        <Plus className="h-5 w-5 mr-2" /> Add Deduction
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
            {/* DOCUMENTS - RESPONSIVE & UNIFORM */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-purple-800">
                  <FileText className="w-7 h-7 text-purple-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="space-y-6">
                  {formData.documents.map((doc, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      {/* Document Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Document Type
                          <TooltipHint hint="Common documents: Aadhaar Card, PAN Card, Passport, Offer Letter, Resume, Educational Certificates, Bank Statement" />
                        </Label>
                        <Select value={doc.docType} onValueChange={v => handleDocumentChange(i, 'docType', v as DocumentType)}>
                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map(t => (
                              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Upload File
                          <TooltipHint hint="Supported formats: PDF, JPG, PNG. Max size 5MB recommended." />
                        </Label>
                        <Input
                          type="file"
                          onChange={e => handleDocumentChange(i, 'file', e.target.files?.[0] || null)}
                          className="h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                        />
                      </div>
                      {/* Remove Button */}
                      <div className="flex items-end">
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={() => removeDocument(i)}
                          className="h-12 w-full sm:w-auto"
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Add Document Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={addDocument}
                      className="h-12 px-8 text-base font-medium border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Add Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* EQUIPMENT - RESPONSIVE + ERROR MESSAGES */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-teal-800">
                  <Laptop className="w-7 h-7 text-teal-600" />
                  Equipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="space-y-6">
                  {formData.employeeEquipmentDTO?.map((eq, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      {/* Equipment Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Equipment Type
                          <TooltipHint hint="Common types: Laptop, Desktop, Monitor, Keyboard, Mouse, Headset, Docking Station" />
                        </Label>
                        <Input
                          placeholder="e.g., Laptop, Monitor"
                          value={eq.equipmentType || ''}
                          onChange={e => {
                            handleEquipmentChange(i, 'equipmentType', e.target.value);
                            validateField(`equipment_${i}_type`, e.target.value);
                          }}
                          maxLength={30}
                          className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                        {errors[`equipment_${i}_type`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`equipment_${i}_type`]}</p>
                        )}
                      </div>
                      {/* Serial Number */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Serial Number
                          <TooltipHint hint="Unique serial number printed on the device. Usually on the back or bottom." />
                        </Label>
                        <Input
                          placeholder="e.g., ABC123XYZ"
                          value={eq.serialNumber || ''}
                          onChange={e => {
                            handleEquipmentChange(i, 'serialNumber', e.target.value);
                            validateField(`equipment_${i}_serialNumber`, e.target.value);
                          }}
                          maxLength={30}
                          className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                        {errors[`equipment_${i}_serialNumber`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`equipment_${i}_serialNumber`]}</p>
                        )}
                      </div>
                      {/* Issued Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Issued Date
                          <TooltipHint hint="Date when equipment was handed over to employee" />
                        </Label>
                        <Input
                          type="date"
                          value={eq.issuedDate || ''}
                          onChange={e => handleEquipmentChange(i, 'issuedDate', e.target.value)}
                          max={today}
                          className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                      {/* Remove Button */}
                      <div className="flex items-end">
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={() => removeEquipment(i)}
                          className="h-12 w-full"
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Add Equipment Button */}
                  <div className="flex justify-center pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={addEquipment}
                      className="h-12 px-8 text-base font-medium border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Add Equipment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* ADDITIONAL DETAILS - RESPONSIVE + ERROR MESSAGES */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-blue-800">
                  <Upload className="w-7 h-7 text-blue-600" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Skills & Certifications */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">Skills & Certifications
                      <TooltipHint hint="List technical and soft skills, certifications. Example: React, AWS Certified Solutions Architect, Agile Scrum Master" />
                    </Label>
                    <Textarea
                      name="skillsAndCertification"
                      value={formData.skillsAndCertification}
                      onChange={handleChange}
                      placeholder="e.g., React, Node.js, AWS Certified, etc."
                      className="min-h-32 resize-none text-base"
                    />
                  </div>
                  {/* Background Check */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Background Check
                      <TooltipHint hint="Status of verification: Cleared, Pending, Failed, Not Initiated" />
                    </Label>
                    <Input
                      name="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                      value={formData.employeeAdditionalDetailsDTO?.backgroundCheckStatus || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., Cleared, Pending"
                      className="h-12 text-base"
                    />
                    {errors['employeeAdditionalDetailsDTO.backgroundCheckStatus'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeAdditionalDetailsDTO.backgroundCheckStatus']}</p>
                    )}
                  </div>
                  {/* Remarks */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">Remarks
                      <TooltipHint hint="Any special notes about the employee: performance, behavior, relocation, etc." />
                    </Label>
                    <Textarea
                      name="employeeAdditionalDetailsDTO.remarks"
                      value={formData.employeeAdditionalDetailsDTO?.remarks || ''}
                      onChange={handleChange}
                      placeholder="Any additional notes..."
                      className="min-h-32 resize-none text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* INSURANCE - RESPONSIVE + ERROR MESSAGES */}
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
                    <Label className="text-sm font-semibold text-gray-700">Policy Number
                      <TooltipHint hint="Unique policy ID from insurance provider. Must be unique across employees." />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.policyNumber"
                      value={formData.employeeInsuranceDetailsDTO?.policyNumber || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., POL123456"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          checkUniqueness('POLICY_NUMBER', val, 'employeeInsuranceDetailsDTO.policyNumber', 'policy_number');
                        }
                      }}
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    {errors['employeeInsuranceDetailsDTO.policyNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeInsuranceDetailsDTO.policyNumber']}</p>
                    )}
                  </div>
                  {/* Provider Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Provider Name
                      <TooltipHint hint="Insurance company name. Example: LIC, Star Health, HDFC Life" />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={formData.employeeInsuranceDetailsDTO?.providerName || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., LIC, Star Health"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    {errors['employeeInsuranceDetailsDTO.providerName'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeInsuranceDetailsDTO.providerName']}</p>
                    )}
                  </div>
                  {/* Coverage Start */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Coverage Start
                      <TooltipHint hint="Date when insurance coverage begins" />
                    </Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageStart"
                      value={formData.employeeInsuranceDetailsDTO?.coverageStart || ''}
                      onChange={handleChange}
                      max={today}
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {/* Coverage End */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Coverage End
                      <TooltipHint hint="Date when policy expires. Leave blank for lifelong policies." />
                    </Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageEnd"
                      value={formData.employeeInsuranceDetailsDTO?.coverageEnd || ''}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {/* Nominee Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Name
                      <TooltipHint hint="Person who will receive insurance benefit in case of claim" />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeName"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeName || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., Priya Sharma"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    {errors['employeeInsuranceDetailsDTO.nomineeName'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeInsuranceDetailsDTO.nomineeName']}</p>
                    )}
                  </div>
                  {/* Nominee Relation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Relation
                      <TooltipHint hint="Relationship to employee: Spouse, Parent, Child, Sibling, etc." />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., Spouse, Parent"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    {errors['employeeInsuranceDetailsDTO.nomineeRelation'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeInsuranceDetailsDTO.nomineeRelation']}</p>
                    )}
                  </div>
                  {/* Nominee Contact */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Contact
                      <TooltipHint hint="10-digit mobile number of nominee" />
                    </Label>
                    <Input

                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="employeeInsuranceDetailsDTO.nomineeContact"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeContact || ''}
                      maxLength={10}
                      type="tel"
                      // onChange={handleChange}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          handleChange(e);
                        }
                      }}
                      placeholder="9876543210"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                    {errors['employeeInsuranceDetailsDTO.nomineeContact'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeInsuranceDetailsDTO.nomineeContact']}</p>
                    )}
                  </div>
                  {/* Group Insurance Checkbox */}
                  <div className="flex items-center space-x-3 h-12 mt-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Checkbox
                      id="groupInsurance"
                      checked={formData.employeeInsuranceDetailsDTO?.groupInsurance === true}
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeInsuranceDetailsDTO.groupInsurance",
                            value: v === true ? true : null   // ✅ NEVER undefined
                          },
                        } as any)
                      }
                    />

                    <Label htmlFor="groupInsurance" className="text-base font-medium cursor-pointer">
                      Group Insurance
                      <TooltipHint hint="Check if employee is covered under company group insurance plan" />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* STATUTORY - RESPONSIVE + ERROR MESSAGES */}
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
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Passport Number
                      <TooltipHint hint="Indian passport number. Format: One letter + 7 digits (e.g., A1234567). Must be unique." />
                    </Label>
                    <Input
                      name="employeeStatutoryDetailsDTO.passportNumber"
                      value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''}
                      onChange={handleChange}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          checkUniqueness('PASSPORT_NUMBER', val, 'employeeStatutoryDetailsDTO.passportNumber', 'passport_number');
                        }
                      }} maxLength={30}
                      placeholder="e.g., A1234567"
                      className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500 uppercase"
                    />
                    {errors['employeeStatutoryDetailsDTO.passportNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeStatutoryDetailsDTO.passportNumber']}</p>
                    )}
                  </div>
                  {/* PF UAN Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">PF UAN Number
                      <TooltipHint hint="12-digit Universal Account Number for Provident Fund. Must be unique across all employees." />
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="employeeStatutoryDetailsDTO.pfUanNumber"
                      value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''}
                      // onChange={handleChange}
                      onChange={(e) => {
                        if (/^\d{0,12}$/.test(e.target.value)) {
                          handleChange(e);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          checkUniqueness('PF_UAN_NUMBER', val, 'employeeStatutoryDetailsDTO.pfUanNumber', 'pf_uan_number');
                        }
                      }} maxLength={30}
                      placeholder="e.g., 123456789012"
                      className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {errors['employeeStatutoryDetailsDTO.pfUanNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeStatutoryDetailsDTO.pfUanNumber']}</p>
                    )}
                  </div>
                  {/* Tax Regime */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Tax Regime
                      <TooltipHint hint="Income tax regime employee has opted for. Common options: Old Regime, New Regime" />
                    </Label>
                    <Input
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g., Old Regime, New Regime"
                      className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {errors['employeeStatutoryDetailsDTO.taxRegime'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeStatutoryDetailsDTO.taxRegime']}</p>
                    )}
                  </div>
                  {/* ESI Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">ESI Number
                      <TooltipHint hint="Employee State Insurance number (usually 10-17 digits). Must be unique." />
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="employeeStatutoryDetailsDTO.esiNumber"
                      value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''}
                      // onChange={handleChange}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          handleChange(e);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          checkUniqueness('ESI_NUMBER', val, 'employeeStatutoryDetailsDTO.esiNumber', 'esi_number');
                        }
                      }}
                      maxLength={30}
                      placeholder="e.g., 1234567890"
                      className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {errors['employeeStatutoryDetailsDTO.esiNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeStatutoryDetailsDTO.esiNumber']}</p>
                    )}
                  </div>
                  {/* SSN Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">SSN Number
                      <TooltipHint hint="Social Security Number (for international employees, e.g., US format: 123-45-6789). Must be unique." />
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="employeeStatutoryDetailsDTO.ssnNumber"
                      value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''}
                      // onChange={handleChange}
                      onChange={(e) => {
                        // Allow only digits (you can later format as 123-45-6789 if needed)
                        if (/^\d*$/.test(e.target.value)) {
                          handleChange(e);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          checkUniqueness('SSN_NUMBER', val, 'employeeStatutoryDetailsDTO.ssnNumber', 'ssn_number');
                        }
                      }}
                      maxLength={30}
                      placeholder="e.g., 123456789" className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {errors['employeeStatutoryDetailsDTO.ssnNumber'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['employeeStatutoryDetailsDTO.ssnNumber']}</p>
                    )}
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