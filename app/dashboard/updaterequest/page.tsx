'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/api/employeeService';
import {
    WebResponseDTOListEmployeeUpdateRequestDTO,
    EmployeeDTO
} from '@/lib/api/types';
import Swal from 'sweetalert2';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

// Format date
const formatDate = (d: string) =>
    d ? new Date(d).toLocaleString() : '—';

// Prettify field names
const formatKey = (key: string) =>
    key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase());

export default function UpdateRequestPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [profile, setProfile] = useState<EmployeeDTO | null>(null);
    const [loading, setLoading] = useState(true);

    // Load OLD values from /employee/view
    const loadOldProfile = async () => {
        try {
            const res = await employeeService.getEmployeeById();
            setProfile(res);
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    // Load update requests
    const loadRequests = async () => {
        try {
            const res: WebResponseDTOListEmployeeUpdateRequestDTO =
                await employeeService.getMyUpdateRequests();

            if (res.flag && Array.isArray(res.response)) {
                const sorted = res.response.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setRequests(sorted);
            }
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    useEffect(() => {
        (async () => {
            await loadOldProfile();
            await loadRequests();
            setLoading(false);
        })();
    }, []);

    if (loading || !profile) {
        return (
            <div className="flex justify-center items-center h-48 sm:h-60 p-4">
                <div className="animate-spin w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center justify-center text-center">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
                My Update Requests
            </h1>

            {requests.length === 0 && (
                <div className="text-center text-gray-500 text-base sm:text-lg py-8 sm:py-10">
                    No update requests found.
                </div>
            )}

            {requests.map((req) => {
                let updatedData = req.updatedData;

                // If backend sends JSON string
                if (typeof updatedData === "string") {
                    try {
                        updatedData = JSON.parse(updatedData);
                    } catch {
                        updatedData = {};
                    }
                }

                // ✅ Show ONLY modified fields: oldValue !== newValue
                const modifiedFields = Object.entries(updatedData).filter(([key, newValue]) => {
                    const oldValue = profile[key as keyof EmployeeDTO];

                    // Ignore null/empty new values
                    if (
                        newValue === null ||
                        newValue === "" ||
                        newValue === undefined ||
                        newValue === "null" ||
                        newValue === "undefined"
                    ) {
                        return false;
                    }

                    // Ignore when both are same
                    if (String(oldValue) === String(newValue)) {
                        return false;
                    }

                    return true; // KEEP ONLY CHANGES
                });

                return (
                    <div
                        key={req.requestId}
                        className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border space-y-4 sm:space-y-6"
                    >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                            <div className="space-y-1">
                                <p className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-1">
                                    Request ID: {req.requestId.slice(0, 8)}...
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Sent: {formatDate(req.createdAt)}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                                {req.status === "PENDING" && (
                                    <span className="flex items-center gap-1.5 sm:gap-2 bg-yellow-100 text-yellow-700 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> Pending
                                    </span>
                                )}
                                {req.status === "APPROVED" && (
                                    <span className="flex items-center gap-1.5 sm:gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> Approved
                                    </span>
                                )}
                                {req.status === "REJECTED" && (
                                    <span className="flex items-center gap-1.5 sm:gap-2 bg-red-100 text-red-700 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> Rejected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Admin Comment */}
                        {req.adminComment && (
                            <div className="bg-gray-50 border rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <p className="text-xs sm:text-sm font-semibold text-gray-700">Admin Comment:</p>
                                <p className="text-gray-700 mt-1 text-xs sm:text-sm line-clamp-3">{req.adminComment}</p>
                            </div>
                        )}

                        {/* OLD vs NEW */}
                        <div>
                            <p className="text-green-700 font-semibold mb-2 sm:mb-3 text-base sm:text-lg">
                                Modified Fields
                            </p>

                            {modifiedFields.length === 0 ? (
                                <p className="text-gray-500 text-xs sm:text-sm">No modified fields.</p>
                            ) : (
                                <div className="space-y-2 sm:space-y-3">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 font-semibold text-xs sm:text-sm text-gray-800 border-b pb-2 hidden sm:grid">
                                        <span>Field Name</span>
                                        <span className="text-center">Previous</span>
                                        <span className="text-right">Updated</span>
                                    </div>

                                    {/* Mobile: Stacked Header */}
                                    <div className="sm:hidden grid grid-cols-1 gap-1 text-xs font-semibold text-gray-800 border-b pb-2">
                                        <span>Field Name</span>
                                        <span>Previous Value</span>
                                        <span>Updated Value</span>
                                    </div>

                                    {/* Data Rows */}
                                    {modifiedFields.map(([key, newValue]) => {
                                        const oldValue = profile[key as keyof EmployeeDTO] ?? "—";

                                        return (
                                            <div
                                                key={key}
                                                className="grid grid-cols-1 sm:grid-cols-3 items-start p-2 sm:p-3 border rounded-lg sm:rounded-xl bg-gray-50 shadow-sm gap-1 sm:gap-0"
                                            >
                                                {/* Label */}
                                                <div className="font-medium text-gray-800 text-xs sm:text-sm">
                                                    {formatKey(key)}
                                                </div>

                                                {/* Old Value */}
                                                <div className="sm:text-center">
                                                    <span className="text-red-600 font-semibold text-xs sm:text-sm block sm:inline">
                                                        Previous: {String(oldValue)}
                                                    </span>
                                                </div>

                                                {/* New Value */}
                                                <div className="text-right sm:text-right">
                                                    <span className="text-green-700 font-semibold text-xs sm:text-sm block sm:inline">
                                                        Updated: {String(newValue)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {req.approvedAt && (
                            <p className="text-xs sm:text-sm text-gray-600">
                                Approved On: {formatDate(req.approvedAt)}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}