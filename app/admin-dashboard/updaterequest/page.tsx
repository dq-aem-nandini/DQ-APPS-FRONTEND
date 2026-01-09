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
  const [oldProfiles, setOldProfiles] = useState<Record<string, EmployeeDTO>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeUpdateRequestDTO | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [viewAllChanges, setViewAllChanges] = useState<any>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

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

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED')
      return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    if (status === 'REJECTED')
      return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  // Extract all meaningful changes
  const extractChanges = (req: EmployeeUpdateRequestDTO, oldProfile: EmployeeDTO | undefined) => {
    let updatedData = req.updatedData;
    if (typeof updatedData === 'string') {
      try { updatedData = JSON.parse(updatedData); } catch { updatedData = {}; }
    }

    const isAddressDelete = req.requestType === "ADDRESS_DELETE";

    let scalarChanges: any[] = [];
    let addressChanges: { field: string; old: string; new: string; type: string }[] = [];

    // 🚨 Skip all comparison logic for delete requests
    if (req.requestType !== "ADDRESS_DELETE") {

      // Scalar field changes (exclude complex objects)
      scalarChanges = Object.entries(updatedData)
        .filter(([key]) => !['documents', 'addresses', 'employeePhotoUrl', 'employeePhotoUrlString'].includes(key))
        .filter(([_, newValue]) => newValue != null && newValue !== '')
        .filter(([key, newValue]) => {
          const oldValue = oldProfile?.[key as keyof EmployeeDTO];
          return String(oldValue ?? '') !== String(newValue);
        });

      // Address changes - only modified fields
      if (Array.isArray(updatedData.addresses) && updatedData.addresses.length > 0) {
        const newAddr = updatedData.addresses[0];
        const oldAddr = oldProfile?.addresses?.find(a => a.addressType === newAddr.addressType) || {};

        const addrFields: (keyof AddressModel)[] = [
          'houseNo', 'streetName', 'city', 'state', 'country', 'pincode', 'addressType'
        ];

        addrFields.forEach((field) => {
          const oldVal = oldAddr[field as keyof AddressModel] ?? '—';
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
    }

    let newDocuments: any[] = [];
    let photoUrl = null;
    let oldPhotoUrl = "";
    let hasNewPhoto = false;

    // Skip image/document diff logic for delete requests
    if (!isAddressDelete) {
      newDocuments = Array.isArray(updatedData.documents) && updatedData.documents.length > 0
        ? updatedData.documents.filter((d: any) => d.fileUrl || d.documentId)
        : [];

      photoUrl = updatedData.employeePhotoUrl || updatedData.employeePhotoUrlString;
      oldPhotoUrl = oldProfile?.employeePhotoUrl || '';
      hasNewPhoto = !!photoUrl && photoUrl !== oldPhotoUrl;
    }

    return { scalarChanges, addressChanges, newDocuments, photoUrl, oldPhotoUrl, hasNewPhoto };
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin size-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Update Requests
          </h1>
        </div>

        {requests.length === 0 ? (
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
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{req.employeeName}</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <Separator className="mb-4" />

<div className="space-y-4 flex-1">
  <p className="text-sm font-semibold text-gray-700">Changes</p>

  {/* 🔥 ADDRESS DELETE REQUEST UI */}
  {req.requestType === "ADDRESS_DELETE" ? (
    <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs space-y-2">

      <p className="text-red-700 font-semibold">
        Requested to delete the following address:
      </p>

      <div className="text-gray-700 space-y-1">
        <p><strong>House No:</strong> {req.updatedData.houseNo}</p>
        <p><strong>Street:</strong> {req.updatedData.streetName}</p>
        <p><strong>City:</strong> {req.updatedData.city}</p>
        <p><strong>State:</strong> {req.updatedData.state}</p>
        <p><strong>Country:</strong> {req.updatedData.country}</p>
        <p><strong>Pincode:</strong> {req.updatedData.pincode}</p>
        <p><strong>Address Type:</strong> {req.updatedData.addressType}</p>
      </div>

    </div>
  ) : (
    
    /* 🔥 ORIGINAL LOGIC (EMPLOYEE_UPDATE, etc.) */
    <>
      {!hasAnyChange ? (
        <p className="text-xs text-gray-500">No changes detected</p>
      ) : (
        <div className="text-xs space-y-3">

          {/* Scalar Fields */}
          {scalarChanges.slice(0, 3).map(([key, newValue]) => {
            const oldValue = profile?.[key as keyof EmployeeDTO] ?? "—";
            return (
              <div key={key} className="grid grid-cols-3 py-1">
                <span className="font-medium truncate">{formatKey(key)}</span>
                <span className="text-center text-red-600 truncate">{String(oldValue)}</span>
                <span className="text-right text-green-700 font-medium truncate">{String(newValue)}</span>
              </div>
            );
          })}

          {/* Address Changes */}
          {addressChanges.length > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-purple-700 text-sm flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {addressChanges[0].type} Address Changes:
              </p>

              {addressChanges.map((change, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-3 items-start p-3 border rounded-xl bg-purple-50 gap-2"
                >
                  <div className="font-medium text-gray-800 text-sm">{change.field}</div>
                  <div className="sm:text-center">
                    <span className="text-red-600 font-medium text-sm">{change.old}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-700 font-medium text-sm">{change.new}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documents */}
          {newDocuments.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="font-medium text-indigo-700">New Documents:</p>
              {newDocuments.slice(0, 2).map((doc: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="truncate">{doc.docType.replace(/_/g, " ")}</span>
                  <span className="text-green-600 text-xs">[New]</span>
                </div>
              ))}
            </div>
          )}

          {/* Photo */}
          {hasNewPhoto && (
            <div className="flex items-center gap-2 text-xs pt-2 border-t">
              <Camera className="w-4 h-4 text-purple-600" />
              <span>Profile Photo</span>
              <span className="text-green-600 text-xs">[New]</span>
            </div>
          )}

          {/* View All */}
          {(scalarChanges.length > 3 ||
            addressChanges.length > 0 ||
            newDocuments.length > 2 ||
            hasNewPhoto) && (
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
    </>
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
  const { 
    scalarChanges, 
    addressChanges, 
    newDocuments, 
    hasNewPhoto, 
    photoUrl, 
    oldPhotoUrl 
  } = extractChanges(req, profile);

  // 🔥 ADDRESS DELETE FULL UI
  if (req.requestType === "ADDRESS_DELETE") {
    return (
      <div className="space-y-4 text-xs">

        <p className="font-bold text-red-700">Address Deletion Request</p>

        <div className="bg-red-50 border border-red-200 p-3 rounded-lg space-y-1">
          <p><strong>House No:</strong> {req.updatedData.houseNo}</p>
          <p><strong>Street:</strong> {req.updatedData.streetName}</p>
          <p><strong>City:</strong> {req.updatedData.city}</p>
          <p><strong>State:</strong> {req.updatedData.state}</p>
          <p><strong>Country:</strong> {req.updatedData.country}</p>
          <p><strong>Pincode:</strong> {req.updatedData.pincode}</p>
          <p><strong>Address Type:</strong> {req.updatedData.addressType}</p>
        </div>

      </div>
    );
  }

  // 🔥 ORIGINAL UPDATE REQUEST UI
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

      {addressChanges.length > 0 && (
        <>
          <p className="font-bold text-purple-700 mt-4">{addressChanges[0].type} Address Changes:</p>
          {addressChanges.map((change, i) => (
            <div key={i} className="grid grid-cols-3 py-2 border-b">
              <span className="font-medium">{change.field}</span>
              <span className="text-center text-red-600">{change.old}</span>
              <span className="text-right text-green-700">{change.new}</span>
            </div>
          ))}
        </>
      )}

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