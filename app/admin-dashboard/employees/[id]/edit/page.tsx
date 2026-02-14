"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/lib/api/adminService";
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
  DESIGNATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
} from "@/lib/api/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import Swal from "sweetalert2";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Plus,
  Briefcase,
  FileText,
  Package,
  Upload,
  Shield,
  FileCheck,
  Loader2,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { employeeService } from "@/lib/api/employeeService";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import TooltipHint from "@/components/ui/TooltipHint";
import { useEmployeeFieldValidation } from "@/hooks/useEmployeeFieldValidation";

interface FileInputProps {
  id: string;
  currentFile: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  onClear: () => void;
}

export const FileInput: React.FC<FileInputProps> = ({
  id,
  currentFile,
  existingUrl,
  onChange,
  onClear,
}) => {
  return (
    <div className="space-y-2">
      {/* View existing document */}
      {existingUrl && !currentFile && (
        <div className="flex items-center gap-3">
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm 
                       font-medium text-indigo-600 border border-indigo-600 
                       rounded-lg hover:bg-indigo-50"
          >
            View document
          </a>

          <span className="text-xs text-gray-500">
            Upload only if you want to replace
          </span>
        </div>
      )}

      {/* File chooser */}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="file"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />

        <label
          htmlFor={id}
          className="cursor-pointer bg-indigo-600 text-white px-4 py-2 
                     rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {existingUrl ? "Replace file" : "Choose file"}
        </label>

        <span className="text-sm text-gray-600 truncate max-w-[220px]">
          {currentFile ? currentFile.name : "No file selected"}
        </span>

        {currentFile && (
          <button
            type="button"
            onClick={onClear}
            className="text-red-600 text-sm hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const EditEmployeePage = () => {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [formData, setFormData] = useState<EmployeeModel | null>(null);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  // const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [departmentEmployees, setDepartmentEmployees] = useState<
    EmployeeDepartmentDTO[]
  >([]);
  const [employeeImageFile, setEmployeeImageFile] = useState<File | undefined>(
    undefined
  );
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localIfsc, setLocalIfsc] = useState<string>("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  // ✅ Safe handleChange — ONLY updates state
  const { validateField } = useEmployeeFieldValidation();
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;
    const fieldValue = isCheckbox ? checked : value;

    setIsDirty(true);

    setFormData((prev) => {
      if (!prev) return prev;

      // Handle nested fields safely
      if (name.includes(".")) {
        const [parent, child] = name.split(".") as [
          keyof EmployeeModel,
          string
        ];

        const currentParent =
          typeof prev[parent] === "object" && prev[parent] !== null
            ? prev[parent]
            : {};

        return {
          ...prev,
          [parent]: {
            ...currentParent,
            [child]: fieldValue,
          },
        };
      }

      return {
        ...prev,
        [name]: fieldValue,
      };
    });
  };

  const { handleValidatedChange, handleUniqueBlur, fieldError } =
    useFormFieldHandlers(
      handleChange,
      setErrors,
      checkUniqueness,
      () => formData,
      validateField // ← this makes it use EMPLOYEE rules
    );
  const isAnyBankFieldFilled = useMemo(() => {
    if (!formData) return false;

    return !!(
      (
        formData.accountNumber?.trim() ||
        formData.accountHolderName?.trim() ||
        formData.ifscCode?.trim() ||
        formData.bankName?.trim() ||
        formData.branchName?.trim()
      ) // even branch is considered "filled"
    );
  }, [formData]);
  // Handle IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    const code = ifsc.trim().toUpperCase();

    if (!code) {
      setErrors((prev) => ({ ...prev, ifscCode: "Please enter IFSC code" }));
      return;
    }

    if (code.length !== 11) {
      setErrors((prev) => ({
        ...prev,
        ifscCode: "IFSC must be exactly 11 characters",
      }));
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

        // Early return if formData is null (should never happen after mount, but safe)
        if (!formData) {
          console.warn("formData is null during IFSC lookup – skipping update");
          return;
        }

        setFormData({
          ...formData, // ← full object guaranteed
          ifscCode: code,
          bankName: BANK.trim() || formData.bankName || "",
          branchName: BRANCH.trim() || formData.branchName || "",
        });

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
  // const [checking, setChecking] = useState<Set<string>>(new Set());
  const [employeeData, setEmployeeData] = useState<EmployeeDTO | null>(null); // ← This has all IDs

  const staticClients = new Set(["BENCH", "INHOUSE", "HR", "NA"]);
  const managerDesignations: Designation[] = [
    "REPORTING_MANAGER",
    "DELIVERY_MANAGER",
    "DIRECTOR",
    "VP_ENGINEERING",
    "CTO",
  ];

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
      console.error("Failed to load employees for department:", dept, err);
      setDepartmentEmployees([]);
    }
  };
  const realManagers = departmentEmployees.filter(
    (emp) => emp.employeeId && emp.designation
  );

  const hasNoManagerOption = departmentEmployees.some(
    (emp) => emp.employeeId === null
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== "string") {
        Swal.fire({ icon: "error", title: "Invalid ID" });
        setLoading(false);
        return;
      }

      try {
        const [empRes, clientRes] = await Promise.all([
          adminService.getEmployeeById(params.id),
          adminService.getAllClients(),
        ]);

        if (!empRes.flag || !empRes.response)
          throw new Error("Employee not found");

        const emp = empRes.response as EmployeeDTO;
        setEmployeeData(emp);
        let clientSelection = "";
        if (emp.clientId) {
          clientSelection = `CLIENT:${emp.clientId}`;
        } else {
          clientSelection = `STATUS:${emp.clientStatus || ""}`;
        }
        setFormData({
          ...emp,
          clientSelection,
          // Clean top-level rateCard — make it null if 0 or undefined (blank in UI)
          rateCard: emp.rateCard ?? null,


          documents: (emp.documents ?? []).map((d) => ({
            documentId: d.documentId,
            docType: d.docType,
            file: null, // 👈 for replacement upload
            fileUrl: d.fileUrl ?? undefined,
          })),
          employeeEquipmentDTO: emp.employeeEquipmentDTO ?? [],

          employeeSalaryDTO: emp.employeeSalaryDTO
            ? {
              ...emp.employeeSalaryDTO,
              employeeId: emp.employeeSalaryDTO.employeeId || emp.employeeId,
              // Clean CTC and Standard Hours to show blank if 0/undefined
              ctc: emp.employeeSalaryDTO.ctc ?? null,

              standardHours:
                emp.employeeSalaryDTO.standardHours === 0 ||
                  emp.employeeSalaryDTO.standardHours == null ||
                  emp.employeeSalaryDTO.standardHours === 40
                  ? null
                  : emp.employeeSalaryDTO.standardHours,
            }
            : undefined,
        });

        if (emp.employeeEmploymentDetailsDTO?.department) {
          employeeService
            .getEmployeesByDepartment(
              emp.employeeEmploymentDetailsDTO.department
            )
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
            console.warn(
              "Could not load managers for department:",
              emp.employeeEmploymentDetailsDTO.department
            );
            setDepartmentEmployees([]);
          }
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (!formData?.personalEmail || !formData?.companyEmail) {
      return;
    }
  
    const p = formData.personalEmail.trim().toLowerCase();
    const c = formData.companyEmail.trim().toLowerCase();
  
    if (p && c && p === c) {
      setErrors(prev => ({
        ...prev,
        personalEmail: "Personal and company email cannot be the same",
        companyEmail: "Personal and company email cannot be the same",
      }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.personalEmail;
        delete next.companyEmail;
        return next;
      });
    }
  }, [formData?.personalEmail, formData?.companyEmail]);
  
  
  useEffect(() => {
    if (formData?.ifscCode) {
      setLocalIfsc(formData.ifscCode.toUpperCase());
    }
  }, [formData?.ifscCode]);
  // Add this useEffect inside EditEmployeePage (near other useEffects)

  useEffect(() => {
    if (!formData?.personalEmail || !formData?.companyEmail) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next["personalEmail_same"];
        delete next["companyEmail_same"];
        return next;
      });
      return;
    }

    const p = formData.personalEmail.trim().toLowerCase();
    const c = formData.companyEmail.trim().toLowerCase();

    if (p === c && p.length > 0) {
      setErrors((prev) => ({
        ...prev,
        personalEmail_same: "Personal and company email cannot be the same",
        companyEmail_same: "Personal and company email cannot be the same",
      }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next["personalEmail_same"];
        delete next["companyEmail_same"];
        return next;
      });
    }
  }, [formData?.personalEmail, formData?.companyEmail]);

  const validateClientDates = (data: EmployeeModel) => {
    if (!data.clientSelection) {
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


    const newErrors: Record<string, string> = {};

    const parseDate = (dateStr?: string | null): Date | null => {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const rawDoJ = data.dateOfJoining;
    const rawOCT = data.dateOfOnboardingToClient;
    const rawOff = data.dateOfOffboardingToClient;
    const rawCbs = data.clientBillingStartDate;
    const rawCbe = data.clientBillingStopDate;

    const doJ = parseDate(rawDoJ);
    const doOCT = parseDate(rawOCT);
    const doOff = parseDate(rawOff);
    const cbs = parseDate(rawCbs);
    const cbe = parseDate(rawCbe);

    /* -----------------------------
       DOJ — ALWAYS mandatory
    ------------------------------ */
    if (!doJ) {
      newErrors.dateOfJoining = "Date of Joining is required";
    }

    /* -----------------------------
       STATUS client → stop here
    ------------------------------ */
    if (data.clientSelection.startsWith("STATUS:")) {
      setErrors((prev) => {
        const cleaned = { ...prev };

        delete cleaned.dateOfOnboardingToClient;
        delete cleaned.dateOfOffboardingToClient;
        delete cleaned.clientBillingStartDate;
        delete cleaned.clientBillingStopDate;

        return {
          ...cleaned,
          ...newErrors, // DOJ error (if any) preserved
        };
      });
      return;
    }

    /* -----------------------------
       CLIENT → Onboarding mandatory
    ------------------------------ */
    if (!doOCT) {
      newErrors.dateOfOnboardingToClient = "Date of Onboarding is required";
    }

    // Stop if mandatory missing
    if (!doJ || !doOCT) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    /* -----------------------------
       Date relationship checks
    ------------------------------ */
    if (doJ > doOCT) {
      newErrors.dateOfOnboardingToClient =
        "Onboarding date must be after Date of Joining";
    }

    if (rawOff && doOff && doOCT > doOff) {
      newErrors.dateOfOffboardingToClient =
        "Offboarding date must be after onboarding date";
    }

    if (rawCbs && cbs && cbs < doOCT) {
      newErrors.clientBillingStartDate =
        "Billing start date cannot be before onboarding date";
    }

    // Billing start must be before offboarding
    if (cbs && doOff && cbs >= doOff) {
      newErrors.clientBillingStartDate =
        "Billing start date must be before offboarding date";
    }

    // Billing start must be before billing end
    if (cbs && cbe && cbs >= cbe) {
      newErrors.clientBillingStartDate =
        "Billing start date must be before billing end date";
      newErrors.clientBillingStopDate =
        "Billing end date must be after billing start date";
    }

    if (rawCbe && cbe && rawCbs && cbs && cbs >= cbe) {
      newErrors.clientBillingStopDate =
        "Billing end date must be after billing start date";
    }

    if (rawOff && rawCbe && doOff && cbe && doOff > cbe) {
      newErrors.dateOfOffboardingToClient =
        "Offboarding date cannot be after billing end date";
    }

    setErrors((prev) => {
      const cleaned = { ...prev };

      delete cleaned.dateOfJoining;
      delete cleaned.dateOfOnboardingToClient;
      delete cleaned.dateOfOffboardingToClient;
      delete cleaned.clientBillingStartDate;
      delete cleaned.clientBillingStopDate;

      return {
        ...cleaned,
        ...newErrors,
      };
    });
  };

  useEffect(() => {
    if (!formData || !isDirty) return;
    validateClientDates(formData);
  }, [
    formData?.dateOfJoining,
    formData?.dateOfOnboardingToClient,
    formData?.dateOfOffboardingToClient,
    formData?.clientBillingStartDate,
    formData?.clientBillingStopDate,
    formData?.clientSelection,
  ]);
  const isStatusClient = formData?.clientSelection?.startsWith("STATUS:");

  useEffect(() => {
    if (!formData) return;

    setErrors((prev) => {
      const next = { ...prev };
      delete next["rateCard"]; // clear old error first

      // Only enforce when real client is selected
      if (formData.clientSelection && !isStatusClient) {
        const rate = formData.rateCard;

        if (rate == null || rate <= 0) {
          next["rateCard"] = "Rate Card is required when a client is selected";
        }
      }

      return next;
    });
  }, [formData?.rateCard, formData?.clientSelection, isStatusClient]);

  // DOCUMENTS
  const addDocument = () => {
    setIsDirty(true);
    setFormData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        documents: [
          ...prev.documents,
          {
            documentId: null,
            docType: undefined,
            file: null, // 👈 important
          },
        ],
      };
    });
  };

  const handleDocumentFileChange = (
    index: number,
    field: string,
    value: string | File | null
  ) => {
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          documents: prev.documents.map((doc, i) =>
            i === index ? { ...doc, [field]: value } : doc
          ),
        }
        : prev
    );
  };

  const confirmAndRemoveDocument = async (index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this document?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      await removeDocument(index);
      Swal.fire("Deleted!", "Document has been removed.", "success");
    }
  };

  const removeDocument = async (index: number) => {
    if (!formData) return;
    const doc = formData.documents[index];
    if (doc.documentId) {
      const res = await adminService.deleteEmployeeDocument(
        params.id as string,
        doc.documentId
      );
      if (!res.flag) {
        Swal.fire({ icon: "error", title: "Delete failed", text: res.message });
        return;
      }
    }
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          documents: prev.documents.filter((_, i) => i !== index),
        }
        : prev
    );
  };

  // EQUIPMENT
  const addEquipment = () => {
    setIsDirty(true); // ← ADD THIS LINE
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          employeeEquipmentDTO: [
            ...(prev.employeeEquipmentDTO ?? []),
            {
              equipmentId: "",
              equipmentType: "",
              serialNumber: "",
              issuedDate: "",
            },
          ],
        }
        : prev
    );
  };

  const handleEquipmentChange = (
    index: number,
    field: keyof EmployeeEquipmentDTO,
    value: string
  ) => {
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          employeeEquipmentDTO:
            prev.employeeEquipmentDTO?.map((eq, i) =>
              i === index ? { ...eq, [field]: value } : eq
            ) ?? [],
        }
        : prev
    );
  };

  const confirmAndRemoveEquipment = async (index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to remove this equipment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      await removeEquipment(index);
      Swal.fire("Deleted!", "Equipment has been removed.", "success");
    }
  };

  const removeEquipment = async (index: number) => {
    if (!formData) return;
    const eq = formData.employeeEquipmentDTO?.[index];
    if (eq?.equipmentId) {
      const res = await adminService.deleteEmployeeEquipmentInfo(
        eq.equipmentId
      );
      if (!res.flag) {
        Swal.fire({ icon: "error", title: "Delete failed", text: res.message });
        return;
      }
    }
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          employeeEquipmentDTO:
            prev.employeeEquipmentDTO?.filter((_, i) => i !== index) ?? [],
        }
        : prev
    );
  };
  const currentManagerName = formData?.reportingManagerId
    ? departmentEmployees.find(
      (e) => e.employeeId === formData.reportingManagerId
    )?.fullName
    : null;

  // DELETE ALLOWANCE
  const confirmAndRemoveAllowance = async (index: number) => {
    const result = await Swal.fire({
      title: "Remove Allowance?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
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
          console.warn(
            "Backend returned flag: false but 200 OK – treating as success",
            res
          );
          wasDeletedFromServer = true;
        }
      } catch (err: any) {
        // Only real network errors or 4xx/5xx → show error
        if (err.response?.status >= 400) {
          await Swal.fire({
            icon: "error",
            title: "Failed",
            text: "Could not delete allowance from server",
          });
          return;
        }
        // If it's a network error but not 4xx/5xx, fall through
        console.error("Unexpected delete error:", err);
      }
    } else {
      wasDeletedFromServer = true; // never saved → safe to remove
    }

    // Always remove from UI if we think it succeeded
    setFormData((prev) => {
      if (!prev?.employeeSalaryDTO) return prev;

      return {
        ...prev,
        employeeSalaryDTO: {
          ...prev.employeeSalaryDTO,
          employeeId:
            prev.employeeSalaryDTO.employeeId || (params.id as string),
          allowances:
            prev.employeeSalaryDTO.allowances?.filter((_, i) => i !== index) ||
            [],
        },
      };
    });

    // Always show success if we reached here
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Allowance removed successfully",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // DELETE DEDUCTION
  const confirmAndRemoveDeduction = async (index: number) => {
    const result = await Swal.fire({
      title: "Remove Deduction?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
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
          console.warn(
            "Deduction delete: flag false but 200 OK → treating as success"
          );
          wasDeletedFromServer = true;
        }
      } catch (err: any) {
        if (err.response?.status >= 400) {
          await Swal.fire({
            icon: "error",
            title: "Failed",
            text: "Could not delete deduction from server",
          });
          return;
        }
      }
    } else {
      wasDeletedFromServer = true;
    }

    setFormData((prev) => {
      if (!prev?.employeeSalaryDTO) return prev;

      return {
        ...prev,
        employeeSalaryDTO: {
          ...prev.employeeSalaryDTO,
          employeeId:
            prev.employeeSalaryDTO.employeeId || (params.id as string),
          deductions:
            prev.employeeSalaryDTO.deductions?.filter((_, i) => i !== index) ||
            [],
        },
      };
    });

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Deduction removed successfully",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // In handleSubmit — CRITICAL CHANGE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id || !formData) return;

    setIsSubmitting(true);
    // ──────────────────────────────────────────────
    // BANK DETAILS: All-or-nothing validation (same as Add page)
    // ──────────────────────────────────────────────
    if (isAnyBankFieldFilled) {
      const missing: string[] = [];
      if (!formData.accountNumber?.trim()) missing.push("Account Number");
      if (!formData.accountHolderName?.trim())
        missing.push("Account Holder Name");
      if (!formData.ifscCode?.trim()) missing.push("IFSC Code");
      if (!formData.bankName?.trim()) missing.push("Bank Name");
      // Branch Name is optional → not added here

      if (missing.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Bank Details",
          html: `
        Please fill these fields when entering bank information:<br><br>
        <ul style="text-align:left; margin:16px 0 16px 32px; list-style:disc;">
          ${missing.map((m) => `<li>${m}</li>`).join("")}
        </ul>
      `,
          confirmButtonText: "OK",
          confirmButtonColor: "#4f46e5",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then((result) => {
          if (result.isConfirmed) {
            const bankCard = document.querySelector("[data-bank-section]");

            if (bankCard) {
              bankCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              setTimeout(() => {
                const firstInput = bankCard.querySelector(
                  'input:not([type="hidden"]):not([readonly])'
                ) as HTMLInputElement | null;

                if (firstInput) {
                  firstInput.focus();
                  firstInput.classList.add(
                    "ring-2",
                    "ring-red-500",
                    "ring-offset-2"
                  );
                  setTimeout(() => {
                    firstInput.classList.remove(
                      "ring-2",
                      "ring-red-500",
                      "ring-offset-2"
                    );
                  }, 1800);
                }
              }, 450);
            }
          }
        });

        setIsSubmitting(false);
        return; // ← STOP submission
      }
    }
    // Rate Card required check for real clients
    if (formData.clientSelection && !isStatusClient) {
      if (formData.rateCard == null || formData.rateCard <= 0) {
        setErrors((prev) => ({
          ...prev,
          rateCard: "Rate Card is required when a client is selected",
        }));

        // Scroll to Rate Card field
        setTimeout(() => {
          const rateInput = document.querySelector('input[name="rateCard"]');
          if (rateInput) {
            rateInput.scrollIntoView({ behavior: "smooth", block: "center" });
            (rateInput as HTMLInputElement).focus();
          }
        }, 150);

        setIsSubmitting(false);
        return;
      }
    }
    const fd = new FormData();

    // 🚫 Block partial document updates
    const hasInvalidNewDocument = formData.documents.some((doc) => {
      // 🟢 Existing document → always valid (replace freely)
      if (doc.documentId) return false;

      const hasType = !!doc.docType;
      const hasFile = doc.file instanceof File;

      // 🔵 New document → invalid ONLY if partially filled
      return hasType !== hasFile;
    });

    if (hasInvalidNewDocument) {
      Swal.fire(
        "Incomplete Document",
        "Please select both document type and file for new documents.",
        "warning"
      );
      setIsSubmitting(false);
      return;
    }
    try {
      const cleanEmploymentDetails = (dto?: any) => {
        if (!dto) return undefined;
        const {
          shiftTimingLabel,
          workingModelLabel,
          noticePeriodDurationLabel,
          probationDurationLabel,
          probationNoticePeriodLabel,
          bondDurationLabel,
          departmentLabel,
          locationLabel,
          ...clean
        } = dto;
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
        dateOfOnboardingToClient: formData.dateOfOnboardingToClient,
        dateOfOffboardingToClient: formData.dateOfOffboardingToClient,
        clientBillingStartDate: formData.clientBillingStartDate,
        clientBillingStopDate: formData.clientBillingStopDate,
        rateCard: formData.rateCard,
        employmentType: formData.employmentType,
        // reportingManagerId: formData.reportingManagerId ?? null,
        reportingManagerId:
          formData.reportingManagerId === "NO_MANAGER"
            ? null
            : formData.reportingManagerId,
        clientId: formData.clientId ?? null,
        clientSelection: formData.clientSelection,
        panNumber: formData.panNumber,
        aadharNumber: formData.aadharNumber,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        employeeEmploymentDetailsDTO: cleanEmploymentDetails(
          formData.employeeEmploymentDetailsDTO
        ),
        employeeSalaryDTO: formData.employeeSalaryDTO,
        employeeEquipmentDTO: formData.employeeEquipmentDTO,

        // ONLY send document metadata — NO file field!
        // documents: formData.documents.map((doc) => ({
        //   documentId: doc.documentId || null,
        //   docType: doc.docType,
        // })),

        // ADDED: INSURANCE & STATUTORY — ONLY IF ANY FIELD IS FILLED
        ...(formData.employeeInsuranceDetailsDTO &&
          (formData.employeeInsuranceDetailsDTO.policyNumber ||
            formData.employeeInsuranceDetailsDTO.providerName ||
            formData.employeeInsuranceDetailsDTO.coverageStart ||
            formData.employeeInsuranceDetailsDTO.coverageEnd ||
            formData.employeeInsuranceDetailsDTO.nomineeName ||
            formData.employeeInsuranceDetailsDTO.nomineeRelation ||
            formData.employeeInsuranceDetailsDTO.nomineeContact ||
            formData.employeeInsuranceDetailsDTO.groupInsurance === true)
          ? {
            employeeInsuranceDetailsDTO: {
              policyNumber:
                formData.employeeInsuranceDetailsDTO.policyNumber || "",
              providerName:
                formData.employeeInsuranceDetailsDTO.providerName || "",
              coverageStart:
                formData.employeeInsuranceDetailsDTO.coverageStart || "",
              coverageEnd:
                formData.employeeInsuranceDetailsDTO.coverageEnd || "",
              nomineeName:
                formData.employeeInsuranceDetailsDTO.nomineeName || "",
              nomineeRelation:
                formData.employeeInsuranceDetailsDTO.nomineeRelation || "",
              nomineeContact:
                formData.employeeInsuranceDetailsDTO.nomineeContact || "",
              groupInsurance:
                formData.employeeInsuranceDetailsDTO.groupInsurance || false,
            },
          }
          : {}),

        ...(formData.employeeStatutoryDetailsDTO &&
          (formData.employeeStatutoryDetailsDTO.passportNumber ||
            formData.employeeStatutoryDetailsDTO.taxRegime ||
            formData.employeeStatutoryDetailsDTO.pfUanNumber ||
            formData.employeeStatutoryDetailsDTO.esiNumber ||
            formData.employeeStatutoryDetailsDTO.ssnNumber)
          ? {
            employeeStatutoryDetailsDTO: {
              passportNumber:
                formData.employeeStatutoryDetailsDTO.passportNumber || "",
              taxRegime: formData.employeeStatutoryDetailsDTO.taxRegime || "",
              pfUanNumber:
                formData.employeeStatutoryDetailsDTO.pfUanNumber || "",
              esiNumber: formData.employeeStatutoryDetailsDTO.esiNumber || "",
              ssnNumber: formData.employeeStatutoryDetailsDTO.ssnNumber || "",
            },
          }
          : {}),
      };

      fd.append("employee", JSON.stringify(cleanPayload));

      if (employeeImageFile instanceof File) {
        fd.append("employeePhotoUrl", employeeImageFile);
      }
      if (formData?.documents?.length) {
        const validDocuments = formData.documents.filter(
          (doc) =>
            // existing document unchanged
            (doc.documentId && !doc.file) ||
            // new or replaced document
            (doc.docType && doc.file instanceof File)
        );

        validDocuments.forEach((doc, index) => {
          if (!doc.docType) return;

          fd.append(`documents[${index}].documentId`, doc.documentId ?? "");
          fd.append(`documents[${index}].docType`, doc.docType);

          if (doc.file instanceof File) {
            fd.append(`documents[${index}].file`, doc.file);
          }
        });
      }

      const res = await adminService.updateEmployee(params.id as string, fd);

      if (res.flag) {
        await Swal.fire(
          "Success!",
          "Employee updated successfully!",
          "success"
        );
        router.push("/admin-dashboard/employees/list");
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err: any) {
      console.error("Update failed:", err);
      Swal.fire("Error", err.message || "Update failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidDocumentChange =
    formData?.documents?.every((doc) => {
      // 🟢 EXISTING DOCUMENT (replace allowed)
      if (doc.documentId) {
        // allow:
        // - change only type
        // - change only file
        // - change both
        // - change nothing
        return true;
      }

      // 🔵 NEW DOCUMENT (must be complete OR untouched)
      const hasType = !!doc.docType;
      const hasFile = doc.file instanceof File;

      // valid if:
      // - both selected
      // - neither selected (empty row allowed until user fills or deletes)
      return hasType === hasFile;
    }) ?? true;

  // const canAddDocument =
  //   !formData ||
  //   formData.documents.every(
  //     (d) => d.documentId || (d.docType && d.file instanceof File)
  //   );

  const { hasAnyDocTypeSelected, hasValidDocument } = useMemo(() => {
    const docs = formData?.documents ?? [];
  
    return {
      hasAnyDocTypeSelected: docs.some(d => !!d.docType),
  
      hasValidDocument: docs.some(d =>
        // Existing document (already saved)
        d.documentId ||
  
        // New complete document
        (d.docType && d.file instanceof File)
      ),
    };
  }, [formData?.documents]);
  
  const canAddDocument =
    !hasAnyDocTypeSelected || hasValidDocument;
  

    const isFormValid = () => {
      if (!formData) return false;
    
      if (!formData.firstName?.trim()) return false;
      if (!formData.lastName?.trim()) return false;
      if (!formData.personalEmail?.trim()) return false;
      if (!formData.companyEmail?.trim()) return false;
      if (!formData.contactNumber?.trim()) return false;
      if (!formData.dateOfBirth) return false;
      if (!formData.nationality?.trim()) return false;
      if (!formData.gender) return false;
    
      if (!formData.clientSelection) return false;

      const isRealClient =
      formData.clientSelection?.startsWith("CLIENT:");
    
    
      if (isRealClient && !formData.clientId) return false;
    
      if (!formData.employeeEmploymentDetailsDTO?.department) return false;
      if (!formData.designation) return false;
      if (!formData.dateOfJoining) return false;
      if (!formData.employmentType) return false;
    
      if (!formData.employeeSalaryDTO?.payType) return false;
      if (
        formData.employeeSalaryDTO?.ctc == null ||
        Number(formData.employeeSalaryDTO.ctc) <= 0
      )
        return false;
      
    
      if (isRealClient) {
        if (!formData.dateOfOnboardingToClient) return false;
        if (!formData.rateCard || formData.rateCard <= 0) return false;
      }
    
      // ❗ BLOCK if personal and company email same
if (
  formData.personalEmail?.trim().toLowerCase() ===
  formData.companyEmail?.trim().toLowerCase()
) {
  return false;
}

      return true; // 🔥 no errors check
    };
    
    

  // LOADING STATES
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-lg font-medium text-gray-700">
              Loading employee data...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!formData) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
        <div className="text-center py-20 text-gray-500 text-xl">
          Employee not found
        </div>
      </ProtectedRoute>
    );
  }

