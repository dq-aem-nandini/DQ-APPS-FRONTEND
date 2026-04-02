"use client";

import { useEffect, useState } from "react";
import { employeePunchService } from "@/lib/api/EmployeePunchService";
import type { AttendanceRegularization } from "@/lib/api/types";
import { Loader2, Check, X } from "lucide-react";
import Swal from "sweetalert2";
import { format } from "date-fns";

export default function RegularizationPage() {
  const [requests, setRequests] = useState<AttendanceRegularization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await employeePunchService.getPendingRegularizations();

      if (res.flag) {
        setRequests(res.response || []);
      } else {
        Swal.fire({
          title: "Error",
          text: res.message,
          icon: "error",
          confirmButtonColor: "#6366f1",
        });
      }
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message || "Something went wrong",
        icon: "error",
        confirmButtonColor: "#6366f1",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    const result = await Swal.fire({
      title: "Approve Request?",
      text: "This will mark the regularization as approved.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, Approve",
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(id);
      const res = await employeePunchService.approveRegularization(id);

      if (res.flag) {
        Swal.fire({
          title: "Approved!",
          text: res.message,
          icon: "success",
          confirmButtonColor: "#10b981",
        });
        fetchRequests();
      } else {
        Swal.fire({
          title: "Failed",
          text: res.message,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    const result = await Swal.fire({
      title: "Reject Request?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, Reject",
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(id);
      const res = await employeePunchService.rejectRegularization(id);

      if (res.flag) {
        Swal.fire({
          title: "Rejected",
          text: res.message,
          icon: "success",
          confirmButtonColor: "#10b981",
        });
        fetchRequests();
      } else {
        Swal.fire({
          title: "Failed",
          text: res.message,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = requests.filter(
    (req) => req.status === "PENDING"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/40 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Regularization Requests
          </h1>
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-1xl font-medium text-indigo-700">
            {pendingCount} pending
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto max-w-md">
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                No pending requests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All regularization requests have been processed.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Employee Name
                    </th>

                    <th
                      scope="col"
                      className="px-3 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      In Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      Out Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      Reason
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-4 text-center text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="relative px-4 py-4 text-center text-sm font-semibold text-gray-900 sm:pr-6"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-indigo-50/40 transition-colors duration-150"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 sm:pl-6 text-center">
                        {req.employeeName} ({req.designation})
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 text-center">
                        {format(new Date(req.attendanceDate), "dd MMM yyyy")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 text-center">
                        {req.correctedIn
                          ? format(new Date(req.correctedIn), "hh:mm a")
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 text-center">
                        {req.correctedOut
                          ? format(new Date(req.correctedOut), "hh:mm a")
                          : "—"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600 max-w-xs truncate  text-center">
                        {req.reason}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm  text-center">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          {req.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium sm:pr-6 text-center">
                        {req.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>

                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading === req.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}