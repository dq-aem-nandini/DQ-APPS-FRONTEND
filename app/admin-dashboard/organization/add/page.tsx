"use client";

import { useState, useRef, useEffect } from "react";
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
  CURRENCY_CODE_OPTIONS,
  INDUSTRY_TYPE_OPTIONS,
  COUNTRY_CURRENCY_MAP,
  ADDRESS_TYPE_OPTIONS,
} from "@/lib/api/types";
import useLoading from "@/hooks/useLoading";
import BackButton from "@/components/ui/BackButton";
import Swal from "sweetalert2";
import TooltipHint from "@/components/ui/TooltipHint";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useOrganizationFieldValidation } from "@/hooks/organizationValidator";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import { employeeService } from "@/lib/api/employeeService";
import { adminService } from "@/lib/api/adminService";
const CURRENCY_COUNTRY_MAP: Record<CurrencyCode, string[]> =
  Object.entries(COUNTRY_CURRENCY_MAP).reduce((acc, [country, currency]) => {
    if (!acc[currency]) {
      acc[currency] = [];
    }
    acc[currency].push(country);
    return acc;
  }, {} as Record<CurrencyCode, string[]>);
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
    industryType: "" as IndustryType,
    domain: "" as Domain, // Default
    establishedDate: "",
    timezone: "", // Default
    autoClockOutTime: "",
    currencyCode: "" as CurrencyCode, // Default
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
        pincode: "",
        country: "",
        addressType: undefined,
      },
    ],
    prefix: "",
    sequenceNumber: undefined,
    companyType: "",
    attendancePolicy: {
      absentMaxMinutes: undefined,
      fullDayMinMinutes: undefined,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const {
    handleValidatedChange,
    handleUniqueBlur,
    handleBlurValidation,
    fieldError,
  } = useFormFieldHandlers(
    // Custom formatting during typing (same as your old logic)
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let formatted = value;

      if (["panNumber", "gstNumber", "cinNumber", "ifscCode"].includes(name)) {
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
        if (name.includes(".")) {
          const [parent, child] = name.split(".");

          return {
            ...prev,
            [parent]: {
              ...(prev[parent as keyof OrganizationRequestDTO] as any),
              [child]: formatted,
            },
          };
        }

        return { ...prev, [name]: formatted };
      });
    },
    setErrors,
    checkUniqueness,
    () => formData,
    validateField
  );

  const [countries, setCountries] = useState<string[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<
    Record<string, string[]>
  >({});
  const [statesLoadingMap, setStatesLoadingMap] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await adminService.getAllCountries();
        setCountries(response || []);
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };

    fetchCountries();
  }, []);
  const fetchStatesForCountry = async (country: string, index: number) => {
    if (!country) return;

    const normalized = country.trim().toLowerCase();

    if (statesByCountry[normalized]) return;

    try {
      setStatesLoadingMap((prev) => ({ ...prev, [index]: true }));

      const response = await adminService.getStatesByCountryV1(country);

      setStatesByCountry((prev) => ({
        ...prev,
        [normalized]: response || [],
      }));
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setStatesLoadingMap((prev) => ({ ...prev, [index]: false }));
    }
  };

  useEffect(() => {
    const country = formData.addresses[0]?.country?.trim();
    console.log("Country changed to:", country);

    if (!country) return;

    const expectedCurrency = COUNTRY_CURRENCY_MAP[country];
    console.log("Mapped currency:", expectedCurrency);

    if (expectedCurrency && formData.currencyCode !== expectedCurrency) {
      console.log(`Auto-select currency → ${expectedCurrency} because country = ${country}`);

      setFormData(prev => ({
        ...prev,
        currencyCode: expectedCurrency
      }));
    }
  }, [formData.addresses[0]?.country]);


  useEffect(() => {
    if (!formData.currencyCode) return;

    const country = formData.addresses[0]?.country?.trim();
    if (!country) return;

    const allowed = CURRENCY_COUNTRY_MAP[formData.currencyCode] || [];
    console.log(`Clearing invalid country ${country} for currency ${formData.currencyCode}`);

    const isValid = allowed.some(
      c => c.trim().toLowerCase() === country.toLowerCase()
    );

    if (!isValid) {
      setFormData(prev => ({
        ...prev,
        addresses: prev.addresses.map((a, i) =>
          i === 0 ? { ...a, country: "" } : a
        )
      }));
    }
  }, [formData.currencyCode]);


  const filteredCountries = formData.currencyCode
    ? CURRENCY_COUNTRY_MAP[formData.currencyCode] ?? countries
    : countries || [];
  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.blur();
  };
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;

    // ✅ Let browser show native required popup
    if (!form.checkValidity()) {
      return;
    }

    e.preventDefault(); // prevent only after valid
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();

      formDataToSend.append(
        "organizationName",
        formData.organizationName || ""
      );
      formDataToSend.append(
        "organizationLegalName",
        formData.organizationLegalName || ""
      );
      formDataToSend.append(
        "registrationNumber",
        formData.registrationNumber || ""
      );
      formDataToSend.append("gstNumber", formData.gstNumber || "");
      formDataToSend.append("panNumber", formData.panNumber || "");
      formDataToSend.append("cinNumber", formData.cinNumber || "");
      formDataToSend.append("website", formData.website || "");
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("contactNumber", formData.contactNumber || "");
      formDataToSend.append("domain", formData.domain || "");
      formDataToSend.append("industryType", formData.industryType || "");
      formDataToSend.append("establishedDate", formData.establishedDate || "");
      formDataToSend.append("timezone", formData.timezone || "");
      formDataToSend.append(
        "autoClockOutTime",
        formData.autoClockOutTime ? `${formData.autoClockOutTime}:00` : ""
      );
      formDataToSend.append("currencyCode", formData.currencyCode || "");
      formDataToSend.append("accountNumber", formData.accountNumber || "");
      formDataToSend.append(
        "accountHolderName",
        formData.accountHolderName || ""
      );
      formDataToSend.append("bankName", formData.bankName || "");
      formDataToSend.append("ifscCode", formData.ifscCode || "");
      formDataToSend.append("branchName", formData.branchName || "");
      formDataToSend.append("prefix", formData.prefix || "");
      formDataToSend.append(
        "sequenceNumber",
        String(formData.sequenceNumber ?? "")
      );
      formDataToSend.append("companyType", formData.companyType || "");

      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      if (formData.digitalSignature) {
        formDataToSend.append("digitalSignature", formData.digitalSignature);
      }

      // Attendance Policy
      if (formData.attendancePolicy?.absentMaxMinutes != null) {
        formDataToSend.append(
          "attendancePolicy.absentMaxMinutes",
          String(Math.round(formData.attendancePolicy.absentMaxMinutes * 60))
        );
      }

      if (formData.attendancePolicy?.fullDayMinMinutes != null) {
        formDataToSend.append(
          "attendancePolicy.fullDayMinMinutes",
          String(Math.round(formData.attendancePolicy.fullDayMinMinutes * 60))
        );
      }

      formData.addresses.forEach((addr, i) => {
        formDataToSend.append(`addresses[${i}].houseNo`, addr.houseNo || "");
        formDataToSend.append(
          `addresses[${i}].streetName`,
          addr.streetName || ""
        );
        formDataToSend.append(`addresses[${i}].city`, addr.city || "");
        formDataToSend.append(`addresses[${i}].state`, addr.state || "");
        formDataToSend.append(`addresses[${i}].country`, addr.country || "");
        formDataToSend.append(`addresses[${i}].pincode`, addr.pincode || "");
        formDataToSend.append(
          `addresses[${i}].addressType`,
          addr.addressType || "OFFICE"
        );
      });

      const response = await organizationService.add(formDataToSend);

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
      let fieldErrors: Record<string, string> = {};

      if (err?.fieldErrors) {
        fieldErrors = Object.fromEntries(
          Object.entries(err.fieldErrors).map(([field, msg]) => [
            field,
            Array.isArray(msg) ? msg[0] : String(msg),
          ])
        );
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || "Something went wrong",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    console.log(
      "[DEBUG] Current first country in formData:",
      formData.addresses[0]?.country
    );
    console.log(
      "[DEBUG] Current currency:",
      formData.currencyCode
    );
  }, [formData.addresses, formData.currencyCode]);

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
                  onBlur={handleBlurValidation("organizationName")}
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
                  onBlur={handleBlurValidation("organizationLegalName")}
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
                  onBlur={(e) => {
                    handleBlurValidation("registrationNumber")(e);
                    handleUniqueBlur(
                      "REGISTRATION_NUMBER",
                      "registration_number",
                      "registrationNumber",
                      null,
                      3
                    )(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("gstNumber")(e);
                    handleUniqueBlur(
                      "GST",
                      "gst_number",
                      "gstNumber",
                      null,
                      15
                    )(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("panNumber")(e);
                    handleUniqueBlur(
                      "PAN_NUMBER",
                      "pan_number",
                      "panNumber",
                      null,
                      10
                    )(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("cinNumber")(e);
                    handleUniqueBlur(
                      "CIN_NUMBER",
                      "cin_number",
                      "cinNumber",
                      null,
                      21
                    )(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("email")(e);
                    handleUniqueBlur("EMAIL", "email", "email", null)(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("contactNumber")(e);
                    handleUniqueBlur(
                      "CONTACT_NUMBER",
                      "contact_number",
                      "contactNumber",
                      null,
                      10
                    )(e);
                  }}
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
                <select
                  required
                  name="domain"
                  value={formData.domain}
                  onChange={(e) => {
                    handleValidatedChange(e);
                  }}
                  onBlur={handleBlurValidation("domain")}
                  className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Domain</option>
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
                  required
                  name="industryType"
                  value={formData.industryType}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("industryType")}
                  className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Industry Type</option>
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
                  required
                  name="establishedDate"
                  type="date"
                  value={formData.establishedDate}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("establishedDate")}
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                  <option value="">Select Timezone</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Clock-Out Time */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Auto Clock-Out Time <span className="text-red-500">*</span>
                </Label>

                <Input
                  required
                  name="autoClockOutTime"
                  type="time"
                  step="60"
                  value={formData.autoClockOutTime ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("autoClockOutTime")}
                  className="h-12"
                />

                {fieldError(errors, "autoClockOutTime")}
              </div>

              {/* Currency Code */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Currency Code <span className="text-red-500">*</span>
                  <TooltipHint hint="Primary currency for financial transactions (e.g., INR, USD)." />
                </Label>
                <select
                  required
                  name="currencyCode"
                  value={formData.currencyCode}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("currencyCode")}
                  className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Currency</option>
                  {CURRENCY_CODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {fieldError(errors, "currencyCode")}
              </div>

              {/* Absent Max Minutes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Absent Max Hours<span className="text-red-500">*</span>
                  <TooltipHint hint="Maximum hours of absence allowed before marking as absent. Enter in hours (e.g., 0.5 for 30 minutes)." />
                </Label>
                <Input
                  required
                  type="text"
                  onWheel={preventWheelChange}
                  inputMode="numeric"
                  name="attendancePolicy.absentMaxMinutes"
                  value={formData.attendancePolicy.absentMaxMinutes ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("attendancePolicy.absentMaxMinutes")}
                  className="h-12"
                  placeholder="e.g. 30"
                />
                {fieldError(errors, "attendancePolicy.absentMaxMinutes")}

              </div>

              {/* Full Day Minimum Minutes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Full Day Min Hours<span className="text-red-500">*</span>
                  <TooltipHint hint="Minimum hours required to be considered a full day. Enter in hours (e.g., 8 for 8 hours)." />
                </Label>
                <Input
                  required
                  type="text"
                  onWheel={preventWheelChange}
                  inputMode="numeric"
                  name="attendancePolicy.fullDayMinMinutes"
                  value={formData.attendancePolicy.fullDayMinMinutes ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("attendancePolicy.fullDayMinMinutes")}
                  className="h-12"
                  placeholder="e.g. 480"
                />
                {fieldError(errors, "attendancePolicy.fullDayMinMinutes")}

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
                  onBlur={(e) => {
                    handleBlurValidation("accountNumber")(e);
                    handleUniqueBlur(
                      "ACCOUNT_NUMBER",
                      "account_number",
                      "accountNumber",
                      null,
                      9
                    )(e);
                  }}
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
                  onBlur={(e) => {
                    handleBlurValidation("accountHolderName")(e);
                    handleUniqueBlur(
                      "ACCOUNT_HOLDER_NAME",
                      "account_holder_name",
                      "accountHolderName",
                      null,
                      3
                    )(e);
                  }}
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
                    onBlur={(e) => {
                      handleBlurValidation("ifscCode")(e);
                      handleIfscLookup(formData.ifscCode ?? "");
                    }}
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
                  onBlur={handleBlurValidation("prefix")}
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
                  type="text"
                  onWheel={preventWheelChange}
                  inputMode="numeric"
                  value={formData.sequenceNumber ?? ""}
                  onChange={handleValidatedChange}
                  onBlur={handleBlurValidation("sequenceNumber")}
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
                  onBlur={handleBlurValidation("companyType")}
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
                        // className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        disabled={formData.addresses.length <= 1}   // ← disable when last one
                        className={formData.addresses.length <= 1 ? "opacity-40 cursor-not-allowed" : ""}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Country<span className="text-red-500">*</span>
                          <TooltipHint hint="Country of the address. Default is India." />
                        </Label>
                        <select
                          name={`addresses.${index}.country`}
                          value={address.country || ""}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            console.log("→ Selected country raw:", value);

                            setFormData(prev => ({
                              ...prev,
                              addresses: prev.addresses.map((addr, idx) =>
                                idx === index
                                  ? { ...addr, country: value, state: "" }
                                  : addr
                              )
                            }));

                            fetchStatesForCountry(value, index);
                          }}
                          onBlur={handleBlurValidation(`addresses.${index}.country`)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Country</option>
                          {filteredCountries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        {/* <select

                          required
                          value={address.country ?? ""}   // use ?? instead of ||
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            console.log("→ Selected country raw:", val);
                            handleAddressChange(index, "country", val);
                            // reset state & fetch
                            handleAddressChange(index, "state", "");
                            // fetch states async — no need to await here for UI
                            adminService.getStatesByCountryV1(val).then((states) => {
                              setStatesMap((prev) => ({ ...prev, [index]: states || [] }));
                            });
                          }}
                          className="!h-12 text-base w-full px-3 border rounded-md"
                        >
                          <option value="" disabled>Select Country *</option>
                          {filteredCountries.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select> */}

                        {fieldError(errors, `addresses.${index}.country`)}
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          State<span className="text-red-500">*</span>
                          <TooltipHint hint="State or province of the address." />
                        </Label>
                        {statesByCountry[address.country?.trim().toLowerCase() || ""]
                          ?.length > 0 ? (
                          <select
                            name={`addresses.${index}.state`}
                            value={address.state || ""}
                            onChange={(e) =>
                              handleValidatedChange(e, index, "addresses")
                            }
                            onBlur={handleBlurValidation(`addresses.${index}.state`)}
                            required
                            disabled={statesLoadingMap[index]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select State</option>
                            {statesByCountry[
                              address.country?.trim().toLowerCase() || ""
                            ]?.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name={`addresses.${index}.state`}
                            value={address.state || ""}
                            onChange={(e) =>
                              handleValidatedChange(e, index, "addresses")
                            }
                            onBlur={handleBlurValidation(`addresses.${index}.state`)}
                            required
                            disabled={!address.country}
                            placeholder="Enter state"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        )}
                        {fieldError(errors, `addresses.${index}.state`)}
                      </div>
                      {/* City */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          City<span className="text-red-500">*</span>
                          <TooltipHint hint="City or town of the address." />
                        </Label>
                        <Input
                          required
                          value={address.city || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, index, "addresses")
                          }
                          onBlur={handleBlurValidation(`addresses.${index}.city`)}
                          placeholder="e.g. Mumbai"
                          className="!h-12 text-base w-full"
                        />
                        {fieldError(errors, `addresses.${index}.city`)}
                      </div>

                      {/* House No. / Flat */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          House No. / Flat<span className="text-red-500">*</span>
                          <TooltipHint hint="Apartment or house number (e.g., 221B, Flat 4A)." />
                        </Label>
                        <Input
                          required
                          rel=""
                          value={address.houseNo || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, index, "addresses")
                          }
                          onBlur={handleBlurValidation(`addresses.${index}.houseNo`)}
                          placeholder="e.g. 221B, Flat 4A"
                          className="!h-12 text-base w-full"
                        />
                        {fieldError(errors, `addresses.${index}.houseNo`)}
                      </div>

                      {/* Street / Locality */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Street / Locality<span className="text-red-500">*</span>
                          <TooltipHint hint="Street name or locality (e.g., Baker Street, Andheri West)." />
                        </Label>
                        <Input
                          required
                          value={address.streetName || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, index, "addresses")
                          }
                          onBlur={handleBlurValidation(
                            `addresses.${index}.streetName`
                          )}
                          placeholder="e.g. Baker Street"
                          className="!h-12 text-base w-full"
                        />
                        {fieldError(errors, `addresses.${index}.streetName`)}
                      </div>
                      {/* Pincode */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Pincode
                          <TooltipHint hint="6-digit postal code (e.g., 400001)." />
                        </Label>
                        <Input
                          required
                          value={address.pincode || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, index, "addresses")
                          }
                          onBlur={handleBlurValidation(`addresses.${index}.pincode`)}
                          placeholder="400001"
                          className="!h-12 text-base w-full"
                        />
                        {fieldError(errors, `addresses.${index}.pincode`)}
                      </div>

                      {/* Address Type */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">
                          Address Type<span className="text-red-500">*</span>
                          <TooltipHint hint="Type of address (e.g., Registered, Office)." />
                        </Label>
                        <select
                          name={`addresses.${index}.addressType`}
                          value={address.addressType || ""}
                          onChange={(e) => handleValidatedChange(e, index, "addresses")}
                          onBlur={handleBlurValidation(
                            `addresses.${index}.addressType`
                          )}
                          required
                          className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none"
                        >
                          <option value="">Select Address Type</option>
                          {ADDRESS_TYPE_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>

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
