"use client";

import { useEffect, useState } from "react";
import {
  EmploymentType,
  EMPLOYMENT_TYPE_OPTIONS,
  WORKING_PATTERN_OPTIONS,
  WorkingPattern,
  WorkingPolicyResponseDTO,
} from "@/lib/api/types";
import { Pencil, Calendar, Briefcase, Clock } from "lucide-react";
import { workingPolicyService } from "@/lib/api/workPolicy";
import Swal from "sweetalert2";

export default function WorkPolicyPage() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [loading, setLoading] = useState(false);
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<EmploymentType | "">("");
  const [statusFilter, setStatusFilter] = useState<boolean | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [workingPattern, setWorkingPattern] = useState<WorkingPattern | "">("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [policies, setPolicies] = useState<WorkingPolicyResponseDTO[]>([]);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const fetchPolicies = async (
    empType?: EmploymentType,
    active?: boolean
  ) => {
    try {
      setLoading(true);

      const res = await workingPolicyService.getAllWorkingPolicies(
        empType,
        active
      );

      setPolicies(res.response || []);
    } catch (error: any) {
      console.error(error);
    
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
    
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "history") {
      fetchPolicies(
        employmentTypeFilter || undefined,
        statusFilter === "" ? undefined : statusFilter
      );
    }
  }, [employmentTypeFilter, statusFilter, activeTab]);
  const resetFilters = () => {
    setEmploymentTypeFilter("");
    setStatusFilter("");
    fetchPolicies();
  };
  const handleSubmit = async () => {
    if (!employmentType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Employment Type",
        text: "Please select Employment Type",
      });
      return;
    }

    if (!workingPattern) {
      Swal.fire({
        icon: "warning",
        title: "Missing Working Pattern",
        text: "Please select Working Pattern",
      });
      return;
    }
    if (!effectiveFrom) {
      Swal.fire({
        icon: "warning",
        title: "Missing Date",
        text: "Please select Effective From date",
      });
      return;
    }
    if (effectiveTo && effectiveFrom >= effectiveTo) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Effective To must be after Effective From",
      });
      return;
    }

    const payload = {
      employmentType: employmentType as EmploymentType,
      workingPattern: workingPattern as WorkingPattern,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
    };

    try {
      if (editingPolicyId) {
        const res =  await workingPolicyService.updateWorkingPolicy(editingPolicyId, payload);

        Swal.fire({
          icon: "success",
          title: "Updated",
          text: res.message,
          // text: "Working policy updated successfully",
        });
      } else {
        const res = await workingPolicyService.createWorkingPolicy(payload);

        Swal.fire({
          icon: "success",
          title: "Created",
          // text: "Working policy created successfully",
          text: res.message,
          timer: 2000,
          showConfirmButton: false
        });
      }

      resetForm();
      if (activeTab === "history") fetchPolicies();
      setActiveTab("history");

    } catch (error: any) {
      console.error(error);
    
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
    
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    }
  };

  const resetForm = () => {
    setEmploymentType("");
    setWorkingPattern("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setEditingPolicyId(null);
  };

  const handleEdit = (policy: WorkingPolicyResponseDTO) => {
    setEmploymentType(policy.employmentType);
    setWorkingPattern(policy.workingPattern);
    setEffectiveFrom(policy.effectiveFrom.split("T")[0]);
    setEffectiveTo(policy.effectiveTo ? policy.effectiveTo.split("T")[0] : "");
    setEditingPolicyId(policy.id);
    setActiveTab("form");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8 flex flex-col items-center">        
        {/* Header + Tabs */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-center tracking-tight mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Working Policy Management
          </h1>


        </div>
        <div className="flex justify-center">
          <div className="inline-flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-5 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === "form"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Create Policy
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === "history"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              Policy History
            </button>
          </div>
        </div>
        {/* FORM TAB */}
        {activeTab === "form" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-3xl w-full mx-auto">
            <div className="space-y-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Briefcase size={16} /> Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Employment Type</option>
                    {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Clock size={16} /> Working Pattern <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={workingPattern}
                    onChange={(e) => setWorkingPattern(e.target.value as WorkingPattern)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Working Pattern</option>
                    {WORKING_PATTERN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace("_", " → ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Effective From <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    min={effectiveFrom || undefined}
                    disabled={!effectiveFrom}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2.5 ${!effectiveFrom
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition shadow-sm disabled:opacity-50"                >
                  {editingPolicyId ? "Update Policy" : "Create Policy"}
                </button>

                {editingPolicyId && (
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB - Edit lives here */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 w-full max-w-5xl mx-auto">            {/* Filters - auto apply on change */}
            <div className="flex flex-wrap justify-center gap-4 mb-6 items-center">
              {/* Employment Type */}
              <select
                value={employmentTypeFilter}
                onChange={(e) =>
                  setEmploymentTypeFilter(e.target.value as EmploymentType | "")
                }
                className="border border-gray-300 rounded-lg px-4 py-2.5 min-w-[200px]"
              >
                <option value="">All Employment Types</option>
                {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={statusFilter === "" ? "" : String(statusFilter)}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val === "" ? "" : val === "true");
                }}
                className="border border-gray-300 rounded-lg px-4 py-2.5 min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>


              {/* Reset */}
              <button
                onClick={resetFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg"
              >
                Reset
              </button>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                  <tr>
                    <th className="px-6 py-4">Employment</th>
                    <th className="px-6 py-4">Pattern</th>
                    <th className="px-6 py-4">From</th>
                    <th className="px-6 py-4">To</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Loading policies...
                      </td>
                    </tr>
                  )}

                  {!loading && policies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No policies found
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    policies.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{p.employmentType?.replace("_", " ") ?? "—"}</td>
                        <td className="px-6 py-4">{p.workingPattern?.replace("_", " → ") ?? "—"}</td>
                        <td className="px-6 py-4">
                          {p.effectiveFrom ? p.effectiveFrom.split("T")[0] : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {p.effectiveTo ? p.effectiveTo.split("T")[0] : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                            title="Edit policy"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}