"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminService } from "@/lib/api/adminService";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import isEqual from "lodash/isEqual";
import { useUniquenessCheck } from "@/hooks/useUniqueCheck";
import { useFormFieldHandlers } from "@/hooks/useFormFieldHandlers";
import TooltipHint from "@/components/ui/TooltipHint";
import {
  ClientModel,
  AddressModel,
  ClientPocModel,
  ClientTaxDetail,
  CurrencyCode,
  CURRENCY_CODE_OPTIONS,
  ADDRESS_TYPE_OPTIONS,
} from "@/lib/api/types";
import { useClientFieldValidation } from "@/hooks/useClientFieldValidation";
import { organizationService } from "@/lib/api/organizationService";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [clientId, setClientId] = useState<string>("");

  const [formData, setFormData] = useState<ClientModel>({
    companyName: "",
    contactNumber: "",
    email: null,
    gst: "",
    panNumber: "",
    tanNumber: "",
    currency: "INR" as CurrencyCode,
    netTerms: null,
    addresses: [],
    clientPocs: [],
    clientTaxDetails: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statesMap, setStatesMap] = useState<Record<number, string[]>>({});
  const [originalData, setOriginalData] = useState<ClientModel | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const { validateField } = useClientFieldValidation();
  const { checkUniqueness } = useUniquenessCheck(setErrors);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number,
    section?: "addresses" | "clientPocs" | "clientTaxDetails"
  ) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    if (name.includes("email")) parsedValue = value.toLowerCase().trim();
    if (name === "gst" || name === "panNumber" || name === "tanNumber")
      parsedValue = value.toUpperCase().trim();
    if (name.includes("pincode") || name.includes("contactNumber"))
      parsedValue = value.replace(/\D/g, "");

    if (section && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        [section]: (prev[section] || []).map((item, i) =>
          i === index
            ? { ...item, [name.split(".").pop()!]: parsedValue }
            : item
        ),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  const { handleValidatedChange, handleUniqueBlur, fieldError } =
    useFormFieldHandlers(
      handleChange,
      setErrors,
      checkUniqueness,
      () => formData, // or whatever your client form data getter is
      validateField // ← this makes it use CLIENT rules
    );

  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.blur();
  };


  const [orgState, setOrgState] = useState<string>("");

  const loadStates = async (country: string, index: number) => {
    try {
      const states = await adminService.getStatesByCountryV1(country);
      setStatesMap((prev) => ({
        ...prev,
        [index]: states || [],
      }));
    } catch (e) {
      console.error("Failed to load states", e);
    }
  };

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const data = await organizationService.getAll(); // or your org API
        const state = data?.[0]?.addresses?.[0]?.state?.trim() || "";
        setOrgState(state);
      } catch (e) {
        console.error("Failed to load org state", e);
      }
    };

    fetchOrg();
  }, []);

  const clientCountry = formData.addresses?.[0]?.country?.trim();
  const clientState = formData.addresses?.[0]?.state?.trim();

  const shouldShowTaxSection =
    formData.currency === "INR" &&
    clientCountry?.toLowerCase() === "india" &&
    !!clientState &&
    !!orgState;

  const isSameState =
    clientState?.toLowerCase() === orgState?.toLowerCase();

  const expectedTaxNames = isSameState
    ? ["CGST", "SGST"]
    : ["IGST"];

  useEffect(() => {
    if (!shouldShowTaxSection) {
      setFormData(prev => ({
        ...prev,
        clientTaxDetails: [],
      }));
      return;
    }

    setFormData(prev => {
      const existing = prev.clientTaxDetails || [];

      // Keep only valid ones
      const filtered = existing.filter(t =>
        expectedTaxNames.includes(t.taxName)
      );

      // Add missing required taxes
      const missing = expectedTaxNames
        .filter(name => !filtered.some(t => t.taxName === name))
        .map(name => ({
          taxId: null,
          taxName: name,
          taxPercentage: 0,
        }));

      return {
        ...prev,
        clientTaxDetails: [...filtered, ...missing],
      };
    });
  }, [shouldShowTaxSection, isSameState]);

  // Fetch client
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      setErrors({});

      try {
        const res = await adminService.getClientById(id);
        const dto = res.response;
        setClientId(dto.clientId);
        const loadedData: ClientModel = {
          companyName: dto.companyName || "",
          contactNumber: dto.contactNumber || "",
          email: dto.email || null,
          gst: dto.gst || "",
          panNumber: dto.panNumber || "",
          tanNumber: dto.tanNumber || "",
          currency: (dto.currency as CurrencyCode) || "",
          netTerms: dto.netTerms ?? null,

          addresses: dto.addresses?.length
            ? dto.addresses.map(
              (a: any): AddressModel => ({
                addressId: a.addressId || null,
                houseNo: a.houseNo || "",
                streetName: a.streetName || "",
                city: a.city || "",
                state: a.state || "",
                pincode: a.pincode || "",
                country: a.country || "",
                addressType: ADDRESS_TYPE_OPTIONS.includes(a.addressType)
                  ? a.addressType
                  : undefined,
              })
            )
            : [
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

          clientPocs:
            Array.isArray(dto.pocs) && dto.pocs.length > 0
              ? dto.pocs.map(
                (p: any): ClientPocModel => ({
                  pocId: p.pocId || null,
                  name: p.name || "",
                  email: p.email || "",
                  contactNumber: p.contactNumber || "",
                  designation: p.designation || "",
                })
              )
              : [
                {
                  pocId: null,
                  name: "",
                  email: "",
                  contactNumber: "",
                  designation: "",
                },
              ],

          clientTaxDetails: dto.clientTaxDetails?.length
            ? dto.clientTaxDetails.map(
              (t: any): ClientTaxDetail => ({
                taxId: t.taxId || null,
                taxName: t.taxName || "",
                taxPercentage: t.taxPercentage || 0,
              })
            )
            : [
              {
                taxId: null,
                taxName: "",
                taxPercentage: 0,
              },
            ],
        };
        setFormData(loadedData);
        setOriginalData(structuredClone(loadedData));

        // ✅ Load states for ALL countries (not just India)
        if (loadedData.addresses?.length) {
          for (const [index, addr] of loadedData.addresses.entries()) {
            if (addr.country) {
              try {
                await loadStates(addr.country, index);
              } catch (e) {
                console.error("Failed to load states", e);
              }
            }
          }
        }
      } catch (err) {
        setErrors({ root: "Failed to load client" });
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);
  const setFieldError = (key: string, err?: string) => {
    setErrors((prev) => {
      const next = { ...prev };

      delete next[key]; // ✅ remove old error first

      if (err) next[key] = err;

      return next;
    });
  };

  // ──────────────────────────────────────────────────────────────
  //           Add this new memoized value
  // ──────────────────────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    return !isEqual(formData, originalData);
  }, [formData, originalData]);

  // Duplicate detection in form (main vs POC, POC vs POC)
  const checkDuplicateInForm = () => {
    const mainEmail = formData.email?.toLowerCase().trim();
    const mainContact = formData.contactNumber?.trim();

    const newErrors: Record<string, string> = {};

    (formData.clientPocs ?? []).forEach((poc, i) => {
      const pocEmail = poc.email?.toLowerCase().trim();
      const pocContact = poc.contactNumber?.trim();
      if (pocEmail && pocEmail === mainEmail) {
        newErrors[`clientPocs.${i}.email`] = "Same as company email";
        newErrors.email = "Same as POC email";
      }
      if (pocContact && pocContact === mainContact) {
        newErrors[`clientPocs.${i}.contactNumber`] = "Same as company contact";
        newErrors.contactNumber = "Same as POC contact";
      }

      (formData.clientPocs ?? []).forEach((otherPoc, j) => {
        if (i !== j) {
          const otherEmail = otherPoc.email?.toLowerCase().trim();
          const otherContact = otherPoc.contactNumber?.trim();

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

      // remove old duplicate errors
      Object.keys(next).forEach((key) => {
        if (
          next[key] === "Same as company email" ||
          next[key] === "Same as POC email" ||
          next[key] === "Same as company contact" ||
          next[key] === "Same as POC contact" ||
          next[key] === "Duplicate POC email" ||
          next[key] === "Duplicate POC contact"
        ) {
          delete next[key];
        }
      });

      return { ...next, ...newErrors };
    });
  };

  // Run duplicate check after every change
  useEffect(() => {
    checkDuplicateInForm();
  }, [formData.email, formData.contactNumber, formData.clientPocs]);

  const addItem = (
    section: "addresses" | "clientPocs" | "clientTaxDetails"
  ) => {
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
            country: "India",
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
    } else {
      setFormData((prev) => ({
        ...prev,
        clientTaxDetails: [
          ...prev.clientTaxDetails,
          {
            taxId: null,
            taxName: "",
            taxPercentage: 0,
          },
        ],
      }));
    }
  };

  const removeItem = (
    section: "addresses" | "clientPocs" | "clientTaxDetails",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] ?? []).filter((_, i) => i !== index),
    }));
  };

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      await Swal.fire(
        "No changes detected",
        "Modify something before updating the client.",
        "info"
      );
      return;
    }

    if (shouldShowTaxSection) {
      const invalidTax = formData.clientTaxDetails.some(
        (t) =>
          !t.taxName ||
          t.taxPercentage === null ||
          t.taxPercentage === undefined ||
          Number(t.taxPercentage) <= 0
      );

      if (invalidTax) {
        await Swal.fire(
          "Tax Required",
          "Please enter valid tax percentage for all tax fields.",
          "warning"
        );
        return;
      }
    }

    setErrors({});

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactNumber: formData.contactNumber,
        email: formData.email?.toLowerCase().trim() || "",
        gst: formData.gst?.toUpperCase().trim() || "",
        panNumber: formData.panNumber?.toUpperCase().trim() || "",
        tanNumber: formData.tanNumber?.toUpperCase().trim() || "",
        currency: formData.currency,
        netTerms: formData.netTerms,
        addresses: (formData.addresses ?? []).map((a) => ({
          addressId:
            a.addressId && a.addressId.length > 10 ? a.addressId : null,
          houseNo: a.houseNo?.trim() || "",
          streetName: a.streetName?.trim() || "",
          city: a.city?.trim() || "",
          state: a.state?.trim() || "",
          pincode: a.pincode,
          country: a.country?.trim() || "",
          addressType: a.addressType,
        })),

        clientPocs: (formData.clientPocs ?? []).map((p) => ({
          pocId: p.pocId && p.pocId.length > 10 ? p.pocId : null,
          name: p.name.trim(),
          email: p.email?.toLowerCase().trim() || "",
          contactNumber: p.contactNumber || "",
          designation: p.designation?.trim() || "",
        })),

        clientTaxDetails: formData.clientTaxDetails
          .filter((t) => t.taxName?.trim())
          .map((t) => ({
            taxId: t.taxId && t.taxId.length > 10 ? t.taxId : null,
            taxName: t.taxName!.trim(),
            taxPercentage: Number(t.taxPercentage) || 0,
          })),
      };

      await adminService.updateClient(clientId, payload);

      await Swal.fire(
        "Success!",
        `${formData.companyName} updated successfully.`,
        "success"
      );

      router.push("/admin-dashboard/clients/list");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update client";

      await Swal.fire("Error", msg, "error");
    }
  };

  const handleDeleteClient = async () => {
    const result = await Swal.fire({
      title: "Delete Client?",
      html: `
        <p>This action cannot be undone.</p>
        <p class="mt-2 text-sm text-gray-600">
          Type <strong>${formData.companyName}</strong> to confirm deletion.
        </p>
      `,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Enter company name",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete Client",
      cancelButtonText: "Cancel",
      preConfirm: (value) => {
        if (value !== formData.companyName) {
          Swal.showValidationMessage("Company name does not match");
        }
      },
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteClientById(clientId);

        await Swal.fire(
          "Deleted!",
          "Client has been deleted successfully.",
          "success"
        );

        router.push("/admin-dashboard/clients/list");
      } catch (err: any) {
        await Swal.fire(
          "Error",
          err?.message || "Failed to delete client",
          "error"
        );
      }
    }
  };

  const filteredCountries = useMemo(() => {
    if (!formData.currency) return countries;

    if (formData.currency === "INR") {
      // Show only India
      return countries.filter(
        (country) => country.toLowerCase() === "india"
      );
    }

    if (formData.currency === "USD") {
      // Show all except India
      return countries.filter(
        (country) => country.toLowerCase() !== "india"
      );
    }

    return countries;
  }, [countries, formData.currency]);

  useEffect(() => {
    const updateCountryAndStates = async () => {
      try {
        setFormData((prev) => {
          const updatedAddresses = (prev.addresses ?? []).map((addr) => {
            if (formData.currency === "INR") {
              return { ...addr, country: "India", state: "" };
            }

            if (formData.currency === "USD" && addr.country === "India") {
              return { ...addr, country: "", state: "" };
            }

            return addr;
          });

          return { ...prev, addresses: updatedAddresses };
        });

        if (formData.currency === "INR") {
          const addressCount = formData.addresses?.length || 0;

          for (let i = 0; i < addressCount; i++) {
            await loadStates("India", i);
          }
        }
      } catch (error) {
        console.error("Currency update failed:", error);
      }
    };

    updateCountryAndStates();
  }, [formData.currency]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR", "HR_MANAGER"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute left-0">
              <BackButton to="/admin-dashboard/clients/list" />
            </div>
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Edit Client
            </h1>
          </div>
          <form
            onSubmit={onSubmit}
            className="space-y-8 bg-white rounded-lg shadow p-6"
          >
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                    <TooltipHint hint="Full legal name of the company. Example: DigiQuad Technologies Private Limited" />
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      handleUniqueBlur(
                        "COMPANY_NAME",
                        "company_name",
                        "companyName",
                        clientId
                      )(e);
                    }}
                    required
                    placeholder="e.g. Digiquads Pvt Ltd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />

                  {fieldError(errors, "companyName")}
                </div>

                {/* Contact Number */}
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
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        handleValidatedChange(e);
                      }
                    }}
                    onBlur={(e) => {
                      handleUniqueBlur(
                        "CONTACT_NUMBER",
                        "contact_number",
                        "contactNumber",
                        clientId,
                        10
                      )(e);
                    }}
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "contactNumber")}
                </div>

                {/* Email */}
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
                    onBlur={(e) => {
                      handleUniqueBlur("EMAIL", "email", "email", clientId)(e);
                    }}
                    placeholder="info@digiquad.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "email")}
                </div>

                {/* GST */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    maxLength={15}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      handleUniqueBlur("GST", "gst", "gst", clientId)(e);
                    }}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "gst")}
                </div>

                {/* PAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN
                    <TooltipHint hint="10-character PAN number. Format: ABCDE1234F (5 letters + 4 digits + 1 letter)" />
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    maxLength={10}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      handleValidatedChange(e);
                    }}
                    onBlur={(e) => {
                      handleUniqueBlur(
                        "PAN_NUMBER",
                        "pan_number",
                        "panNumber",
                        clientId
                      )(e);
                    }}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "panNumber")}
                </div>

                {/* TAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TAN
                    <TooltipHint hint="10-character Tax Deduction Account Number. Format: MUMA12345B" />
                  </label>
                  <input
                    type="text"
                    name="tanNumber"
                    value={formData.tanNumber}
                    maxLength={10}
                    onChange={handleValidatedChange}
                    onBlur={(e) => {
                      handleUniqueBlur(
                        "TAN_NUMBER",
                        "tan_number",
                        "tanNumber",
                        clientId
                      )(e);
                    }}
                    placeholder="MUMA12345B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "tanNumber")}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                    <TooltipHint hint="Primary billing currency for this client" />
                  </label>

                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        currency: value as CurrencyCode,
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
                        clientTaxDetails: [],
                      }))
                    }
                  >
                    <SelectTrigger className="!h-11 text-base w-full">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>

                    <SelectContent>
                      {CURRENCY_CODE_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldError(errors, "currency")}
                </div>

                {/* Net Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Net Terms (Days)
                    <TooltipHint hint="Number of days after which payment is due. Example: 30, 60, 90" />
                  </label>
                  <input
                    type="text"
                    onWheel={preventWheelChange}
                    inputMode="numeric"
                    name="netTerms"
                    value={formData.netTerms !== null ? formData.netTerms : ""}

                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        netTerms: val === "" ? null : Math.max(0, Number(val)),
                      }));
                    }}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {fieldError(errors, "netTerms")}
                </div>
              </CardContent>
            </Card>

            {/* ==================== ADDRESSES ==================== */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Addresses
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
                <div key={i} className="mb-6 p-4 border rounded bg-gray-50">
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
                        onChange={async (e) => {
                          const selectedCountry = e.target.value;

                          setFormData((prev) => ({
                            ...prev,
                            addresses: [
                              {
                                addressId: prev.addresses?.[i]?.addressId || null,
                                houseNo: "",
                                streetName: "",
                                city: "",
                                state: "",
                                pincode: "",
                                country: selectedCountry,
                                addressType: undefined,
                              },
                            ],
                            clientTaxDetails: [],
                          }));

                          if (selectedCountry) {
                            await loadStates(selectedCountry, i);
                          }
                        }}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Country</option>
                        {filteredCountries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      {fieldError(errors, `addresses.${i}.country`)} {/* ✅ */}
                    </div>
                    {/* state */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                        <TooltipHint hint="State name as per official records" />
                      </label>
                      {statesMap[i]?.length ? (
                        <Select
                          required
                          value={addr.state}
                          disabled={!addr.country}
                          onValueChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              addresses: [
                                {
                                  addressId: prev.addresses?.[i]?.addressId || null,
                                  houseNo: "",
                                  streetName: "",
                                  city: "",
                                  state: val,
                                  pincode: "",
                                  country: prev.addresses?.[i]?.country || "",
                                  addressType: undefined,
                                },
                              ],
                              clientTaxDetails: [],
                            }));
                          }}
                        >
                          <SelectTrigger className="!h-10 text-base w-full">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {statesMap[i].map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <input
                          type="text"
                          name={`addresses.${i}.state`}
                          value={addr.state || ""}
                          onChange={(e) =>
                            handleValidatedChange(e, i, "addresses")
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter State"
                          required
                        />
                      )}
                      {fieldError(errors, `addresses.${i}.state`)} {/* ✅ */}
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
                        required
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      {fieldError(errors, `addresses.${i}.city`)} {/* ✅ */}
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
                        placeholder="e.g. 221B"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street <span className="text-red-500">*</span>
                        <TooltipHint hint="Street name. Example: Baker Street" />
                      </label>
                      <input
                        type="text"
                        required
                        name={`addresses.${i}.streetName`}
                        value={addr.streetName || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        placeholder="e.g. Baker Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none"
                      />
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
                        required
                        placeholder="e.g. 400001"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      {fieldError(errors, `addresses.${i}.pincode`)} {/* ✅ */}
                    </div>
                    {/* Address Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name={`addresses.${i}.addressType`}
                        value={addr.addressType || ""}
                        onChange={(e) =>
                          handleValidatedChange(e, i, "addresses")
                        }
                        className="!h-11 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none"
                        required
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

                  {(formData.addresses ?? []).length > 1 && (
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
                  Point of Contacts
                </h3>
                <button
                  type="button"
                  onClick={() => addItem("clientPocs")}
                  className="text-indigo-600 text-sm hover:underline font-medium"
                >
                  + Add POC
                </button>
              </div>

              {/* Show POCs when at least one exists */}
              {(formData.clientPocs ?? []).length > 0 && (
                <div className="space-y-6">
                  {(formData.clientPocs ?? []).map((poc, i) => (
                    <div
                      key={i}
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
                            placeholder="e.g. Anita Sharma"
                            className="w-full px-3 py-2 border rounded-md"
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
                            type="email"
                            name={`clientPocs.${i}.email`}
                            value={poc.email || ""}
                            onChange={(e) =>
                              handleValidatedChange(e, i, "clientPocs")
                            }
                            onBlur={(e) => {
                              handleUniqueBlur(
                                "EMAIL",
                                "email",
                                `clientPocs.${i}.email`,
                                (formData.clientPocs ?? [])[i]?.pocId
                              )(e);
                            }}
                            required
                            placeholder="e.g. anita@company.com"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {fieldError(errors, `clientPocs.${i}.email`)}
                        </div>

                        {/* Contact Number */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                            {/* {i === 0 && <span className="text-red-500">*</span>} */}
                            <TooltipHint hint="10-digit mobile number of the contact" />
                          </label>
                          <input
                            type="tel"
                            name={`clientPocs.${i}.contactNumber`}
                            value={poc.contactNumber || ""}
                            maxLength={10}
                            onChange={(e) => {
                              if (!/^\d*$/.test(e.target.value)) return;
                              handleValidatedChange(e, i, "clientPocs");
                            }}
                            onBlur={(e) => {
                              handleUniqueBlur(
                                "CONTACT_NUMBER",
                                "contact_number",
                                `clientPocs.${i}.contactNumber`,
                                (formData.clientPocs ?? [])[i]?.pocId,
                                10
                              )(e);
                            }}
                            className="w-full px-3 py-2 border rounded-md"
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
                            onChange={(e) =>
                              handleValidatedChange(e, i, "clientPocs")
                            }
                            placeholder="e.g. Procurement Manager"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        {fieldError(errors, `clientPocs.${i}.designation`)}
                      </div>

                      {/* Remove Button - Only when more than 1 POC */}
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

            {/* ==================== TAX DETAILS ==================== */}
            {shouldShowTaxSection && (
              <div className="pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tax Details
                  </h3>
                  {/* <button
                  type="button"
                  onClick={() => addItem("clientTaxDetails")}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  + Add Tax
                </button> */}
                </div>

                {(formData.clientTaxDetails || []).map((tax, i) => (
                  <div
                    key={i}
                    className="mb-4 p-4 border rounded bg-gray-50 flex gap-4 items-end"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Name
                        <TooltipHint hint="Name of the tax. Example: GST, VAT, Service Tax" />
                      </label>
                      {/* <input
                      type="text"
                      name={`clientTaxDetails.${i}.taxName`}
                      value={tax.taxName || ""}
                      onChange={(e) => handleChange(e, i, "clientTaxDetails")}
                      placeholder="e.g., GST"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    /> */}
                      <input
                        type="text"
                        name={`clientTaxDetails.${i}.taxName`}
                        value={tax.taxName || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                      {fieldError(errors, `clientTaxDetails.${i}.taxName`)}
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        % <span className="text-red-500">*</span>
                        <TooltipHint hint="Tax percentage rate. Example: 18 for 18%" />
                      </label>
                      <input
                        name={`clientTaxDetails.${i}.taxPercentage`}
                        value={tax.taxPercentage ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!/^\d*\.?\d*$/.test(val)) return; // allow only numbers

                          handleChange(e, i, "clientTaxDetails");
                        }}
                        type="text"
                        onWheel={preventWheelChange}
                        inputMode="numeric"
                        required={shouldShowTaxSection}
                        min={0}
                        placeholder="Enter %"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {fieldError(errors, `clientTaxDetails.${i}.taxPercentage`)}
                    </div>
                    {/* {(formData.clientTaxDetails ?? []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem("clientTaxDetails", i)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      <Trash2 size={18} />
                    </button>
                  )} */}
                  </div>
                ))}
              </div>
            )}

            {errors.root && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                {errors.root}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              {/* LEFT → DELETE BUTTON */}
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClient}
              >
                Delete Client
              </Button>
              {/* RIGHT → CANCEL + UPDATE */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin-dashboard/clients/list")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!hasChanges || Object.keys(errors).length > 0}
                  title={!hasChanges ? "No changes made" : ""}
                >
                  Update Client
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
