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

// ------------------------
// Format Field Name
// ------------------------
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

  // ⭐ View All changes dialog
  const [viewAllData, setViewAllData] = useState<any[]>([]);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // ------------------------
  // Load Previous Profile
  // ------------------------
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

  // ------------------------
  // Fetch Requests
  // ------------------------
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

  // ------------------------
  // Approve
  // ------------------------
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

  // ------------------------
  // Reject
  // ------------------------
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

  // ------------------------
  // Status Badge
  // ------------------------
  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED')
      return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    if (status === 'REJECTED')
      return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;

    return <Badge className="bg-yellow-100 text-yellow-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  // ------------------------
  // Loading screen
  // ------------------------
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

        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Update Requests
          </h1>
        </div>
        {/* No Requests */}
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
              let updatedData = req.updatedData;

              if (typeof updatedData === 'string') {
                try { updatedData = JSON.parse(updatedData); } catch { updatedData = {}; }
              }

              const modifiedFields = Object.entries(updatedData || {}).filter(([key, newValue]) => {
                const oldValue = profile?.[key as keyof EmployeeDTO];
                if (newValue == null || newValue === '') return false;
                return String(oldValue) !== String(newValue);
              });

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

                      {/* When no changed fields */}
                      {modifiedFields.length === 0 ? (
                        <p className="text-xs text-gray-500">No changes detected</p>
                      ) : (

                        // Changes Grid
                        <div className="text-xs space-y-2">
                          <div className="grid grid-cols-3 font-medium text-gray-600 border-b pb-1">
                            <span>Field</span>
                            <span className="text-center text-red-600">From</span>
                            <span className="text-right text-green-700">To</span>
                          </div>

                          {/* Show first 4 fields */}
                          {modifiedFields.slice(0, 4).map(([key, newValue]) => {
                            const oldValue = profile?.[key as keyof EmployeeDTO] ?? '—';

                            return (
                              <div key={key} className="grid grid-cols-3 py-1">
                                <span className="font-medium truncate">{formatKey(key)}</span>
                                <span className="text-center text-red-600 truncate">{String(oldValue)}</span>
                                <span className="text-right text-green-700 font-medium truncate">{String(newValue)}</span>
                              </div>
                            );
                          })}

                          {/* View All Button */}
                          {modifiedFields.length > 4 && (
                            <button
                              className="text-center text-xs text-blue-600 underline pt-2"
                              onClick={() => {
                                setSelectedRequest(req);
                                setViewAllData(modifiedFields);
                                setIsViewAllOpen(true);
                              }}
                            >
                              +{modifiedFields.length - 4} more (View all)
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Admin Comment (Rejection Reason) */}
                    {req.adminComment && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-800 font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Reason for rejection:
                        </p>
                        <p className="text-xs text-red-700 mt-1">{req.adminComment}</p>
                      </div>
                    )}

                    {/* APPROVE + REJECT */}
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 mt-6">
                        <Button
                          size="sm"
                          className="flex-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(req.requestId)}
                          disabled={processing}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs sm:text-sm border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => openRejectDialog(req)}
                          disabled={processing}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
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
      </div>

      {/* ================================================================== */}
      {/* Reject Request Dialog                                              */}
      {/* ================================================================== */}

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

            {/* Changed fields list */}
            <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50 p-4 text-xs">
              <div className="grid grid-cols-3 font-bold text-gray-700 border-b pb-2 mb-3">
                <span>Field</span>
                <span className="text-center text-red-600">From</span>
                <span className="text-right text-green-700">To</span>
              </div>

              {selectedRequest && oldProfiles[selectedRequest.employeeId] && (
                Object.entries(
                  typeof selectedRequest.updatedData === 'string'
                    ? JSON.parse(selectedRequest.updatedData)
                    : selectedRequest.updatedData || {}
                )
                  .filter(([_, v]) => v != null && v !== '')
                  .slice(0, 10)
                  .map(([key, newValue]) => {
                    const oldValue =
                      oldProfiles[selectedRequest.employeeId]?.[key as keyof EmployeeDTO] ?? '—';

                    return (
                      <div
                        key={key}
                        className="grid grid-cols-3 py-2 border-b last:border-0"
                      >
                        <span className="font-medium truncate">{formatKey(key)}</span>
                        <span className="text-center text-red-600 truncate">{String(oldValue)}</span>
                        <span className="text-right text-green-700 font-medium truncate">
                          {String(newValue)}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <div>
              <Label htmlFor="comment">Comment <span className="text-red-600">*</span></Label>
              <Textarea
                id="comment"
                placeholder="Reason for rejection..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="mt-2 resize-none"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectComment.trim()}
              className="w-full sm:w-auto"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ================================================================== */}
      {/* View All Changes Dialog                                            */}
      {/* ================================================================== */}

      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>All Changes</DialogTitle>
            <DialogDescription>Complete list of modified fields</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto border bg-gray-50 p-4 rounded-lg text-xs sm:text-sm">

            <div className="grid grid-cols-3 font-bold text-gray-700 border-b pb-2 mb-3">
              <span>Field</span>
              <span className="text-center text-red-600">From</span>
              <span className="text-right text-green-700">To</span>
            </div>

            {viewAllData.map(([key, newValue]) => {
              const oldValue =
                oldProfiles[selectedRequest?.employeeId ?? '']?.[key as keyof EmployeeDTO] ??
                '—';

              return (
                <div
                  key={key}
                  className="grid grid-cols-3 py-2 border-b last:border-0"
                >
                  <span className="font-medium truncate">{formatKey(key)}</span>
                  <span className="text-center text-red-600 truncate">{String(oldValue)}</span>
                  <span className="text-right text-green-700 font-medium truncate">
                    {String(newValue)}
                  </span>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => setIsViewAllOpen(false)}>
              Close
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
