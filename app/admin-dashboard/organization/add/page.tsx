"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Upload, Plus, Trash2, MapPin } from "lucide-react";
import { organizationService } from "@/lib/api/organizationService";
import {
  Domain,
  CurrencyCode,
  OrganizationRequestDTO,
  AddressModel,
  AddressType,
  IndustryType,
  DOMAIN_OPTIONS,
  WORKING_MODEL_OPTIONS,
  CURRENCY_CODE_OPTIONS,
  INDUSTRY_TYPE_OPTIONS,
} from "@/lib/api/types";
import useLoading from "@/hooks/useLoading";
import Spinner from "@/components/ui/Spinner";
import BackButton from "@/components/ui/BackButton";
import Swal from "sweetalert2";
import TooltipHint from "@/components/ui/TooltipHint";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useOrganizationFieldValidation } from "@/hooks/organizationValidator";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import { employeeService } from "@/lib/api/employeeService";

// Assume AddressType enum: 'PERMANENT' | 'CURRENT' | 'OFFICE' | etc.
const ADDRESS_TYPES: AddressType[] = ["PERMANENT", "CURRENT", "OFFICE"]; // Adjust as per actual enum

// Common timezones (subset for simplicity)
const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Australia/Sydney",
  "Asia/Singapore",
];

export default function AddOrganizationPage() {
  const router = useRouter();
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
    industryType: "HEALTHCARE" as IndustryType,
    domain: "OTHER" as Domain, // Default
    establishedDate: "",
    timezone: "Asia/Kolkata", // Default
    currencyCode: "INR" as CurrencyCode, // Default
    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    digitalSignature: null,
    addresses: [], // Initially empty
    prefix: "",
    sequenceNumber: undefined,
    companyType: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { loading } = useLoading?.() ?? {
    loading: false,
    withLoading: (fn: any) => fn(),
  };
  // ────────────────────────────────────────────────
  // Reusable validation + uniqueness + form handlers
  // ────────────────────────────────────────────────
  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const { validateField } = useOrganizationFieldValidation();

  const { handleValidatedChange, handleUniqueBlur, fieldError } =
    useFormFieldHandlers(
      // Custom formatting during typing (same as your old logic)
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

        setFormData((prev) => ({ ...prev, [name]: formatted }));
      },
      setErrors,
      checkUniqueness,
      () => formData,
      validateField
    );
  // Handle file change - just update state, optionally basic check
  const handleFileChange = (
    name: "logo" | "digitalSignature",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  // IFSC Lookup - called on blur for IFSC field
  const handleIfscLookup = async (ifsc: string) => {
    const code = String(ifsc ?? "")
      .trim()
      .toUpperCase();

    // Skip if already invalid from format check or empty
    if (!code || isLookingUp || errors.ifscCode) return;

    setIsLookingUp(true);

    try {
      const res = await employeeService.getIFSCDetails(code);

      if (res?.flag && res.response) {
        const data = res.response;
        const bankName = data.BANK || "";
        const branchName = data.BRANCH || "";

        setFormData((prev) => ({
          ...prev,
          bankName,
          branchName,
          ifscCode: code,
        }));

        setSuccess("Bank details auto-filled!");
        setErrors((prev) => {
          const n = { ...prev };
          delete n["ifscCode"];
          return n;
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          ifscCode: "Invalid IFSC or lookup failed",
        }));
      }
    } catch (err: any) {
      console.log("IFSC lookup error", err);
      setErrors((prev) => ({
        ...prev,
        ifscCode: "Invalid IFSC or lookup failed",
      }));
    } finally {
      setIsLookingUp(false);
    }
  };
  // Address field change (only update state while typing)
  const handleAddressChange = (
    index: number,
    field: keyof AddressModel,
    value: string
  ) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };

    setFormData((prev) => ({
      ...prev,
      addresses: newAddresses,
    }));
  };

  // Add/Remove address
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

    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Clean errors for that index
    setErrors((prev) => {
      const newErr = { ...prev };
      delete newErr[`addresses.${index}.city`];
      delete newErr[`addresses.${index}.state`];
      delete newErr[`addresses.${index}.country`];
      delete newErr[`addresses.${index}.pincode`];

      return newErr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrors({}); // clear old errors

    // Step 1: Run full client-side validation using your validator
    const tempErrors: Record<string, string> = {};

    // Main fields (same as your old requiredFields list)
    const mainFields = [
      { name: "organizationName", value: formData.organizationName },
      { name: "organizationLegalName", value: formData.organizationLegalName },
      { name: "registrationNumber", value: formData.registrationNumber },
      { name: "gstNumber", value: formData.gstNumber },
      { name: "panNumber", value: formData.panNumber },
      { name: "cinNumber", value: formData.cinNumber },
      { name: "website", value: formData.website },
      { name: "email", value: formData.email },
      { name: "contactNumber", value: formData.contactNumber },
      { name: "domain", value: formData.domain },
      { name: "industryType", value: formData.industryType },
      { name: "establishedDate", value: formData.establishedDate },
      { name: "currencyCode", value: formData.currencyCode },
      { name: "accountNumber", value: formData.accountNumber },
      { name: "accountHolderName", value: formData.accountHolderName },
      { name: "ifscCode", value: formData.ifscCode },
      { name: "prefix", value: formData.prefix },
      { name: "sequenceNumber", value: formData.sequenceNumber },
      { name: "companyType", value: formData.companyType },
    ];

    mainFields.forEach(({ name, value }) => {
      const error = validateField(name, value, formData);
      if (error) tempErrors[name] = error;
    });

    // Optional: Validate first address if at least one exists
    if (formData.addresses.length > 0) {
      const addr = formData.addresses[0];
      const addressFields = [
        { sub: "city", value: addr.city },
        { sub: "state", value: addr.state },
        { sub: "country", value: addr.country },
        { sub: "pincode", value: addr.pincode },
      ];

      addressFields.forEach(({ sub, value }) => {
        const fieldPath = `addresses.0.${sub}`;
        const error = validateField(fieldPath, value, formData);
        if (error) tempErrors[fieldPath] = error;
      });
    }

    // If there are any client-side errors → show them and stop
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);

      // Scroll to + focus first error field
      setTimeout(() => {
        const firstErrorField = Object.keys(tempErrors)[0];
        const input = document.querySelector(
          `[name="${firstErrorField}"]`
        ) as HTMLInputElement;
        if (input) {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
          input.focus();
        }
      }, 100);

      setIsSubmitting(false);
      return;
    }

    // Step 2: All client-side checks passed → proceed to submit
    try {
      const form = new FormData();

      // Append fields (same as your code)
      form.append("organizationName", formData.organizationName || "");
      form.append(
        "organizationLegalName",
        formData.organizationLegalName || ""
      );
      form.append("registrationNumber", formData.registrationNumber || "");
      form.append("gstNumber", formData.gstNumber || "");
      form.append("panNumber", formData.panNumber || "");
      form.append("cinNumber", formData.cinNumber || "");
      form.append("website", formData.website || "");
      form.append("email", formData.email || "");
      form.append("contactNumber", formData.contactNumber || "");
      form.append("domain", formData.domain || "");
      form.append("industryType", formData.industryType || "");
      form.append("establishedDate", formData.establishedDate || "");
      form.append("timezone", formData.timezone || "");
      form.append("currencyCode", formData.currencyCode || "");
      form.append("accountNumber", formData.accountNumber || "");
      form.append("accountHolderName", formData.accountHolderName || "");
      form.append("bankName", formData.bankName || "");
      form.append("ifscCode", formData.ifscCode || "");
      form.append("branchName", formData.branchName || "");
      form.append("prefix", formData.prefix || "");
      form.append("sequenceNumber", String(formData.sequenceNumber ?? ""));
      form.append("companyType", formData.companyType || "");

      if (formData.logo) form.append("logo", formData.logo);
      if (formData.digitalSignature)
        form.append("digitalSignature", formData.digitalSignature);

      formData.addresses.forEach((addr, i) => {
        form.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        form.append(`addresses[${i}].streetName`, addr.streetName || "");
        form.append(`addresses[${i}].city`, addr.city || "");
        form.append(`addresses[${i}].state`, addr.state || "");
        form.append(`addresses[${i}].country`, addr.country || "");
        form.append(`addresses[${i}].pincode`, addr.pincode || "");
        form.append(
          `addresses[${i}].addressType`,
          addr.addressType || "OFFICE"
        );
      });

      // API call
      const response = await organizationService.add(form);

      if (!response.flag) {
        throw response;
      }

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Organization added successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin-dashboard/organization/list");
    } catch (err: any) {
      console.log("Backend error:", err);

      let fieldErrors: Record<string, string> = {};
      let backendMessage = "Something went wrong";

      // Backend field errors
      if (err?.fieldErrors) {
        fieldErrors = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([field, msg]) => [
            field,
            Array.isArray(msg) ? msg[0] : String(msg),
          ])
        );
      } else if (err?.errors && typeof err.errors === "object") {
        fieldErrors = Object.fromEntries(
          Object.entries(err.errors).map(([field, msg]) => [
            field,
            Array.isArray(msg) ? msg[0] : String(msg),
          ])
        );
      }

      // Show field errors
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);

        setTimeout(() => {
          const firstField = Object.keys(fieldErrors)[0];
          const input = document.querySelector(
            `[name="${firstField}"]`
          ) as HTMLElement;
          if (input) {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
            input.focus();
          }
        }, 100);

        setIsSubmitting(false);
        return;
      }

      // Fallback generic error
      if (err?.message) backendMessage = err.message;

      Swal.fire({
        icon: "error",
        title: "Error",
        text: backendMessage,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="container mx-auto py-6">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0">
          <BackButton to="/admin-dashboard/organization/list" />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Add Organization
        </h1>
      </div>
      <Card>
        <CardContent>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <Spinner size="lg" />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Organization Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Display name of the organization. Must be unique." />
                </Label>
                <Input
                  required
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleValidatedChange}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter organization name"
                  maxLength={100}
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
                  required
                  name="organizationLegalName"
                  value={formData.organizationLegalName}
                  onChange={handleValidatedChange}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter legal name"
                  maxLength={100}
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
                  required
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "REGISTRATION_NUMBER",
                    "registration_number",
                    "registrationNumber",
                    null,
                    3
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                  placeholder="e.g., UDYAM-AB-12-0001234"
                  maxLength={50}
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
                  required
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "GST",
                    "gst_number",
                    "gstNumber",
                    null,
                    15
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                  placeholder="Enter GST number"
                  maxLength={15}
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
                  required
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "PAN_NUMBER",
                    "pan_number",
                    "panNumber",
                    null,
                    10
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                  placeholder="Enter PAN number"
                  maxLength={10}
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
                  required
                  name="cinNumber"
                  value={formData.cinNumber}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "CIN_NUMBER",
                    "cin_number",
                    "cinNumber",
                    null,
                    21
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                  placeholder="Enter CIN number"
                  maxLength={21}
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
                  required
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur("EMAIL", "email", "email", null)}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter email"
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
                  required
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "CONTACT_NUMBER",
                    "contact_number",
                    "contactNumber",
                    null,
                    10
                  )}
                  maxLength={10}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 10-digit mobile"
                />
                {fieldError(errors, "contactNumber")}
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Domain <span className="text-red-500">*</span>
                  <TooltipHint hint="Primary industry domain of the organization." />
                </Label>
                <Select
                  name="domain"
                  value={formData.domain}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, domain: val as Domain }));
                    const error = validateField("domain", val, formData);
                    setErrors((prev) => {
                      const next = { ...prev };
                      error ? (next.domain = error) : delete next.domain;
                      return next;
                    });
                  }}
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))} */}
                    {DOMAIN_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError(errors, "domain")}
              </div>

              {/* Industry Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Industry Type <span className="text-red-500">*</span>
                  <TooltipHint hint="Specific industry type within the chosen domain." />
                </Label>
                <Select
                  name="industryType"
                  value={formData.industryType}
                  onValueChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      industryType: val as IndustryType,
                    }));
                    const error = validateField("industryType", val, formData);
                    setErrors((prev) => {
                      const next = { ...prev };
                      error
                        ? (next.industryType = error)
                        : delete next.industryType;
                      return next;
                    });
                  }}
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue placeholder="Select Industry Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* {Object.entries(INDUSTRY_TYPE_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )} */}
                    {INDUSTRY_TYPE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError(errors, "industryType")}
              </div>

              {/* Established Date */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Established Date <span className="text-red-500">*</span>
                  <TooltipHint hint="Date when the organization was officially incorporated." />
                </Label>
                <Input
                  required
                  name="establishedDate"
                  type="date"
                  value={formData.establishedDate}
                  onChange={handleValidatedChange}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                {fieldError(errors, "establishedDate")}
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Timezone
                </Label>
                <Select
                  name="timezone"
                  value={formData.timezone}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, timezone: val }))
                  }
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency Code */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Currency Code <span className="text-red-500">*</span>
                  <TooltipHint hint="Primary currency for financial transactions (e.g., INR, USD)." />
                </Label>
                <Select
                  name="currencyCode"
                  value={formData.currencyCode}
                  onValueChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      currencyCode: val as CurrencyCode,
                    }));
                    const error = validateField("currencyCode", val, formData);
                    setErrors((prev) => {
                      const next = { ...prev };
                      error
                        ? (next.currencyCode = error)
                        : delete next.currencyCode;
                      return next;
                    });
                  }}
                >
                  <SelectTrigger className="w-full min-w-[200px] !h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* {Object.entries(CURRENCY_CODE_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )} */}
                    {CURRENCY_CODE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError(errors, "currencyCode")}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Logo
                <TooltipHint hint="Upload organization logo (JPEG, PNG). Max size 2MB." />
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("logo", e.target.files?.[0] || null)
                  }
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {formData.logo && (
                <p className="text-sm text-gray-600">
                  Selected: {formData.logo.name}
                </p>
              )}
              {errors.logo && (
                <p className="text-red-500 text-xs mt-1">{errors.logo}</p>
              )}
            </div>

            {/* Bank Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Account Number */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                  <TooltipHint hint="Bank account number (9-18 digits only)." />
                </Label>
                <Input
                  required
                  name="accountNumber"
                  value={formData.accountNumber ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "ACCOUNT_NUMBER",
                    "account_number",
                    "accountNumber",
                    null,
                    9
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter account number"
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
                  required
                  name="accountHolderName"
                  value={formData.accountHolderName ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleUniqueBlur(
                    "ACCOUNT_HOLDER_NAME",
                    "account_holder_name",
                    "accountHolderName",
                    null,
                    3
                  )}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="ABC Company Private Limited"
                />
                {fieldError(errors, "accountHolderName")}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  IFSC Code <span className="text-red-500">*</span>
                  <TooltipHint hint="11-character IFSC code. Auto-fills bank & branch name on blur." />
                </Label>
                <div className="relative">
                  <Input
                    required
                    name="ifscCode"
                    value={formData.ifscCode ?? ""}
                    onChange={handleValidatedChange} // ← centralized formatting + validation
                    onBlur={() => handleIfscLookup(formData.ifscCode ?? "")}
                    className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10 uppercase"
                    placeholder="Enter IFSC (auto-fills bank/branch)"
                    maxLength={11}
                  />
                  {isLookingUp && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                {fieldError(errors, "ifscCode")}
              </div>

              {/* Bank Name (auto-filled, read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Bank Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Auto-filled based on IFSC code." />
                </Label>
                <Input
                  required
                  name="bankName"
                  value={formData.bankName ?? ""}
                  readOnly
                  className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                  placeholder="auto-filled"
                />
                {fieldError(errors, "bankName")}
              </div>

              {/* Branch Name (auto-filled, read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Branch Name <span className="text-red-500">*</span>
                  <TooltipHint hint="Auto-filled based on IFSC code." />
                </Label>
                <Input
                  required
                  name="branchName"
                  value={formData.branchName ?? ""}
                  readOnly
                  className="h-12 text-base border-gray-300 bg-gray-50 cursor-not-allowed"
                  placeholder="auto-filled"
                />
                {fieldError(errors, "branchName")}
              </div>
            </div>
            {/* Prefix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="h-12"
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
                  type="number"
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
                  className="h-12"
                  placeholder="Private Limited"
                  maxLength={50}
                />
                {fieldError(errors, "companyType")}
              </div>
            </div>

            {/* Digital Signature Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Digital Signature
                <TooltipHint hint="Upload digital signature image (JPEG, PNG). Max size 2MB." />
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      "digitalSignature",
                      e.target.files?.[0] || null
                    )
                  }
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {formData.digitalSignature && (
                <p className="text-sm text-gray-600">
                  Selected: {formData.digitalSignature.name}
                </p>
              )}
              {errors.digitalSignature && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.digitalSignature}
                </p>
              )}
            </div>

            {/* ==================== ADDRESSES (OPTIONAL) ==================== */}
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
              {formData.addresses.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200">
                  <MapPin className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
                  <p className="text-xl font-medium text-gray-700">
                    No addresses added yet
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    Click the button above to add a registered or office address
                  </p>
                </div>
              )}

              {/* Dynamic Address Forms — Appear only when added */}
              {formData.addresses.map((address, index) => (
                <div
                  key={index}
                  className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                        Address {index + 1}
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
                        onClick={() => removeAddress(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* House No. / Flat */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          House No. / Flat
                          <TooltipHint hint="Apartment or house number (e.g., 221B, Flat 4A)." />
                        </Label>
                        <Input
                          value={address.houseNo || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              index,
                              "houseNo",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 221B, Flat 4A"
                          className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {fieldError(errors, `addresses.${index}.houseNo`)}
                      </div>

                      {/* Street / Locality */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Street / Locality
                          <TooltipHint hint="Street name or locality (e.g., Baker Street, Andheri West)." />
                        </Label>
                        <Input
                          value={address.streetName || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              index,
                              "streetName",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Baker Street"
                          className="h-12"
                        />
                        {fieldError(errors, `addresses.${index}.streetName`)}
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          City
                          <TooltipHint hint="City or town of the address." />
                        </Label>
                        <Input
                          value={address.city || ""}
                          onChange={(e) =>
                            handleAddressChange(index, "city", e.target.value)
                          }
                          placeholder="e.g. Mumbai"
                          className="h-12"
                        />
                        {fieldError(errors, `addresses.${index}.city`)}
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          State
                          <TooltipHint hint="State or province of the address." />
                        </Label>
                        <Input
                          value={address.state || ""}
                          onChange={(e) =>
                            handleAddressChange(index, "state", e.target.value)
                          }
                          placeholder="e.g. Maharashtra"
                          className="h-12"
                        />
                        {fieldError(errors, `addresses.${index}.state`)}
                      </div>

                      {/* Pincode */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Pincode
                          <TooltipHint hint="6-digit postal code (e.g., 400001)." />
                        </Label>
                        <Input
                          value={address.pincode || ""}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(
                              /\D/g,
                              ""
                            );
                            handleAddressChange(index, "pincode", digitsOnly);
                          }}
                          placeholder="400001"
                          maxLength={6}
                          className="h-12 font-mono"
                        />
                        {fieldError(errors, `addresses.${index}.pincode`)}
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Country
                          <TooltipHint hint="Country of the address. Default is India." />
                        </Label>
                        <Input
                          value={address.country || ""}
                          onChange={(e) =>
                            handleAddressChange(
                              index,
                              "country",
                              e.target.value
                            )
                          }
                          placeholder="India"
                          className="h-12"
                        />
                        {fieldError(errors, `addresses.${index}.country`)}
                      </div>

                      {/* Address Type */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Address Type
                          <TooltipHint hint="Type of address (e.g., Registered, Office)." />
                        </Label>
                        <Select
                          value={address.addressType || ""}
                          onValueChange={(val) =>
                            handleAddressChange(
                              index,
                              "addressType",
                              val as AddressType
                            )
                          }
                        >
                          <SelectTrigger className="w-full min-w-[200px] !h-12">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDRESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldError(errors, `addresses.${index}.addressType`)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isSubmitting ? "Adding..." : "Add Organization"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
