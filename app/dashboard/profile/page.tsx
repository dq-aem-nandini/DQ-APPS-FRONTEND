"use client";

import { useState, useEffect, useCallback } from "react";
import { employeeService } from "@/lib/api/employeeService";
import { EmployeeDTO, AddressModel, BankMaster } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import {
  Phone,
  MapPin,
  DollarSign,
  FileText,
  User,
  Edit3,
  Save,
  X,
  Briefcase,
  Shield,
  Building,
  Upload,
  Trash2,
  Download,
  Eye,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import { DocumentType, EmployeeDocumentDTO } from "@/lib/api/types";
import { UniqueField, validationService } from "@/lib/api/validationService";
export const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  "OFFER_LETTER",
  "CONTRACT",
  "TAX_DECLARATION_FORM",
  "WORK_PERMIT",
  "PAN_CARD",
  "AADHAAR_CARD",
  "BANK_PASSBOOK",
  "TENTH_CERTIFICATE",
  "TWELFTH_CERTIFICATE",
  "DEGREE_CERTIFICATE",
  "POST_GRADUATION_CERTIFICATE",
  "OTHER",
] as const;
// Safe value
const safe = (val: any) =>
  val === null || val === undefined ? "—" : String(val);

// Format date
const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "—";

// Validate address
const isValidAddress = (addr: AddressModel): boolean =>
  !!addr.houseNo &&
  !!addr.streetName &&
  !!addr.city &&
  !!addr.state &&
  !!addr.country &&
  !!addr.pincode &&
  !!addr.addressType;

// Deduplicate addresses
const deduplicateAddresses = (addresses: AddressModel[]): AddressModel[] => {
  const map = new Map<string, AddressModel>();
  addresses.forEach((addr) => {
    const key = `${addr.houseNo}-${addr.streetName}-${addr.city}-${addr.state}-${addr.country}-${addr.pincode}-${addr.addressType}`;
    const withId = { ...addr, addressId: addr.addressId || uuidv4() };
    if (!map.has(key)) map.set(key, withId);
  });
  return Array.from(map.values()).filter(isValidAddress);
};

