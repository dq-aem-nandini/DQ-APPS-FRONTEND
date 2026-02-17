"use client";

import { useState, useEffect, useCallback } from "react";
import { employeeService } from "@/lib/api/employeeService";
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
  Eye,
  Camera,
  Loader2,
  Plus,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  DocumentType,
  EmployeeDocumentDTO,
  EmployeeDTO,
  AddressModel,
  DOCUMENT_TYPE_OPTIONS,
} from "@/lib/api/types";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useOrganizationFieldValidation } from "@/hooks/organizationValidator";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
// Employee should NOT see offer letter or contract
const EMPLOYEE_ALLOWED_DOCUMENTS = DOCUMENT_TYPE_OPTIONS.filter(
  (doc) => doc !== "OFFER_LETTER" && doc !== "CONTRACT"
);
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

// Simple deep equality check for address objects (only the fields we care about)
const isAddressEqual = (
  a: AddressModel | undefined,
  b: AddressModel | undefined
): boolean => {
  if (!a || !b) return false;
  return (
    (a.houseNo || "").trim() === (b.houseNo || "").trim() &&
    (a.streetName || "").trim() === (b.streetName || "").trim() &&
    (a.city || "").trim() === (b.city || "").trim() &&
    (a.state || "").trim() === (b.state || "").trim() &&
    (a.country || "").trim() === (b.country || "").trim() &&
    (a.pincode || "").trim() === (b.pincode || "").trim() &&
    (a.addressType || "") === (b.addressType || "")
  );
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
  const [hasChanges, setHasChanges] = useState(false);
  const [documents, setDocuments] = useState<FormDocument[]>([]);
  // IFSC local state (prevents focus loss)
  const [localIfsc, setLocalIfsc] = useState<string>("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  // ────────────────────────────────────────────────
  // Reusable hooks (same as organization forms)
  // ────────────────────────────────────────────────
  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const { validateField } = useOrganizationFieldValidation();

  const { handleValidatedChange, handleUniqueBlur, fieldError } =
    useFormFieldHandlers(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formatted = value;

        // Reuse same formatting rules as organization
        if (["panNumber", "ifscCode"].includes(name)) {
          formatted = value.toUpperCase();
        }
        if (name === "personalEmail") {
          formatted = value.toLowerCase();
        }
        if (
          [
            "contactNumber",
            "alternateContactNumber",
            "emergencyContactNumber",
            "accountNumber",
            "aadharNumber",
          ].includes(name)
        ) {
          formatted = value.replace(/[^0-9]/g, "");
        }
        if (name === "gender" || name === "maritalStatus") {
          formatted =
            value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }

        setFormData((prev) => (prev ? { ...prev, [name]: formatted } : null));
      },
      setErrors,
      checkUniqueness,
      () => formData,
      validateField
    );
  interface FormDocument extends EmployeeDocumentDTO {
    fileObj?: File | null;
    tempId?: string;
    status?: "unchanged" | "new";
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
          addressId: a.addressId ?? uuidv4(), // only if null/undefined
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
          status: "unchanged" as const,
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
        file: null,
        fileObj: null,
        tempId: uuidv4(),
        status: "new" as const, // ← Important
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

  const removeDocument = async (index: number) => {
    const doc = documents[index];

    // Case 1: New document (never saved) → just remove from UI
    if (doc.status === "new" || !doc.documentId) {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    // Case 2: Existing document → ask for confirmation & send delete request
    const result = await Swal.fire({
      title: "Delete Document?",
      text: "This will send a delete request to admin for approval.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, request delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      // Call the delete request API (similar to address)
      await employeeService.submitDeleteDocumentRequest(doc);

      Swal.fire({
        icon: "success",
        title: "Delete Request Sent",
        text: "Admin will review your request.",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.message || "Unable to send delete request. Try again.",
      });
    }
  };
  // Handle IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    const code = (ifsc ?? "").trim().toUpperCase();
    if (!code || isLookingUp || errors.ifscCode) return;
    setIsLookingUp(true);
    try {
      const res = await employeeService.getIFSCDetails(code);
      if (res?.flag && res.response) {
        const data = res.response;

        setFormData((prev) =>
          prev
            ? {
                ...prev,
                bankName: data.BANK ?? "",
                branchName: data.BRANCH ?? "",
                ifscCode: code,
              }
            : null
        );

        setSuccess("Bank details auto-filled!");
        setErrors((prev) => {
          const n = { ...prev };
          delete n.ifscCode;
          return n;
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          ifscCode: "Invalid IFSC or lookup failed",
        }));
      }
    } catch (err: any) {
      console.error("IFSC lookup error:", err);
      setErrors((prev) => ({
        ...prev,
        ifscCode: "Invalid IFSC or lookup failed",
      }));
    } finally {
      setIsLookingUp(false);
    }
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
          `Please fill ${
            field === "firstName"
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
      appendIfChanged("gender", formData.gender, profile.gender); // ← Fixed
      appendIfChanged(
        "maritalStatus",
        formData.maritalStatus,
        profile.maritalStatus
      ); // ← Fixed
      appendIfChanged("nationality", formData.nationality, profile.nationality);

      // Optional personal fields
      appendIfChanged(
        "personalEmail",
        formData.personalEmail,
        profile.personalEmail
      );
      appendIfChanged(
        "contactNumber",
        formData.contactNumber,
        profile.contactNumber
      );
      appendIfChanged(
        "alternateContactNumber",
        formData.alternateContactNumber,
        profile.alternateContactNumber
      );
      appendIfChanged(
        "emergencyContactName",
        formData.emergencyContactName,
        profile.emergencyContactName
      );
      appendIfChanged(
        "emergencyContactNumber",
        formData.emergencyContactNumber,
        profile.emergencyContactNumber
      );
      appendIfChanged(
        "numberOfChildren",
        formData.numberOfChildren,
        profile.numberOfChildren
      );

      // Identity & Bank Details
      appendIfChanged("panNumber", formData.panNumber, profile.panNumber);
      appendIfChanged(
        "aadharNumber",
        formData.aadharNumber,
        profile.aadharNumber
      );
      appendIfChanged(
        "accountNumber",
        formData.accountNumber,
        profile.accountNumber
      );
      appendIfChanged(
        "accountHolderName",
        formData.accountHolderName,
        profile.accountHolderName
      );
      appendIfChanged("bankName", formData.bankName, profile.bankName);
      appendIfChanged("branchName", formData.branchName, profile.branchName);

      // IFSC Code - uses localIfsc state
      if (localIfsc.trim() !== (profile.ifscCode || "").trim()) {
        payload.append("ifscCode", localIfsc.trim());
      }

      // === Addresses (Send only if changed) ===
      const normalizeAddress = (addr: AddressModel) => ({
        houseNo: addr.houseNo?.trim() || "",
        streetName: addr.streetName?.trim() || "",
        city: addr.city?.trim() || "",
        state: addr.state?.trim() || "",
        country: addr.country?.trim() || "",
        pincode: addr.pincode?.trim() || "",
        addressType: addr.addressType || "",
      });

      const oldAddresses = (profile.addresses || []).map(normalizeAddress);
      const newAddresses = addresses.map(normalizeAddress);

      if (JSON.stringify(oldAddresses) !== JSON.stringify(newAddresses)) {
        addresses.forEach((addr, index) => {
          if (addr.addressId && !addr.addressId.startsWith("temp-")) {
            payload.append(`addresses[${index}].addressId`, addr.addressId);
          }

          payload.append(`addresses[${index}].houseNo`, addr.houseNo || "");
          payload.append(
            `addresses[${index}].streetName`,
            addr.streetName || ""
          );
          payload.append(`addresses[${index}].city`, addr.city || "");
          payload.append(`addresses[${index}].state`, addr.state || "");
          payload.append(`addresses[${index}].country`, addr.country || "");
          payload.append(`addresses[${index}].pincode`, addr.pincode || "");
          payload.append(
            `addresses[${index}].addressType`,
            addr.addressType || ""
          );
        });
      }

      let docIndex = 0;

      documents.forEach((doc) => {
        if (!(doc.fileObj instanceof File)) return;

        // Existing document → include ID
        if (doc.documentId) {
          payload.append(`documents[${docIndex}].documentId`, doc.documentId);

          if (doc.fileUrl) {
            payload.append(`documents[${docIndex}].fileUrl`, doc.fileUrl);
          }
        }

        if (!doc.docType) {
          throw new Error(
            "Invariant violation: docType missing for uploaded document"
          );
        }

        payload.append(`documents[${docIndex}].docType`, doc.docType);
        payload.append(`documents[${docIndex}].file`, doc.fileObj);

        docIndex++;
      });

      // If no changes at all (except possibly photo/documents), prevent submission
      // Check if we have any real changes
      const hasRealChanges =
        !payload.entries().next().done || // something was appended (fields, photo, addresses, etc.)
        !!profilePhotoFile || // photo changed
        documents.some((d) => d.fileObj instanceof File || d.status === "new");

      if (!hasRealChanges) {
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

  const handleDeleteAddress = async (address: AddressModel) => {
    const addressId = address.addressId;

    // Case 1: New / temporary address → instantly remove from UI (no prompt, no API)
    if (!addressId || addressId.startsWith("temp-")) {
      setAddresses((prev) => prev.filter((a) => a.addressId !== addressId));
      return;
    }

    // Case 2: Existing address → show confirmation & send delete request
    const result = await Swal.fire({
      title: "Request Address Deletion?",
      text: "This will send a delete request to the admin for approval.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, send request",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await employeeService.submitDeleteAddressRequest(address);
      Swal.fire({
        icon: "success",
        title: "Delete Request Sent",
        text: "Admin will review your request.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to submit delete request. Please try again.",
      });
    }
  };

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value: rawValue } = e.target;
    let normalizedValue = rawValue;

    // Normalize gender & maritalStatus
    if (name === "gender" || name === "maritalStatus") {
      normalizedValue =
        rawValue.charAt(0).toUpperCase() + rawValue.slice(1).toLowerCase();
    }

    // Update form data
    setFormData((prev) => (prev ? { ...prev, [name]: normalizedValue } : null));

    // Real-time validation
    // validateField(name, normalizedValue);
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
    if (field === "houseNo" && value.length > 19) {
      newErrors[`addresses[${i}].${field}`] = "Maximum 20 characters allowed";
    }
    if (field === "pincode" && value && !/^\d{6}$/.test(value)) {
      newErrors[`addresses[${i}].${field}`] = "PIN code must be 6 digits";
    }
    setErrors(newErrors);
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

    // Compare addresses — ignore temporary uuid differences
    const normalizeAddressForCompare = (addr: AddressModel) => ({
      houseNo: addr.houseNo?.trim() || "",
      streetName: addr.streetName?.trim() || "",
      city: addr.city?.trim() || "",
      state: addr.state?.trim() || "",
      country: addr.country?.trim() || "",
      pincode: addr.pincode?.trim() || "",
      addressType: addr.addressType || "",
      // Do NOT include addressId in comparison
    });

    const oldAddresses = (profile.addresses || [])
      .map(normalizeAddressForCompare)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

    const newAddresses = addresses
      .map(normalizeAddressForCompare)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

    if (JSON.stringify(oldAddresses) !== JSON.stringify(newAddresses)) {
      return true;
    }

    // Compare documents (new files uploaded)
    const documentsChanged = documents.some(
      (d) =>
        d.fileObj instanceof File && // file selected
        !!d.docType // document type selected
    );

    if (documentsChanged) return true;

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
  }, [fetchProfile]);

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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* REQUIRED FIELDS - No uniqueness check */}
                    <div className="space-y-2">
                      <Input
                        label="First Name"
                        name="firstName"
                        value={formData?.firstName ?? ""}
                        onChange={handleValidatedChange}
                        required
                      />
                      {fieldError(errors, "firstName")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Last Name"
                        name="lastName"
                        value={formData?.lastName ?? ""}
                        onChange={handleValidatedChange}
                        required
                      />
                      {fieldError(errors, "lastName")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData?.dateOfBirth ?? ""}
                        onChange={handleValidatedChange}
                        required
                      />
                      {fieldError(errors, "dateOfBirth")}
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
                      {fieldError(errors, "gender")}
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
                      {fieldError(errors, "maritalStatus")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Nationality"
                        name="nationality"
                        value={formData?.nationality ?? ""}
                        onChange={handleValidatedChange}
                        required
                      />
                      {fieldError(errors, "nationality")}
                    </div>

                    <div className="space-y-2">
                      {/* Personal Email */}
                      <Input
                        label="Personal Email Address"
                        name="personalEmail"
                        type="email"
                        value={formData.personalEmail ?? ""}
                        onChange={handleValidatedChange}
                        onBlur={handleUniqueBlur(
                          "EMAIL",
                          "personal_email",
                          "personalEmail",
                          profile?.employeeId
                        )}
                        placeholder="you@gmail.com"
                      />

                      {fieldError(errors, "personalEmail")}
                    </div>

                    <div className="space-y-2">
                      {/* Primary Contact Number */}
                      <Input
                        label="Primary Contact Number"
                        name="contactNumber"
                        value={formData?.contactNumber ?? ""}
                        onChange={handleValidatedChange}
                        maxLength={10}
                        onBlur={handleUniqueBlur(
                          "CONTACT_NUMBER",
                          "contact_number",
                          "contactNumber",
                          profile?.employeeId,
                          10
                        )}
                      />
                      {fieldError(errors, "contactNumber")}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      {/* Alternate Contact Number */}
                      <Input
                        label="Alternate Contact Number"
                        name="alternateContactNumber"
                        value={formData?.alternateContactNumber ?? ""}
                        onChange={handleValidatedChange}
                        maxLength={10}
                        placeholder="Another 10-digit number (optional)"
                        onBlur={handleUniqueBlur(
                          "CONTACT_NUMBER",
                          "contact_number",
                          "alternateContactNumber",
                          profile?.employeeId,
                          10
                        )}
                      />
                      {fieldError(errors, "alternateContactNumber")}
                    </div>

                    <div className="space-y-2">
                      {/* Number of Children - no uniqueness */}
                      <Input
                        label="Number of Children"
                        name="numberOfChildren"
                        type="number"
                        value={formData?.numberOfChildren ?? ""}
                        onChange={handleValidatedChange}
                        min="0"
                      />
                      {fieldError(errors, "numberOfChildren")}
                    </div>
                  </div>
                </Card>

                {/* Emergency Contact */}
                <Card
                  title="Emergency Contact"
                  icon={<Phone className="w-5 h-5" />}
                >
                  <div className="space-y-2">
                    <Input
                      label="Emergency Contact Name"
                      name="emergencyContactName"
                      value={formData?.emergencyContactName ?? ""}
                      onChange={handleValidatedChange}
                    />
                    {fieldError(errors, "emergencyContactName")}
                  </div>

                  {/* Emergency Contact Number – with uniqueness check */}
                  <div className="space-y-2">
                    <Input
                      label="Emergency Contact Number"
                      name="emergencyContactNumber"
                      value={formData?.emergencyContactNumber ?? ""}
                      onChange={handleValidatedChange}
                      maxLength={10}
                      onBlur={handleUniqueBlur(
                        "CONTACT_NUMBER",
                        "emergency_contact_number",
                        "emergencyContactNumber",
                        profile?.employeeId,
                        10 // min length to trigger uniqueness check
                      )}
                    />
                    {fieldError(errors, "emergencyContactNumber")}
                  </div>
                </Card>

                {/* Bank Details */}
                <Card
                  title="Bank Details"
                  icon={<DollarSign className="w-5 h-5" />}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input
                        label="PAN Number"
                        name="panNumber"
                        value={formData.panNumber || ""}
                        onChange={handleValidatedChange}
                        pattern="[A-Z0-9]{10}"
                        onBlur={handleUniqueBlur(
                          "PAN_NUMBER",
                          "pan_number",
                          "panNumber",
                          profile?.employeeId,
                          10
                        )}
                      />
                      {fieldError(errors, "panNumber")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Aadhar Number"
                        name="aadharNumber"
                        value={formData.aadharNumber || ""}
                        onChange={handleValidatedChange}
                        pattern="[0-9]{12}"
                        onBlur={handleUniqueBlur(
                          "AADHAR_NUMBER",
                          "aadhar_number",
                          "aadharNumber",
                          profile?.employeeId,
                          12
                        )}
                      />
                      {fieldError(errors, "aadharNumber")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Account Number"
                        name="accountNumber"
                        value={formData.accountNumber || ""}
                        onChange={handleValidatedChange}
                        pattern="[0-9]{9,18}"
                        maxLength={18}
                        onBlur={handleUniqueBlur(
                          "ACCOUNT_NUMBER",
                          "account_number",
                          "accountNumber",
                          profile?.employeeId,
                          9
                        )}
                      />
                      {fieldError(errors, "accountNumber")}
                    </div>

                    <div className="space-y-2">
                      <Input
                        label="Account Holder Name"
                        name="accountHolderName"
                        value={formData.accountHolderName || ""}
                        onChange={handleValidatedChange}
                        placeholder="As per bank passbook / statement"
                      />

                      {fieldError(errors, "accountHolderName")}
                    </div>

                    {/* IFSC & Bank Name — unchanged */}
                    <div className="relative space-y-2">
                      <Input
                        label="IFSC Code"
                        name="ifscCode"
                        value={localIfsc ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 11);
                          setLocalIfsc(val);

                          handleValidatedChange({
                            ...e,
                            target: { ...e.target, value: val },
                          } as any);
                        }}
                        onBlur={() => handleIfscLookup(localIfsc)}
                        placeholder="HDFC0000123"
                        maxLength={11}
                      />

                      {isLookingUp && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                      )}

                      {fieldError(errors, "ifscCode")}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Input
                        label="Bank Name"
                        name="bankName"
                        value={formData.bankName || ""}
                        readOnly
                        placeholder="Auto-filled from IFSC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        label="Branch Name"
                        name="branchName"
                        value={formData.branchName || ""}
                        onChange={handleValidatedChange}
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
                          onClick={() => handleDeleteAddress(addr)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Request Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                        <div>
                          <Input
                            label="House Number"
                            value={addr.houseNo || ""}
                            maxLength={20}
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
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </Card>

                {/* Upload Documents */}
                <Card
                  title="Upload Documents"
                  icon={<Upload className="w-5 h-5" />}
                >
                  {documents
                    .filter(
                      (doc) =>
                        doc.docType !== "OFFER_LETTER" &&
                        doc.docType !== "CONTRACT"
                    )
                    .map((doc, i) => (
                      <div
                        key={doc.tempId || doc.documentId}
                        className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl mb-6 border border-gray-200 shadow-sm"
                      >
                        {/* Document Type - Col 1 */}
                        <div className="lg:col-span-1">
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
                            options={EMPLOYEE_ALLOWED_DOCUMENTS.filter((t) => {
                              // allow current row's selected type
                              if (t === doc.docType) return true;

                              // block types already used in other rows
                              return !documents.some(
                                (d, idx) => idx !== i && d.docType === t
                              );
                            })}
                          />
                        </div>

                        {/* Current File Info - Col 2 */}
                        <div className="lg:col-span-1 flex items-center justify-center">
                          {doc.fileUrl && !doc.fileObj && (
                            <div className="text-center">
                              {/* <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2 mx-auto">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div> */}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 justify-center"
                              >
                                <Eye className="w-4 h-4" /> View Current
                              </a>
                            </div>
                          )}
                        </div>
                        {/* Upload / Replace - Col 3 */}
                        <div className="lg:col-span-1 flex-1">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            {doc.fileUrl ? "Replace File" : "Upload File"}
                          </label>

                          {/* Hidden native input */}
                          <input
                            id={`file-${i}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              updateDocument(i, "fileObj", file);
                            }}
                          />

                          {/* Custom button + text */}
                          <label
                            htmlFor={`file-${i}`}
                            className="flex items-center gap-3 px-4 py-3 border border-gray-200 
               rounded-xl cursor-pointer bg-white hover:bg-gray-50
               focus-within:ring-2 focus-within:ring-indigo-500 transition"
                          >
                            <span
                              className="px-4 py-2 rounded-lg text-white text-sm font-medium
                 bg-gradient-to-r from-indigo-600 to-purple-600
                 hover:from-indigo-700 hover:to-purple-700 shadow"
                            >
                              Choose file
                            </span>

                            {/* File name text logic */}
                            {!doc.fileUrl && (
                              <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                {doc.fileObj
                                  ? doc.fileObj.name
                                  : "No file selected"}
                              </span>
                            )}

                            {doc.fileUrl && doc.fileObj && (
                              <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                {doc.fileObj.name}
                              </span>
                            )}
                          </label>

                          {errors[`documents[${i}].file`] && (
                            <p className="mt-1 text-red-600 text-xs font-medium">
                              {errors[`documents[${i}].file`]}
                            </p>
                          )}
                        </div>

                        {/* Trash - Col 4 */}
                        <div className="lg:col-span-1 flex items-start lg:items-center justify-center lg:justify-end pt-2 lg:pt-8">
                          <button
                            type="button"
                            onClick={() => removeDocument(i)}
                            className="group relative p-3 bg-red-50 hover:bg-red-100 rounded-2xl border-2 border-red-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md hover:scale-105"
                            title="Remove this document"
                          >
                            <Trash2 className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors" />
                          </button>
                        </div>
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
                    className={`px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl transition flex items-center gap-2 ${
                      !hasChanges || updating
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
                  {profile.emergencyContactName ||
                  profile.emergencyContactNumber ? (
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
                      <ShowIfFilled
                        label="PAN Number"
                        value={profile.panNumber}
                      />
                      <ShowIfFilled
                        label="Aadhar Number"
                        value={profile.aadharNumber}
                      />
                      <ShowIfFilled
                        label="Bank Name"
                        value={profile.bankName}
                      />
                      <ShowIfFilled
                        label="Account Number"
                        value={profile.accountNumber}
                      />
                      <ShowIfFilled
                        label="Account Holder Name"
                        value={profile.accountHolderName}
                      />
                      <ShowIfFilled
                        label="IFSC Code"
                        value={profile.ifscCode}
                      />
                      <ShowIfFilled
                        label="Branch Name"
                        value={profile.branchName}
                      />
                    </>
                  ) : (
                    <p className="text-gray-500 ">No bank details added .</p>
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
                          key={doc.documentId ?? doc.fileUrl ?? i}
                          className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl"
                        >
                          <p className="font-medium">
                            {(doc.docType ?? "UNKNOWN").replace(/_/g, " ")}
                          </p>

                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
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
                    <p className="text-gray-500">No documents uploaded .</p>
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
                        value={
                          profile.employeeSalaryDTO.ctc
                            ? `₹${profile.employeeSalaryDTO.ctc}`
                            : undefined
                        }
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
                          <p className="font-medium text-green-700 mb-2">
                            Allowances
                          </p>
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
                          <p className="font-medium text-red-700 mb-2">
                            Deductions
                          </p>
                          {profile.employeeSalaryDTO.deductions!.map((d, i) => (
                            <p key={i} className="text-sm">
                              • {d.deductionType}: ₹{d.amount}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No salary details added .</p>
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
                    profile.employeeInsuranceDetailsDTO.groupInsurance !==
                      undefined) ? (
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
                            ? `${formatDate(
                                profile.employeeInsuranceDetailsDTO
                                  .coverageStart
                              )} to ${formatDate(
                                profile.employeeInsuranceDetailsDTO.coverageEnd
                              )}`
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
                        value={
                          profile.employeeInsuranceDetailsDTO.nomineeContact
                        }
                      />
                      <ShowIfFilled
                        label="Group Insurance"
                        value={
                          profile.employeeInsuranceDetailsDTO.groupInsurance !==
                          undefined
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
                    <p className="text-gray-500 t">No equipment assigned .</p>
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
                        value={
                          profile.employeeStatutoryDetailsDTO.passportNumber
                        }
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
                    profile.employeeEmploymentDetailsDTO
                      .noticePeriodDurationLabel ||
                    profile.employeeEmploymentDetailsDTO.bondDurationLabel ||
                    profile.employeeEmploymentDetailsDTO
                      .probationDurationLabel ||
                    profile.employeeEmploymentDetailsDTO
                      .probationNoticePeriodLabel) ? (
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
                        value={
                          profile.employeeEmploymentDetailsDTO.workingModel
                        }
                      />
                      <ShowIfFilled
                        label="Shift Timing"
                        value={
                          profile.employeeEmploymentDetailsDTO.shiftTimingLabel
                        }
                      />
                      <ShowIfFilled
                        label="Notice Period Duration"
                        value={
                          profile.employeeEmploymentDetailsDTO
                            .noticePeriodDurationLabel
                        }
                      />
                      <ShowIfFilled
                        label="Bond Duration"
                        value={
                          profile.employeeEmploymentDetailsDTO.bondDurationLabel
                        }
                      />
                      <ShowIfFilled
                        label="Probation Duration"
                        value={
                          profile.employeeEmploymentDetailsDTO
                            .probationDurationLabel
                        }
                      />
                      <ShowIfFilled
                        label="Probation Notice Period"
                        value={
                          profile.employeeEmploymentDetailsDTO
                            .probationNoticePeriodLabel
                        }
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
