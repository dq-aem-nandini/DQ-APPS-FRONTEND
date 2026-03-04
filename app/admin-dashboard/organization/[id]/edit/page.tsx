"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { organizationService } from "@/lib/api/organizationService";
import { employeeService } from "@/lib/api/employeeService";
import {
  Domain,
  CurrencyCode,
  OrganizationRequestDTO,
  AddressModel,
  AddressType,
  IndustryType,
  DOMAIN_OPTIONS,
  INDUSTRY_TYPE_OPTIONS,
  CURRENCY_CODE_OPTIONS,
  COUNTRY_CURRENCY_MAP,
} from "@/lib/api/types";
import BackButton from "@/components/ui/BackButton";
import Swal from "sweetalert2";
import TooltipHint from "@/components/ui/TooltipHint";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useOrganizationFieldValidation } from "@/hooks/organizationValidator";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import { adminService } from "@/lib/api/adminService";
const CURRENCY_COUNTRY_MAP: Record<CurrencyCode, string[]> =
  Object.entries(COUNTRY_CURRENCY_MAP).reduce((acc, [country, currency]) => {
    if (!acc[currency as CurrencyCode]) {
      acc[currency as CurrencyCode] = [];
    }
    acc[currency as CurrencyCode].push(country);
    return acc;
  }, {} as Record<CurrencyCode, string[]>);
const ADDRESS_TYPES: AddressType[] = ["PERMANENT", "CURRENT", "OFFICE"];
const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Australia/Sydney",
  "Asia/Singapore",
];

