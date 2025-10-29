'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leaveService } from '@/lib/api/leaveService';
import {
  LeaveResponseDTO,
  LeaveCategoryType,
  WebResponseDTOPageLeaveResponseDTO,
  LeaveStatus,
} from '@/lib/api/types';

const LeaveList: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const [monthFilter, setMonthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<LeaveCategoryType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const pageSize = 10;

  // ✅ Fetch Leaves
  const fetchLeaves = async (page: number = currentPage) => {
    setLoading(true);
    setError('');
    try {
      const response: WebResponseDTOPageLeaveResponseDTO = await leaveService.getLeaveSummary(
        undefined,
        monthFilter || undefined,
        typeFilter !== 'ALL' ? (typeFilter as LeaveCategoryType) : undefined,
        statusFilter !== 'ALL' ? (statusFilter as LeaveStatus) : undefined,
        undefined,
        undefined,
        undefined,
        page,
        pageSize,
        'fromDate,desc'
      );

      if (response.flag && response.response) {
        setLeaves(response.response.content || []);
        setTotalPages(response.response.totalPages || 0);
        setTotalElements(response.response.totalElements || 0);
      } else {
        setError(response.message || 'Failed to fetch leaves');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [monthFilter, typeFilter, statusFilter, currentPage]);

  // ✅ Delete Leave
  const handleDelete = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave?')) return;
    setDeletingId(leaveId);
    try {
      await leaveService.withdrawLeave(leaveId); // or deleteLeave if backend supports DELETE
      alert('Leave deleted successfully!');
      if (currentPage === totalPages - 1 && leaves.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchLeaves(currentPage);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete leave');
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Withdraw Leave
  const handleWithdraw = async (leaveId: string) => {
    if (!confirm('Are you sure you want to withdraw this leave?')) return;
    setWithdrawingId(leaveId);
    try {
      await leaveService.withdrawLeave(leaveId);
      alert('Leave withdrawn successfully!');
      fetchLeaves(currentPage);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw leave');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">My Leaves</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as LeaveCategoryType | 'ALL')}
          className="border rounded px-2 py-1"
        >
          <option value="ALL">All Types</option>
          <option value="PAID">Paid</option>
          <option value="SICK">Sick</option>
          <option value="CASUAL">Casual</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'ALL')}
          className="border rounded px-2 py-1"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaves.map((leave) => (
              <tr key={leave.leaveId}>
                <td className="px-6 py-4 text-sm">{leave.fromDate}</td>
                <td className="px-6 py-4 text-sm">{leave.toDate}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leave.leaveCategoryType === 'SICK'
                        ? 'bg-orange-100 text-orange-800'
                        : leave.leaveCategoryType === 'CASUAL'
                          ? 'bg-blue-100 text-blue-800'
                          : leave.leaveCategoryType === 'PLANNED'
                            ? 'bg-green-100 text-green-800'
                            : leave.leaveCategoryType === 'UNPLANNED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {leave.leaveCategoryType}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leave.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : leave.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : leave.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {leave.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    href={`/employee-dashboard/leave/${leave.leaveId}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </Link>

                  {leave.status === 'PENDING' && (
                    <>
                      <Link
                        href={`/employee-dashboard/leave/${leave.leaveId}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(leave.leaveId!)}
                        disabled={deletingId === leave.leaveId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === leave.leaveId ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}

                  {leave.status === 'APPROVED' && (
                    <button
                      onClick={() => handleWithdraw(leave.leaveId!)}
                      disabled={withdrawingId === leave.leaveId}
                      className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                    >
                      {withdrawingId === leave.leaveId ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {leaves.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No leaves found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
          disabled={currentPage >= totalPages - 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LeaveList;