const ProfilePage = () => {
  const {
    state: { user },
  } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeDTO | null>(null);
  const [formData, setFormData] = useState<EmployeeDTO | null>(null);
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingAddresses, setDeletingAddresses] = useState<Set<string>>(
    new Set()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  // Bank search
  const [bankSearch, setBankSearch] = useState("");
  const [bankOptions, setBankOptions] = useState<BankMaster[]>([]);
  const [bankSearchTimeout, setBankSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [documents, setDocuments] = useState<FormDocument[]>([]);
  // IFSC local state (prevents focus loss)
  const [localIfsc, setLocalIfsc] = useState<string>("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
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
      if (!res?.employeeId) throw new Error("Invalid profile");

      const clean: EmployeeDTO = {
        ...res,
        gender: res.gender
          ? res.gender.charAt(0).toUpperCase() +
          res.gender.slice(1).toLowerCase()
          : "",
        maritalStatus: res.maritalStatus
          ? res.maritalStatus.charAt(0).toUpperCase() +
          res.maritalStatus.slice(1).toLowerCase()
          : "",
        addresses: (res.addresses || []).map((a) => ({
          ...a,
          addressId: a.addressId || uuidv4(),
        })),
        documents: res.documents || [],
        employeeSalaryDTO: res.employeeSalaryDTO || undefined,
        employeeInsuranceDetailsDTO:
          res.employeeInsuranceDetailsDTO || undefined,
        employeeEquipmentDTO: res.employeeEquipmentDTO || [],
        employeeStatutoryDetailsDTO:
          res.employeeStatutoryDetailsDTO || undefined,
        employeeEmploymentDetailsDTO:
          res.employeeEmploymentDetailsDTO || undefined,
        employeeAdditionalDetailsDTO:
          res.employeeAdditionalDetailsDTO || undefined,
      };

      setProfile(clean);
      setFormData(clean);
      setAddresses(clean.addresses || []);
      setLocalIfsc(clean.ifscCode || ""); // Sync local IFSC
      setDocuments(
        (clean.documents || []).map((d) => ({
          ...d,
          fileObj: null,
          tempId: uuidv4(),
        }))
      );
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user, router]);
  const addDocument = () => {
    setDocuments((prev) => [
      ...prev,
      {
        documentId: "",
        docType: "OTHER" as DocumentType,
        file: "",
        fileObj: null,
        tempId: uuidv4(),
      } as FormDocument,
    ]);
  };
  const updateDocument = (
    index: number,
    field: "docType" | "fileObj",
    value: any
  ) => {
    setDocuments((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };
  // Handle IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    if (isLookingUp || !formData) return;
    setIsLookingUp(true);
    console.log("Looking up IFSC:", ifsc); // DEBUG LOG

    try {
      const res = await employeeService.getIFSCDetails(ifsc);
      console.log("API Response:", res); // SEE EXACT RESPONSE

      if (res.flag && res.response) {
        const data = res.response;

        const bankName = data.BANK;
        const branchName = data.BRANCH;

        console.log("Auto-filling → Bank:", bankName, "| Branch:", branchName);

        setFormData((prev) =>
          prev
            ? {
              ...prev,
              bankName: bankName,
              branchName: branchName,
            }
            : null
        );

        setSuccess("Bank details auto-filled!");
        setBankSearch("");
        setBankOptions([]);
      }
    } catch (err: any) {
      console.log("IFSC lookup failed:", err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const checkUniqueness = async (
    field: UniqueField,
    value: string,
    errorKey: string,
    fieldColumn: string, // ← REQUIRED: exact DB column name
    excludeId?: string // ← Optional: statutoryId, insuranceId, equipmentId, etc.
  ) => {
    const val = value.trim();
    if (!val || val.length < 3 || checking.has(errorKey)) return;

    setChecking((prev) => new Set(prev).add(errorKey));

    try {
      const result = await validationService.validateField({
        field,
        value: val,
        mode: excludeId ? "edit" : "create", // If we have an ID → edit mode
        excludeId, // Send the correct ID (employeeId, statutoryId, etc.)
        fieldColumn, // ← This is CRITICAL — tells backend which column we're editing
      });

      setErrors((prev) => {
        const newErrors = { ...prev };
        if (result.exists) {
          newErrors[errorKey] =
            result.message || "This value already exists in the system";
        } else {
          delete newErrors[errorKey];
        }
        return newErrors;
      });
    } catch (err: any) {
      console.warn("Uniqueness check failed:", err);
      // Optional: show temporary message
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "Validation unavailable. Try again.",
      }));
    } finally {
      setChecking((prev) => {
        const next = new Set(prev);
        next.delete(errorKey);
        return next;
      });
    }
  };
  // REAL-TIME VALIDATION
  const validateField = (name: string, value: any) => {
    const val = String(value ?? "").trim();
    const newErrors = { ...errors };

    // Clear previous error
    delete newErrors[name];

    // === REGEX PATTERNS ===
    const patterns = {
      onlyLetters: /^[A-Za-z\s]+$/,
      email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
      mobile: /^[6-9]\d{9}$/,
      pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      aadhaar: /^\d{12}$/,
      ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    };

    // === REQUIRED FIELDS ===
    const requiredFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "nationality",
    ];

    if (requiredFields.includes(name) && !val) {
      newErrors[name] = "This field is required";
      return setErrors(newErrors);
    }

    // === FIELD-WISE VALIDATIONS ===

    switch (name) {
      case "firstName":
      case "lastName":
        if (val && !patterns.onlyLetters.test(val))
          newErrors[name] = "Only letters and spaces allowed";
        else if (val.length > 30)
          newErrors[name] = "Maximum 30 characters allowed";
        break;

      case "personalEmail":
        if (val && !patterns.email.test(val))
          newErrors[name] = "Invalid email format";
        break;

      case "contactNumber":
      case "alternateContactNumber":
      case "emergencyContactNumber":
        if (val && !patterns.mobile.test(val))
          newErrors[name] = "Enter valid 10-digit Indian mobile number";
        break;

      case "panNumber":
        if (val && !patterns.pan.test(val))
          newErrors[name] = "Invalid PAN format (Example: ABCDE1234F)";
        break;

      case "aadharNumber":
        if (val && !patterns.aadhaar.test(val))
          newErrors[name] = "Aadhaar must be exactly 12 digits";
        break;

      case "accountNumber":
        if (!val) {
          newErrors[name] = "Account number is required";
        } else if (val.length < 9) {
          newErrors[name] = "Account number must be at least 9 digits";
        } else if (val.length > 18) {
          newErrors[name] = "Account number cannot exceed 18 digits";
        }
        break;

      case "ifscCode":
        if (val && !patterns.ifsc.test(val))
          newErrors[name] = "Invalid IFSC format (Example: SBIN0000123)";
        break;

      case "numberOfChildren":
        const num = Number(val);
        if (isNaN(num) || num < 0)
          newErrors[name] = "Must be a non-negative number";
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !profile) return;
    // Check uniqueness errors
    if (Object.keys(errors).length > 0) {
      setError("Please resolve the highlighted errors before submitting.");
      return;
    }
    // Only validate 5 required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "nationality",
    ];
    for (const field of requiredFields) {
      if (!formData[field as keyof EmployeeDTO]) {
        setError(
          `Please fill ${field === "firstName"
            ? "First Name"
            : field === "lastName"
              ? "Last Name"
              : field === "dateOfBirth"
                ? "Date of Birth"
                : field.charAt(0).toUpperCase() +
                field
                  .slice(1)
                  .replace(/([A-Z])/g, " $1")
                  .toLowerCase()
          }`
        );
        return;
      }
    }

    setUpdating(true);
    setError(null);
    try {
      const payload = new FormData();

      // Helper to append only if value actually changed
      const appendIfChanged = (key: string, newVal: any, oldVal: any) => {
        const normalizedNew = String(newVal ?? "").trim();
        const normalizedOld = String(oldVal ?? "").trim();
        // Only append if different AND new value is not empty (except for required fields we allow same value)
        if (normalizedNew !== normalizedOld) {
          payload.append(key, normalizedNew);
        }
      };
      // Profile Photo - always send if selected (it's a file upload)
      if (profilePhotoFile) {
        payload.append("employeePhotoUrl", profilePhotoFile);
      }
      // === Only send changed fields ===
      // Required fields - send only if changed
      appendIfChanged("firstName", formData.firstName, profile.firstName);
      appendIfChanged("lastName", formData.lastName, profile.lastName);
      appendIfChanged("dateOfBirth", formData.dateOfBirth, profile.dateOfBirth);
      appendIfChanged("gender", formData.gender, profile.gender);           // ← Fixed
      appendIfChanged("maritalStatus", formData.maritalStatus, profile.maritalStatus); // ← Fixed
      appendIfChanged("nationality", formData.nationality, profile.nationality);

      // Optional personal fields
      appendIfChanged("personalEmail", formData.personalEmail, profile.personalEmail);
      appendIfChanged("contactNumber", formData.contactNumber, profile.contactNumber);
      appendIfChanged("alternateContactNumber", formData.alternateContactNumber, profile.alternateContactNumber);
      appendIfChanged("emergencyContactName", formData.emergencyContactName, profile.emergencyContactName);
      appendIfChanged("emergencyContactNumber", formData.emergencyContactNumber, profile.emergencyContactNumber);
      appendIfChanged("numberOfChildren", formData.numberOfChildren, profile.numberOfChildren);

      // Identity & Bank Details
      appendIfChanged("panNumber", formData.panNumber, profile.panNumber);
      appendIfChanged("aadharNumber", formData.aadharNumber, profile.aadharNumber);
      appendIfChanged("accountNumber", formData.accountNumber, profile.accountNumber);
      appendIfChanged("accountHolderName", formData.accountHolderName, profile.accountHolderName);
      appendIfChanged("bankName", formData.bankName, profile.bankName);
      appendIfChanged("branchName", formData.branchName, profile.branchName);

      // IFSC Code - uses localIfsc state
      if (localIfsc.trim() !== (profile.ifscCode || "").trim()) {
        payload.append("ifscCode", localIfsc.trim());
      }

      // === Addresses ===
      // Always send full list (backend handles upsert based on addressId)
      addresses.forEach((addr, i) => {
        if (addr.addressId && !addr.addressId.startsWith("temp-")) {
          payload.append(`addresses[${i}].addressId`, addr.addressId);
        }
        payload.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        payload.append(`addresses[${i}].streetName`, addr.streetName || "");
        payload.append(`addresses[${i}].city`, addr.city || "");
        payload.append(`addresses[${i}].state`, addr.state || "");
        payload.append(`addresses[${i}].country`, addr.country || "");
        payload.append(`addresses[${i}].pincode`, addr.pincode || "");
        payload.append(`addresses[${i}].addressType`, addr.addressType || "");
      });

      // === Documents - only new file uploads ===
      documents
        .filter((d) => d.fileObj instanceof File)
        .forEach((doc, i) => {
          if (doc.documentId) {
            payload.append(`documents[${i}].documentId`, doc.documentId);
          }
          payload.append(`documents[${i}].docType`, doc.docType);
          payload.append(`documents[${i}].file`, doc.fileObj!);
        });

      // If no changes at all (except possibly photo/documents), prevent submission
      if (payload.entries().next().done && !profilePhotoFile && documents.every(d => !(d.fileObj instanceof File))) {
        Swal.fire({
          icon: "info",
          title: "No Changes",
          text: "You haven't made any changes to submit.",
          confirmButtonColor: "#4F46E5",
        });
        return;
      }

      const res = await employeeService.submitUpdateRequest(payload);
      if (!res.flag) throw new Error(res.message || "Update failed");

      setProfilePhotoFile(null);

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your update request has been sent to admin for approval.",
        confirmButtonColor: "#4F46E5",
      });

      await fetchProfile();
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit update request");
    } finally {
      setUpdating(false);
    }
  };
  // Inside your onChange function — replace the existing onChange with this enhanced version

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value: rawValue } = e.target;
    let normalizedValue = rawValue;

    // === Special field transformations ===
    if (name === "personalEmail") {
      // Force lowercase for email
      normalizedValue = rawValue.toLowerCase();
    }

    if (name === "panNumber") {
      // Force uppercase for PAN
      normalizedValue = rawValue.toUpperCase();
      // Optional: Allow only alphanumeric (PAN format)
      normalizedValue = normalizedValue.replace(/[^A-Z0-9]/g, "");
    }

    // Prevent leading spaces for most fields
    if (!["personalEmail", "panNumber"].includes(name)) {
      normalizedValue = rawValue.trimStart();
    }

    // Numeric-only fields (keep existing logic)
    if (
      [
        "accountNumber",
        "aadharNumber",
        "contactNumber",
        "alternateContactNumber",
        "emergencyContactNumber",
      ].includes(name)
    ) {
      normalizedValue = rawValue.replace(/\D/g, ""); // Only digits
    }

    // Normalize gender & maritalStatus
    if (name === "gender" || name === "maritalStatus") {
      normalizedValue =
        rawValue.charAt(0).toUpperCase() + rawValue.slice(1).toLowerCase();
    }

    // Update form data
    setFormData((prev) => (prev ? { ...prev, [name]: normalizedValue } : null));

    // Real-time validation
    validateField(name, normalizedValue);
  };
  const addAddress = () => {
    const newAddr: AddressModel = {
      addressId: `temp-${uuidv4()}`,
      houseNo: "",
      streetName: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      addressType: undefined,
    };
    setAddresses((prev) => [...prev, newAddr]);
  };

  const updateAddress = (
    i: number,
    field: keyof AddressModel,
    value: string
  ) => {
    setAddresses((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
    // Validate address fields (basic required/length)
    const newErrors: Record<string, string> = { ...errors };
    delete newErrors[`addresses[${i}].${field}`];
    if (
      !value.trim() &&
      ["houseNo", "streetName", "city", "state", "country", "pincode"].includes(
        field
      )
    ) {
      newErrors[`addresses[${i}].${field}`] = "This field is required";
    }
    if (field === "pincode" && value && !/^\d{6}$/.test(value)) {
      newErrors[`addresses[${i}].${field}`] = "PIN code must be 6 digits";
    }
    setErrors(newErrors);
  };

  const removeAddress = async (index: number) => {
    const address = addresses[index];
    const addressId = address.addressId;

    if (!addressId || addressId.startsWith("temp-")) {
      setAddresses((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setDeletingAddresses((prev) => new Set(prev).add(addressId));
    try {
      await employeeService.deleteEmployeeAddressGlobal(
        profile!.employeeId,
        addressId
      );
      setAddresses((prev) => prev.filter((_, i) => i !== index));
      setSuccess("Address removed successfully");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingAddresses((prev) => {
        const next = new Set(prev);
        next.delete(addressId);
        return next;
      });
    }
  };
  // ADD THIS FUNCTION — detects if anything actually changed
  const hasAnyChanges = useCallback(() => {
    if (!profile || !formData) return false;

    // Compare basic fields
    const basicFields: (keyof EmployeeDTO)[] = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "nationality",
      "personalEmail",
      "contactNumber",
      "alternateContactNumber",
      "emergencyContactName",
      "emergencyContactNumber",
      "panNumber",
      "aadharNumber",
      "accountNumber",
      "accountHolderName",
      "bankName",
      "ifscCode",
      "branchName",
      "numberOfChildren",
    ];

    for (const field of basicFields) {
      const oldVal = String(profile[field] ?? "").trim();
      const newVal = String(formData[field] ?? "").trim();
      if (oldVal !== newVal) return true;
    }

    // Compare addresses
    const oldAddresses = (profile.addresses || [])
      .map((a) => JSON.stringify(a))
      .sort();
    const newAddresses = addresses.map((a) => JSON.stringify(a)).sort();
    if (JSON.stringify(oldAddresses) !== JSON.stringify(newAddresses))
      return true;

    // Compare documents (new files uploaded)
    if (documents.some((d) => d.fileObj instanceof File)) return true;

    return false;
  }, [profile, formData, addresses, documents]);
  // Keep hasChanges updated in real-time
  useEffect(() => {
    setHasChanges(hasAnyChanges());
  }, [formData, addresses, documents, hasAnyChanges]);

  // Optional: Show friendly message when no changes
  useEffect(() => {
    if (!editing) {
      setHasChanges(false);
    }
  }, [editing]);

  // Sync localIfsc when profile loads
  useEffect(() => {
    if (profile?.ifscCode) {
      setLocalIfsc(profile.ifscCode);
    }
  }, [profile?.ifscCode]);

  useEffect(() => {
    fetchProfile();
  }, []);
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
          const filtered = res.response.filter(
            (bank) =>
              !formData?.bankName ||
              bank.bankName.toLowerCase() !== formData.bankName.toLowerCase()
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

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  if (error && !profile)
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          <p>{error}</p>
          <button
            onClick={fetchProfile}
            className="mt-3 px-5 py-2 bg-red-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  if (!profile || !formData)
    return (
      <div className="container mx-auto p-6 text-gray-500">No profile data</div>
    );
  // ADD THIS INSIDE YOUR ProfilePage COMPONENT (before the return statement)
  const ShowIfFilled = ({
    label,
    value,
    required = false,
  }: {
    label: string;
    value?: any;
    required?: boolean;
  }) => {
    // Use your existing safe() helper
    const displayValue = safe(value);
    if (
      (displayValue === "—" ||
        displayValue === "" ||
        value === null ||
        value === undefined) &&
      !required
    ) {
      return null;
    }
    return <Info label={label} value={value} required={required} />;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Profile Photo */}

                <div className="relative group">
                  <div
                    className="
      rounded-full overflow-hidden bg-gray-200 border-2 border-white/40
      shadow-sm
      w-20 h-20    /* mobile */
      sm:w-24 sm:h-24   /* tablet */
      lg:w-28 lg:h-28   /* desktop */
      transition-all
    "
                  >
                    {" "}
                    {profilePhotoFile ? (
                      <img
                        src={URL.createObjectURL(profilePhotoFile)}
                        alt="New profile"
                        className="w-full h-full object-cover"
                      />
                    ) : profile.employeePhotoUrl ? (
                      <img
                        src={profile.employeePhotoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-500">
                          {profile.firstName[0]}
                          {profile.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Camera icon — only in edit mode */}
                  {editing && (
                    <>
                      <label
                        htmlFor="profile-photo-upload"
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Camera className="w-12 h-12 text-white" />
                      </label>
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 3 * 1024 * 1024) {
                              setError("Photo must be under 3MB");
                              return;
                            }
                            setProfilePhotoFile(file);
                            setHasChanges(true); // Important: trigger "Submit" button
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-lg opacity-90 mt-1">
                    {profile.designation?.replace("_", " ") || "Employee"}
                  </p>
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition shadow-lg"
                >
                  <Edit3 className="w-5 h-5" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex justify-between items-center">
                <span className="font-medium">{success}</span>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {/* edit mode */}
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-8">
                {/* Personal Information */}
                <Card
                  title="Personal Information"
                  icon={<User className="w-5 h-5" />}
                >
                  <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"

                  >
                    {/* REQUIRED FIELDS */}
                    <div className="space-y-2">
                      <Input
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={onChange}
                        required
                      />
                      {errors.firstName && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={onChange}
                        required
                      />
                      {errors.lastName && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.lastName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={onChange}
                        required
                      />
                      {errors.dateOfBirth && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Gender"
                        name="gender"
                        value={formData.gender || ""}
                        onChange={onChange}
                        options={["Male", "Female", "Other"]}
                        required
                      />
                      {errors.gender && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Select
                        label="Marital Status"
                        name="maritalStatus"
                        value={formData.maritalStatus || ""}
                        onChange={onChange}
                        options={["Single", "Married", "Divorced", "Widowed"]}
                        required
                      />
                      {errors.maritalStatus && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.maritalStatus}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={onChange}
                        required
                      />
                      {errors.nationality && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.nationality}
                        </p>
                      )}
                    </div>

                    {/* UNIQUENESS CHECKED FIELDS */}
                    <div className="space-y-2">
                      {/* Personal Email */}
                      <Input
                        label="Personal Email Address"
                        name="personalEmail"
                        type="email"
                        value={formData.personalEmail || ""}
                        onChange={onChange}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val)
                            checkUniqueness("EMAIL", val, "personalEmail", "personal_email", profile?.employeeId);
                        }}
                      />
                      {errors.personalEmail && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.personalEmail}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Primary Contact Number"
                        name="contactNumber"
                        value={formData.contactNumber || ""}
                        onChange={onChange}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val.length === 10) {
                            checkUniqueness(
                              "CONTACT_NUMBER",
                              val,
                              "contactNumber",
                              "contact_number",
                              profile?.employeeId
                            );
                          }
                        }}
                      />
                      {errors.contactNumber && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.contactNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Input
                        label="Alternate Contact Number"
                        name="alternateContactNumber"
                        value={formData.alternateContactNumber || ""}
                        onChange={onChange}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        placeholder="Another 10-digit number (optional)"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val.length === 10) {
                            checkUniqueness(
                              "CONTACT_NUMBER",
                              val,
                              "alternateContactNumber",
                              "alternate_contact_number",
                              profile?.employeeId
                            );
                          }
                        }}
                      />
                      {errors.alternateContactNumber && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.alternateContactNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Number of Children"
                        name="numberOfChildren"
                        type="number"
                        value={formData.numberOfChildren}
                        onChange={onChange}
                        min="0"
                      />
                      {errors.numberOfChildren && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.numberOfChildren}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Emergency Contact */}
                <Card
                  title="Emergency Contact"
                  icon={<Phone className="w-5 h-5" />}
                >
                  <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    <div className="space-y-2">
                      <Input
                        label="Emergency Contact Name"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={onChange}
                      />
                      {errors.emergencyContactName && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.emergencyContactName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Emergency Contact Number"
                        name="emergencyContactNumber"
                        value={formData.emergencyContactNumber || ""}
                        onChange={onChange}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val.length === 10) {
                            checkUniqueness(
                              "CONTACT_NUMBER",
                              val,
                              "emergencyContactNumber",
                              "emergency_contact_number",
                              profile?.employeeId
                            );
                          }
                        }}
                      />
                      {errors.emergencyContactNumber && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.emergencyContactNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Bank Details */}
                <Card
                  title="Bank Details"
                  icon={<DollarSign className="w-5 h-5" />}
                >
                  <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                  >
                    <div className="space-y-2">
                      <Input
                        label="PAN Number"
                        name="panNumber"
                        value={formData.panNumber || ""}
                        onChange={onChange}
                        pattern="[A-Z0-9]{10}"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val)
                            checkUniqueness(
                              "PAN_NUMBER",
                              val,
                              "panNumber",
                              "pan_number",
                              profile?.employeeId
                            );
                        }}
                      />
                      {errors.panNumber && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.panNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Aadhaar Number"
                        name="aadharNumber"
                        value={formData.aadharNumber || ""}
                        onChange={onChange}
                        pattern="[0-9]{12}"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val)
                            checkUniqueness(
                              "AADHAR_NUMBER",
                              val,
                              "aadharNumber",
                              "aadhar_number",
                              profile?.employeeId
                            );
                        }}
                      />
                      {errors.aadharNumber && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.aadharNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Account Number"
                        name="accountNumber"
                        value={formData.accountNumber || ""}
                        onChange={onChange}
                        pattern="[0-9]{9,18}"
                        maxLength={18}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val)
                            checkUniqueness(
                              "ACCOUNT_NUMBER",
                              val,
                              "accountNumber",
                              "account_number",
                              profile?.bankAccountId
                            );
                        }}
                      />
                      {errors.accountNumber && (
                        <p className="text-red-600 text-sm font-medium ">
                          {errors.accountNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Account Holder Name"
                        name="accountHolderName"
                        value={formData.accountHolderName || ""}
                        onChange={onChange}
                        placeholder="As per bank passbook / statement"
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val)
                            checkUniqueness(
                              "ACCOUNT_HOLDER_NAME",
                              val.toUpperCase(),
                              "accountHolderName",
                              "account_holder_name",
                              profile?.employeeId
                            );
                        }}
                      />
                      {errors.accountHolderName && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.accountHolderName}
                        </p>
                      )}
                    </div>

                    {/* IFSC & Bank Name — unchanged */}
                    <div className="relative space-y-2">
                      <Input
                        label="IFSC Code"
                        value={localIfsc ?? ""}
                        onChange={(e) => {
                          let val = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 11);
                          setLocalIfsc(val);
                          validateField("ifscCode", val);
                          if (val.length === 11) handleIfscLookup(val);
                        }}
                        placeholder="HDFC0000123"
                        maxLength={11}
                      />
                      {(localIfsc?.length ?? 0) === 11 && (
                        <div className="absolute right-3 top-10 text-green-600 text-xs font-medium">
                          Valid
                        </div>
                      )}
                      {errors.ifscCode && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.ifscCode}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Input
                        label="Bank Name"
                        name="bankName"
                        value={formData.bankName || ""}
                        onChange={(e) => {
                          onChange(e);
                          setBankSearch(e.target.value);
                        }}
                        onFocus={() =>
                          formData.bankName && setBankSearch(formData.bankName)
                        }
                        placeholder="Type to search bank..."
                      />
                      {bankSearch && bankOptions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          {bankOptions.map((bank) => (
                            <button
                              key={bank.bankCode}
                              type="button"
                              onClick={() => {
                                setFormData((prev) =>
                                  prev
                                    ? { ...prev, bankName: bank.bankName }
                                    : null
                                );
                                setBankSearch("");
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

                    <div className="space-y-2">
                      <Input
                        label="Branch Name"
                        name="branchName"
                        value={formData.branchName || ""}
                        onChange={onChange}
                      />
                      {errors.branchName && (
                        <p className="text-red-600 text-sm font-medium">
                          {errors.branchName}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Addresses */}
                <Card title="Addresses" icon={<MapPin className="w-5 h-5" />}>
                  {addresses.map((addr, i) => (
                    <div
                      key={addr.addressId}
                      className="border rounded-xl p-5 mb-5 bg-gradient-to-r from-gray-50 to-gray-100"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-700">
                          Address {i + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeAddress(i)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div
                        className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4"
                      >
                        <div>
                          <Input
                            label="House Number"
                            value={addr.houseNo || ""}
                            onChange={(e) =>
                              updateAddress(i, "houseNo", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].houseNo`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].houseNo`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="Street Name"
                            value={addr.streetName || ""}
                            onChange={(e) =>
                              updateAddress(i, "streetName", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].streetName`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].streetName`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="City"
                            value={addr.city || ""}
                            onChange={(e) =>
                              updateAddress(i, "city", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].city`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].city`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="State"
                            value={addr.state || ""}
                            onChange={(e) =>
                              updateAddress(i, "state", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].state`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].state`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="Country"
                            value={addr.country || ""}
                            onChange={(e) =>
                              updateAddress(i, "country", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].country`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].country`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="PIN Code"
                            value={addr.pincode || ""}
                            onChange={(e) =>
                              updateAddress(i, "pincode", e.target.value)
                            }
                          />
                          {errors[`addresses[${i}].pincode`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`addresses[${i}].pincode`]}
                            </p>
                          )}
                        </div>
                        <Select
                          label="Address Type"
                          value={addr.addressType ?? ""}
                          onChange={(e) =>
                            updateAddress(i, "addressType", e.target.value)
                          }
                          options={["PERMANENT", "CURRENT"]}
                        />
                        {errors[`addresses[${i}].addressType`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`addresses[${i}].addressType`]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAddress}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" /> Add Address
                  </button>
                </Card>

                {/* Upload Documents */}
                <Card
                  title="Upload Documents"
                  icon={<Upload className="w-5 h-5" />}
                >
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
                          onChange={(e) =>
                            updateDocument(
                              i,
                              "docType",
                              e.target.value as DocumentType
                            )
                          }
                          options={DOCUMENT_TYPE_OPTIONS}
                        />
                        {errors[`documents[${i}].docType`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`documents[${i}].docType`]}
                          </p>
                        )}
                      </div>

                      {/* File Input */}
                      <div className="flex-1 min-w-[280px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateDocument(i, "fileObj", file);
                            // Basic file validation
                            if (file) {
                              const newErrors: Record<string, string> = {
                                ...errors,
                              };
                              delete newErrors[`documents[${i}].file`];
                              if (file.size > 5 * 1024 * 1024) {
                                // 5MB
                                newErrors[`documents[${i}].file`] =
                                  "File too large (max 5MB)";
                              }
                              if (
                                ![
                                  "application/pdf",
                                  "image/jpeg",
                                  "image/jpg",
                                  "image/png",
                                ].includes(file.type)
                              ) {
                                newErrors[`documents[${i}].file`] =
                                  "Only PDF, JPG, JPEG, PNG allowed";
                              }
                              setErrors(newErrors);
                            }
                          }}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                        />
                        {errors[`documents[${i}].file`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`documents[${i}].file`]}
                          </p>
                        )}
                      </div>

                      {/* Current File or Selected File */}
                      <div className="flex-1 min-w-[200px]">
                        {doc.fileObj ? (
                          <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
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
                          <span className="text-gray-400 text-sm italic">
                            No file selected
                          </span>
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

                {/* GLOBAL VALIDATION ERROR - NEW: Placed below all fields, above buttons */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex justify-between items-center">
                    <span className="font-medium">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setAddresses(profile.addresses.map((a) => ({ ...a })));
                      setFormData({ ...profile });
                      setDocuments(
                        (profile.documents || []).map((d) => ({
                          ...d,
                          fileObj: null,
                          tempId: uuidv4(),
                        }))
                      );
                      setLocalIfsc(profile.ifscCode || "");
                      setErrors({});
                      setError(null); // NEW: Clear global error on cancel
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating || !hasChanges}
                    className={`px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl transition flex items-center gap-2 ${!hasChanges || updating
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-blue-700 hover:to-indigo-800 shadow-lg"
                      }`}
                  >
                    <Save className="w-5 h-5" />
                    {updating
                      ? "Submitting..."
                      : hasChanges
                        ? "Submit Request"
                        : "No changes to submit"}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE - SAME AS BEFORE */
              <div className="space-y-8">
                <InfoCard
                  title="Personal"
                  icon={<User className="w-6 h-6 text-blue-600" />}
                >
                  <Info
                    label="Full Name"
                    value={`${profile.firstName} ${profile.lastName}`}
                    required
                  />
                  <Info
                    label="Date of Birth"
                    value={formatDate(profile.dateOfBirth)}
                    required
                  />
                  <Info label="Gender" value={profile.gender} required />
                  <Info
                    label="Marital Status"
                    value={profile.maritalStatus}
                    required
                  />
                  <Info
                    label="Nationality"
                    value={profile.nationality}
                    required
                  />

                  <ShowIfFilled
                    label="Number of Children"
                    value={profile.numberOfChildren}
                  />
                  <ShowIfFilled
                    label="Personal Email Address"
                    value={profile.personalEmail}
                  />
                  <ShowIfFilled
                    label="Company Email Address"
                    value={profile.companyEmail}
                  />
                  <ShowIfFilled
                    label="Primary Contact Number"
                    value={profile.contactNumber}
                  />
                  <ShowIfFilled
                    label="Alternate Contact Number"
                    value={profile.alternateContactNumber}
                  />
                </InfoCard>

                <InfoCard
                  title="Professional"
                  icon={<Briefcase className="w-6 h-6 text-indigo-600" />}
                >
                  <ShowIfFilled
                    label="Designation"
                    value={profile.designation?.replace("_", " ")}
                  />
                  <ShowIfFilled
                    label="Date of Joining"
                    value={formatDate(profile.dateOfJoining)}
                  />
                  <ShowIfFilled
                    label="Employment Type"
                    value={profile.employmentType}
                  />
                  <ShowIfFilled
                    label="Client Name"
                    value={profile.clientName}
                  />
                  <ShowIfFilled
                    label="Reporting Manager"
                    value={profile.reportingManagerName}
                  />
                </InfoCard>

                <InfoCard
                  title="Emergency Contact"
                  icon={<Phone className="w-6 h-6 text-red-600" />}
                >
                  {profile.emergencyContactName || profile.emergencyContactNumber ? (
                    <>
                      <ShowIfFilled
                        label="Emergency Contact Name"
                        value={profile.emergencyContactName}
                      />
                      <ShowIfFilled
                        label="Emergency Contact Number"
                        value={profile.emergencyContactNumber}
                      />
                    </>
                  ) : (
                    <p className="text-gray-500">
                      No emergency contact added .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Bank Details"
                  icon={<DollarSign className="w-6 h-6 text-green-600" />}
                >
                  {profile.panNumber ||
                    profile.aadharNumber ||
                    profile.bankName ||
                    profile.accountNumber ||
                    profile.accountHolderName ||
                    profile.ifscCode ||
                    profile.branchName ? (
                    <>
                      <ShowIfFilled label="PAN Number" value={profile.panNumber} />
                      <ShowIfFilled label="Aadhaar Number" value={profile.aadharNumber} />
                      <ShowIfFilled label="Bank Name" value={profile.bankName} />
                      <ShowIfFilled label="Account Number" value={profile.accountNumber} />
                      <ShowIfFilled
                        label="Account Holder Name"
                        value={profile.accountHolderName}
                      />
                      <ShowIfFilled label="IFSC Code" value={profile.ifscCode} />
                      <ShowIfFilled label="Branch Name" value={profile.branchName} />
                    </>
                  ) : (
                    <p className="text-gray-500 ">
                      No bank details added .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Addresses"
                  icon={<MapPin className="w-6 h-6 text-purple-600" />}
                >
                  {profile.addresses.length > 0 ? (
                    profile.addresses.map((a, i) => (
                      <div
                        key={a.addressId}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-4"
                      >
                        <p className="font-semibold text-blue-900">
                          {a.addressType} Address
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {a.houseNo}, {a.streetName}, {a.city}, {a.state} -{" "}
                          {a.pincode}, {a.country}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No addresses added .</p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Documents"
                  icon={<FileText className="w-6 h-6 text-indigo-600" />}
                >
                  {profile.documents && profile.documents.length > 0 ? (
                    <div className="space-y-3">
                      {profile.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl"
                        >
                          <div>
                            <p className="font-medium">
                              {doc.docType.replace(/_/g, " ")}
                            </p>
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
                            <span className="text-gray-400 text-sm italic">
                              No file uploaded
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No documents uploaded .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Salary"
                  icon={<DollarSign className="w-6 h-6 text-green-600" />}
                >
                  {profile.employeeSalaryDTO &&
                    (profile.employeeSalaryDTO.ctc ||
                      profile.employeeSalaryDTO.payType ||
                      profile.employeeSalaryDTO.standardHours ||
                      profile.employeeSalaryDTO.payClass ||
                      !!profile.employeeSalaryDTO.allowances?.length ||
                      !!profile.employeeSalaryDTO.deductions?.length) ? (
                    <>
                      <ShowIfFilled
                        label="CTC"
                        value={profile.employeeSalaryDTO.ctc ? `₹${profile.employeeSalaryDTO.ctc}` : undefined}
                      />
                      <ShowIfFilled
                        label="Pay Type"
                        value={profile.employeeSalaryDTO.payType}
                      />
                      <ShowIfFilled
                        label="Standard Working Hours"
                        value={profile.employeeSalaryDTO.standardHours}
                      />
                      <ShowIfFilled
                        label="Pay Class"
                        value={profile.employeeSalaryDTO.payClass}
                      />

                      {/* Allowances - safe rendering */}
                      {!!profile.employeeSalaryDTO.allowances?.length && (
                        <div className="md:col-span-2">
                          <p className="font-medium text-green-700 mb-2">Allowances</p>
                          {profile.employeeSalaryDTO.allowances!.map((a, i) => (
                            <p key={i} className="text-sm">
                              • {a.allowanceType}: ₹{a.amount}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Deductions - safe rendering */}
                      {!!profile.employeeSalaryDTO.deductions?.length && (
                        <div className="md:col-span-2">
                          <p className="font-medium text-red-700 mb-2">Deductions</p>
                          {profile.employeeSalaryDTO.deductions!.map((d, i) => (
                            <p key={i} className="text-sm">
                              • {d.deductionType}: ₹{d.amount}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">
                      No salary details added .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Insurance"
                  icon={<Shield className="w-6 h-6 text-teal-600" />}
                >
                  {profile.employeeInsuranceDetailsDTO &&
                    (profile.employeeInsuranceDetailsDTO.policyNumber ||
                      profile.employeeInsuranceDetailsDTO.providerName ||
                      profile.employeeInsuranceDetailsDTO.coverageStart ||
                      profile.employeeInsuranceDetailsDTO.coverageEnd ||
                      profile.employeeInsuranceDetailsDTO.nomineeName ||
                      profile.employeeInsuranceDetailsDTO.nomineeRelation ||
                      profile.employeeInsuranceDetailsDTO.nomineeContact ||
                      profile.employeeInsuranceDetailsDTO.groupInsurance !== undefined) ? (
                    <>
                      <ShowIfFilled
                        label="Policy Number"
                        value={profile.employeeInsuranceDetailsDTO.policyNumber}
                      />
                      <ShowIfFilled
                        label="Insurance Provider"
                        value={profile.employeeInsuranceDetailsDTO.providerName}
                      />
                      <ShowIfFilled
                        label="Coverage Period"
                        value={
                          profile.employeeInsuranceDetailsDTO.coverageStart &&
                            profile.employeeInsuranceDetailsDTO.coverageEnd
                            ? `${formatDate(profile.employeeInsuranceDetailsDTO.coverageStart)} to ${formatDate(profile.employeeInsuranceDetailsDTO.coverageEnd)}`
                            : undefined
                        }
                      />
                      <ShowIfFilled
                        label="Nominee Details"
                        value={
                          profile.employeeInsuranceDetailsDTO.nomineeName &&
                            profile.employeeInsuranceDetailsDTO.nomineeRelation
                            ? `${profile.employeeInsuranceDetailsDTO.nomineeName} (${profile.employeeInsuranceDetailsDTO.nomineeRelation})`
                            : undefined
                        }
                      />
                      <ShowIfFilled
                        label="Nominee Contact Number"
                        value={profile.employeeInsuranceDetailsDTO.nomineeContact}
                      />
                      <ShowIfFilled
                        label="Group Insurance"
                        value={
                          profile.employeeInsuranceDetailsDTO.groupInsurance !== undefined
                            ? profile.employeeInsuranceDetailsDTO.groupInsurance
                              ? "Yes"
                              : "No"
                            : undefined
                        }
                      />
                    </>
                  ) : (
                    <p className="text-gray-500 ">
                      No insurance details added .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Equipment"
                  icon={<Building className="w-6 h-6 text-orange-600" />}
                >
                  {profile.employeeEquipmentDTO &&
                    profile.employeeEquipmentDTO.length > 0 ? (
                    <>
                      {profile.employeeEquipmentDTO.map((eq, i) => (
                        <div
                          key={i}
                          className="bg-orange-50 p-4 rounded-xl text-sm mb-3 last:mb-0"
                        >
                          <strong>{eq.equipmentType}</strong>: {eq.serialNumber}
                          <br />
                          <span className="text-gray-600">
                            Issued: {formatDate(eq.issuedDate || "")}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-gray-500 t">
                      No equipment assigned .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Statutory"
                  icon={<FileText className="w-6 h-6 text-gray-600" />}
                >
                  {profile.employeeStatutoryDetailsDTO &&
                    (profile.employeeStatutoryDetailsDTO.passportNumber ||
                      profile.employeeStatutoryDetailsDTO.taxRegime ||
                      profile.employeeStatutoryDetailsDTO.pfUanNumber ||
                      profile.employeeStatutoryDetailsDTO.esiNumber ||
                      profile.employeeStatutoryDetailsDTO.ssnNumber) ? (
                    <>
                      <ShowIfFilled
                        label="Passport Number"
                        value={profile.employeeStatutoryDetailsDTO.passportNumber}
                      />
                      <ShowIfFilled
                        label="Tax Regime"
                        value={profile.employeeStatutoryDetailsDTO.taxRegime}
                      />
                      <ShowIfFilled
                        label="PF UAN Number"
                        value={profile.employeeStatutoryDetailsDTO.pfUanNumber}
                      />
                      <ShowIfFilled
                        label="ESI Number"
                        value={profile.employeeStatutoryDetailsDTO.esiNumber}
                      />
                      <ShowIfFilled
                        label="SSN Number"
                        value={profile.employeeStatutoryDetailsDTO.ssnNumber}
                      />
                    </>
                  ) : (
                    <p className="text-gray-500">
                      No statutory details added .
                    </p>
                  )}
                </InfoCard>

                <InfoCard
                  title="Employment Details"
                  icon={<Briefcase className="w-6 h-6 text-purple-600" />}
                >
                  {profile.employeeEmploymentDetailsDTO &&
                    (profile.employeeEmploymentDetailsDTO.department ||
                      profile.employeeEmploymentDetailsDTO.location ||
                      profile.employeeEmploymentDetailsDTO.workingModel ||
                      profile.employeeEmploymentDetailsDTO.shiftTimingLabel ||
                      profile.employeeEmploymentDetailsDTO.noticePeriodDurationLabel ||
                      profile.employeeEmploymentDetailsDTO.bondDurationLabel ||
                      profile.employeeEmploymentDetailsDTO.probationDurationLabel ||
                      profile.employeeEmploymentDetailsDTO.probationNoticePeriodLabel) ? (
                    <>
                      <ShowIfFilled
                        label="Department"
                        value={profile.employeeEmploymentDetailsDTO.department}
                      />
                      <ShowIfFilled
                        label="Work Location"
                        value={profile.employeeEmploymentDetailsDTO.location}
                      />
                      <ShowIfFilled
                        label="Working Model"
                        value={profile.employeeEmploymentDetailsDTO.workingModel}
                      />
                      <ShowIfFilled
                        label="Shift Timing"
                        value={profile.employeeEmploymentDetailsDTO.shiftTimingLabel}
                      />
                      <ShowIfFilled
                        label="Notice Period Duration"
                        value={profile.employeeEmploymentDetailsDTO.noticePeriodDurationLabel}
                      />
                      <ShowIfFilled
                        label="Bond Duration"
                        value={profile.employeeEmploymentDetailsDTO.bondDurationLabel}
                      />
                      <ShowIfFilled
                        label="Probation Duration"
                        value={profile.employeeEmploymentDetailsDTO.probationDurationLabel}
                      />
                      <ShowIfFilled
                        label="Probation Notice Period"
                        value={profile.employeeEmploymentDetailsDTO.probationNoticePeriodLabel}
                      />
                    </>
                  ) : (
                    <p className="text-gray-500 ">
                      No employment details added .
                    </p>
                  )}
                </InfoCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
    <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const InfoCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
    <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
      {icon}
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-5 text-sm">
      {children}
    </div>
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
  options: string[];
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
const Info = ({
  label,
  value,
  required,
}: {
  label: string;
  value?: any;
  required?: boolean;
}) => (
  <div>
    <p className="text-gray-600 font-medium">
      {label}
      {required && <span className="text-red-600 ml-1 font-bold">*</span>}
    </p>
    <p className="font-bold text-gray-900 mt-1">{safe(value)}</p>
  </div>
);

export default ProfilePage;