const selectValue =
  formData.clientSelection?.startsWith("CLIENT:")
    ? formData.clientSelection.replace("CLIENT:", "")
    : formData.clientSelection?.replace("STATUS:", "") ?? "";


  const getError = (key: string) => errors[key] || "";
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
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
                      <TooltipHint hint="Employee's first name as per official documents. Example: Manoj" />
                    </Label>
                    <Input
                      name="firstName"
                      value={formData.firstName ?? ""}
                      required
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="Enter first name"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
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
                      value={formData.lastName ?? ""}
                      required
                      onChange={handleValidatedChange}
                      maxLength={50}
                      placeholder="Enter last name"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                    />
                    {fieldError(errors, "lastName")}
                  </div>
                  {/* Personal Email - WITH UNIQUENESS CHECK & LOADING SPINNER */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Personal Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Personal email for communication. Must be unique in the system." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="personalEmail"
                        type="email"
                        value={formData.personalEmail ?? ""}
                        required
                        onChange={(e) => {
                          e.target.value = e.target.value.toLowerCase();
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "EMAIL",
                          "personal_email",
                          "personalEmail",
                          employeeData?.employeeId
                        )}
                        maxLength={30}
                        placeholder="you@gmail.com"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                      />
                    </div>
                    {fieldError(errors, "personalEmail")}
                  </div>

                  {/* Company Email */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Company Email <span className="text-red-500">*</span>
                      <TooltipHint hint="Official work email provided by company. Must be unique." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="companyEmail"
                        type="email"
                        value={formData.companyEmail ?? ""}
                        required
                        onChange={(e) => {
                          e.target.value = e.target.value.toLowerCase();
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "EMAIL",
                          "company_email",
                          "companyEmail",
                          employeeData?.employeeId
                        )}
                        maxLength={50}
                        placeholder="you@company.com"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                      />
                    </div>
                    {fieldError(errors, "companyEmail")}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                      <TooltipHint hint="10-digit Indian mobile number. Must start with 6-9." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="contactNumber"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.contactNumber ?? ""}
                        required
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "CONTACT_NUMBER",
                          "contact_number",
                          "contactNumber",
                          employeeData?.employeeId,
                          10
                        )}
                        maxLength={10}
                        placeholder="9876543210"
                        className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                      />
                    </div>
                    {/* Error Message */}
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
                      value={formData.dateOfBirth ?? ""}
                      required
                      onChange={handleValidatedChange}
                      max={today}
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
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
                      value={formData.nationality ?? ""}
                      required
                      onChange={handleValidatedChange}
                      maxLength={30}
                      placeholder="Indian"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
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
                      value={formData?.gender || ""}
                      onValueChange={(v) => {
                        setFormData((prev) =>
                          prev ? { ...prev, gender: v } : prev
                        );
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        {" "}
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
                      onBlur={handleUniqueBlur(
                        "PAN_NUMBER",
                        "pan_number",
                        "panNumber"
                      )}
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
                        const onlyDigits = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        e.target.value = onlyDigits;
                        handleValidatedChange(e);
                      }}
                      pattern="[0-9]{12}"
                      onBlur={handleUniqueBlur(
                        "AADHAR_NUMBER",
                        "aadhar_number",
                        "aadharNumber"
                      )}
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="e.g.123456789012"
                      className="h-12"
                    />
                    {fieldError(errors, "aadharNumber")}
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
                      <TooltipHint hint="Select the client/project the employee is assigned to. Use BENCH/INHOUSE if not assigned." />
                    </Label>
                    <Select
                      required
                      value={selectValue}
                      onValueChange={(v) => {
                        setFormData((prev) => {
                          if (!prev) return prev;

                          const prevClient = prev.clientSelection?.startsWith(
                            "CLIENT:"
                          )
                            ? prev.clientSelection
                            : null;

                          const nextClient = staticClients.has(v)
                            ? `STATUS:${v}`
                            : `CLIENT:${v}`;
                          const clientChanged =
                            prev.clientSelection !== nextClient;
                          return {
                            ...prev,
                            clientId: staticClients.has(v) ? null : v,
                            clientSelection: nextClient,

                            // 🔴 Reset client-dependent dates if client changed
                            ...(clientChanged
                              ? {
                                dateOfOnboardingToClient: "",
                                dateOfOffboardingToClient: "",
                                clientBillingStartDate: "",
                                clientBillingStopDate: "",
                              }
                              : {}),
                          };
                        });

                        // Clear date-related validation errors
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dateOfOnboardingToClient;
                          delete newErrors.dateOfOffboardingToClient;
                          delete newErrors.clientBillingStartDate;
                          delete newErrors.clientBillingStopDate;
                          delete newErrors.clientSelection;
                          return newErrors;
                        });

                        setIsDirty(true);
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

                    {fieldError(errors, "clientSelection")}
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Department<span className="text-red-500">*</span>
                      <TooltipHint hint="Department where employee works (e.g., Development, QA, HR)." />
                    </Label>
                    <Select
                      required
                      value={
                        formData?.employeeEmploymentDetailsDTO?.department || ""
                      }
                      onValueChange={async (v) => {
                        const department = v as Department;
                        setIsDirty(true);
                        setFormData((prev) =>
                          prev
                            ? {
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
                              reportingManagerId: "", // temporarily clear
                            }
                            : prev
                        );

                        // Fetch fresh list
                        const employees =
                          await employeeService.getEmployeesByDepartment(
                            department
                          );
                        setDepartmentEmployees(employees);

                        const validManagers = employees.filter((emp) =>
                          managerDesignations.includes(
                            emp.designation as Designation
                          )
                        );

                        // Auto-select if only one manager
                        if (validManagers.length === 1) {
                          setFormData((prev) =>
                            prev
                              ? {
                                ...prev,
                                reportingManagerId:
                                  validManagers[0].employeeId,
                              }
                              : prev
                          );
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
                        />{" "}
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError(
                      errors,
                      "employeeEmploymentDetailsDTO.department"
                    )}
                  </div>

                  {/* Reporting Manager */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      Reporting Manager
                      <TooltipHint hint="Select the employee's direct reporting manager from the same department." />
                    </Label>
                    <Select
                      value={formData?.reportingManagerId || ""}
                      onValueChange={(v) => {
                        setFormData((prev) =>
                          prev ? { ...prev, reportingManagerId: v } : prev
                        );
                        setIsDirty(true);
                      }}
                      disabled={
                        !formData?.employeeEmploymentDetailsDTO?.department
                      }
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
                      value={formData?.designation || ""}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        setFormData((prev) =>
                          prev
                            ? { ...prev, designation: v as Designation }
                            : prev
                        );
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>

                      <SelectContent>
                        {DESIGNATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d.replace(/_/g, " ")}
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
                      <TooltipHint hint="Employee's first official working day with the company. Must be in the past or today. Cannot be a future date. This date must be earlier than onboarding, billing start, offboarding, and billing end dates." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfJoining"
                      required
                      value={formData.dateOfJoining ?? ""}
                      onChange={handleValidatedChange}
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                    />
                    {fieldError(errors, "dateOfJoining")}
                  </div>

                  {/* Date of onboarding */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date Of Onboarding To Client
                      {formData.clientSelection && !isStatusClient && <span className="text-red-500">*</span>}
                      <TooltipHint hint="Date when the employee started working for the client. Must be after Date of Joining." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfOnboardingToClient"
                      value={formData.dateOfOnboardingToClient ?? ""}
                      onChange={handleValidatedChange}
                      required={!!(formData.clientSelection && !isStatusClient)} // disabled={isStatusClient}
                      className="h-12 text-base w-full"
                    />
                    {fieldError(errors, "dateOfOnboardingToClient")}
                  </div>

                  {/* Date of Offboarding To Client*/}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Date Of Offboarding To Client
                      <TooltipHint hint="Last working day with the client. Must be after Date of Joining, onboarding, and billing start. Can be the same as or before Client Billing End Date." />
                    </Label>
                    <Input
                      type="date"
                      name="dateOfOffboardingToClient"
                      value={formData.dateOfOffboardingToClient ?? ""}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full"
                    //  max={maxJoiningDateStr}
                    />
                    {fieldError(errors, "dateOfOffboardingToClient")}
                  </div>
                  {/* Client Billing Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client Billing Start Date
                      <TooltipHint hint="Date from which client billing begins. Must be after Date of Joining and on or after Date of Onboarding. Must be strictly before Client Billing End Date and before offboarding date." />
                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStartDate"
                      value={formData.clientBillingStartDate ?? ""}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full"
                    //  max={maxJoiningDateStr}
                    />
                    {fieldError(errors, "clientBillingStartDate")}
                  </div>
                  {/* client Billing Stop Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Client Billing End Date
                      <TooltipHint hint="Date until which client billing continues for this employee. Must be strictly after Client Billing Start Date. Can be the same as or after Date of Offboarding to Client." />
                    </Label>
                    <Input
                      type="date"
                      name="clientBillingStopDate"
                      value={formData.clientBillingStopDate ?? ""}
                      onChange={handleValidatedChange}
                      className="h-12 text-base w-full"
                    //  max={maxJoiningDateStr}
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
                      value={formData.employmentType ?? ""}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        setFormData((prev) =>
                          prev
                            ? { ...prev, employmentType: v as EmploymentType }
                            : prev
                        );
                      }}
                    >
                      <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>

                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
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
                    <Label className="text-sm font-semibold text-gray-700">
                      Rate Card
                      {formData.clientSelection && !isStatusClient && (
                        <span className="text-red-500">*</span>
                      )}
                      <TooltipHint hint="Hourly or daily billing rate for client projects (in selected currency). Leave blank if not applicable." />
                    </Label>
                    <Input
                      type="number"
                      name="rateCard"
                      required={!!(formData.clientSelection && !isStatusClient)}
                      value={formData.rateCard ?? ""}
                      onChange={handleValidatedChange} // ← changed                      className="h-12 text-base w-full"
                      placeholder="45.00"
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
                      className="h-12 text-base w-full"
                      type="number"
                      placeholder="e.g. 1200000"
                      name="employeeSalaryDTO.ctc"
                      value={formData.employeeSalaryDTO?.ctc ?? ""}
                      onChange={handleValidatedChange}
                      required
                    />
                    {fieldError(errors, "employeeSalaryDTO.ctc")}
                  </div>
                  {/* Pay Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Pay Type <span className="text-red-500">*</span>
                      <TooltipHint hint="How salary is structured: Fixed, Variable, Hourly, etc." />
                    </Label>
                    <Select
                      required
                      value={formData?.employeeSalaryDTO?.payType || ""}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        setFormData((prev) =>
                          prev
                            ? {
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
                            }
                            : prev
                        );
                      }}
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
                    {fieldError(errors, "employeeSalaryDTO.payType")}
                  </div>

                  {/* Standard Hours */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Standard Hours
                      <TooltipHint hint="Expected working hours per week. Default is 40." />
                    </Label>
                    <Input
                      type="number"
                      name="employeeSalaryDTO.standardHours"
                      value={formData.employeeSalaryDTO?.standardHours ?? ""}
                      onChange={handleValidatedChange} // ← changed                      className="h-12 text-base w-full"
                    />
                    {fieldError(errors, "employeeSalaryDTO.standardHours")}
                  </div>

                  {/* Pay Class */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Pay Class
                      <TooltipHint hint="Salary classification: A1, A2, INTERN, NA, B1, B2, CONTRACT" />
                    </Label>

                    <Select
                      value={formData.employeeSalaryDTO?.payClass || ""}
                      onValueChange={(v) => {
                        setIsDirty(true);
                        handleChange({
                          target: {
                            name: "employeeSalaryDTO.payClass",
                            value: v,
                          },
                        } as any);
                      }}
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
                    {fieldError(errors, "employeeSalaryDTO.payClass")}
                  </div>

                  {/* Working Model */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Working Model
                      <TooltipHint hint="Work arrangement: Remote, Hybrid, Onsite, etc." />
                    </Label>
                    <Select
                      value={
                        formData.employeeEmploymentDetailsDTO?.workingModel ||
                        ""
                      }
                      onValueChange={(v) => {
                        setIsDirty(true);
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.workingModel",
                            value: v,
                          },
                        } as any);
                      }}
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
                    {fieldError(
                      errors,
                      "employeeEmploymentDetailsDTO.workingModel"
                    )}{" "}
                    {/* ← Fixed error key */}
                  </div>

                  {/* Shift Timing */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Shift Timing
                      <TooltipHint hint="Employee's work shift: General, US Shift, UK Shift, etc." />
                    </Label>

                    <Select
                      value={
                        formData.employeeEmploymentDetailsDTO?.shiftTiming || ""
                      }
                      onValueChange={(v) => {
                        setIsDirty(true);
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.shiftTiming",
                            value: v,
                          },
                        } as any);
                      }}
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
                    <Label className="text-sm font-semibold text-gray-700">
                      Date of Confirmation
                      <TooltipHint hint="Date when employee moved from probation to permanent. Leave blank if still on probation." />
                    </Label>
                    <Input
                      type="date"
                      name="employeeEmploymentDetailsDTO.dateOfConfirmation"
                      value={
                        formData.employeeEmploymentDetailsDTO
                          ?.dateOfConfirmation || ""
                      }
                      onChange={handleChange}
                      className="h-12 text-base w-full"
                    />
                    {fieldError(
                      errors,
                      "employeeEmploymentDetailsDTO.dateOfConfirmation"
                    )}
                  </div>

                  {/* Notice Period */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Notice Period
                      <TooltipHint hint="Number of days/months required for resignation after confirmation." />
                    </Label>

                    <Select
                      value={
                        formData.employeeEmploymentDetailsDTO
                          ?.noticePeriodDuration || ""
                      }
                      onValueChange={(v) => {
                        setIsDirty(true);
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.noticePeriodDuration",
                            value: v,
                          },
                        } as any);
                      }}
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
                      checked={
                        formData.employeeEmploymentDetailsDTO
                          ?.probationApplicable || false
                      }
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.probationApplicable",
                            value: v === true,
                          },
                        } as any)
                      }
                    />
                    <Label className="text-sm font-semibold text-gray-700">
                      Probation Applicable
                      <TooltipHint hint="Check if the employee is currently on probation period." />
                    </Label>
                  </div>

                  {/* Probation Duration */}
                  {formData.employeeEmploymentDetailsDTO
                    ?.probationApplicable && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Probation Duration
                          <TooltipHint hint="Length of probation period (e.g., 3 months, 6 months)." />
                        </Label>

                        <Select
                          value={
                            formData.employeeEmploymentDetailsDTO
                              ?.probationDuration || ""
                          }
                          onValueChange={(v) => {
                            setIsDirty(true);
                            handleChange({
                              target: {
                                name: "employeeEmploymentDetailsDTO.probationDuration",
                                value: v,
                              },
                            } as any);
                          }}
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
                  {formData.employeeEmploymentDetailsDTO
                    ?.probationApplicable && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Probation Notice Period
                          <TooltipHint hint="Notice period required during probation (usually shorter)." />
                        </Label>

                        <Select
                          value={
                            formData.employeeEmploymentDetailsDTO
                              ?.probationNoticePeriod || ""
                          }
                          onValueChange={(v) => {
                            setIsDirty(true);
                            handleChange({
                              target: {
                                name: "employeeEmploymentDetailsDTO.probationNoticePeriod",
                                value: v,
                              },
                            } as any);
                          }}
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
                      checked={
                        formData.employeeEmploymentDetailsDTO?.bondApplicable ||
                        false
                      }
                      onCheckedChange={(v) =>
                        handleChange({
                          target: {
                            name: "employeeEmploymentDetailsDTO.bondApplicable",
                            value: v === true,
                          },
                        } as any)
                      }
                    />
                    <Label className="text-sm font-semibold text-gray-700">
                      Bond Applicable
                      <TooltipHint hint="Check if employee signed a service bond (e.g., training bond)." />
                    </Label>
                  </div>

                  {/* Bond Duration */}
                  {formData.employeeEmploymentDetailsDTO?.bondApplicable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Bond Duration
                        <TooltipHint hint="Duration employee must serve after training or bond period." />
                      </Label>

                      <Select
                        value={
                          formData.employeeEmploymentDetailsDTO?.bondDuration ||
                          ""
                        }
                        onValueChange={(v) => {
                          setIsDirty(true);
                          handleChange({
                            target: {
                              name: "employeeEmploymentDetailsDTO.bondDuration",
                              value: v,
                            },
                          } as any);
                        }}
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
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">
                      Allowances
                      <TooltipHint hint="Common allowances: HRA (House Rent), Travel, Medical, Special Allowance, Conveyance, LTA" />
                    </Label>

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
                              value={a.allowanceType ?? ""}
                              maxLength={30}
                              className="h-12 text-base"
                              onChange={(e) => {
                                const val = e.target.value;

                                // 1️⃣ clone allowances safely
                                const updated = [
                                  ...(formData.employeeSalaryDTO?.allowances ||
                                    []),
                                ];

                                updated[i] = {
                                  ...updated[i],
                                  allowanceType: val,
                                };

                                // 2️⃣ FULL validation path (CRITICAL)
                                const fieldKey = `employeeSalaryDTO.allowances.${i}.allowanceType`;

                                // 3️⃣ validate
                                const error = validateField(
                                  fieldKey,
                                  val,
                                  formData
                                );

                                // 4️⃣ update errors correctly
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  error
                                    ? (next[fieldKey] = error)
                                    : delete next[fieldKey];
                                  return next;
                                });

                                // 5️⃣ update formData
                                setFormData((prev) =>
                                  prev
                                    ? {
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
                                    }
                                    : prev
                                );
                              }}
                            />

                            {/* ✅ correct error display */}
                            {fieldError(
                              errors,
                              `employeeSalaryDTO.allowances.${i}.allowanceType`
                            )}
                          </div>

                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={a.amount ?? ""}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [
                                ...(formData.employeeSalaryDTO?.allowances ||
                                  []),
                              ];
                              // updated[i].amount = parseFloat(e.target.value) || 0;
                              updated[i].amount =
                                e.target.value === ""
                                  ? null
                                  : parseFloat(e.target.value) || null;

                              setFormData((prev) =>
                                prev
                                  ? {
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
                                  }
                                  : prev
                              );
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
                              disabled={isSubmitting}
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
                          setIsDirty(true); // ← ADD THIS
                          const newAllowance: AllowanceDTO = {
                            allowanceId: "",
                            allowanceType: "",
                            amount: null,
                          };

                          setFormData((prev) =>
                            prev
                              ? {
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
                                  allowances: [
                                    ...(prev.employeeSalaryDTO?.allowances ||
                                      []),
                                    newAllowance,
                                  ],
                                },
                              }
                              : prev
                          );
                        }}
                      >
                        <Plus className="h-5 w-5 mr-2" /> Add Allowance
                      </Button>
                    </div>
                  </div>

                  {/* ================= DEDUCTIONS ================= */}
                  <div>
                    <Label className="text-lg font-bold text-gray-800 mb-4 block">
                      Deductions
                      <TooltipHint hint="Add mandatory or voluntary deductions from salary, like PF, Professional Tax, TDS, etc." />
                    </Label>

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
                              value={d.deductionType ?? ""}
                              maxLength={30}
                              className="h-12 text-base"
                              onChange={(e) => {
                                const val = e.target.value;

                                // 1️⃣ build updated deductions
                                const updated = [
                                  ...(formData.employeeSalaryDTO?.deductions ||
                                    []),
                                ];
                                updated[i] = {
                                  ...updated[i],
                                  deductionType: val,
                                };

                                // 2️⃣ FULL validation key (critical)
                                const fieldKey = `employeeSalaryDTO.deductions.${i}.deductionType`;

                                // 3️⃣ validate
                                const error = validateField(
                                  fieldKey,
                                  val,
                                  formData
                                );

                                // 4️⃣ update errors correctly
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  error
                                    ? (next[fieldKey] = error)
                                    : delete next[fieldKey];
                                  return next;
                                });

                                // 5️⃣ update formData
                                setFormData((prev) =>
                                  prev
                                    ? {
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
                                        deductions: updated,
                                      },
                                    }
                                    : prev
                                );
                              }}
                            />

                            {fieldError(
                              errors,
                              `employeeSalaryDTO.deductions.${i}.deductionType`
                            )}
                          </div>
                          {/* Amount */}
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={d.amount ?? ""}
                            className="h-12 text-base"
                            onChange={(e) => {
                              const updated = [
                                ...(formData.employeeSalaryDTO?.deductions ||
                                  []),
                              ];
                              // updated[i].amount = parseFloat(e.target.value) || 0;
                              updated[i].amount =
                                e.target.value === ""
                                  ? null
                                  : parseFloat(e.target.value) || null;

                              setFormData((prev) =>
                                prev
                                  ? {
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
                                      deductions: updated,
                                    },
                                  }
                                  : prev
                              );
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
                              disabled={isSubmitting}
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
                          setIsDirty(true); // ← ADD THIS
                          const newDeduction: DeductionDTO = {
                            deductionId: "",
                            deductionType: "",
                            amount: null,
                          };

                          setFormData((prev) =>
                            prev
                              ? {
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
                                  deductions: [
                                    ...(prev.employeeSalaryDTO?.deductions ||
                                      []),
                                    newDeduction,
                                  ],
                                },
                              }
                              : prev
                          );
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
            <Card className="shadow-xl border-0" data-bank-section>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-rose-900">
                  <FileText className="w-7 h-7 text-rose-800" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        const onlyDigits = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        e.target.value = onlyDigits;
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur(
                        "ACCOUNT_NUMBER",
                        "account_number",
                        "accountNumber"
                      )}
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
                      value={localIfsc || formData?.ifscCode || ""}
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
                      onChange={handleValidatedChange}
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
                            Document Type
                            <TooltipHint hint="Common documents: Aadhar Card, PAN Card, Passport, Offer Letter, Resume, Educational Certificates, Bank Statement" />
                          </Label>

                          <Select
                            value={doc.docType ?? ""}
                            onValueChange={(v) => {
                              setIsDirty(true);
                              handleDocumentFileChange(
                                i,
                                "docType",
                                v as DocumentType
                              );
                            }}
                          >
                            <SelectTrigger className="w-full min-w-[200px] !h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>

                            <SelectContent>
                              {DOCUMENT_TYPE_OPTIONS.filter((t) => {
                                // allow current docType for this row
                                if (t === doc.docType) return true;

                                // block already-selected docTypes from other rows
                                return !formData.documents.some(
                                  (d, idx) => idx !== i && d.docType === t
                                );
                              }).map((t) => (
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
                            <TooltipHint hint="Supported formats: PDF, JPG, PNG. Max size 5MB recommended." />
                          </Label>

                          <FileInput
                            id={`doc-upload-${i}`}
                            currentFile={doc.file ?? null}
                            existingUrl={doc.fileUrl ?? undefined}
                            onChange={(file) => {
                              setFormData((prev) =>
                                prev
                                  ? {
                                    ...prev,
                                    documents: prev.documents.map((d, idx) =>
                                      idx === i ? { ...d, file } : d
                                    ),
                                  }
                                  : prev
                              );
                              setIsDirty(true); // ← this was missing
                            }}
                            onClear={() => {
                              setFormData((prev) =>
                                prev
                                  ? {
                                    ...prev,
                                    documents: prev.documents.map((d, idx) =>
                                      idx === i ? { ...d, file: null } : d
                                    ),
                                  }
                                  : prev
                              );
                              setIsDirty(true); // ← also useful
                            }}
                          />
                        </div>

                        {/* Remove Button */}
                        <div className="flex items-end">
                          <Button
                            type="button"
                            disabled={isSubmitting}
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
                      disabled={!canAddDocument}
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
                            <TooltipHint hint="Common types: Laptop, Desktop, Monitor, Keyboard, Mouse, Headset, Docking Station" />
                          </Label>
                          <Input
                            value={eq.equipmentType || ""}
                            onChange={(e) => {
                              const val = e.target.value;

                              // FIXED: update correct field (was wrongly "serialNumber")
                              handleEquipmentChange(i, "equipmentType", val);

                              const error = validateField(
                                "equipmentType",
                                val,
                                formData
                              );

                              setErrors((prev) => {
                                const next = { ...prev };
                                error
                                  ? (next[
                                    `employeeEquipmentDTO[${i}].equipmentType`
                                  ] = error)
                                  : delete next[
                                  `employeeEquipmentDTO[${i}].equipmentType`
                                  ];
                                return next;
                              });
                            }}
                            placeholder="Enter Type"
                            className="h-12 text-base"
                          />
                          {fieldError(
                            errors,
                            `employeeEquipmentDTO[${i}].equipmentType`
                          )}
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Serial Number
                            <TooltipHint hint="Unique serial number printed on the device. Usually on the back or bottom." />
                          </Label>
                          <Input
                            value={eq.serialNumber || ""}
                            onChange={(e) =>
                              handleEquipmentChange(
                                i,
                                "serialNumber",
                                e.target.value
                              )
                            }
                            placeholder="Enter Serial Number"
                            maxLength={30}
                            className="h-12 text-base"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val.length >= 3) {
                                checkUniqueness(
                                  "SERIAL_NUMBER",
                                  val,
                                  `employeeEquipmentDTO[${i}].serialNumber`,
                                  "serial_number",
                                  eq.equipmentId || undefined
                                );
                              }
                            }}
                          />
                          {fieldError(
                            errors,
                            `employeeEquipmentDTO[${i}].serialNumber`
                          )}
                        </div>

                        {/* Issued Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Issued Date
                            <TooltipHint hint="Date when equipment was handed over to employee" />
                          </Label>
                          <Input
                            type="date"
                            value={eq.issuedDate || ""}
                            onChange={(e) =>
                              handleEquipmentChange(
                                i,
                                "issuedDate",
                                e.target.value
                              )
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
                          disabled={isSubmitting}
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
                    <Label className="text-sm font-semibold text-gray-700">
                      Skills & Certification
                      <TooltipHint hint="List technical and soft skills, certifications. Example: React, AWS Certified Solutions Architect, Agile Scrum Master" />
                    </Label>
                    <textarea
                      name="skillsAndCertification"
                      value={formData.skillsAndCertification ?? ""}
                      onChange={handleChange}
                      placeholder="e.g., React, Node.js, AWS Certified"
                      className="w-full min-h-32 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* BACKGROUND CHECK STATUS */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Background Check Status
                      <TooltipHint hint="Status of verification: Cleared, Pending, Failed, Not Initiated" />
                    </Label>
                    <input
                      name="employeeAdditionalDetailsDTO.backgroundCheckStatus"
                      value={
                        formData.employeeAdditionalDetailsDTO
                          ?.backgroundCheckStatus || ""
                      }
                      maxLength={30}
                      placeholder="e.g., Cleared, Pending"
                      onChange={handleValidatedChange}
                      className="w-full h-12 px-4 py-3 border rounded-xl"
                    />
                    {fieldError(
                      errors,
                      "employeeAdditionalDetailsDTO.backgroundCheckStatus"
                    )}
                  </div>

                  {/* A REMARKS */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <Label className="text-sm font-semibold text-gray-700">
                      Remarks
                      <TooltipHint hint="Any special notes about the employee: performance, behavior, relocation, etc." />
                    </Label>
                    <textarea
                      id="additionalRemarks"
                      name="employeeAdditionalDetailsDTO.remarks"
                      value={
                        formData.employeeAdditionalDetailsDTO?.remarks || ""
                      }
                      onChange={handleChange}
                      placeholder="Any additional notes..."
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
                    <Label className="text-sm font-semibold text-gray-700">
                      Policy Number
                      <TooltipHint hint="Unique policy ID from insurance provider. Must be unique across employees." />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.policyNumber"
                      value={
                        formData.employeeInsuranceDetailsDTO?.policyNumber || ""
                      }
                      onChange={handleValidatedChange}
                      onBlur={handleUniqueBlur(
                        "POLICY_NUMBER",
                        "policy_number",
                        "employeeInsuranceDetailsDTO.policyNumber",
                        employeeData?.employeeInsuranceDetailsDTO?.insuranceId
                      )}
                      placeholder="e.g., POL123456"
                      className="h-12 text-base"
                    />

                    {fieldError(
                      errors,
                      "employeeInsuranceDetailsDTO.policyNumber"
                    )}
                  </div>

                  {/* Provider Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Provider Name
                      <TooltipHint hint="Insurance company name. Example: LIC, Star Health, HDFC Life" />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.providerName"
                      value={
                        formData.employeeInsuranceDetailsDTO?.providerName || ""
                      }
                      onChange={handleValidatedChange}
                      placeholder="e.g., Star Health"
                      className="h-12 text-base"
                    />

                    {fieldError(
                      errors,
                      "employeeInsuranceDetailsDTO.providerName"
                    )}
                  </div>

                  {/* Coverage Start */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Coverage Start
                      <TooltipHint hint="Date when insurance coverage begins" />
                    </Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageStart"
                      value={
                        formData.employeeInsuranceDetailsDTO?.coverageStart ||
                        ""
                      }
                      max={today}
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                  </div>

                  {/* Coverage End */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Coverage End
                      <TooltipHint hint="Date when policy expires. Leave blank for lifelong policies." />
                    </Label>
                    <Input
                      type="date"
                      name="employeeInsuranceDetailsDTO.coverageEnd"
                      value={
                        formData.employeeInsuranceDetailsDTO?.coverageEnd || ""
                      }
                      onChange={handleChange}
                      className="h-12 text-base border-gray-300 focus:ring-amber-500"
                    />
                  </div>

                  {/* Nominee Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Nominee Name
                      <TooltipHint hint="Person who will receive insurance benefit in case of claim" />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeName"
                      value={
                        formData.employeeInsuranceDetailsDTO?.nomineeName || ""
                      }
                      onChange={handleValidatedChange}
                      placeholder="e.g., Priya Sharma"
                    />

                    {fieldError(
                      errors,
                      "employeeInsuranceDetailsDTO.nomineeName"
                    )}
                  </div>

                  {/* Nominee Relation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Nominee Relation
                      <TooltipHint hint="Relationship to employee: Spouse, Parent, Child, Sibling, etc." />
                    </Label>
                    <Input
                      name="employeeInsuranceDetailsDTO.nomineeRelation"
                      value={
                        formData.employeeInsuranceDetailsDTO?.nomineeRelation ||
                        ""
                      }
                      onChange={handleValidatedChange}
                      placeholder="e.g., Spouse"
                    />

                    {fieldError(
                      errors,
                      "employeeInsuranceDetailsDTO.nomineeRelation"
                    )}
                  </div>

                  {/* Nominee Contact */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Nominee Contact
                      <TooltipHint hint="10-digit mobile number of nominee" />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeInsuranceDetailsDTO.nomineeContact"
                        value={
                          formData.employeeInsuranceDetailsDTO
                            ?.nomineeContact || ""
                        }
                        maxLength={10}
                        type="tel"
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        placeholder="e.g., 9876543210"
                      />

                      {fieldError(
                        errors,
                        "employeeInsuranceDetailsDTO.nomineeContact"
                      )}
                    </div>
                  </div>

                  {/* Group Insurance */}
                  <div className="flex items-center gap-3 h-12 sm:col-span-2 lg:col-span-3 xl:col-span-4 mt-4">
                    <Checkbox
                      id="groupInsurance"
                      // checked={formData.employeeInsuranceDetailsDTO?.groupInsurance || false}
                      checked={
                        formData.employeeInsuranceDetailsDTO?.groupInsurance ===
                          null
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
                    <Label
                      htmlFor="groupInsurance"
                      className="text-base font-medium cursor-pointer"
                    >
                      Group Insurance
                      <TooltipHint hint="Check if employee is covered under company group insurance plan" />
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
                    <Label className="text-sm font-semibold text-gray-700">
                      Passport Number
                      <TooltipHint hint="Indian passport number. Format: One letter + 7 digits (e.g., A1234567). Must be unique." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.passportNumber"
                        value={
                          formData.employeeStatutoryDetailsDTO
                            ?.passportNumber || ""
                        }
                        onChange={handleValidatedChange}
                        onBlur={handleUniqueBlur(
                          "PASSPORT_NUMBER",
                          "passport_number",
                          "employeeStatutoryDetailsDTO.passportNumber",
                          employeeData?.employeeStatutoryDetailsDTO?.statutoryId
                        )}
                        placeholder="e.g., A1234567"
                        className="h-12 text-base"
                      />
                    </div>
                    {fieldError(
                      errors,
                      "employeeStatutoryDetailsDTO.passportNumber"
                    )}
                  </div>

                  {/* PF UAN Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      PF UAN Number
                      <TooltipHint hint="12-digit Universal Account Number for Provident Fund. Must be unique across all employees." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.pfUanNumber"
                        inputMode="numeric"
                        maxLength={12}
                        value={
                          formData.employeeStatutoryDetailsDTO?.pfUanNumber ||
                          ""
                        }
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "PF_UAN_NUMBER",
                          "pf_uan_number",
                          "employeeStatutoryDetailsDTO.pfUanNumber",
                          employeeData?.employeeStatutoryDetailsDTO?.statutoryId
                        )}
                        placeholder="e.g., 123456789012"
                        className="h-12 text-base"
                      />
                    </div>
                    {fieldError(
                      errors,
                      "employeeStatutoryDetailsDTO.pfUanNumber"
                    )}
                  </div>

                  {/* Tax Regime */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      Tax Regime
                      <TooltipHint hint="Income tax regime employee has opted for. Common options: Old Regime, New Regime" />
                    </Label>
                    <Input
                      name="employeeStatutoryDetailsDTO.taxRegime"
                      type="text"
                      value={
                        formData.employeeStatutoryDetailsDTO?.taxRegime || ""
                      }
                      onChange={handleChange}
                      placeholder="e.g., Old Regime / New Regime"
                      className="h-12 text-base border border-gray-300 rounded-xl focus:ring-indigo-500"
                    />
                    {fieldError(
                      errors,
                      "employeeStatutoryDetailsDTO.taxRegime"
                    )}
                  </div>

                  {/* ESI Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      ESI Number
                      <TooltipHint hint="Employee State Insurance Number (usually 10–17 digits). Optional." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.esiNumber"
                        inputMode="numeric"
                        autoComplete="off" // ← this is the key line
                        value={
                          formData.employeeStatutoryDetailsDTO?.esiNumber || ""
                        }
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "ESI_NUMBER",
                          "esi_number",
                          "employeeStatutoryDetailsDTO.esiNumber",
                          employeeData?.employeeStatutoryDetailsDTO?.statutoryId
                        )}
                        placeholder="e.g., 1234567890"
                        className="h-12 text-base"
                      />
                    </div>
                    {fieldError(
                      errors,
                      "employeeStatutoryDetailsDTO.esiNumber"
                    )}
                  </div>

                  {/* SSN Number */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      SSN Number
                      <TooltipHint hint="Social Security Number (for international employees, e.g., US format: 123456789). Optional." />
                    </Label>
                    <div className="relative">
                      <Input
                        name="employeeStatutoryDetailsDTO.ssnNumber"
                        inputMode="numeric"
                        value={
                          formData.employeeStatutoryDetailsDTO?.ssnNumber || ""
                        }
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          e.target.value = onlyDigits;
                          handleValidatedChange(e);
                        }}
                        onBlur={handleUniqueBlur(
                          "SSN_NUMBER",
                          "ssn_number",
                          "employeeStatutoryDetailsDTO.ssnNumber",
                          employeeData?.employeeStatutoryDetailsDTO?.statutoryId
                        )}
                        placeholder="e.g., 123456789"
                        className="h-12 text-base"
                      />
                    </div>
                    {fieldError(
                      errors,
                      "employeeStatutoryDetailsDTO.ssnNumber"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin-dashboard/employees/list"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Link>

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
                    Updating...
                  </>
                ) : (
                  'Update Employee'
                )}
              </Button>

            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};
export default EditEmployeePage;
