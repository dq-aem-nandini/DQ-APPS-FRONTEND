"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  Loader2,
  Edit3,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BackButton from "@/components/ui/BackButton";
import { organizationService } from "@/lib/api/organizationService";
import type { OrganizationResponseDTO } from "@/lib/api/types";

// Safe display helper
const $ = (v: any) => (v ? String(v) : "—");
const fmt = (v: any) => (v ? String(v).replace(/_/g, " ") : "—");

export default function ViewOrganizationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizationResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      try {
        const data = await organizationService.getById(id);
        setOrg(data);
      } catch (err) {
        console.error("Failed to load organization:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!org) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-lg">
          Organization not found
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <BackButton to="/admin-dashboard/organization/list" />
            <Button
              onClick={() =>
                router.push(`/admin-dashboard/organization/${id}/edit`)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Organization
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-10 md:p-16 shadow-xl mb-16 overflow-hidden">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              {/* IMAGE */}
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur-xl opacity-25 group-hover:opacity-40 transition duration-500" />
                <div className="relative rounded-full overflow-hidden ring-8 ring-white shadow-xl">
                  <Avatar className="h-32 w-32 md:h-36 md:w-36 lg:h-40 lg:w-40">
                    <AvatarImage
                      src={org.logoUrl || ""}
                      alt={org.organizationName}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-3xl md:text-4xl font-black">
                      {org.organizationName?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* TEXT */}
              <div className="text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 mb-3">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {org.organizationName}
                  </h1>
                  {org.status === "ACTIVE" && (
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">
                      Active
                    </Badge>
                  )}
                </div>

                <p className="text-base md:text-lg text-gray-600 font-medium mb-5 max-w-3xl">
                  {org.organizationLegalName}
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border shadow-sm">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {fmt(org.domain)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border shadow-sm">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {fmt(org.industryType)}
                    </span>
                  </div>

                  {org.establishedDate && (
                    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border shadow-sm">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-gray-700">
                        {format(new Date(org.establishedDate), "yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left */}
            <div className="space-y-8">
              {/* Overview */}
              <Card className="border-0 shadow-sm">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-gray-800">
                    Overview
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Established</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        {org.establishedDate
                          ? format(
                              new Date(org.establishedDate),
                              "dd MMMM yyyy"
                            )
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Timezone</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {$(org.timezone)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Currency</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-gray-400" />
                        {$(org.currencyCode)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact */}
              <Card className="border-0 shadow-sm">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-gray-800">
                    Contact
                  </h3>
                  <div className="space-y-5">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {" "}
                        {/* ← this prevents overflow */}
                        <p className="text-xs text-gray-500">Email</p>
                        <a
                          href={`mailto:${org.email}`}
                          className="font-semibold text-base hover:underline break-all"
                        >
                          {$(org.email)}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <Phone className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Phone</p>
                        <a
                          href={`tel:${org.contactNumber}`}
                          className="font-semibold text-base hover:underline"
                        >
                          {$(org.contactNumber)}
                        </a>
                      </div>
                    </div>

                    {/* Website */}
                    {org.website && (
                      <div className="flex items-start gap-4">
                        <Globe className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Website</p>
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-base text-indigo-600 hover:underline flex items-center gap-1 break-all"
                          >
                            {org.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Digital Signature */}
              <Card className="border-0 shadow-sm">
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 text-center">
                    Digital Signature
                  </h3>

                  {org.digitalSignatureUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={org.digitalSignatureUrl}
                        alt="Digital Signature"
                        className="h-28 object-contain border rounded-xl p-3 bg-white shadow-sm"
                      />
                      <p className="text-xs text-gray-500 mt-3">
                        Authorized Digital Signature
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-4">
                      No Digital Signature Uploaded
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right */}
            <div className="lg:col-span-2 space-y-10">
              {/* Tax & Legal */}
              <Card className="border-0 shadow-sm">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-8 text-gray-800">
                    Tax & Legal
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-gray-500 text-xs mb-2">GST Number</p>
                      <p className="font-mono text-xl font-bold">
                        {$(org.gstNumber)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-2">PAN Number</p>
                      <p className="font-mono text-xl font-bold">
                        {$(org.panNumber)}
                      </p>
                    </div>
                    {org.cinNumber && (
                      <div className="sm:col-span-2">
                        <p className="text-gray-500 text-xs mb-2">CIN Number</p>
                        <p className="font-mono text-xl font-bold">
                          {$(org.cinNumber)}
                        </p>
                      </div>
                    )}
                    {/* Prefix */}
                    {org.prefix && (
                      <div>
                        <p className="text-gray-500 text-xs mb-2">
                          Invoice Prefix
                        </p>
                        <p className="font-mono text-xl font-bold text-indigo-600">
                          {$(org.prefix)}
                        </p>
                      </div>
                    )}

                    {/* Company Type */}
                    {org.companyType && (
                      <div>
                        <p className="text-gray-500 text-xs mb-2">
                          Company Type
                        </p>
                        <p className="text-xl font-bold">
                          {$(org.companyType)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              {/* Attendance Policy */}
              <Card className="border-0 shadow-sm">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6 text-gray-800">
                    Attendance Policy
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Absent Max Hours
                      </p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {org.attendancePolicyDto?.absentMaxMinutes != null
                          ? org.attendancePolicyDto.absentMaxMinutes / 60
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Full Day Min Hours
                      </p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {org.attendancePolicyDto?.fullDayMinMinutes != null
                          ? org.attendancePolicyDto.fullDayMinMinutes / 60
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bank */}
              <Card className="border-0 shadow-sm">
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-8 text-gray-800">
                    Bank Details
                  </h3>
                  <div className="bg-gray-50 rounded-2xl p-8">
                    <div className="grid sm:grid-cols-2 gap-8 mb-8">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">
                          Account Holder
                        </p>
                        <p className="text-lg font-bold">
                          {$(org.accountHolderName)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">
                          Account Number
                        </p>
                        <p className="font-mono text-lg font-bold">
                          {$(org.accountNumber)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Bank</p>
                        <p className="text-lg font-bold">{$(org.bankName)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Branch</p>
                        <p className="text-lg font-bold">{$(org.branchName)}</p>
                      </div>
                    </div>
                    <div className="text-center pt-8 border-t">
                      <p className="text-gray-500 text-xs mb-2">IFSC Code</p>
                      <p className="font-mono text-3xl font-black text-indigo-600 tracking-widest">
                        {$(org.ifscCode)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Addresses */}
              <Card className="border-0 shadow-sm">
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-8 text-gray-800">
                    Addresses
                  </h3>
                  {org.addresses && org.addresses.length > 0 ? (
                    <div className="space-y-6">
                      {org.addresses.map((a, i) => (
                        <div
                          key={a.addressId || i}
                          className={`p-6 rounded-2xl border-l-8 ${
                            i === 0
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <p className="font-bold text-base mb-3">
                            {a.addressType} Address{" "}
                            {i === 0 && (
                              <span className="text-indigo-600">(Primary)</span>
                            )}
                          </p>
                          <p className="text-base font-medium text-gray-800">
                            {a.houseNo} {a.streetName}
                          </p>
                          <p className="text-gray-600">
                            {a.city}, {a.state} - {$(a.pincode)}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {$(a.country)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12 text-sm">
                      No addresses Added
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
