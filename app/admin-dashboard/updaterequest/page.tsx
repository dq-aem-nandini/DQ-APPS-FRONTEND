'use client';

import React, { useEffect, useState } from 'react';
import { employeeService } from '@/lib/api/employeeService';
import { EmployeeUpdateRequestDTO, EmployeeDTO, AddressModel } from '@/lib/api/types';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {adminService} from "@/lib/api/adminService"; 
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  MessageSquare,
  FileText,
  Camera,
  MapPin,
} from 'lucide-react';

const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

export default function UpdateRequestAdminPage() {
  const [requests, setRequests] = useState<EmployeeUpdateRequestDTO[]>([]);
  const [holidayRequests, setHolidayRequests] = useState<any[]>([]);
  const [oldProfiles, setOldProfiles] = useState<Record<string, EmployeeDTO>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeUpdateRequestDTO | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [viewAllChanges, setViewAllChanges] = useState<any>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const hasProfileRequests = requests.length > 0;
const hasHolidayRequests = holidayRequests.length > 0;
const hasAnyRequests = hasProfileRequests || hasHolidayRequests;


  const isLongText = (val: any, limit = 18) =>String(val).length > limit;
  const loadOldProfile = async (employeeId: string) => {
    if (oldProfiles[employeeId]) return oldProfiles[employeeId];
    try {
      const profile = await employeeService.getEmployeeByIdAdmin(employeeId);
      setOldProfiles(prev => ({ ...prev, [employeeId]: profile }));
      return profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  };

    const fetchholidayRequests = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAllHolidayUpdateRequests();
        console.log("Holiday Update Requests:", res.response);
        if (res.flag && res.response) {
          console.log("Setting requests:");
          setHolidayRequests(res.response);
        }
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Failed to load',
          confirmButtonColor: '#2563eb',
        });
      } finally {
        setLoading(false);
      }
    };
  
    const handleholidayApprove = async (requestId: string) => {
      if (processing) return;
      setProcessing(true);
  
      Swal.fire({ title: 'Approving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
      try {
        const res = await adminService.approveHolidayUpdateRequest(requestId);
        if (res.flag) {
          Swal.fire({ icon: 'success', title: 'Approved!', confirmButtonColor: '#2563eb' });
          fetchRequests(); // refresh the list
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: '#2563eb' });
      } finally {
        setProcessing(false);
      }
    };
  
    useEffect(() => {
      fetchholidayRequests();
    }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAllUpdateRequestsAdmin();
      if (res.flag && res.response) {
        setRequests(res.response);
        const uniqueIds = [...new Set(res.response.map(r => r.employeeId))];
        await Promise.all(uniqueIds.map(id => loadOldProfile(id)));
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to load', confirmButtonColor: '#2563eb' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (processing) return;
    setProcessing(true);
    Swal.fire({ title: 'Approving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await employeeService.approveUpdateRequest(requestId);
      if (res.flag) {
        Swal.fire({ icon: 'success', title: 'Approved!', confirmButtonColor: '#2563eb' });
        fetchRequests();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: '#2563eb' });
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (req: EmployeeUpdateRequestDTO) => {
    setSelectedRequest(req);
    setRejectComment('');
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest || processing) return;
    setProcessing(true);
    setIsRejectDialogOpen(false);

    Swal.fire({ title: 'Rejecting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await employeeService.rejectUpdateRequest(selectedRequest.requestId, rejectComment.trim());
      if (res.flag) {
        Swal.fire({ icon: 'success', title: 'Rejected!', confirmButtonColor: '#2563eb' });
        fetchRequests();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: '#2563eb' });
    } finally {
      setProcessing(false);
    }
  };

  // const getStatusBadge = (status: string) => {
  //   if (status === 'APPROVED')
  //     return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
  //   if (status === 'REJECTED')
  //     return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  //   return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  // };
  const getStatusBadge = (status: string) => {
    const base =
      'max-w-full whitespace-nowrap overflow-hidden text-ellipsis';
  
    if (status === 'APPROVED')
      return (
        <Badge className={`bg-green-100 text-green-700 text-xs ${base}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
  
    if (status === 'REJECTED')
      return (
        <Badge className={`bg-red-100 text-red-700 text-xs ${base}`}>
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
  
    return (
      <Badge className={`bg-yellow-100 text-yellow-700 text-xs ${base}`}>
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };  

  // Extract all meaningful changes
  const extractChanges = (req: EmployeeUpdateRequestDTO, oldProfile: EmployeeDTO | undefined) => {
    let updatedData = req.updatedData;
    if (typeof updatedData === 'string') {
      try { updatedData = JSON.parse(updatedData); } catch { updatedData = {}; }
    }

     // New documents
     const newDocuments = Array.isArray(updatedData.documents) && updatedData.documents.length > 0
     ? updatedData.documents.filter((d: any) => d.fileUrl || d.documentId)
     : [];

    // Profile photo - check both possible keys
    const photoUrl = updatedData.employeePhotoUrl || updatedData.employeePhotoUrlString;
    const oldPhotoUrl = oldProfile?.employeePhotoUrl || '';
    const hasNewPhoto = !!photoUrl && photoUrl !== oldPhotoUrl;
    // Scalar field changes (exclude complex objects)
    const scalarChanges = Object.entries(updatedData)
      .filter(([key]) => !['documents', 'addresses', 'employeePhotoUrl', 'employeePhotoUrlString'].includes(key))
      .filter(([_, newValue]) => newValue != null && newValue !== '')
      .filter(([key, newValue]) => {
        const oldValue = oldProfile?.[key as keyof EmployeeDTO];
        return String(oldValue ?? '') !== String(newValue);
      });

      // const isAddressDelete = req.requestType === 'ADDRESS_DELETE';

    // Address changes - ADDED / UPDATED / REMOVED
      const addressChanges: {
        field: string;
        old: string;
        new: string;
        type: string;
      }[] = [];

      const oldAddresses: AddressModel[] = oldProfile?.addresses || [];

// const isAddressDelete =
//   updatedData &&
//   typeof updatedData === 'object' &&
//   'addressId' in updatedData &&
//   !Array.isArray(updatedData.addresses);
      const isAddressDelete = req.requestType === 'ADDRESS_DELETE';


      if (isAddressDelete) {
        const deletedAddressId = updatedData.addressId;

        const deletedAddress = oldAddresses.find(
          (a) => a.addressId === deletedAddressId
        );

        if (deletedAddress) {
          addressChanges.push({
            field: 'Address',
            old: 'Removed',
            new: '—',
            type: deletedAddress.addressType ?? 'UNKNOWN',
          });
        }

        return {
          scalarChanges,
          addressChanges,
          newDocuments,
          hasNewPhoto,
          photoUrl,
          oldPhotoUrl,
        };
      }

      let newAddresses: AddressModel[] = [];

      if (Array.isArray(updatedData.addresses)) {
        newAddresses = updatedData.addresses;
      }

      const deletedAddressTypes = new Set<string>();

      if (Array.isArray(updatedData.addresses)) {
        updatedData.addresses.forEach((addr: any) => {
          if (addr.isDeleted === true && addr.addressType) {
            deletedAddressTypes.add(addr.addressType);
          }
        });
      }

      const oldMap = new Map<string, AddressModel>(
        oldAddresses
          .filter((a) => {
            console.log(a.addressId);
            return a.addressType !== undefined 
          })
          .map((a) => [a.addressType as string, a]),
      );

      const newMap = new Map<string, AddressModel>(
        newAddresses
          .filter((a) => a.addressType !== undefined)
          .map((a) => [a.addressType as string, a]),
      );

      const addrFields: (keyof AddressModel)[] = [
        'houseNo',
        'streetName',
        'city',
        'state',
        'country',
        'pincode',
      ];

      // --------------------
      // ADDED & UPDATED
      // --------------------
      newMap.forEach((newAddr, type) => {
        const oldAddr = oldMap.get(type);

        // ➕ ADDED
      if (!oldAddr) {
        addrFields.forEach((field) => {
          const newVal = newAddr[field] ?? '—';

          if (newVal !== '—') {
            addressChanges.push({
              field: formatKey(field),
              old: '—',
              new: String(newVal),
              type,
            });
          }
        });
        return;
      }

  // ✏️ UPDATED (field-level diff)
  addrFields.forEach((field) => {
    const oldVal = oldAddr[field] ?? '—';
    const newVal = newAddr[field] ?? '—';

      if (String(oldVal) !== String(newVal)) {
        addressChanges.push({
          field: formatKey(field),
          old: String(oldVal),
          new: String(newVal),
          type,
        });
      }
    });
  });

// --------------------
// ❌ REMOVED
// --------------------
// oldMap.forEach((oldAddr, type) => {
//   if (!newMap.has(type)) {
//     addressChanges.push({
//       field: 'Address',
//       old: 'Removed',
//       new: '—',
//       type,
//     });
//   }
// });

if (!isAddressDelete) {
  oldMap.forEach((oldAddr, id) => {
    if (!newMap.has(id)) {
      addressChanges.push({
        field: 'Address',
        old: 'Removed',
        new: '—',
        type: oldAddr.addressType ?? 'UNKNOWN',
      });
    }
  });
}


   
    return { scalarChanges, addressChanges, newDocuments, hasNewPhoto, photoUrl, oldPhotoUrl };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin size-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }


  const groupAddressChangesByType = (
    addressChanges: {
      field: string;
      old: string;
      new: string;
      type: string;
    }[],
  ) => {
    return addressChanges.reduce((acc, change) => {
      if (!acc[change.type]) {
        acc[change.type] = [];
      }
      acc[change.type].push(change);
      return acc;
    }, {} as Record<string, typeof addressChanges>);
  };
  

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Update Requests
          </h1>
        </div>

        {!hasAnyRequests? (
          <Card className="text-center py-20">
            <CardContent>
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6" />
              <p className="text-xl text-gray-600">No pending requests</p>
              <p className="text-gray-400 mt-2">Everything is up to date</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {requests.map((req) => {
              const profile = oldProfiles[req.employeeId];
              const { scalarChanges, addressChanges, newDocuments, hasNewPhoto } = extractChanges(req, profile);
              const hasAnyChange = scalarChanges.length > 0 || addressChanges.length > 0 || newDocuments.length > 0 || hasNewPhoto;

              return (
                <Card key={req.requestId} className="h-full flex flex-col hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3 w-full">
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                          <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span
                            className="truncate block max-w-full"
                            title={req.employeeName}
                          >
                            {req.employeeName}
                          </span>
                        </CardTitle>

                        <CardDescription className="text-xs sm:text-sm">
                          {format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </CardDescription>
                      </div>

                      <div className="max-w-[90px] shrink-0 overflow-hidden">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <Separator className="mb-4" />

                    <div className="space-y-4 flex-1">
                      <p className="text-sm font-semibold text-gray-700">Changes</p>

                      {!hasAnyChange ? (
                        <p className="text-xs text-gray-500">No changes detected</p>
                      ) : (
                        <div className="text-xs space-y-3">
                          {/* Scalar Fields */}
                          
                          {scalarChanges.slice(0, 3).map(([key, newValue]) => {
                            const oldValue = profile?.[key as keyof EmployeeDTO] ?? '—';
                            const showEllipsis =
                              isLongText(oldValue) || isLongText(newValue);

                            return (
                              <div
                                key={key}
                                className="grid grid-cols-3 gap-2 py-1 items-start"
                              >
                                <span className="font-medium truncate">
                                  {formatKey(key)}
                                </span>

                                <span
                                  className="text-center text-red-600 break-words line-clamp-1"
                                  title={String(oldValue)}
                                >
                                  {String(oldValue)}
                                </span>

                                <span
                                  className="text-right text-green-700 font-medium break-words line-clamp-1"
                                  title={String(newValue)}
                                >
                                  {String(newValue)}
                                </span>

                                {/* {showEllipsis && (
                                  <span className="col-span-3 text-right text-[10px] text-gray-500">
                                    (Truncated)
                                  </span>
                                )} */}
                              </div>
                            );
                          })}


                          {/* Address Changes - Only Modified Fields */}
                          {addressChanges.length > 0 && (() => {
                            const groupedAddresses = groupAddressChangesByType(addressChanges);

                            return (
                              <div className="space-y-5">
                                {Object.entries(groupedAddresses).map(([type, changes], idx) => (
                                  <div key={type} className="space-y-3">
                                    <p className="font-semibold text-purple-700 text-sm flex items-center gap-2">
                                      <MapPin className="w-5 h-5" />
                                      Address {idx + 1} ({type})
                                    </p>

                                    {changes.map((change, i) => (
                                      <div
                                        key={`${type}-${i}`}
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
                                        <span className="text-green-700 font-medium text-sm break-words">
                                            {change.new}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}


                          {/* Documents */}
                          {newDocuments.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="font-medium text-indigo-700">New Documents:</p>
                              {newDocuments.slice(0, 2).map((doc: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="truncate">{doc.docType.replace(/_/g, ' ')}</span>
                                  <span className="text-green-600 text-xs">[New]</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Profile Photo */}
                          {hasNewPhoto && (
                            <div className="flex items-center gap-2 text-xs pt-2 border-t">
                              <Camera className="w-4 h-4 text-purple-600" />
                              <span>Profile Photo</span>
                              <span className="text-green-600 text-xs">[New]</span>
                            </div>
                          )}

                          {/* View All Button */}
                          {(
                              scalarChanges.length > 3 ||
                              scalarChanges.some(([_, v]) => isLongText(v)) ||
                              addressChanges.length > 0 ||
                              newDocuments.length > 2 ||
                              hasNewPhoto
                            ) && (
                                <button
                                  className="text-center text-xs text-blue-600 underline pt-2 block w-full"
                                  onClick={() => {
                                    setViewAllChanges({ req, profile });
                                    setSelectedRequest(req);
                                    setIsViewAllOpen(true);
                                  }}
                                >
                                  View all changes
                                </button>
                          )}
                        </div>
                      )}
                    </div>

                    {req.adminComment && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-800 font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Reason for rejection:
                        </p>
                        <p className="text-xs text-red-700 mt-1">{req.adminComment}</p>
                      </div>
                    )}

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 mt-6">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.requestId)} disabled={processing}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => openRejectDialog(req)} disabled={processing}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

          {!hasAnyRequests ? (
            <Card className="text-center py-20">
              <CardContent>
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6" />
                <p className="text-xl text-gray-600">No pending holiday requests</p>
                <p className="text-gray-400 mt-2">Everything is up to date</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {holidayRequests.map((req) => {
              const profile = oldProfiles[req.employeeId];
              const { scalarChanges, addressChanges, newDocuments, hasNewPhoto } = extractChanges(req, profile);
              const hasAnyChange = scalarChanges.length > 0 || addressChanges.length > 0 || newDocuments.length > 0 || hasNewPhoto;

              return (
                <Card key={req.requestId} className="h-full flex flex-col hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3 w-full">
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                          <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="truncate block max-w-full" title={req.employeeName}>
                            {req.employeeName}
                          </span>
                        </CardTitle>

                        <CardDescription className="text-xs sm:text-sm">
                          {format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </CardDescription>
                      </div>

                      <div className="max-w-[90px] shrink-0 overflow-hidden">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  </CardHeader>


                <CardContent className="flex-1 flex flex-col">
                  <Separator className="mb-4" />

                  <div className="space-y-4 flex-1">
                    <p className="text-sm font-semibold text-gray-700">Holiday Changes</p>

                    <div className="space-y-3">
                      {req.updatedData.map((item: any, index: number) => {
                        const isAdd = item.updateType === "ADD_HOLIDAY";
                        const isRemove = item.updateType === "REMOVE_HOLIDAY";

                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border flex items-start gap-3 ${
                              isAdd
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            {/* Icon */}
                            <div className="mt-1">
                              {isAdd ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-xs sm:text-sm">
                              <p className={`font-semibold ${isAdd ? "text-green-700" : "text-red-700"}`}>
                                {isAdd ? "Add Holiday" : "Remove Holiday"}
                              </p>

                              <p className="text-gray-800 mt-1">
                                <span className="font-medium">Name:</span> {item.holidayName}
                              </p>

                              <p className="text-gray-600">
                                <span className="font-medium">Date:</span>{" "}
                                {format(new Date(item.holidayDate), "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin comment (only if rejected earlier) */}
                  {req.adminComment && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800 font-medium flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Reason for rejection:
                      </p>
                      <p className="text-xs text-red-700 mt-1">{req.adminComment}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === "PENDING" && (
                    <div className="flex gap-2 mt-6">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleholidayApprove(req.requestId)}
                        disabled={processing} 
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => openRejectDialog(req)}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>

                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div>
              <Label className="font-semibold">Employee:</Label>
              <p className="text-sm text-gray-700 mt-1">{selectedRequest?.employeeName}</p>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50 p-4 text-xs">
              {(() => {
                if (!selectedRequest || !oldProfiles[selectedRequest.employeeId]) return <p className="text-center text-gray-500">Loading...</p>;

                const { scalarChanges, addressChanges, newDocuments, hasNewPhoto, photoUrl, oldPhotoUrl } = extractChanges(selectedRequest, oldProfiles[selectedRequest.employeeId]);
                const hasAny = scalarChanges.length > 0 || addressChanges.length > 0 || newDocuments.length > 0 || hasNewPhoto;

                if (!hasAny) return <p className="text-center text-gray-500 py-4">No changes detected</p>;

                return (
                  <div className="space-y-4">
                    {scalarChanges.map(([key, newValue]) => {
                      const oldValue = oldProfiles[selectedRequest.employeeId]?.[key as keyof EmployeeDTO] ?? '—';
                      return (
                        <div key={key} className="grid grid-cols-3 py-2 border-b">
                          <span className="font-medium">{formatKey(key)}</span>
                          <span className="text-center text-red-600">{String(oldValue)}</span>
                          <span className="text-right text-green-700">{String(newValue)}</span>
                        </div>
                      );
                    })}

                    {addressChanges.length > 0 && (
                      <div className="space-y-3">
                        <p className="font-semibold text-purple-700">{addressChanges[0].type} Address Changes:</p>
                        {addressChanges.map((change, i) => (
                          <div key={i} className="grid grid-cols-3 py-2 border-b">
                            <span className="font-medium">{change.field}</span>
                            <span className="text-center text-red-600">{change.old}</span>
                            <span className="text-right text-green-700">{change.new}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {newDocuments.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-indigo-700">Uploaded Documents:</p>
                        {newDocuments.map((doc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 border rounded bg-blue-50 p-3">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{doc.docType.replace(/_/g, ' ')}</p>
                                {doc.fileUrl && <a href={doc.fileUrl} target="_blank" className="text-blue-600 text-xs underline">Open File →</a>}
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700">New</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasNewPhoto && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Camera className="w-6 h-6 text-purple-700" />
                          <div>
                            <p className="font-medium">Profile Photo Updated</p>
                            <a href={photoUrl} target="_blank" className="text-blue-600 text-xs underline">View New Photo →</a>
                            {oldPhotoUrl && <p className="text-xs text-gray-600 mt-1">Old: <a href={oldPhotoUrl} target="_blank" className="text-gray-500 underline">View Old</a></p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <Label htmlFor="comment">Comment <span className="text-red-600">*</span></Label>
              <Textarea id="comment" placeholder="Reason for rejection..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} className="mt-2 resize-none" rows={4} />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={processing}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectComment.trim()}>Reject Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Changes Dialog */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>All Changes</DialogTitle>
            <DialogDescription>Complete list for {selectedRequest?.employeeName}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto border bg-gray-50 p-4 rounded-lg text-xs">
            {viewAllChanges && (() => {
              const { req, profile } = viewAllChanges;
              const { scalarChanges, addressChanges, newDocuments, hasNewPhoto, photoUrl, oldPhotoUrl } = extractChanges(req, profile);

              return (
                <div className="space-y-5">
                  {scalarChanges.length > 0 && (
                    <>
                      <p className="font-bold text-gray-700">Field Changes:</p>
                      {scalarChanges.map(([key, newValue]: [string, any]) => {
                        const oldValue = profile?.[key as keyof EmployeeDTO] ?? '—';
                        return (
                          <div key={key} className="grid grid-cols-3 py-2 border-b">
                            <span className="font-medium">{formatKey(key)}</span>
                            <span className="text-center text-red-600">{String(oldValue)}</span>
                            <span className="text-right text-green-700">{String(newValue)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* model */}

                  {addressChanges.length > 0 && (() => {
                    const groupedAddresses = groupAddressChangesByType(addressChanges);

                    return (
                      <>
                        {Object.entries(groupedAddresses).map(([type, changes], idx) => (
                          <div key={type} className="space-y-2 mt-4">
                            <p className="font-bold text-purple-700">
                              Address {idx + 1} ({type})
                            </p>

                            {changes.map((change, i) => (
                              <div key={`${type}-${i}`} className="grid grid-cols-3 py-2 border-b">
                                <span className="font-medium">{change.field}</span>
                                <span className="text-center text-red-600">{change.old}</span>
                                <span className="text-right text-green-700">{change.new}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    );
                  })()}


                  {newDocuments.length > 0 && (
                    <>
                      <p className="font-bold text-indigo-700 mt-4">Uploaded Documents:</p>
                      {newDocuments.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-3 border rounded bg-blue-50 p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{doc.docType.replace(/_/g, ' ')}</p>
                              {doc.fileUrl && <a href={doc.fileUrl} target="_blank" className="text-blue-600 text-xs underline">Open File →</a>}
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">New</Badge>
                        </div>
                      ))}
                    </>
                  )}

                  {hasNewPhoto && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Camera className="w-8 h-8 text-purple-700" />
                        <div className="flex-1">
                          <p className="font-medium">Profile Photo Updated</p>
                          <div className="mt-2 space-y-1 text-xs">
                            <a href={photoUrl} target="_blank" className="text-blue-600 underline block">→ View New Photo</a>
                            {oldPhotoUrl && <a href={oldPhotoUrl} target="_blank" className="text-gray-600 underline block">→ View Current Photo</a>}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">New</Badge>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsViewAllOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}