// app/admin-dashboard/clients/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/lib/api/adminService";
import { organizationService } from "@/lib/api/organizationService";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/ui/BackButton";
import useLoading from "@/hooks/useLoading";
import Swal from "sweetalert2";
import TooltipHint from "@/components/ui/TooltipHint";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import {
  ADDRESS_TYPE_OPTIONS,
  ClientDTO,
  ClientModel,
  CURRENCY_CODE_OPTIONS,
  CurrencyCode,
  OrganizationResponseDTO,
} from "@/lib/api/types";
import { useClientFieldValidation } from "@/hooks/useClientFieldValidation";
import { Trash2 } from "lucide-react";

export default function AddClientPage() {
  const router = useRouter();
  const { loading, withLoading } = useLoading();
  const [organizations, setOrganizations] = useState<OrganizationResponseDTO[]>([]);
  const [filtered, setFiltered] = useState<OrganizationResponseDTO[]>([]);
  // const [rendering, setLoading] = useState(true);
  // const [error, setError] = useState('');
  const [formData, setFormData] = useState<ClientModel>({
    companyName: "",
    contactNumber: "",
    email: "",
    gst: "",
    currency: "" as CurrencyCode,
    netTerms: null,
    panNumber: "",
    tanNumber: "",
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
    clientPocs: [
      {
        pocId: null,
        name: "",
        email: "",
        contactNumber: "",
        designation: "",
      },
    ],
    branchEntityIds: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateField } = useClientFieldValidation();
  const { checkUniqueness, checking } = useUniquenessCheck(setErrors);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    index?: number,
    section?: "addresses" | "clientPocs"
  ) => {
    const { name, value } = e.target;

    let parsedValue: string | number = value;

    if (name === "netTerms") {
      parsedValue = value ? parseInt(value) : "";
    }

    if (section && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        [section]: (prev[section] ?? []).map((item, i) =>
          i === index
            ? { ...item, [name.split(".").pop()!]: parsedValue }
            : item
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const {
    handleValidatedChange,
    handleUniqueBlur,
    handleBlurValidation,
    fieldError,
  } = useFormFieldHandlers(
    handleChange,
    setErrors,
    checkUniqueness,
    () => formData, // or whatever your client form data getter is
    validateField // ← this makes it use CLIENT rules
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

  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.blur();
  };
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
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [error, setError] = useState("");
  const [loadings, setLoading] = useState(true);

   // Fetch clients
    useEffect(() => {
      const fetchClients = async () => {
        try {
          const data = await adminService.getAllClients();
          const clientList: ClientDTO[] = data.response || [];
          setClients(clientList);
        } catch (err: any) {
          setError(err.message || "Failed to fetch clients");
        } finally {
          setLoading(false);
        }
      };
      fetchClients();
    }, []);

    
  const selectedCountry = formData.addresses?.[0]?.country;

  // Real-time duplicate detection between main fields and POCs
  const checkDuplicateInForm = () => {
    const mainEmail = formData.email?.toLowerCase().trim();
    const mainContact = formData.contactNumber;

    const newErrors: Record<string, string> = {};

    (formData.clientPocs ?? []).forEach((poc, i) => {
      const pocEmail = poc.email?.toLowerCase().trim();
      const pocContact = poc.contactNumber;

      // Main email = POC email
      if (pocEmail && mainEmail && pocEmail === mainEmail) {
        newErrors[`clientPocs.${i}.email`] = "Same as company email";
        newErrors.email = "Same as POC email";
      }

      // Main contact = POC contact
      if (pocContact && pocContact === mainContact) {
        newErrors[`clientPocs.${i}.contactNumber`] = "Same as company contact";
        newErrors.contactNumber = "Same as POC contact";
      }

      // POC vs POC duplicates
      (formData.clientPocs ?? []).forEach((otherPoc, j) => {
        if (i !== j) {
          const otherEmail = otherPoc.email?.toLowerCase().trim();
          const otherContact = otherPoc.contactNumber;

          if (pocEmail && otherEmail && pocEmail === otherEmail) {
            newErrors[`clientPocs.${i}.email`] = "Duplicate POC email";
          }

          if (pocContact && otherContact && pocContact === otherContact) {
            newErrors[`clientPocs.${i}.contactNumber`] =
              "Duplicate POC contact";
          }
        }
      });
    });

    setErrors((prev) => {
      const next = { ...prev };

      Object.keys(next).forEach((key) => {
        const message = next[key];

        if (
          message === "Same as company email" ||
          message === "Same as POC email" ||
          message === "Same as company contact" ||
          message === "Same as POC contact" ||
          message === "Duplicate POC email" ||
          message === "Duplicate POC contact"
        ) {
          delete next[key];
        }
      });

      return { ...next, ...newErrors };
    });
  };

  // Run duplicate check whenever email, contact, or POCs change
  useEffect(() => {
    checkDuplicateInForm();
  }, [formData.email, formData.contactNumber, formData.clientPocs]);

  const addItem = (section: "addresses" | "clientPocs") => {
    if (section === "addresses") {
      setFormData((prev) => ({
        ...prev,
        addresses: [
          ...(prev.addresses || []),
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
      }));
    } else if (section === "clientPocs") {
      setFormData((prev) => ({
        ...prev,
        clientPocs: [
          ...(prev.clientPocs || []),
          {
            pocId: null,
            name: "",
            email: "",
            contactNumber: "",
            designation: "",
          },
        ],
      }));
    }
  };

  const removeItem = (section: "addresses" | "clientPocs", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    // ────── REQUIRED FIELDS WITH AUTO-FOCUS & SCROLL ──────
    const requiredFields = [
      {
        value: formData.companyName,
        name: "companyName",
        label: "Company Name",
      },
      {
        value: formData.contactNumber,
        name: "contactNumber",
        label: "Contact Number",
      },
      // { value: formData.email, name: 'email', label: 'Email' },
      // { value: formData.gst, name: 'gst', label: 'GST' },
      // { value: formData.panNumber, name: 'panNumber', label: 'PAN' },
      // { value: formData.tanNumber, name: 'tanNumber', label: 'TAN' },
      { value: formData.currency, name: "currency", label: "Currency" },
      // Address (first one only)
      {
        value: (formData.addresses ?? [])[0]?.houseNo,
        name: "addresses.0.houseNo",
        label: "House No (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.streetName,
        name: "addresses.0.streetName",
        label: "Street Name (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.city,
        name: "addresses.0.city",
        label: "City (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.state,
        name: "addresses.0.state",
        label: "State (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.pincode,
        name: "addresses.0.pincode",
        label: "Pincode (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.country,
        name: "addresses.0.country",
        label: "Country (Address)",
      },
      {
        value: (formData.addresses ?? [])[0]?.addressType,
        name: "addresses.0.addressType",
        label: "Address Type",
      },
      // POC (first one only)
      {
        value: (formData.clientPocs ?? [])[0]?.name,
        name: "clientPocs.0.name",
        label: "POC Name",
      },
      {
        value: (formData.clientPocs ?? [])[0]?.email,
        name: "clientPocs.0.email",
        label: "POC Email",
      },
      // { value: formData.clientPocs[0]?.contactNumber, name: 'clientPocs.0.contactNumber', label: 'POC Contact Number' },
    ];

    const missingField = requiredFields.find(
      (f) => !f.value || f.value.toString().trim() === ""
    );
    if (missingField) {
      const errorMsg = `${missingField.label} is required`;
      setErrors({ [missingField.name]: errorMsg });

      setTimeout(() => {
        const input = document.querySelector(
          `[name="${CSS.escape(missingField.name)}"]`
        ) as HTMLElement;

        if (input) {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
          input.focus();
          input.classList.add("error-field");
        }
      }, 100);

      setIsSubmitting(false);
      return;
    }

    try {
      await withLoading(async () => {
        const payload = {
          companyName: formData.companyName.trim(),
          contactNumber: formData.contactNumber,
          email: formData.email ? formData.email.toLowerCase().trim() : null,
          gst: formData.gst.toUpperCase(),
          panNumber: formData.panNumber.toUpperCase(),
          tanNumber: (formData.tanNumber ?? "").toUpperCase(),
          currency: formData.currency,
          netTerms: formData.netTerms ?? null,
          addresses: (formData.addresses ?? []).map((a) => ({
            addressId: null,
            houseNo: a.houseNo?.trim() || "",
            streetName: a.streetName?.trim() || "",
            city: a.city?.trim() || "",
            state: a.state?.trim() || "",
            pincode: a.pincode,
            country: a.country?.trim() || "",
            addressType: a.addressType,
          })),

          clientPocs: (formData.clientPocs ?? []).map((p) => ({
            pocId: null,
            name: p.name.trim(),
            email: p.email ? p.email.toLowerCase().trim() : "",
            contactNumber: p.contactNumber || "",
            designation: p.designation?.trim() || "",
          })),

          branchEntityIds: formData.branchEntityIds,
        };

        await adminService.addClient(payload);

        // SUCCESS SWEETALERT — FROM BACKEND (IF AVAILABLE) OR DEFAULT
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Client added successfully!",
          timer: 2000,
          showConfirmButton: false,
        });

        router.push("/admin-dashboard/clients/list");
      });
    } catch (err: any) {
      let fieldErrors: Record<string, string> = {};
      let backendMessage = "Failed to add client";

      if (err.response?.data) {
        const data = err.response.data;

        // ✅ Spring Boot @Valid errors
        if (data.fieldErrors && typeof data.fieldErrors === "object") {
          fieldErrors = Object.fromEntries(
            Object.entries(data.fieldErrors).map(([field, msg]) => [
              field,
              Array.isArray(msg) ? msg[0] : String(msg),
            ])
          );
        }

        // ✅ Custom validation errors
        else if (data.errors && typeof data.errors === "object") {
          fieldErrors = Object.fromEntries(
            Object.entries(data.errors).map(([field, msg]) => [
              field,
              Array.isArray(msg) ? msg[0] : String(msg),
            ])
          );
        }

        // ✅ Backend message
        if (data.message) {
          backendMessage = data.message;
        }
      } else if (err.message) {
        backendMessage = err.message;
      }

      // ✅ If field errors → show below inputs + scroll
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);

        setTimeout(() => {
          const firstField = Object.keys(fieldErrors)[0];

          const input = document.querySelector(
            `[name="${CSS.escape(firstField)}"]`
          ) as HTMLElement;

          if (input) {
            input.scrollIntoView({ behavior: "smooth", block: "center" });
            input.focus();
          }
        }, 100);
      }

      // ✅ Otherwise show alert
      else {
        await Swal.fire("Error", backendMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCountries = formData.currency
    ? formData.currency === "INR"
      ? countries.filter((country) => country === "India")
      : countries.filter((country) => country !== "India")
    : countries;

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute left-0">
            <BackButton to="/admin-dashboard/clients" />
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Add Client
          </h1>
        </div>

        <div className="max-w-6xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-8"
          >
            {/* Company Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full legal name of the company. Example: DigiQuad Technologies Private Limited" />
                  </label>
                  <input
                    type="text"
                    required
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      handleBlurValidation("companyName")(e); // 🔥 required check
                      handleUniqueBlur(
                        "COMPANY_NAME",
                        "company_name",
                        "companyName"
                      )(e); 
                    }}
                    placeholder="e.g. Digiquads Pvt Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "companyName")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                    <TooltipHint hint="10-digit Indian mobile number. Must start with 6-9." />
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    maxLength={10}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      handleBlurValidation("contactNumber")(e);
                      handleUniqueBlur(
                        "CONTACT_NUMBER",
                        "contact_number",
                        "contactNumber"
                      )(e);
                    }}
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />

                  {fieldError(errors, "contactNumber")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                    <TooltipHint hint="Official company email. Example: info@digiquad.com" />
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleValidatedChange}
                    onBlur={handleUniqueBlur("EMAIL", "email", "email")}
                    placeholder="info@digiquad.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "email")}
                </div>

                {/* GST - Now checks backend uniqueness */}
                <div>
                  <label
                    htmlFor="gst"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    GST
                    {/* <span className="text-red-500">*</span> */}
                    <TooltipHint hint="15-character GSTIN. Format: 27AABCU9603R1ZX (2 digits state code + PAN + entity code + Z + checksum)" />{" "}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="gst"
                      value={formData.gst}
                      maxLength={15}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur("GST", "gst", "gst")}
                      placeholder="27ABCDE1234F1Z5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {fieldError(errors, "gst")}
                  </div>
                </div>

                {/* PAN */}
                <div>
                  <label
                    htmlFor="panNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    PAN
                    <TooltipHint hint="10-character PAN number. Format: ABCDE1234F (5 letters + 4 digits + 1 letter)" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      maxLength={10}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur(
                        "PAN_NUMBER",
                        "pan_number",
                        "panNumber"
                      )}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {fieldError(errors, "panNumber")}
                  </div>
                </div>

                {/* TAN -  */}
                <div>
                  <label
                    htmlFor="tanNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    TAN
                    {/* <span className="text-red-500">*</span> */}
                    <TooltipHint hint="10-character Tax Deduction Account Number. Format: MUMA12345B" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tanNumber"
                      value={formData.tanNumber}
                      maxLength={10}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleValidatedChange(e);
                      }}
                      onBlur={handleUniqueBlur(
                        "TAN_NUMBER",
                        "tan_number",
                        "tanNumber"
                      )}
                      placeholder="MUMA12345B"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {fieldError(errors, "tanNumber")}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                    <TooltipHint hint="Primary billing currency for this client" />
                  </label>

                  <select
                    name="currency"
                    value={formData.currency || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currency: e.target.value as CurrencyCode,
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
                      }))
                    }
                    required
                    className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Currency</option>
                    {CURRENCY_CODE_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  {fieldError(errors, "currency")}
                </div>

                {/* Net Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Terms (Days)<span className="text-red-500">*</span>
                    <TooltipHint hint="Number of days after which payment is due. Example: 30, 60, 90" />
                  </label>
                  <input
                    type="text"
                    onWheel={preventWheelChange}
                    inputMode="numeric"
                    name="netTerms"
                    value={formData.netTerms || ""}
                    required
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {fieldError(errors, "netTerms")}
              </div>
            </div>

              {/* ==================== CLIENT BRANCH NAME ==================== */}
              <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Client Branch Name
              </h3>

              <div className="border rounded-md p-4 max-h-60 overflow-y-auto bg-gray-50">
                {clients.length === 0 && (
                  <div className="text-gray-500 text-sm">No clients available</div>
                )}

                {clients.map((client) => (
                  <label
                    key={client.clientId}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={client.clientId}
                      checked={formData.branchEntityIds.includes(client.clientId)}
                      onChange={(e) => {
                        const { checked, value } = e.target;

                        setFormData((prev) => ({
                          ...prev,
                          branchEntityIds: checked
                            ? [...prev.branchEntityIds, value]
                            : prev.branchEntityIds.filter((id) => id !== value),
                        }));
                      }}
                    />
                    <span>{client.companyName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ==================== ADDRESSES ==================== */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Addresses <span className="text-red-500">*</span>
                </h3>
                <button
                  type="button"
                  onClick={() => addItem("addresses")}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Address
                </button>
              </div>

              {(formData.addresses || []).map((addr, i) => (
                <div
                  key={addr.addressId ?? `addr-${i}`}
                  className="mb-6 p-4 border rounded bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                        <span className="text-red-500">*</span>
                        <TooltipHint hint="Country name as per official records" />
                      </label>

                      <select
                        name={`addresses.${i}.country`}
                        value={addr.country || ""}
                        onChange={(e) => {
                          const selectedCountry = e.target.value;

                          setFormData((prev) => {
                            const updated = [...(prev.addresses || [])];

                            updated[i] = {
                              ...updated[i],
                              country: selectedCountry,
                              state: "",
                              city: "",
                              houseNo: "",
                              streetName: "",
                              pincode: "",
                            };

                            return {
                              ...prev,
                              addresses: updated,
                            };
                          });

                          fetchStatesForCountry(selectedCountry, i);
                        }}
                        onBlur={handleBlurValidation(`addresses.${i}.country`)}
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
                      {fieldError(errors, `addresses.${i}.country`)}
                    </div>
                    {/* state */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                        <TooltipHint hint="State name as per official records" />
                      </label>
                      {statesByCountry[addr.country?.trim().toLowerCase() || ""]
                        ?.length > 0 ? (
                        <select
                          name={`addresses.${i}.state`}
                          value={addr.state || ""}
                          onChange={(e) => {
                            const selectedState = e.target.value;

                            setFormData((prev) => {
                              const updated = [...(prev.addresses || [])];

                              updated[i] = {
                                ...updated[i],
                                state: selectedState,
                                city: "",
                                houseNo: "",
                                streetName: "",
                                pincode: "",
                              };

                              return {
                                ...prev,
                                addresses: updated,
                              };
                            });
                          }}
                          onBlur={handleBlurValidation(`addresses.${i}.state`)}
                          required
                          disabled={statesLoadingMap[i]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select State</option>
                          {statesByCountry[
                            addr.country?.trim().toLowerCase() || ""
                          ]?.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name={`addresses.${i}.state`}
                          value={addr.state || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, i, "addresses")
                          }
                          onBlur={handleBlurValidation(`addresses.${i}.state`)}
                          required
                          disabled={!addr.country}
                          placeholder="Enter state"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )}

                      {fieldError(errors, `addresses.${i}.state`)}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                        <span className="text-red-500">*</span>
                        <TooltipHint hint="City name as per official records" />
                      </label>
                      <input
                        type="text"
                        name={`addresses.${i}.city`}
                        value={addr.city || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        onBlur={handleBlurValidation(`addresses.${i}.city`)}
                        required
                        placeholder="e.g. Mumbai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {fieldError(errors, `addresses.${i}.city`)}
                    </div>
                    {/* House No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        House No <span className="text-red-500">*</span>
                        <TooltipHint hint="House or building number. Example: 221B" />
                      </label>
                      <input
                        required
                        type="text"
                        name={`addresses.${i}.houseNo`}
                        value={addr.houseNo || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        onBlur={handleBlurValidation(`addresses.${i}.houseNo`)}
                        placeholder="e.g. 221B"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                      {fieldError(errors, `addresses.${i}.houseNo`)}
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street <span className="text-red-500">*</span>
                        <TooltipHint hint="Street name. Example: Baker Street" />
                      </label>
                      <input
                        required
                        type="text"
                        name={`addresses.${i}.streetName`}
                        value={addr.streetName || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        onBlur={handleBlurValidation(
                          `addresses.${i}.streetName`
                        )}
                        placeholder="e.g. Baker Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                      {fieldError(errors, `addresses.${i}.streetName`)}
                    </div>
                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                        <span className="text-red-500">*</span>
                        <TooltipHint hint="Pincode as per official records" />
                      </label>
                      <input
                        type="text"
                        name={`addresses.${i}.pincode`}
                        value={addr.pincode || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        onBlur={handleBlurValidation(`addresses.${i}.pincode`)}
                        required
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {fieldError(errors, `addresses.${i}.pincode`)}
                    </div>

                    {/* Address Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Type <span className="text-red-500">*</span>
                      </label>

                      <select
                        name={`addresses.${i}.addressType`}
                        value={addr.addressType || ""}
                        onChange={(e) => handleChange(e, i, "addresses")}
                        onBlur={handleBlurValidation(
                          `addresses.${i}.addressType`
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
                    </div>
                  </div>

                  {formData.addresses!.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => removeItem("addresses", i)}
                        className="text-red-600 hover:text-red-700 transition"
                        title="Remove Address"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ==================== POINT OF CONTACTS (POCs) ==================== */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Point of Contacts <span className="text-red-500">*</span>
                </h3>
                <button
                  type="button"
                  onClick={() => addItem("clientPocs")}
                  className="text-indigo-600 text-sm hover:underline font-medium"
                >
                  + Add POC
                </button>
              </div>

              {/* Show POC fields only if at least one exists */}
              {(formData.clientPocs ?? []).length > 0 && (
                <div className="space-y-6">
                  {(formData.clientPocs ?? []).map((poc, i) => (
                    <div
                      key={poc.pocId || i}
                      className="p-6 border rounded-lg bg-gray-50 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                            <TooltipHint hint="Full name of the point of contact" />
                          </label>
                          <input
                            type="text"
                            name={`clientPocs.${i}.name`}
                            value={poc.name || ""}
                            onChange={(e) =>
                              handleValidatedChange(e, i, "clientPocs")
                            }
                            onBlur={handleBlurValidation(
                              `clientPocs.${i}.name`
                            )}
                            required
                            placeholder="e.g. Anita Sharma"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />

                          {fieldError(errors, `clientPocs.${i}.name`)}
                        </div>

                        {/* Email */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                            <TooltipHint hint="Official email of the contact person" />
                          </label>
                          <input
                            required
                            type="email"
                            name={`clientPocs.${i}.email`}
                            value={poc.email || ""}
                            onChange={(e) =>
                              handleValidatedChange(e, i, "clientPocs")
                            }
                            onBlur={(e) => {
                              handleBlurValidation(`clientPocs.${i}.email`)(e);
                              handleUniqueBlur(
                                "EMAIL",
                                "email",
                                `clientPocs.${i}.email`
                              )(e);
                            }}
                            placeholder="e.g. anita@company.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />

                          {fieldError(errors, `clientPocs.${i}.email`)}
                        </div>

                        {/* Contact Number */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                            <TooltipHint hint="10-digit mobile number of the contact" />
                          </label>
                          <input
                            type="tel"
                            name={`clientPocs.${i}.contactNumber`}
                            value={poc.contactNumber || ""}
                            maxLength={10}
                            onChange={(e) =>
                              handleValidatedChange(e, i, "clientPocs")
                            }
                            onBlur={handleUniqueBlur(
                              "CONTACT_NUMBER",
                              "contact_number",
                              `clientPocs.${i}.contactNumber`,
                              null,
                              10
                            )}
                            placeholder="9876543210"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />

                          {fieldError(errors, `clientPocs.${i}.contactNumber`)}
                        </div>

                        {/* Designation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation
                            <TooltipHint hint="Job title or role of the contact person" />
                          </label>
                          <input
                            type="text"
                            name={`clientPocs.${i}.designation`}
                            value={poc.designation || ""}
                            onChange={(e) => handleChange(e, i, "clientPocs")}
                            placeholder="e.g. Procurement Manager"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                          />
                        </div>
                        {fieldError(errors, `clientPocs.${i}.designation`)}
                      </div>

                      {/* Remove Button - Only show if more than 1 POC */}
                      {(formData.clientPocs ?? []).length > 1 && (
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeItem("clientPocs", i)}
                            className="text-red-600 hover:text-red-700 transition"
                            title="Remove POC"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin-dashboard/clients")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding..." : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