export default function EditOrganizationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id; // string | undefined
  const router = useRouter();
  const [countries, setCountries] = useState<string[]>([]);
  const [statesMap, setStatesMap] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<OrganizationRequestDTO>({
    organizationName: "",
    organizationLegalName: "",
    registrationNumber: "",
    gstNumber: "",
    panNumber: "",
    cinNumber: "",
    website: "",
    email: "",
    contactNumber: "",
    logo: null,
    industryType: "" as IndustryType,
    domain: "" as Domain,
    establishedDate: "",
    timezone: "",
    autoClockOutTime: "",
    currencyCode: "" as CurrencyCode,
    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    digitalSignature: null,
    addresses: [
      {
        addressId: null,
        houseNo: "",
        streetName: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        addressType: "OFFICE" as AddressType,
      },
    ], prefix: "",
    sequenceNumber: undefined,
    companyType: "",
    attendancePolicy: {
      absentMaxMinutes: undefined,
      fullDayMinMinutes: undefined,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] =
    useState<OrganizationRequestDTO | null>(null);
  const [success, setSuccess] = useState("");

  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const { validateField } = useOrganizationFieldValidation();

  const { handleValidatedChange, handleUniqueBlur, fieldError } =
    useFormFieldHandlers(
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formatted = value;

        if (
          ["panNumber", "gstNumber", "cinNumber", "ifscCode"].includes(name)
        ) {
          formatted = value.toUpperCase();
        }
        if (name === "email") {
          formatted = value.toLowerCase();
        }
        if (name === "contactNumber" || name === "accountNumber") {
          formatted = value.replace(/[^0-9]/g, "");
        }
        if (name === "registrationNumber") {
          formatted = value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
        }
        if (name === "accountHolderName") {
          formatted = value.replace(/[^A-Za-z\s.,&()-]/g, "");
        }

        setFormData((prev) => {
          // ── NEW: Support dotted/nested names ──
          if (name.includes(".")) {
            const parts = name.split(".");
            if (parts.length === 2) {
              const [parent, child] = parts;

              // Special case for attendancePolicy
              if (parent === "attendancePolicy") {
                return {
                  ...prev,
                  attendancePolicy: {
                    ...prev.attendancePolicy,
                    [child]: formatted === "" ? undefined : Number(formatted),
                  },
                };
              }

              // Generic nested support (if you ever add more)
              return {
                ...prev,
                [parent]: {
                  ...(prev[parent as keyof typeof prev] as any),
                  [child]: formatted,
                },
              };
            }
          }

          // Normal flat fields
          return { ...prev, [name]: formatted };
        });
      },
      setErrors,
      checkUniqueness,
      () => formData,
      validateField
    );

  useEffect(() => {
    if (!formData.addresses?.length) return;

    const selectedCountry = formData.addresses[0]?.country;
    if (!selectedCountry) return;

    const mappedCurrency =
      COUNTRY_CURRENCY_MAP[selectedCountry];

    if (
      mappedCurrency &&
      formData.currencyCode !== mappedCurrency
    ) {
      setFormData((prev) => ({
        ...prev,
        currencyCode: mappedCurrency,
      }));
    }
  }, [formData.addresses]);

  const filteredCountries = useMemo(() => {
    if (!formData.currencyCode) return countries;

    return (
      CURRENCY_COUNTRY_MAP[formData.currencyCode] || []
    );
  }, [formData.currencyCode, countries]);

  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.blur();
  };
  // Load organization data
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await organizationService.getById(id);

        const loaded: OrganizationRequestDTO = {
          organizationName: res.organizationName ?? "",
          organizationLegalName: res.organizationLegalName ?? "",
          registrationNumber: res.registrationNumber ?? "",
          gstNumber: res.gstNumber ?? "",
          panNumber: res.panNumber ?? "",
          cinNumber: res.cinNumber ?? "",
          website: res.website ?? "",
          email: res.email ?? "",
          contactNumber: res.contactNumber ?? "",
          logo: null,
          industryType: res.industryType ?? "",
          domain: res.domain ?? "",
          establishedDate: res.establishedDate ?? "",
          timezone: res.timezone ?? "",
          autoClockOutTime: res.autoClockOutTime
            ? res.autoClockOutTime.slice(0, 5)
            : "",
          currencyCode: res.currencyCode ?? "",
          accountNumber: res.accountNumber ?? "",
          accountHolderName: res.accountHolderName ?? "",
          bankName: res.bankName ?? "",
          ifscCode: res.ifscCode ?? "",
          branchName: res.branchName ?? "",
          digitalSignature: null,
          addresses:
            res.addresses?.map((a) => ({
              addressId: a.addressId ?? null,
              houseNo: a.houseNo ?? "",
              streetName: a.streetName ?? "",
              city: a.city ?? "",
              state: a.state ?? "",
              country: a.country ?? "",
              pincode: a.pincode ?? "",
              addressType: a.addressType ?? ("" as AddressType),
            })) ?? [],
          prefix: res.prefix ?? "",
          sequenceNumber: res.sequenceNumber ?? undefined,
          companyType: res.companyType ?? "",
          attendancePolicy: res.attendancePolicyDto
            ? {
              absentMaxMinutes:
                res.attendancePolicyDto.absentMaxMinutes != null
                  ? res.attendancePolicyDto.absentMaxMinutes / 60
                  : undefined,
              fullDayMinMinutes:
                res.attendancePolicyDto.fullDayMinMinutes != null
                  ? res.attendancePolicyDto.fullDayMinMinutes / 60
                  : undefined,
            }
            : {
              absentMaxMinutes: undefined,
              fullDayMinMinutes: undefined,
            },
        };

        setFormData(loaded);
        setOriginalData(loaded);
        setLogoPreview(res.logoUrl ?? "");
        setSignaturePreview(res.digitalSignatureUrl ?? "");
        // Load states for existing addresses
        if (loaded.addresses?.length) {
          for (const [index, addr] of loaded.addresses.entries()) {
            if (addr.country) {
              try {
                const states =
                  await adminService.getStatesByCountryV1(addr.country);

                setStatesMap((prev) => ({
                  ...prev,
                  [index]: states || [],
                }));
              } catch (e) {
                console.error("Failed to load states", e);
              }
            }
          }
        }
      } catch (err: any) {
        Swal.fire("Error", "Failed to load organization", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await adminService.getAllCountries();
        setCountries(res || []);
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };

    fetchCountries();
  }, []);

  const hasChanges = useMemo(() => {
    if (!originalData) return false;

    const clean = (data: OrganizationRequestDTO) => ({
      ...data,
      logo: undefined,
      digitalSignature: undefined,
    });

    return (
      JSON.stringify(clean(formData)) !== JSON.stringify(clean(originalData))
    );
  }, [formData, originalData]);

  // IFSC lookup
  const handleIfscLookup = async (ifsc: string) => {
    const code = String(ifsc ?? "")
      .trim()
      .toUpperCase();

    // Skip if empty, already looking up, or already has error
    if (!code || isLookingUp || errors.ifscCode) return;

    setIsLookingUp(true);

    try {
      const res = await employeeService.getIFSCDetails(code);

      if (res?.flag && res.response) {
        const data = res.response;

        setFormData((prev) => ({
          ...prev,
          bankName: data.BANK ?? "",
          branchName: data.BRANCH ?? "",
          ifscCode: code, // store cleaned version
        }));

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

  const handleAddressChange = (
    index: number,
    field: keyof AddressModel,
    value: string
  ) => {
    setFormData((prev) => {
      const addrs = [...prev.addresses];
      addrs[index] = { ...addrs[index], [field]: value };
      return { ...prev, addresses: addrs };
    });

    const path = `addresses.${index}.${field}`;
    const error = validateField(path, value, formData);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[path] = error;
      else delete next[path];
      return next;
    });
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          addressId: null,
          houseNo: "",
          streetName: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
          addressType: "OFFICE" as AddressType,
        },
      ],
    }));
  };

  const removeAddress = (index: number) => {
    const updated = [...formData.addresses];

    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      addresses: updated,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`addresses.${index}.`)) delete next[key];
      });
      return next;
    });
  };

  const handleFileChange = (
    field: "logo" | "digitalSignature",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (file) {
      const preview = URL.createObjectURL(file);
      if (field === "logo") setLogoPreview(preview);
      if (field === "digitalSignature") setSignaturePreview(preview);
    } else {
      if (field === "logo") setLogoPreview("");
      if (field === "digitalSignature") setSignaturePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    console.log("SUBMIT CLICKED");
    console.log("HAS CHANGES:", hasChanges);
    console.log("ID:", id);

    if (!hasChanges || !id) {
      console.log("STOPPED because no changes or no id");
      return;
    }

    setSaving(true);
    setErrors({});

    // Client-side validation
    const tempErrors: Record<string, string> = {};

    const fieldsToValidate = [
      "organizationName",
      "organizationLegalName",
      "registrationNumber",
      "gstNumber",
      "panNumber",
      "cinNumber",
      "email",
      "contactNumber",
      "domain",
      "industryType",
      "establishedDate",
      "currencyCode",
      "autoClockOutTime",
      "bankName",
      "branchName",
      "attendancePolicy.absentMaxMinutes",
      "attendancePolicy.fullDayMinMinutes",
      "accountNumber",
      "accountHolderName",
      "ifscCode",
      "prefix",
      "sequenceNumber",
      "companyType",
      "timezone",
      "logo",
      "digitalSignature",
    ];
    const getValueByPath = (obj: any, path: string) =>
      path.split(".").reduce((acc, key) => acc?.[key], obj);
    fieldsToValidate.forEach((name) => {
      const value = getValueByPath(formData, name);
      const error = validateField(name, value, formData);
      if (error) tempErrors[name] = error;
    });
    fieldsToValidate.forEach((name) => {
      const value = getValueByPath(formData, name);

      console.log(`[VALIDATE] ${name} → value:`, value, typeof value);

      const error = validateField(name, value, formData);

      console.log(`[VALIDATE] ${name} → error returned:`, error || "(empty string)");

      if (error) {
        tempErrors[name] = error;
        console.log(`[ERROR ADDED] ${name} = ${error}`);
      }
    });
    // Validate addresses
    formData.addresses.forEach((addr, idx) => {
      ["city", "state", "country", "pincode"].forEach((sub) => {
        const value = (addr as any)[sub];
        const path = `addresses.${idx}.${sub}`;
        const error = validateField(path, value, formData);
        if (error) tempErrors[path] = error;
      });
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      const firstError = Object.keys(tempErrors)[0];
      document
        .querySelector(`[name="${firstError}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setSaving(false);
      return;
    }

    try {
      const fd = new FormData();

      fd.append("organizationName", formData.organizationName || "");
      fd.append("organizationLegalName", formData.organizationLegalName || "");
      fd.append("registrationNumber", formData.registrationNumber || "");
      fd.append("gstNumber", formData.gstNumber || "");
      fd.append("panNumber", formData.panNumber || "");
      fd.append("cinNumber", formData.cinNumber || "");
      fd.append("website", formData.website || "");
      fd.append("email", formData.email || "");
      fd.append("contactNumber", formData.contactNumber || "");
      fd.append("domain", formData.domain || "");
      fd.append("industryType", formData.industryType || "");
      fd.append("establishedDate", formData.establishedDate || "");
      fd.append("timezone", formData.timezone || "");
      if (formData.autoClockOutTime) {
        fd.append("autoClockOutTime", `${formData.autoClockOutTime}:00`);
      } else {
        fd.append("autoClockOutTime", "");
      }

      fd.append("currencyCode", formData.currencyCode || "");
      fd.append("accountNumber", formData.accountNumber || "");
      fd.append("accountHolderName", formData.accountHolderName || "");
      fd.append("bankName", formData.bankName || "");
      fd.append("ifscCode", formData.ifscCode || "");
      fd.append("branchName", formData.branchName || "");
      fd.append("prefix", formData.prefix || "");
      fd.append("sequenceNumber", String(formData.sequenceNumber ?? ""));
      fd.append("companyType", formData.companyType || "");
      if (formData.attendancePolicy?.absentMaxMinutes != null) {
        fd.append(
          "attendancePolicy.absentMaxMinutes",
          String(Math.round(Number(formData.attendancePolicy.absentMaxMinutes) * 60))
        );
      }

      if (formData.attendancePolicy?.fullDayMinMinutes != null) {
        fd.append(
          "attendancePolicy.fullDayMinMinutes",
          String(Math.round(Number(formData.attendancePolicy.fullDayMinMinutes) * 60))
        );
      }
      if (formData.logo) fd.append("logo", formData.logo);
      if (formData.digitalSignature)
        fd.append("digitalSignature", formData.digitalSignature);

      formData.addresses.forEach((addr, i) => {
        if (addr.addressId)
          fd.append(`addresses[${i}].addressId`, addr.addressId);
        fd.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        fd.append(`addresses[${i}].streetName`, addr.streetName || "");
        fd.append(`addresses[${i}].city`, addr.city || "");
        fd.append(`addresses[${i}].state`, addr.state || "");
        fd.append(`addresses[${i}].country`, addr.country || "");
        fd.append(`addresses[${i}].pincode`, addr.pincode || "");
        fd.append(`addresses[${i}].addressType`, addr.addressType || "OFFICE");
      });

      for (let pair of fd.entries()) {
      }

      const res = await organizationService.update(id, fd);

      if (res.flag) {
        Swal.fire({
          title: "Success",
          text: "Organization updated successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => router.push("/admin-dashboard/organization/list"));
      } else {
        Swal.fire("Error", res.message || "Update failed", "error");
      }
    } catch (err: any) {
      console.log("UPDATE ERROR:", err);
      console.log("ERROR RESPONSE:", err?.response);
      Swal.fire("Error", err.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!id) return;

    const result = await Swal.fire({
      title: "Delete Organization?",
      html: `
        <div style="text-align:left">
           <p className="text-sm text-red-600 mb-4">
    Deleting this organization will permanently remove all associated data.
    This action cannot be undone.
  </p>
          <br/>
          <p>Type <b>${formData.organizationName}</b> to confirm:</p>
        </div>
      `,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Enter organization name",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete Permanently",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      preConfirm: (value) => {
        if (value !== formData.organizationName) {
          Swal.showValidationMessage(
            "Organization name does not match. Deletion cancelled."
          );
        }
      },
    });

    if (!result.isConfirmed) return;

    setDeleting(true);

    try {
      const res = await organizationService.delete(id);

      if (res.flag) {
        await Swal.fire({
          icon: "success",
          title: "Deleted Successfully",
          text: "Organization has been permanently removed.",
          confirmButtonColor: "#4f46e5",
        });

        router.push("/admin-dashboard/organization/list");
      } else {
        throw new Error(res.message || "Delete failed");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err.message || "Something went wrong.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <BackButton to="/admin-dashboard/organization/list" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Edit Organization
          </h1>
          <div className="w-10" />
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Organization Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Display name of the organization. Must be unique." />
                  </Label>
                  <Input
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter organization name"
                    maxLength={100}
                    required
                  />
                  {fieldError(errors, "organizationName")}
                </div>

                {/* Legal Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Legal Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full legal name as registered with government authorities." />
                  </Label>
                  <Input
                    name="organizationLegalName"
                    value={formData.organizationLegalName}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter legal name"
                    maxLength={100}
                    required
                  />
                  {fieldError(errors, "organizationLegalName")}
                </div>

                {/* Registration Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Registration Number <span className="text-red-500">*</span>
                    <TooltipHint hint="Company registration number (e.g., UDYAM-AB-12-0001234, ROC number). Alphanumeric only, converted to uppercase." />
                  </Label>
                  <Input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "REGISTRATION_NUMBER",
                        "registration_number",
                        "registrationNumber",
                        id,
                        3
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="e.g., UDYAM-AB-12-0001234"
                    maxLength={50}
                    required
                  />
                  {fieldError(errors, "registrationNumber")}
                </div>

                {/* GST Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    GST Number <span className="text-red-500">*</span>
                    <TooltipHint hint="15-digit GSTIN (e.g., 22AAAAA0000A1Z5). Automatically converted to uppercase." />
                  </Label>
                  <Input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "GST",
                        "gst_number",
                        "gstNumber",
                        id,
                        15
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter GST number"
                    maxLength={15}
                    required
                  />
                  {fieldError(errors, "gstNumber")}
                </div>

                {/* PAN Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    PAN Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-character PAN (e.g., ABCDE1234F). Automatically converted to uppercase." />
                  </Label>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "PAN_NUMBER",
                        "pan_number",
                        "panNumber",
                        id,
                        10
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter PAN number"
                    maxLength={10}
                    required
                  />
                  {fieldError(errors, "panNumber")}
                </div>

                {/* CIN Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    CIN Number <span className="text-red-500">*</span>
                    <TooltipHint hint="21-character Corporate Identity Number (e.g., L12345MH2020PLC123456). Automatically uppercase." />
                  </Label>
                  <Input
                    name="cinNumber"
                    value={formData.cinNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "CIN_NUMBER",
                        "cin_number",
                        "cinNumber",
                        id,
                        21
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="Enter CIN number"
                    maxLength={21}
                    required
                  />
                  {fieldError(errors, "cinNumber")}
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Website
                    <TooltipHint hint="Official website URL (include https://). Example: https://company.com" />
                  </Label>
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="https://example.com"
                  />
                  {fieldError(errors, "website")}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                    <TooltipHint hint="Official organization email. Must be unique and in lowercase only." />
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur("EMAIL", "email", "email", id)(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter email"
                    required
                  />
                  {fieldError(errors, "email")}
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Contact Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-digit Indian mobile number starting with 6-9." />
                  </Label>
                  <Input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "CONTACT_NUMBER",
                        "contact_number",
                        "contactNumber",
                        id,
                        10
                      )(e);
                    }}
                    maxLength={10}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter 10-digit mobile"
                    required
                  />
                  {fieldError(errors, "contactNumber")}
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Domain <span className="text-red-500">*</span>
                    <TooltipHint hint="Primary industry domain of the organization." />
                  </Label>
                  <select
                    name="domain"
                    value={formData.domain || ""}
                    onChange={handleValidatedChange}           // ← this is enough — validation runs here
                    required
                    className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  >
                    <option value="" >
                      Select Domain
                    </option>
                    {DOMAIN_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {fieldError(errors, "domain")}
                </div>

                {/* Industry Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Industry Type <span className="text-red-500">*</span>
                    <TooltipHint hint="Specific industry type within the chosen domain." />
                  </Label>
                  <select
                    name="industryType"
                    value={formData.industryType || ""}
                    onChange={handleValidatedChange}
                    required
                    className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  >
                    <option value="" >
                      Select Industry Type
                    </option>
                    {INDUSTRY_TYPE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {fieldError(errors, "industryType")}
                </div>

                {/* Established Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Established Date <span className="text-red-500">*</span>
                    <TooltipHint hint="Date when the organization was officially incorporated." />
                  </Label>
                  <Input
                    name="establishedDate"
                    type="date"
                    value={formData.establishedDate}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  {fieldError(errors, "establishedDate")}
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Timezone
                  </Label>
                  <select
                    name="timezone"
                    value={formData.timezone || ""}
                    onChange={handleValidatedChange}
                    className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  >
                    <option value="" >
                      Select Timezone
                    </option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Auto Clock Out Time */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Auto Clock Out Time <span className="text-red-500">*</span>
                    <TooltipHint hint="Automatic clock-out time in 24-hour format (HH:mm)." />
                  </Label>

                  <Input
                    name="autoClockOutTime"
                    type="time"
                    value={formData.autoClockOutTime ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />

                  {fieldError(errors, "autoClockOutTime")}
                </div>

                {/* Currency Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Currency Code <span className="text-red-500">*</span>
                    <TooltipHint hint="Primary currency used by the organization for financial transactions." />
                  </Label>
                  <select
                    name="currencyCode"
                    value={formData.currencyCode || ""}
                    onChange={handleValidatedChange}
                    required
                    className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                  >
                    <option value="" >
                      Select Currency
                    </option>
                    {CURRENCY_CODE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {fieldError(errors, "currencyCode")}
                </div>

                {/* Absent Max Hours */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Absent Max Hours <span className="text-red-500">*</span>
                    <TooltipHint hint="Maximum hours of absence allowed before marking as absent. Enter in hours (e.g., 4 for 4 hours). Automatically converted to minutes for backend." />
                  </Label>

                  <Input
                    name="attendancePolicy.absentMaxMinutes"
                    type="text"
                    onWheel={preventWheelChange}
                    placeholder="e.g.,4 for 4 hours"
                    inputMode="numeric"
                    required
                    value={formData.attendancePolicy?.absentMaxMinutes ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12"
                  />

                  {fieldError(errors, "attendancePolicy.absentMaxMinutes")}
                </div>

                {/* Full Day Min Hours */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Full Day Min Hours <span className="text-red-500">*</span>
                    <TooltipHint hint="Minimum hours required to be considered a full day. Enter in hours (e.g., 8 for 8 hours). Automatically converted to minutes for backend." />
                  </Label>

                  <Input
                    name="attendancePolicy.fullDayMinMinutes"
                    type="text"
                    required
                    onWheel={preventWheelChange}
                    placeholder="e.g.,8 for 8 hours"
                    inputMode="numeric"
                    value={formData.attendancePolicy?.fullDayMinMinutes ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12"
                  />

                  {fieldError(errors, "attendancePolicy.fullDayMinMinutes")}
                </div>

              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>
                  Logo
                  <TooltipHint hint="Upload organization logo (image files only). Max size: 2MB." />
                </Label>
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-24 h-24 object-cover rounded border shadow-sm mb-2"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleFileChange("logo", file);
                    if (file) setLogoPreview(URL.createObjectURL(file));
                    else setLogoPreview("");
                  }}
                  className="h-12 text-base border-gray-300"
                />
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Account Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Account Number <span className="text-red-500">*</span>
                    <TooltipHint hint="Bank account number (9-18 digits only)." />
                  </Label>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber ?? ""}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "ACCOUNT_NUMBER",
                        "account_number",
                        "accountNumber",
                        id,
                        9
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter account number"
                    required
                  />
                  {fieldError(errors, "accountNumber")}
                </div>

                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Account Holder Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full name as per bank records. Only letters and spaces allowed." />
                  </Label>
                  <Input
                    name="accountHolderName"
                    value={formData.accountHolderName ?? ""}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      if (!id) return;
                      handleUniqueBlur(
                        "ACCOUNT_HOLDER_NAME",
                        "account_holder_name",
                        "accountHolderName",
                        id,
                        3
                      )(e);
                    }}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="ABC Company Private Limited"
                    required
                  />
                  {fieldError(errors, "accountHolderName")}
                </div>

                {/* IFSC Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    IFSC Code <span className="text-red-500">*</span>
                    <TooltipHint hint="11-character IFSC code. Auto-fills bank & branch name on blur." />
                  </Label>

                  <div className="relative">
                    <Input
                      name="ifscCode"
                      value={formData.ifscCode ?? ""}
                      onChange={handleValidatedChange}
                      onBlur={() => handleIfscLookup(formData.ifscCode ?? "")}
                      className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10 uppercase"
                      placeholder="Enter IFSC (auto-fills bank/branch)"
                      maxLength={11}
                      required
                    />
                    {isLookingUp && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  {fieldError(errors, "ifscCode")}
                </div>

                {/* Bank Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Bank Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Auto-filled based on IFSC code. Read-only." />
                  </Label>
                  <Input
                    name="bankName"
                    value={formData.bankName ?? ""}
                    readOnly
                    className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                    placeholder="auto-filled"
                    required
                  />
                  {fieldError(errors, "bankName")}
                </div>

                {/* Branch Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Branch Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Auto-filled based on IFSC code. Read-only." />
                  </Label>
                  <Input
                    name="branchName"
                    value={formData.branchName ?? ""}
                    readOnly
                    className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                    placeholder="auto-filled"
                    required
                  />
                  {fieldError(errors, "branchName")}
                </div>
              </div>

              {/* Digital Signature */}
              <div className="space-y-2">
                <Label>
                  Digital Signature
                  <TooltipHint hint="Upload digital signature file (e.g., .p12, .pfx, .cer) or an image. Max size: 2MB." />
                </Label>
                {signaturePreview && (
                  <img
                    src={signaturePreview}
                    alt="Digital Signature Preview"
                    className="h-28 object-contain border rounded-xl p-3 bg-white shadow-sm"
                  />
                )}
                <Input
                  type="file"
                  accept=".p12,.pfx,.cer,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleFileChange("digitalSignature", file);
                    if (file) {
                      if (file.type.startsWith("image/")) {
                        setSignaturePreview(URL.createObjectURL(file));
                      } else {
                        setSignaturePreview("");
                      }
                    } else {
                      setSignaturePreview("");
                    }
                  }}
                  className="h-12 text-base border-gray-300"
                />
                {errors.digitalSignature && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.digitalSignature}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Prefix */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Prefix <span className="text-red-500">*</span>
                    <TooltipHint hint="Invoice or organization prefix (e.g., INV, ORG)" />
                  </Label>
                  <Input
                    required
                    name="prefix"
                    value={formData.prefix ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                    placeholder="INV"
                    maxLength={10}
                  />
                  {fieldError(errors, "prefix")}
                </div>



                {/* Sequence Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Sequence Number <span className="text-red-500">*</span>
                    <TooltipHint hint="Starting sequence number (e.g., 1001)" />
                  </Label>
                  <Input
                    required
                    name="sequenceNumber"
                    type="text"
                    onWheel={preventWheelChange}
                    inputMode="numeric"
                    value={formData.sequenceNumber ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12"
                    placeholder="1001"
                  />
                  {fieldError(errors, "sequenceNumber")}
                </div>
                {/* Company Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Company Type <span className="text-red-500">*</span>
                    <TooltipHint hint="e.g. Private Limited, LLP, Partnership" />
                  </Label>
                  <Input
                    required
                    name="companyType"
                    value={formData.companyType ?? ""}
                    onChange={handleValidatedChange}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Private Limited"
                    maxLength={50}
                  />
                  {fieldError(errors, "companyType")}
                </div>
              </div>
              {/* Addresses */}
              <div className="border-t border-gray-200 pt-10 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <MapPin className="h-7 w-7 text-indigo-600" />
                    Addresses
                  </h3>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={addAddress}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-medium shadow-sm"

                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Address
                  </Button>
                </div>

                {formData.addresses.map((address, idx) => (
                  <div key={idx} className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                          Address {idx + 1}
                          {address.addressType && (
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 shadow-sm">
                              {address.addressType}
                            </span>
                          )}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAddress(idx)}
                          disabled={formData.addresses.length <= 1}   // ← disable when last one
                          className={formData.addresses.length <= 1 ? "opacity-40 cursor-not-allowed" : ""}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* country */}
                        <div className="space-y-2">
                          <Label>
                            Country<span className="text-red-500">*</span>
                            <TooltipHint hint="Country for this address." />
                          </Label>
                          <select
                            required
                            value={address.country || ""}
                            onChange={async (e) => {
                              const selectedCountry = e.target.value;

                              handleAddressChange(idx, "country", selectedCountry);

                              handleAddressChange(idx, "state", "");

                              const states =
                                await adminService.getStatesByCountryV1(selectedCountry);

                              setStatesMap((prev) => ({
                                ...prev,
                                [idx]: states || [],
                              }));
                            }}

                            className="!h-12 text-base w-full px-3 border rounded-md"
                          >
                            <option value="">Select Country</option>
                            {filteredCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                          {fieldError(errors, `addresses.${idx}.country`)}
                        </div>
                        {/* state */}
                        <div className="space-y-2">
                          <Label>
                            State<span className="text-red-500">*</span>
                            <TooltipHint hint="Name of the state for this address." />
                          </Label>
                          {statesMap[idx]?.length ? (
                            <select
                              name={`addresses.${idx}.state`}           // optional: helps with native form
                              value={address.state || ""}
                              onChange={(e) => handleAddressChange(idx, "state", e.target.value)}
                              onBlur={() => {
                                // Optional: trigger validation on blur (if you have validator for state)
                                const err = validateField(`addresses.${idx}.state`, address.state, formData);
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  if (err) next[`addresses.${idx}.state`] = err;
                                  else delete next[`addresses.${idx}.state`];
                                  return next;
                                });
                              }}
                              required

                              className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                            >
                              <option value="" >
                                Select State
                              </option>
                              {statesMap[idx].map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              required
                              disabled={!address.country}
                              value={address.state || ""}
                              onChange={(e) =>
                                handleAddressChange(idx, "state", e.target.value)
                              }
                              placeholder="Enter State"
                              className="!h-12 text-base w-full"
                            />
                          )}
                          {fieldError(errors, `addresses.${idx}.state`)}
                        </div>
                        {/* city */}
                        <div className="space-y-2">
                          <Label>
                            City<span className="text-red-500">*</span>
                            <TooltipHint hint="Name of the city for this address." />
                          </Label>
                          <Input
                            required
                            name={`addresses.${idx}.city`}
                            value={address.city || ""}
                            onChange={(e) =>
                              handleAddressChange(idx, "city", e.target.value)
                            }
                            placeholder="e.g. Mumbai"
                            className="!h-12 text-base w-full"

                          />
                          {fieldError(errors, `addresses.${idx}.city`)}
                        </div>

                        {/* H.no */}
                        <div className="space-y-2">
                          <Label>
                            House No.<span className="text-red-500">*</span>
                            <TooltipHint hint="House or building number for this address." />
                          </Label>
                          <Input
                            required
                            value={address.houseNo || ""}
                            onChange={(e) =>
                              handleAddressChange(idx, "houseNo", e.target.value)
                            }
                            placeholder="e.g. 221B"
                            className="!h-12 text-base w-full"

                          />
                          {fieldError(errors, `addresses.${idx}.houseNo`)}
                        </div>
                        {/* street name */}
                        <div className="space-y-2">
                          <Label>
                            Street Name<span className="text-red-500">*</span>
                            <TooltipHint hint="Name of the street for this address." />
                          </Label>
                          <Input
                            required
                            value={address.streetName || ""}
                            onChange={(e) =>
                              handleAddressChange(
                                idx,
                                "streetName",
                                e.target.value
                              )
                            }
                            className="!h-12 text-base w-full"

                            placeholder="e.g. Baker Street"
                          />
                          {fieldError(errors, `addresses.${idx}.streetName`)}
                        </div>
                        {/* pincode */}
                        <div className="space-y-2">
                          <Label>
                            Pincode<span className="text-red-500">*</span>
                            <TooltipHint hint="6-digit postal code for this address." />
                          </Label>
                          <Input
                            required
                            value={address.pincode || ""}
                            onChange={(e) => {
                              handleAddressChange(idx, "pincode", e.target.value);
                            }}
                            placeholder="e.g. 400001"
                            className="!h-12 text-base w-full"

                          />
                          {fieldError(errors, `addresses.${idx}.pincode`)}
                        </div>

                        {/* address type */}
                        <div className="space-y-2">
                          <Label>
                            Address Type<span className="text-red-500">*</span>
                            <TooltipHint hint="Type of address (e.g., Registered, Office)." />
                          </Label>
                          <select
                            name={`addresses.${idx}.addressType`}
                            value={address.addressType || ""}
                            onChange={(e) => handleAddressChange(idx, "addressType", e.target.value as AddressType)}
                            onBlur={() => {
                              // Optional: run validation on blur
                              const err = validateField(
                                `addresses.${idx}.addressType`,
                                address.addressType,
                                formData
                              );
                              setErrors((prev) => {
                                const next = { ...prev };
                                if (err) next[`addresses.${idx}.addressType`] = err;
                                else delete next[`addresses.${idx}.addressType`];
                                return next;
                              });
                            }}
                            required
                            className="h-12 w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                          >
                            <option value="" >
                              Select type
                            </option>
                            {ADDRESS_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          {fieldError(errors, `addresses.${idx}.addressType`)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-8 border-t">

                {/* Left Side → Delete */}
                <div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteOrganization}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Organization"}
                  </Button>
                </div>

                {/* Right Side → Cancel + Update */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving || !hasChanges || !id}
                    title={!hasChanges ? "No changes made" : ""}
                  >
                    {saving ? "Saving..." : "Update Organization"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
