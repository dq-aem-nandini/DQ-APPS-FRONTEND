'use client';

import { useEffect, useState } from 'react';
import { employeeService } from '@/lib/api/employeeService';
import {
    WebResponseDTOListEmployeeUpdateRequestDTO,
    EmployeeDTO,
    AddressModel
} from '@/lib/api/types';
import Swal from 'sweetalert2';
import { Clock, CheckCircle, XCircle, FileText, Camera, MapPin } from 'lucide-react';

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

    const loadOldProfile = async () => {
        try {
            const res = await employeeService.getEmployeeById();
            setProfile(res);
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight flex items-center justify-center">
                My Update Requests
            </h1>

            {requests.length === 0 && (
                <div className="text-center text-gray-500 text-base sm:text-lg py-8 sm:py-10">
                    No update requests found.
                </div>
            )}

            {requests.map((req) => {
                return (
                    <div
                        key={req.requestId}
                        className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border space-y-4 sm:space-y-6 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div className="space-y-1">
                                <p className="text-base sm:text-lg font-semibold text-gray-800">
                                    Request ID: {req.requestId.slice(0, 8)}...
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Sent: {formatDate(req.createdAt)}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                                {req.status === "PENDING" && (
                                    <span className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                                        <Clock className="w-4 h-4" /> Pending
                                    </span>
                                )}
                                {req.status === "APPROVED" && (
                                    <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" /> Approved
                                    </span>
                                )}
                                {req.status === "REJECTED" && (
                                    <span className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium">
                                        <XCircle className="w-4 h-4" /> Rejected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Admin Comment */}
                        {req.adminComment && (
                            <div className="bg-gray-50 border rounded-xl p-4">
                                <p className="text-sm font-semibold text-gray-700">Admin Comment:</p>
                                <p className="text-gray-700 mt-1 text-sm">{req.adminComment}</p>
                            </div>
                        )}

                        {/* Changes Section */}
                        {/* Changes Section */}
                        <div>
                            <p className="text-green-700 font-semibold mb-3 text-base sm:text-lg">
                                Modified Fields & Files
                            </p>

                            {(() => {
                                if (!profile) {
                                    return <p className="text-gray-500 text-sm italic">Profile not loaded</p>;
                                }

                                let updatedData = req.updatedData;
                                if (typeof updatedData === "string") {
                                    try {
                                        updatedData = JSON.parse(updatedData);
                                    } catch {
                                        updatedData = {};
                                    }
                                }

                                // 1. Scalar field changes
                                const scalarChanges = Object.entries(updatedData)
                                    .filter(([key]) => !['documents', 'addresses', 'employeePhotoUrl', 'employeePhotoUrlString'].includes(key))
                                    .filter(([_, newValue]) => newValue != null && newValue !== '' && newValue !== 'null')
                                    .filter(([key, newValue]) => {
                                        const oldValue = profile[key as keyof EmployeeDTO];
                                        return String(oldValue ?? '') !== String(newValue);
                                    });

                                // 2. Address changes
                                const addressChanges: { field: string; old: string; new: string; type: string }[] = [];
                                if (Array.isArray(updatedData.addresses) && updatedData.addresses.length > 0) {
                                    const newAddr = updatedData.addresses[0];
                                    const oldAddr = profile.addresses?.find(a => a.addressType === newAddr.addressType) || {};

                                    const addrFields: (keyof AddressModel)[] = [
                                        'houseNo', 'streetName', 'city', 'state', 'country', 'pincode', 'addressType'
                                    ];

                                    addrFields.forEach((field) => {
                                        const oldVal = (oldAddr as Partial<AddressModel>)[field] ?? '—';
                                        const newVal = newAddr[field] ?? '—';
                                        if (String(oldVal) !== String(newVal)) {
                                            addressChanges.push({
                                                field: formatKey(field),
                                                old: String(oldVal),
                                                new: String(newVal),
                                                type: newAddr.addressType || 'Address'
                                            });
                                        }
                                    });
                                }

                                // 3. Documents
                                const newDocuments = Array.isArray(updatedData.documents) && updatedData.documents.length > 0
                                    ? updatedData.documents.filter((d: any) => d.fileUrl || d.documentId)
                                    : [];

                                // 4. Profile Photo
                                const oldPhotoUrl = profile.employeePhotoUrl || '';
                                const photoUrl = updatedData.employeePhotoUrl || updatedData.employeePhotoUrlString || null;
                                const hasNewPhoto = !!photoUrl && photoUrl !== oldPhotoUrl;

                                const hasAnyChange = scalarChanges.length > 0 || addressChanges.length > 0 || newDocuments.length > 0 || hasNewPhoto;

                                if (!hasAnyChange) {
                                    return (
                                        <p className="text-gray-500 text-sm italic">
                                            No changes detected in this request.
                                        </p>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Table Header - Only shown if there are grid changes */}
                                        {(scalarChanges.length > 0 || addressChanges.length > 0 || hasNewPhoto) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 font-semibold text-gray-700 text-sm border-b border-gray-300 pb-2 mb-4">
                                                <div>Field</div>
                                                <div className="sm:text-center text-red-600">Previous</div>
                                                <div className="text-right text-green-700">Updated</div>
                                            </div>
                                        )}

                                        {/* Scalar Changes */}
                                        {scalarChanges.length > 0 && (
                                            <div className="space-y-3">
                                                {scalarChanges.map(([key, newValue]) => {
                                                    const oldValue = profile[key as keyof EmployeeDTO] ?? "—";
                                                    return (
                                                        <div
                                                            key={key}
                                                            className="grid grid-cols-1 sm:grid-cols-3 items-start p-3 border rounded-xl bg-gray-50 gap-2"
                                                        >
                                                            <div className="font-medium text-gray-800 text-sm">
                                                                {formatKey(key)}
                                                            </div>
                                                            <div className="sm:text-center">
                                                                <span className="text-red-600 font-medium text-sm">
                                                                    {String(oldValue)}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-green-700 font-medium text-sm">
                                                                    {String(newValue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Address Changes */}
                                        {addressChanges.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="font-semibold text-purple-700 text-sm flex items-center gap-2 mb-3">
                                                    <MapPin className="w-5 h-5" />
                                                    {addressChanges[0].type} Address Changes:
                                                </p>
                                                {addressChanges.map((change, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-1 sm:grid-cols-3 items-start p-3 border rounded-xl bg-purple-50 gap-2"
                                                    >
                                                        <div className="font-medium text-gray-800 text-sm">
                                                            {change.field}
                                                        </div>
                                                        <div className="sm:text-center">
                                                            <span className="text-red-600 font-medium text-sm">
                                                                {change.old}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-green-700 font-medium text-sm">
                                                                {change.new}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Profile Photo Changes */}
                                        {hasNewPhoto && (
                                            <div className="space-y-3">
                                                <p className="font-semibold text-purple-700 text-sm flex items-center gap-2 mb-3">
                                                    <Camera className="w-5 h-5" />
                                                    Profile Photo Changes:
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 items-start p-3 border rounded-xl bg-purple-50 gap-2">
                                                    <div className="font-medium text-gray-800 text-sm">
                                                        Profile Photo
                                                    </div>
                                                    <div className="sm:text-center">
                                                        {oldPhotoUrl ? (
                                                            <a
                                                                href={oldPhotoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-red-600 hover:underline text-sm break-all block"
                                                                title={oldPhotoUrl}
                                                            >
                                                                View Old Photo →
                                                            </a>
                                                        ) : (
                                                            <span className="text-red-600 italic text-sm">No previous photo</span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <a
                                                            href={photoUrl!}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-700 font-medium hover:underline text-sm break-all block"
                                                            title={photoUrl!}
                                                        >
                                                            View New Photo →
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents - Aligned Like Other Changes */}
                                        {newDocuments.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="font-semibold text-indigo-700 text-sm">
                                                    Document Updates:
                                                </p>

                                                {newDocuments.map((newDoc: any, i: number) => {
                                                    // Find old document with same docType
                                                    const oldDoc = profile.documents?.find((d: any) => d.docType === newDoc.docType);

                                                    return (
                                                        <div key={i} className="space-y-3">
                                                            {/* Document Type Header */}
                                                            <p className="font-medium text-sm flex items-center gap-2">
                                                                <FileText className="w-5 h-5 text-indigo-600" />
                                                                {newDoc.docType.replace(/_/g, " ")}
                                                            </p>

                                                            {/* Grid: Previous vs New */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 items-start p-3 border rounded-xl bg-blue-50 gap-2">
                                                                {/* Label */}
                                                                <div className="font-medium text-gray-800 text-sm">
                                                                    Document File
                                                                </div>

                                                                {/* Previous File */}
                                                                <div className="sm:text-center">
                                                                    {oldDoc?.file ? (
                                                                        <a
                                                                        href={oldDoc.file instanceof File ? URL.createObjectURL(oldDoc.file) : oldDoc.file}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-red-600 hover:underline text-sm break-all block"
                                                                        title={oldDoc.file instanceof File ? oldDoc.file.name : oldDoc.file}
                                                                        >
                                                                        View Old File →
                                                                        </a>

                                                                    ) : (
                                                                        <span className="text-red-600 italic text-sm">No previous file</span>
                                                                    )}
                                                                </div>

                                                                {/* New File */}
                                                                <div className="text-right">
                                                                    <a
                                                                        href={newDoc.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-green-700 font-medium hover:underline text-sm break-all block"
                                                                        title={newDoc.fileUrl}
                                                                    >
                                                                        View New File →
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                    </div>
                                );
                            })()}
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