'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/api/adminService';
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
  WorkingModel,
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
import { User, Briefcase, FileText, Laptop, Shield, FileCheck, Upload, Trash2, Plus, Loader2, DollarSign } from 'lucide-react';
import { employeeService } from '@/lib/api/employeeService';
import TooltipHint from '@/components/ui/TooltipHint';
import { useUniquenessCheck } from '@/hooks/useUniqueCheck';
import { useEmployeeFieldValidation } from '@/hooks/useFieldValidation';
import { useFormFieldHandlers } from '@/hooks/useFormFieldHandlers';
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
  const [isDirty, setIsDirty] = useState(false);   // optional, but useful
  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const [localIfsc, setLocalIfsc] = useState<string>("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { validateField } = useEmployeeFieldValidation();   // ← employee validator
  const handleChange = (e: any) => {
    const target = e?.target;
    const name: string | undefined = target?.name;

    if (!name) return; // ✅ guard clause

    let value =
      target.value !== undefined ? target.value : target.checked;

    if (typeof value === "boolean") {
      value = value ? true : null;
    }

    if (
      ['ctc', 'standardHours', 'rateCard', 'numberOfChildren']
        .some(f => name.includes(f))
    ) {
      value =
        value === '' || value == null
          ? null
          : Number(value) || null;
    }

    setFormData(prev => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof EmployeeModel] as any),
            [child]: value,
          },
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const { handleValidatedChange, handleUniqueBlur, fieldError } = useFormFieldHandlers(
    handleChange,
    setErrors,
    checkUniqueness,
    () => formData,
    validateField   // ← this makes it use EMPLOYEE rules
  );
  useEffect(() => {
    validateClientDates(formData);
  }, [
    formData.dateOfJoining,
    formData.dateOfOnboardingToClient,
    formData.dateOfOffboardingToClient,
    formData.clientBillingStartDate,
    formData.clientBillingStopDate,
    formData.clientSelection,
  ]);

  // Handle IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    const code = ifsc.trim().toUpperCase();

    if (!code) {
      setErrors((prev) => ({ ...prev, ifscCode: "Please enter IFSC code" }));
      return;
    }

    if (code.length !== 11) {
      setErrors((prev) => ({ ...prev, ifscCode: "IFSC must be exactly 11 characters" }));
      return;
    }

    if (isLookingUp) return;

    setIsLookingUp(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.ifscCode;
      return next;
    });

    try {
      const res = await employeeService.getIFSCDetails(code);

      if (res?.flag && res.response) {
        const { BANK = "", BRANCH = "" } = res.response;

        setFormData((prev) => ({
          ...prev,
          ifscCode: code,
          bankName: BANK.trim() || prev.bankName || "",
          branchName: BRANCH.trim() || prev.branchName || "",
        }));

        setSuccess("Bank & branch details auto-filled!");
      } else {
        setErrors((prev) => ({
          ...prev,
          ifscCode: res?.message || "Invalid IFSC code",
        }));
      }
    } catch (err: any) {
      console.error("IFSC lookup failed:", err);
      setErrors((prev) => ({
        ...prev,
        ifscCode: "Failed to fetch bank details. Try again.",
      }));
    } finally {
      setIsLookingUp(false);
    }
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
    'AADHAR_CARD', 'BANK_PASSBOOK', 'TENTH_CERTIFICATE', 'TWELFTH_CERTIFICATE',
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
          docType: undefined,
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

    setDocumentFilesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleEquipmentChange = (index: number, field: keyof EmployeeEquipmentDTO, value: string) => {
    setFormData((prev) => ({
      ...prev,
      employeeEquipmentDTO: (prev.employeeEquipmentDTO ?? []).map((eq, i) => i === index ? { ...eq, [field]: value } : eq
      ) ?? [{
        equipmentId: crypto.randomUUID(),
        equipmentType: '',
        serialNumber: '',
        issuedDate: '',
        [field]: value,
      }],
    }));

    // Validate the changed field immediately (using shared validator)
    // This works for both equipmentType and serialNumber
    setErrors((prevErrors) => {
      const nextErrors = { ...prevErrors };

      // Use full nested path for validation (same as your other nested fields)
      const nestedFieldName = `employeeEquipmentDTO.${index}.${field}`;

      const error = validateField(nestedFieldName, value, formData);

      if (error) {
        nextErrors[nestedFieldName] = error;
      } else {
        delete nextErrors[nestedFieldName];
      }

      return nextErrors;
    });

    // If it's serialNumber → also trigger uniqueness check on change (or keep on blur)
    if (field === 'serialNumber') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length >= 3) {  // min length check
        // Format validation already done above → only uniqueness if no format error
        const formatError = validateField(
          `employeeEquipmentDTO.${index}.serialNumber`,
          trimmed,
          formData
        );

        if (!formatError) {
          checkUniqueness(
            'SERIAL_NUMBER',
            trimmed,
            `employeeEquipmentDTO.${index}.serialNumber`, // same error key
            'serial_number'                                 // fieldColumn
          );
        }
      }
    }
  };
  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      employeeEquipmentDTO: [
        ...(prev.employeeEquipmentDTO ?? []),
        { equipmentId: null, equipmentType: '', serialNumber: '', issuedDate: '' },],
    }));
  };
  const removeEquipment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      employeeEquipmentDTO: (prev.employeeEquipmentDTO ?? []).filter((_, i) => i !== index),
    }));

    // Clear any error that was shown for the removed item's fields
    setErrors((prevErrors) => {
      const nextErrors = { ...prevErrors };

      // Remove errors for both equipmentType and serialNumber of this index
      delete nextErrors[`employeeEquipmentDTO.${index}.equipmentType`];
      delete nextErrors[`employeeEquipmentDTO.${index}.serialNumber`];
      // If you have more fields in future (e.g. issuedDate), delete them too

      return nextErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 🚫 Document validation
    if (hasAnyDocTypeSelected || hasAnyFileSelected) {
      if (!hasValidDocument) {
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Document',
          text: 'Please select document type and upload file before submitting.',
        });
        setIsSubmitting(false);
        return;
      }
    }

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
        ...(isStatusClient
          ? []
          : [{
            value: formData.dateOfOnboardingToClient,
            name: 'dateOfOnboardingToClient',
            label: 'Date of Onboarding to Client',
          }]
        ),
        { value: formData.employeeSalaryDTO?.payType, name: 'employeeSalaryDTO.payType', label: 'Pay Type' },
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
        setErrors({ [missingField.name]: `Please fill ${missingField.label}` });

        setTimeout(() => {
          let element: HTMLElement | null = null;

          if (missingField.name.includes(".")) {
            const child = missingField.name.split(".").pop()!;

            // Try to find <input name="ctc"> for CTC
            element = document.querySelector(`input[name="${child}"]`);

            // For Select fields (Pay Type, Department, etc.)
            if (!element) {
              element = document.querySelector(
                `select[name="${child}"] ~ button[role="combobox"]`
              ) as HTMLElement;
            }
          } else {
            element = document.querySelector(`[name="${missingField.name}"]`) as HTMLElement;
          }

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus();
            // Visual feedback
            element.classList.add("ring-2", "ring-red-500", "ring-offset-2");
            setTimeout(() => {
              element?.classList.remove("ring-2", "ring-red-500", "ring-offset-2");
            }, 3000);
          }
        }, 150);

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
  // ⭐ VALIDATION: Helper to get validation for a field key
  const selectValue = formData.clientSelection?.startsWith('STATUS:')
    ? formData.clientSelection.replace('STATUS:', '')
    : (formData.clientId ?? undefined);

  const isStatusClient = formData.clientSelection?.startsWith("STATUS:");



  const validateClientDates = (data: EmployeeModel) => {
    const newErrors: Record<string, string> = {};
    const isStatusClient =
      data.clientSelection?.startsWith("STATUS:");

    // 🚫 Skip client validations for non-client employees
    if (isStatusClient) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.dateOfOnboardingToClient;
        delete next.dateOfOffboardingToClient;
        delete next.clientBillingStartDate;
        delete next.clientBillingStopDate;
        return next;
      });
      return;
    }

    // Helper: parse yyyy-mm-dd safely
    const parseDate = (dateStr?: string | null): Date | null => {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const doJ = parseDate(data.dateOfJoining);
    const doOCT = parseDate(data.dateOfOnboardingToClient);
    const doOff = parseDate(data.dateOfOffboardingToClient);
    const cbs = parseDate(data.clientBillingStartDate);
    const cbe = parseDate(data.clientBillingStopDate);


    // 🚫 Joining is mandatory anchor
    if (!doJ) {
      setErrors(prev => ({
        ...prev,
        ...newErrors
      }));
      
      return;
    }

    /* ---------------------------------------------------
       1️⃣ DOJ must be before everything
    --------------------------------------------------- */
    if (doOCT && doJ > doOCT) {
      newErrors.dateOfOnboardingToClient =
        "Onboarding date must be after Date of Joining";
    }

    if (cbs && doJ > cbs) {
      newErrors.clientBillingStartDate =
        "Billing start date must be after Date of Joining";
    }

    if (doOff && doJ >= doOff) {
      newErrors.dateOfOffboardingToClient =
        "Offboarding date must be after Date of Joining";
    }

    if (cbe && doJ >= cbe) {
      newErrors.clientBillingStopDate =
        "Billing end date must be after Date of Joining";
    }

    /* ---------------------------------------------------
       2️⃣ Onboarding < Offboarding
    --------------------------------------------------- */
    if (doOCT && doOff && doOCT > doOff) {
      newErrors.dateOfOnboardingToClient =
        "Onboarding date must be before offboarding date";
    }

    // if (rawOff && doOff && doOCT  doOff) {
    //   newErrors.dateOfOffboardingToClient =
    //     "Offboarding date must be after onboarding date";
    // }

    /* ---------------------------------------------------
       3️⃣ Billing Start rules
       - ≥ Onboarding
       - < Offboarding
       - < Billing End
    --------------------------------------------------- */
    if (cbs && doOCT && cbs < doOCT) {
      newErrors.clientBillingStartDate =
        "Billing start date cannot be before onboarding date";
    }

    if (cbs && doOff && cbs >= doOff) {
      newErrors.clientBillingStartDate =
        "Billing start date must be before offboarding date";
    }

    if (cbs && cbe && cbs >= cbe) {
      newErrors.clientBillingStartDate =
        "Billing start date must be before billing end date";
      newErrors.clientBillingStopDate =
        "Billing end date must be after billing start date";
    }

    /* ---------------------------------------------------
       4️⃣ Billing Stop rules
       - ≥ Onboarding
       - ≥ Offboarding (can be equal)
    --------------------------------------------------- */
    if (cbe && doOCT && cbe <= doOCT) {
      newErrors.clientBillingStopDate =
        "Billing end date must be after onboarding date";
    }

    if (doOff && cbe && doOff > cbe) {
      newErrors.dateOfOffboardingToClient =
        "Offboarding date cannot be after billing end date";
    }

    setErrors(newErrors);
  };

  const { hasAnyDocTypeSelected, hasAnyFileSelected, hasValidDocument } = useMemo(() => {
    const docs = formData.documents;
    return {
      hasAnyDocTypeSelected: docs.some(d => !!d.docType),
      hasAnyFileSelected: docs.some(d => d.file instanceof File),
      hasValidDocument: docs.some(d => d.docType && d.file instanceof File),
    };
  }, [formData.documents]);

  const canAddDocument =
    !hasAnyDocTypeSelected || hasValidDocument;

  const isFormValid = () => {
    // Required top-level fields
    if (!formData.firstName.trim()) return false;
    if (!formData.lastName.trim()) return false;
    if (!formData.personalEmail.trim()) return false;
    if (!formData.companyEmail.trim()) return false;
    if (!formData.contactNumber.trim()) return false;
    if (!formData.dateOfBirth) return false;
    if (!formData.nationality.trim()) return false;
    if (!formData.gender) return false;

    // Client / Selection
    if (!formData.clientSelection && !formData.clientId) return false;

    // Employment
    if (!formData.employeeEmploymentDetailsDTO?.department) return false;
    if (!formData.designation) return false;
    if (!formData.dateOfJoining) return false;

    // Salary
    if (!formData.employeeSalaryDTO?.payType) return false;
    if (!formData.employmentType) return false;
    if (formData.employeeSalaryDTO?.ctc == null || formData.employeeSalaryDTO.ctc <= 0) return false;

    // Optional client dates only if not STATUS client
    if (!isStatusClient) {
      if (!formData.dateOfOnboardingToClient) return false;
    }

    // No errors remaining
    return Object.keys(errors).length === 0;
  };
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
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="Enter first name"
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "firstName")}
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
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="Enter last name"
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "lastName")}
                  </div>
                  {/* Personal Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Personal Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Personal email for communication. Must be unique in the system." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="email"
                        name="personalEmail"
                        value={formData.personalEmail}
                        required
                        onChange={(e) => {
                          e.target.value = e.target.value.toLowerCase();
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "EMAIL",
                          "personal_email",
                          "personalEmail",
                          null // no excludeId in ADD mode
                        )}
                        maxLength={50}
                        placeholder="you@gmail.com"
                        className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {checking.has("personalEmail") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                    {fieldError(errors, "personalEmail")}
                  </div>

                  {/* Company Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Company Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Official work email provided by company. Must be unique." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="email"
                        name="companyEmail"
                        value={formData.companyEmail}
                        required
                        onChange={(e) => {
                          e.target.value = e.target.value.toLowerCase();
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "EMAIL",
                          "company_email",
                          "companyEmail",
                          null // ADD mode
                        )}
                        maxLength={50}
                        placeholder="you@company.com"
                        className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {checking.has("companyEmail") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                    {fieldError(errors, "companyEmail")}
                  </div>
                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                      <TooltipHint hint="10-digit Indian mobile number. Must start with 6-9." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="contactNumber"
                        value={formData.contactNumber}
                        required
                        maxLength={10}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "CONTACT_NUMBER",
                          "contact_number",
                          "contactNumber",
                          null,
                          10 // min length for uniqueness
                        )}
                        placeholder="9876543210"
                        className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {checking.has("contactNumber") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                    {fieldError(errors, "contactNumber")}
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
                      onChange={handleValidatedChange}
                      max={today}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "dateOfBirth")}
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
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="Indian"
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "nationality")}
                  </div>
                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Gender <span className="text-red-500">*</span>
                      <TooltipHint hint="Select from dropdown: Male, Female, or Other." />
                    </Label>
                    <Select
                      required
                      value={formData.gender || ""}
                      onValueChange={(v) => {
                        setIsDirty(true);

                        setFormData(prev => {
                          const next = { ...prev, gender: v };

                          const error = validateField("gender", v, next);
                          setErrors(prevErr => {
                            const e = { ...prevErr };
                            error ? (e.gender = error) : delete e.gender;
                            return e;
                          });

                          return next;
                        });
                      }}

                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "gender")}
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
                    <Select
                      required
                      value={selectValue}
                      onValueChange={(v) => {
                        setIsDirty(true);

                        const nextData = {
                          ...formData,
                          clientId: staticClients.has(v) ? null : v,
                          clientSelection: staticClients.has(v) ? `STATUS:${v}` : `CLIENT:${v}`,
                          // reset client-related dates
                          dateOfOnboardingToClient: '',
                          dateOfOffboardingToClient: '',
                          clientBillingStartDate: '',
                          clientBillingStopDate: '',
                        };

                        setFormData(nextData);

                        // Clear dependent date errors
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.dateOfJoining;
                          delete next.dateOfOnboardingToClient;
                          delete next.dateOfOffboardingToClient;
                          delete next.clientBillingStartDate;
                          delete next.clientBillingStopDate;
                          return next;
                        });

                        // Validate client field using shared validator
                        const error = validateField("clientSelection", v, nextData);
                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next.clientSelection = error;
                          else delete next.clientSelection;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
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
                    {fieldError(errors, "clientSelection")}
                  </div>
                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Department<span className="text-red-500">*</span>
                      <TooltipHint hint="Department where employee works (e.g., Development, QA, HR)." />
                    </Label>
                    <Select
                      required
                      value={formData.employeeEmploymentDetailsDTO?.department || ''}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        const dept = v as Department;

                        const nextData = {
                          ...formData,
                          employeeEmploymentDetailsDTO: {
                            ...formData.employeeEmploymentDetailsDTO!,
                            department: dept,
                          },
                        };

                        setFormData(nextData);
                        fetchDepartmentEmployees(dept);

                        // Validate using shared validator
                        const error = validateField(
                          'employeeEmploymentDetailsDTO.department',
                          dept,
                          nextData
                        );

                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next['employeeEmploymentDetailsDTO.department'] = error;
                          else delete next['employeeEmploymentDetailsDTO.department'];
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "employeeEmploymentDetailsDTO.department")}
                  </div>
                  {/* Reporting Manager */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Reporting Manager
                      <TooltipHint hint="Select the employee's direct reporting manager from the same department." />
                    </Label>
                    <Select
                      value={formData.reportingManagerId ?? undefined}
                      disabled={!formData.employeeEmploymentDetailsDTO?.department}
                      onValueChange={(v) => {
                        const nextData = {
                          ...formData,
                          reportingManagerId: v,
                        };

                        setFormData(nextData);

                        // OPTIONAL validation (only if you want error for required manager)
                        const error = validateField('reportingManagerId', v, nextData);

                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next.reportingManagerId = error;
                          else delete next.reportingManagerId;
                          return next;
                        });
                      }}
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
                    <Select
                      required
                      value={formData.designation ?? ''}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        const nextData = {
                          ...formData,
                          designation: v as Designation,
                        };

                        setFormData(nextData);

                        const error = validateField('designation', v, nextData);
                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next.designation = error;
                          else delete next.designation;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map(d => (
                          <SelectItem key={d} value={d}>
                            {d.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "designation")}
                  </div>
                  {/* Date of Joining */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Joining <span className="text-red-500">*</span>
                      <TooltipHint
                        hint="Employee's first official working day with the company. Must be in the past or today. Cannot be a future date. This date must be earlier than onboarding, billing start, offboarding, and billing end dates."
                      />                      </Label>
                    <Input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining ?? ""}
                      required
                      max={maxJoiningDateStr}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "dateOfJoining")}
                  </div>
                  {/* Date of onboarding*/}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date Of Onboarding To Client
                      {!isStatusClient && <span className="text-red-500">*</span>}
                      <TooltipHint
                        hint="Date when the employee started working for the client. Must be after Date of Joining."
                      />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfOnboardingToClient"
                      value={formData.dateOfOnboardingToClient ?? ""}
                      required={!isStatusClient}
                      max={maxJoiningDateStr}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "dateOfOnboardingToClient")}
                  </div>
                  {/* Date of Offboarding To Client*/}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date Of Offboarding To Client
                      {/* <span className="text-red-500">*</span> */}
                      <TooltipHint
                        hint="Last working day with the client. Must be after Date of Joining, onboarding, and billing start. Can be the same as or before Client Billing End Date."
                      />                    </Label>
                    <Input
                      type="date"
                      name="dateOfOffboardingToClient"
                      value={formData.dateOfOffboardingToClient ?? ""}
                      onChange={handleValidatedChange}
                      max={maxJoiningDateStr}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "dateOfOffboardingToClient")}
                  </div>
                  {/* Client Billing Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client Billing Start Date
                      {/* <span className="text-red-500">*</span> */}
                      <TooltipHint
                        hint="Date from which client billing begins. Must be after Date of Joining and on or after Date of Onboarding. Must be strictly before Client Billing End Date and before offboarding date."
                      />

                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStartDate"
                      value={formData.clientBillingStartDate ?? ""}
                      onChange={handleValidatedChange}
                      max={maxJoiningDateStr}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "clientBillingStartDate")}
                  </div>
                  {/* client Billing Stop Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client Billing End Date
                      {/* <span className="text-red-500">*</span> */}
                      <TooltipHint
                        hint="Date until which client billing continues for this employee. Must be strictly after Client Billing Start Date. Can be the same as or after Date of Offboarding to Client."
                      />
                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStopDate"
                      value={formData.clientBillingStopDate ?? ""}
                      onChange={handleValidatedChange}
                      max={maxJoiningDateStr}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "clientBillingStopDate")}
                  </div>
                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Employment Type <span className="text-red-500">*</span>
                      <TooltipHint hint="Full-time, Part-time, Contract, Intern, etc." />
                    </Label>
                    <Select
                      required
                      value={formData.employmentType}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        const nextData = {
                          ...formData,
                          employmentType: v as EmploymentType,
                        };

                        setFormData(nextData);

                        const error = validateField("employmentType", v, nextData);
                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next.employmentType = error;
                          else delete next.employmentType;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Employment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map(t => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "employmentType")}
                  </div>
                  {/* Rate Card */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Rate Card
                      <TooltipHint hint="Hourly or daily billing rate for client projects (in selected currency). Leave blank if not applicable." />
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      name="rateCard"
                      value={formData.rateCard ?? ''}
                      onChange={handleValidatedChange}
                      placeholder="45.00"
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "rateCard")}

                  </div>
                  {/* CTC - Mandatory */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      CTC <span className="text-red-500">*</span>
                      <TooltipHint hint="Cost to Company - Annual gross salary in rupees (before deductions)." />
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      name="employeeSalaryDTO.ctc"
                      value={formData.employeeSalaryDTO?.ctc ?? ''}
                      onChange={handleValidatedChange}
                      required
                      placeholder="e.g. 1200000"
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "employeeSalaryDTO.ctc")}
                  </div>
                  {/* Pay Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Pay Type <span className="text-red-500">*</span>
                      <TooltipHint hint="How salary is structured: Fixed, Variable, Hourly, etc." />
                    </Label>
                    <Select
                      required
                      value={formData.employeeSalaryDTO?.payType || ""}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        const nextData = {
                          ...formData,
                          employeeSalaryDTO: {
                            ...formData.employeeSalaryDTO!,
                            payType: v as PayType,
                          },
                        };

                        setFormData(nextData);

                        const error = validateField("employeeSalaryDTO.payType", v, nextData);
                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next["employeeSalaryDTO.payType"] = error;
                          else delete next["employeeSalaryDTO.payType"];
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Pay Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_TYPE_OPTIONS.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "employeeSalaryDTO.payType")}
                  </div>
                  {/* Standard Hours */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Standard Hours
                      <TooltipHint hint="Expected working hours per week. Default is 40." />
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      name="employeeSalaryDTO.standardHours"
                      value={formData.employeeSalaryDTO?.standardHours ?? ''}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "employeeSalaryDTO.standardHours")}

                  </div>
                  {/* Pay Class – now uses correct options */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Pay Class 
                      <TooltipHint hint="Salary classification: A1, A2, INTERN, NA, B1, B2, CONTRACT" />
                    </Label>
                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ''}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        const nextData = {
                          ...formData,
                          employeeSalaryDTO: {
                            ...formData.employeeSalaryDTO!,
                            payClass: v as PayClass,
                          },
                        };

                        setFormData(nextData);

                        const error = validateField("employeeSalaryDTO.payClass", v, nextData);
                        setErrors(prev => {
                          const next = { ...prev };
                          if (error) next["employeeSalaryDTO.payClass"] = error;
                          else delete next["employeeSalaryDTO.payClass"];
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
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
                    {fieldError(errors, "employeeSalaryDTO.payClass")}
                  </div>

                  {/* Working Model – now uses correct options */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Working Model
                      <TooltipHint hint="Work arrangement: Remote, Hybrid, Onsite, etc." />
                    </Label>
                    <Select
                      value={formData.employeeEmploymentDetailsDTO?.workingModel || ''}
                      onValueChange={(v) => {
                        setIsDirty(true);

                        const workingModel = v as WorkingModel;

                        const nextData: EmployeeModel = {
                          ...formData,
                          employeeEmploymentDetailsDTO: {
                            ...formData.employeeEmploymentDetailsDTO!,
                            workingModel,
                          },
                        };

                        setFormData(nextData);

                        const error = validateField(
                          "employeeEmploymentDetailsDTO.workingModel",
                          workingModel,
                          nextData
                        );

                        setErrors(prev => {
                          const next = { ...prev };
                          error
                            ? (next["employeeEmploymentDetailsDTO.workingModel"] = error)
                            : delete next["employeeEmploymentDetailsDTO.workingModel"];
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12">
                        <SelectValue placeholder="Select Working Model" /> {/* ← Fixed placeholder */}
                      </SelectTrigger>
                      <SelectContent>
                        {WORKING_MODEL_OPTIONS.map(m => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(errors, "employeeEmploymentDetailsDTO.workingModel")} {/* ← Fixed error key */}
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
                      type="date"
                      name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                      value={formData.employeeEmploymentDetailsDTO?.dateOfConfirmation ?? ''}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {fieldError(errors, "employeeEmploymentDetailsDTO.dateOfConfirmation")}
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
                              }}
                              onBlur={e => {
                                const error = validateField(
                                  `employeeSalaryDTO.allowances.${i}.allowanceType`,
                                  e.target.value,
                                  formData
                                );

                                setErrors(prev => {
                                  const next = { ...prev };
                                  if (error) next[`employeeSalaryDTO.allowances.${i}.allowanceType`] = error;
                                  else delete next[`employeeSalaryDTO.allowances.${i}.allowanceType`];
                                  return next;
                                });
                              }}
                              maxLength={30}
                              className="h-12 text-base"
                            />
                            {fieldError(errors, `employeeSalaryDTO.allowances.${i}.allowanceType`)}
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
                              onChange={(e) => {
                                const updated = [...(formData.employeeSalaryDTO?.deductions || [])];
                                updated[i] = {
                                  ...updated[i],
                                  deductionType: e.target.value,
                                };

                                setFormData((prev) => ({
                                  ...prev,
                                  employeeSalaryDTO: {
                                    ...prev.employeeSalaryDTO!,
                                    deductions: updated,
                                  },
                                }));
                              }}
                              onBlur={(e) => {
                                const error = validateField(
                                  `employeeSalaryDTO.deductions.${i}.deductionType`,
                                  e.target.value,
                                  formData
                                );

                                setErrors((prev) => {
                                  const next = { ...prev };
                                  if (error) next[`employeeSalaryDTO.deductions.${i}.deductionType`] = error;
                                  else delete next[`employeeSalaryDTO.deductions.${i}.deductionType`];
                                  return next;
                                });
                              }}
                              maxLength={30}
                              className="h-12 text-base"
                            />

                            {fieldError(errors, `employeeSalaryDTO.deductions.${i}.deductionType`)}
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
            {/* Bank Details - RESPONSIVE & UNIFORM */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-rose-900">
                  <FileText className="w-7 h-7 text-rose-800" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PAN Number – Optional */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      PAN Number
                      <TooltipHint hint="Permanent Account Number for tax purposes. Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)" />
                    </Label>
                    <Input
                      name="panNumber"
                      value={formData.panNumber || ""}
                        onChange={handleValidatedChange}
                        pattern="[A-Z0-9]{10}"
                      onBlur={handleUniqueBlur("PAN_NUMBER", "pan_number", "panNumber")}

                      maxLength={10}
                      placeholder="e.g.ABCDE1234F"
                      className="h-12"
                    />

                    {fieldError(errors, "panNumber")}
                  </div>

                  {/* Aadhar Number – Optional */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Aadhar Number
                      <TooltipHint hint="12-digit unique ID issued by UIDAI. Format: 1234 5678 9012" />
                    </Label>
                    <Input
                      name="aadharNumber"
                      value={formData.aadharNumber || ""}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = onlyDigits;
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur("AADHAR_NUMBER", "aadhar_number", "aadharNumber")}
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="e.g.123456789012"
                      className="h-12"
                    />

                    {fieldError(errors, "aadharNumber")}
                  </div>

                  {/* Account Number – Optional */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Account Number
                      <TooltipHint hint="Bank account number for salary deposits. Typically 9-18 digits." />
                    </Label>
                    <Input
                      name="accountNumber"
                      value={formData.accountNumber || ""}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = onlyDigits;
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur("ACCOUNT_NUMBER", "account_number", "accountNumber")}

                      inputMode="numeric"
                      maxLength={18}
                      placeholder="123456789012"
                      className="h-12"
                    />

                    {fieldError(errors, "accountNumber")}
                  </div>

                  {/* Account Holder Name – Optional */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Account Holder Name
                      <TooltipHint hint="Name as per bank records. Avoid special characters." />
                    </Label>
                    <Input
                      name="accountHolderName"
                      value={formData.accountHolderName || ""}
                      onChange={handleValidatedChange}
                      placeholder="e.g. As per bank passbook / statement"
                      maxLength={100}
                      className="h-12"
                    />
                    {fieldError(errors, "accountHolderName")}
                  </div>

                  {/* IFSC Code – Optional + Lookup */}
                  <div className="space-y-2 relative">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      IFSC Code
                      <TooltipHint hint="11-character code to identify bank branch. Format: ABCD0123456" />
                    </Label>
                    <Input
                      name="ifscCode"
                      value={formData.ifscCode || ""}
                      onChange={(e) => {
                        setLocalIfsc(e.target.value.toUpperCase());
                        handleValidatedChange(e);
                      }}
                      onBlur={() => handleIfscLookup(localIfsc)}
                      placeholder="e.g. HDFC0000123"
                      maxLength={11}
                      className="h-12 pr-10 uppercase tracking-wider"
                    />
                    {isLookingUp && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {fieldError(errors, "ifscCode")}
                  </div>

                  {/* Bank Name – Auto-filled, read-only */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Bank Name
                      <TooltipHint hint="Auto-filled based on IFSC code. Read-only field." />
                    </Label>
                    <Input
                      name="bankName"
                      value={formData.bankName || ""}
                      readOnly
                      placeholder="Auto-filled from IFSC"
                      className="h-12 bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  {/* Branch Name – Optional */}
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Branch Name
                      <TooltipHint hint="Optional field for bank branch name. Can be auto-filled from IFSC but editable." />
                    </Label>
                    <Input
                      name="branchName"
                      value={formData.branchName || ""}
                      onChange={handleValidatedChange}
                      placeholder="e.g. Mumbai Main Branch"
                      maxLength={100}
                      className="h-12"
                    />
                    {fieldError(errors, "branchName")}
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
                          <TooltipHint hint="Common documents: Aadhar Card, PAN Card, Passport, Offer Letter, Resume, Educational Certificates, Bank Statement" />
                        </Label>
                        <Select
                          value={doc.docType}
                          onValueChange={(v) => {
                            handleDocumentChange(i, 'docType', v as DocumentType);

                            // Add this: validate document type using shared validator
                            const error = validateField(
                              `documents.${i}.docType`,
                              v,
                              formData
                            );

                            setErrors(prev => {
                              const next = { ...prev };
                              if (error) next[`documents.${i}.docType`] = error;
                              else delete next[`documents.${i}.docType`];
                              return next;
                            });
                          }}
                        >                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes
                              .filter((t) => {
                                // allow currently selected type for this row
                                if (t === doc.docType) return true;

                                // block types already used in other rows
                                return !formData.documents.some(
                                  (d, idx) => idx !== i && d.docType === t
                                );
                              })
                              .map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                          </SelectContent>
                          {fieldError(errors, `documents.${i}.docType`)}
                        </Select>
                      </div>
                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Upload File
                          <TooltipHint hint="Supported formats: PDF, JPG, PNG. Max size 5MB recommended." />
                        </Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
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
                      disabled={!canAddDocument}
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
                  {(formData.employeeEquipmentDTO ?? []).map((eq, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-6 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      {/* Equipment Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Equipment Type
                          <TooltipHint hint="Common types: Laptop, Desktop, Monitor, Keyboard, Mouse, Headset, Docking Station" />
                        </Label>
                        <Input
                          placeholder="e.g., Laptop, Monitor"
                          maxLength={30}
                          className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                          value={eq.equipmentType || ''}
                          onChange={(e) => {
                            const value = e.target.value;

                            setFormData(prev => ({
                              ...prev,
                              employeeEquipmentDTO: (prev.employeeEquipmentDTO ?? []).map((item, idx) =>
                                idx === i ? { ...item, equipmentType: value } : item
                              ),
                            }));

                            const error = validateField(
                              `employeeEquipmentDTO.${i}.equipmentType`,
                              value,
                              formData
                            );

                            setErrors(prev => {
                              const next = { ...prev };
                              error
                                ? (next[`employeeEquipmentDTO.${i}.equipmentType`] = error)
                                : delete next[`employeeEquipmentDTO.${i}.equipmentType`];
                              return next;
                            });
                          }}
                        />

                        {fieldError(errors, `employeeEquipmentDTO.${i}.equipmentType`)}
                      </div>

                      {/* Serial Number */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Serial Number
                          <TooltipHint hint="Unique serial number printed on the device. Usually on the back or bottom." />
                        </Label>
                        <Input
                          placeholder="e.g., ABC123XYZ"
                          maxLength={30}
                          className="h-12 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                          value={eq.serialNumber || ''}
                          onChange={(e) => {
                            const value = e.target.value;

                            setFormData(prev => ({
                              ...prev,
                              employeeEquipmentDTO: (prev.employeeEquipmentDTO ?? []).map((item, idx) =>
                                idx === i ? { ...item, serialNumber: value } : item
                              ),
                            }));

                            const error = validateField(
                              `employeeEquipmentDTO.${i}.serialNumber`,
                              value,
                              formData
                            );

                            setErrors(prev => {
                              const next = { ...prev };
                              error
                                ? (next[`employeeEquipmentDTO.${i}.serialNumber`] = error)
                                : delete next[`employeeEquipmentDTO.${i}.serialNumber`];
                              return next;
                            });
                          }}
                          onBlur={() => {
                            if (eq.serialNumber?.trim()?.length >= 3) {
                              checkUniqueness(
                                'SERIAL_NUMBER',
                                eq.serialNumber.trim(),
                                `employeeEquipmentDTO.${i}.serialNumber`,
                                'serial_number'
                              );
                            }
                          }}
                        />

                        {fieldError(errors, `employeeEquipmentDTO.${i}.serialNumber`)}
                      </div>

                      {/* Issued Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Issued Date
                          <TooltipHint hint="Date when equipment was handed over to employee" />
                        </Label>
                        <Input
                          type="date"
                          value={eq.issuedDate || ''}
                          onChange={(e) => handleEquipmentChange(i, 'issuedDate', e.target.value)}
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
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="e.g., Cleared, Pending"
                      className="h-12 text-base"
                    />

                    {fieldError(errors, "employeeAdditionalDetailsDTO.backgroundCheckStatus")}
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
                      onChange={handleValidatedChange}
                      onBlur={handleUniqueBlur(
                        'POLICY_NUMBER',
                        'policy_number',
                        'employeeInsuranceDetailsDTO.policyNumber',
                        null  // ADD mode
                      )}
                      maxLength={30}
                      placeholder="e.g., POL123456"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />

                    {fieldError(errors, "employeeInsuranceDetailsDTO.policyNumber")}
                  </div>
                  {/* Provider Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Provider Name
                      <TooltipHint hint="Insurance company name. Example: LIC, Star Health, HDFC Life" />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={formData.employeeInsuranceDetailsDTO?.providerName || ''}
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="e.g., LIC, Star Health"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />

                    {fieldError(errors, "employeeInsuranceDetailsDTO.providerName")}
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
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="e.g., Priya Sharma"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />

                    {fieldError(errors, "employeeInsuranceDetailsDTO.nomineeName")}
                  </div>
                  {/* Nominee Relation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Nominee Relation
                      <TooltipHint hint="Relationship to employee: Spouse, Parent, Child, Sibling, etc." />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={formData.employeeInsuranceDetailsDTO?.nomineeRelation || ''}
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="e.g., Spouse, Parent"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />

                    {fieldError(errors, "employeeInsuranceDetailsDTO.nomineeRelation")}
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
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = onlyDigits;
                        handleValidatedChange(e);
                      }}
                      placeholder="9876543210"
                      className="h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />

                    {fieldError(errors, "employeeInsuranceDetailsDTO.nomineeContact")}
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
                  {/* Passport Number - Keep uniqueness (as per your original) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Passport Number
                      <TooltipHint hint="Indian passport number. Format: One letter + 7 digits (e.g., A1234567). Must be unique." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.passportNumber"
                        value={formData.employeeStatutoryDetailsDTO?.passportNumber || ''}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          'PASSPORT_NUMBER',
                          'passport_number',
                          'employeeStatutoryDetailsDTO.passportNumber',
                          null
                        )}
                        maxLength={30}
                        placeholder="e.g., A1234567"
                        className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500 uppercase"
                      />
                      {checking.has("employeeStatutoryDetailsDTO.passportNumber") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                        </div>
                      )}
                    </div>
                    {fieldError(errors, "employeeStatutoryDetailsDTO.passportNumber")}
                  </div>

                  {/* PF UAN Number - Keep uniqueness */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      PF UAN Number
                      <TooltipHint hint="12-digit Universal Account Number for Provident Fund. Must be unique across all employees." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="employeeStatutoryDetailsDTO.pfUanNumber"
                        value={formData.employeeStatutoryDetailsDTO?.pfUanNumber || ''}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          'PF_UAN_NUMBER',
                          'pf_uan_number',
                          'employeeStatutoryDetailsDTO.pfUanNumber',
                          null
                        )}
                        maxLength={12}
                        placeholder="e.g., 123456789012"
                        className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                      />
                      {checking.has("employeeStatutoryDetailsDTO.pfUanNumber") && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                        </div>
                      )}
                    </div>
                    {fieldError(errors, "employeeStatutoryDetailsDTO.pfUanNumber")}
                  </div>

                  {/* Tax Regime - No change needed */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Tax Regime
                      <TooltipHint hint="Income tax regime employee has opted for. Common options: Old Regime, New Regime" />
                    </Label>
                    <Input
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      value={formData.employeeStatutoryDetailsDTO?.taxRegime || ''}
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="e.g., Old Regime, New Regime"
                      className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {fieldError(errors, "employeeStatutoryDetailsDTO.taxRegime")}
                  </div>

                  {/* ESI Number - No uniqueness */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      ESI Number
                      <TooltipHint hint="Employee State Insurance Number (usually 10–17 digits). Optional." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="employeeStatutoryDetailsDTO.esiNumber"
                        value={formData.employeeStatutoryDetailsDTO?.esiNumber || ''}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        maxLength={17}
                        placeholder="e.g., 12345678901234567"
                        className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    {fieldError(errors, "employeeStatutoryDetailsDTO.esiNumber")}
                  </div>

                  {/* SSN Number - No uniqueness */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      SSN Number
                      <TooltipHint hint="Social Security Number (for international employees, e.g., US format: 123456789). Optional." />
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="employeeStatutoryDetailsDTO.ssnNumber"
                        value={formData.employeeStatutoryDetailsDTO?.ssnNumber || ''}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        maxLength={12}
                        placeholder="e.g., 123456789"
                        className="h-12 text-base border-gray-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    {fieldError(errors, "employeeStatutoryDetailsDTO.ssnNumber")}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* SUBMIT */}
            <div className="flex justify-end gap-6 items-center mt-10 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/admin-dashboard/employees/list')}>
                Cancel
              </Button>

              <div className="relative group">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                  className={`min-w-[180px] transition-all ${isFormValid() && !isSubmitting
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                    : "bg-gray-400 cursor-not-allowed"
                    } text-white`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Add Employee'
                  )}
                </Button>

                {/* Show tooltip when disabled due to missing fields */}
                {!isSubmitting && !isFormValid() && (
                  <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-4 shadow-xl whitespace-nowrap border border-gray-700">
                      Fill all required fields to enable
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};
export default AddEmployeePage;