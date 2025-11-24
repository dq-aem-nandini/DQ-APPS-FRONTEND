'use client';

import React, { useEffect, useState } from 'react';

import { employeeService } from '@/lib/api/employeeService';
import { EmployeeUpdateRequestDTO, EmployeeDTO } from '@/lib/api/types';
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
} from 'lucide-react';

// Format date
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN') : '—';

// Prettify field names
const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const UpdateRequestAdminPage = () => {
  const [requests, setRequests] = useState<EmployeeUpdateRequestDTO[]>([]);
  const [oldProfiles, setOldProfiles] = useState<Record<string, EmployeeDTO>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeUpdateRequestDTO | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load requests',
          text: res.message || '',
          confirmButtonColor: '#2563eb',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Network error',
        text: err.message || '',
        confirmButtonColor: '#2563eb',
      });
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
    Swal.fire({
      title: 'Approving request...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      confirmButtonColor: '#2563eb',
    });
    try {
      const res = await employeeService.approveUpdateRequest(requestId);
      if (res.flag) {
        Swal.fire({
          icon: 'success',
          title: 'Request approved successfully.',
          confirmButtonColor: '#2563eb',
        });
        fetchRequests();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to approve request',
          text: res.message || '',
          confirmButtonColor: '#2563eb',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to approve request',
        text: err.message || 'Network error',
        confirmButtonColor: '#2563eb',
      });
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
    Swal.fire({
      title: 'Rejecting request...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      confirmButtonColor: '#2563eb',
    });
    try {
      const res = await employeeService.rejectUpdateRequest(
        selectedRequest.requestId,
        rejectComment.trim()
      );
      if (res.flag) {
        Swal.fire({
          icon: 'success',
          title: 'Request rejected successfully.',
          confirmButtonColor: '#2563eb',
        });
        fetchRequests();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to reject request',
          text: res.message || '',
          confirmButtonColor: '#2563eb',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to reject request',
        text: err.message || 'Network error',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED')
      return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-4 h-4 mr-1" /> Approved</Badge>;
    if (status === 'REJECTED')
      return <Badge className="bg-red-100 text-red-700"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="relative flex items-center justify-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Update Requests
          </h1>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No update requests</p>
            <p className="text-sm text-gray-400 mt-2">All requests have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => {
            const profile = oldProfiles[req.employeeId];
            let updatedData = req.updatedData;
            if (typeof updatedData === 'string') {
              try { updatedData = JSON.parse(updatedData); } catch { updatedData = {}; }
            }

            const modifiedFields = Object.entries(updatedData || {}).filter(([key, newValue]) => {
              const oldValue = profile?.[key as keyof EmployeeDTO];
              if (newValue === null || newValue === '' || newValue === undefined) return false;
              return String(oldValue) !== String(newValue);
            });

            return (
              <Card key={req.requestId} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        {req.employeeName}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(req.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Modified Fields</p>

                    {modifiedFields.length === 0 ? (
                      <p className="text-xs text-gray-500">No changes</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 text-xs font-semibold text-gray-600 border-b pb-1">
                          <span>Field</span>
                          <span className="text-center">Old</span>
                          <span className="text-right">New</span>
                        </div>

                        {modifiedFields.slice(0, 3).map(([key, newValue]) => {
                          const oldValue = profile?.[key as keyof EmployeeDTO] ?? '—';
                          return (
                            <div key={key} className="grid grid-cols-3 text-xs">
                              <span className="font-medium">{formatKey(key)}</span>
                              <span className="text-center text-red-600 ">
                                {String(oldValue)}
                              </span>
                              <span className="text-right text-green-700 font-medium">
                                {String(newValue)}
                              </span>
                            </div>
                          );
                        })}

                        {modifiedFields.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{modifiedFields.length - 3} more fields
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {req.adminComment && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs">
                      <p className="font-medium text-red-800 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Admin Comment:
                      </p>
                      <p className="text-red-700 mt-1">{req.adminComment}</p>
                    </div>
                  )}

                  {req.status === 'PENDING' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(req.requestId)}
                        disabled={processing}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => openRejectDialog(req)}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Update Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-black font-semibold m-0.5">Employee : {selectedRequest?.employeeName}</Label>
            </div>
            <div>
              <Label>Modified Fields</Label>
              {selectedRequest && oldProfiles[selectedRequest.employeeId] ? (
                (() => {
                  const profile = oldProfiles[selectedRequest.employeeId];
                  let updatedData = selectedRequest.updatedData;
                  if (typeof updatedData === 'string') {
                    try { updatedData = JSON.parse(updatedData); } catch { updatedData = {}; }
                  }

                  const modifiedFields = Object.entries(updatedData || {}).filter(([key, newValue]) => {
                    const oldValue = profile?.[key as keyof EmployeeDTO];
                    if (newValue === null || newValue === '' || newValue === undefined) return false;
                    return String(oldValue) !== String(newValue);
                  });

                  return modifiedFields.length > 0 ? (
                    <div className="mt-3 border rounded-lg bg-gray-50 p-3 max-h-48 overflow-y-auto">
                      {/* Header */}
                      <div className="grid grid-cols-3 text-xs font-bold text-gray-700 border-b pb-2 mb-2">
                        <span>Field</span>
                        <span className="text-center">Old Value</span>
                        <span className="text-right">New Value</span>
                      </div>

                      {/* Rows */}
                      {modifiedFields.slice(0, 8).map(([key, newValue]) => {
                        const oldValue = profile?.[key as keyof EmployeeDTO] ?? '—';
                        return (
                          <div key={key} className="grid grid-cols-3 text-xs py-1.5 border-b last:border-0">
                            <span className="font-medium text-gray-800">{formatKey(key)}</span>
                            <span className="text-center text-red-600">
                              {String(oldValue) || '—'}
                            </span>
                            <span className="text-right text-green-700 font-semibold">
                              {String(newValue)}
                            </span>
                          </div>
                        );
                      })}

                      {/* More indicator */}
                      {modifiedFields.length > 8 && (
                        <p className="text-center text-xs text-gray-500 mt-2 font-medium">
                          +{modifiedFields.length - 8} more field(s)
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">No meaningful changes detected</p>
                  );
                })()
              ) : (
                <p className="text-xs text-gray-500 mt-2">Loading profile data...</p>
              )}
            </div>
            <div>
              <Label htmlFor="comment" className="mb-2 block">Comment (required)</Label>
              <Textarea
                id="comment"
                placeholder="Enter reason..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectComment.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateRequestAdminPage;