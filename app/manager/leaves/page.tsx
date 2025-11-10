'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/lib/api/leaveService';
import {
  PageLeaveResponseDTO,
  LeaveResponseDTO,
  PendingLeavesResponseDTO,
  LeaveStatus,
  LeaveCategoryType,
} from '@/lib/api/types';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const Leavespage: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeavesResponseDTO[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status?: LeaveStatus;
    leaveCategory?: LeaveCategoryType;
    month?: string;
    futureApproved?: boolean;
  }>({});
  const [pagination, setPagination] = useState<{
    page: number;
    size: number;
    sort: string;
  }>({
    page: 0,
    size: 5,
    sort: 'fromDate,desc',
  });
  const categoryTypes: LeaveCategoryType[] = ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];

  // Handle authentication redirect
  useEffect(() => {
    if (!user || !accessToken) {
      console.log('🧩 Redirecting to /auth/login due to missing user or accessToken');
      router.push('/auth/login');
    }
  }, [user, accessToken, router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!accessToken || !user || user.role !== 'MANAGER') {
        throw new Error('Unauthorized access. Please log in as a manager.');
      }

      if (activeTab === 'pending') {
        const response = await leaveService.getPendingLeaves();
        console.log('🧩 Pending leaves fetched:', response);
        setPendingLeaves(response);
        setTotalPages(1); // No pagination for pending leaves
      } else if (activeTab === 'all') {
        const response = await leaveService.getLeaveSummary(
          undefined, // Fetch all employees under manager
          filters.month,
          filters.leaveCategory,
          filters.status,
          undefined, // financialType
          filters.futureApproved,
          undefined, // date
          pagination.page,
          pagination.size,
          pagination.sort
        );
        console.log('🧩 All leaves fetched:', response);
        if (!response.flag || !response.response) {
          throw new Error(
            response.message.includes('assignedManager')
              ? 'Unable to load leave data. Some employees may not have assigned managers. Please check employee settings or contact support.'
              : response.message || 'Failed to fetch leave summary'
          );
        }
        setAllLeaves(response.response.content);
        setTotalPages(response.response.totalPages || 1);
      }
    } catch (err: any) {
      setError(
        err.message.includes('assignedManager')
          ? 'Unable to load leave data. Some employees may not have assigned managers. Please check employee settings or contact support.'
          : err.message || 'Failed to load leave data. Please try again.'
      );
      console.error('❌ Error fetching data:', err);
      setAllLeaves([]);
      setPendingLeaves([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, pagination, accessToken, user]);

  useEffect(() => {
    if (user && accessToken) {
      fetchData();
    }
  }, [fetchData, user, accessToken]);

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  // Handle sort changes
  const handleSortChange = (newSort: string) => {
    setPagination((prev) => ({
      ...prev,
      sort: newSort.includes(',desc') ? newSort.replace(',desc', ',asc') : newSort.replace(',asc', ',desc'),
      page: 0,
    }));
  };

  // Handle review leave request
  const handleReviewLeave = (leave: LeaveResponseDTO | PendingLeavesResponseDTO) => {
    Swal.fire({
      title: 'Review Leave Request',
      html: `
        <div class="text-left text-sm text-gray-600 space-y-3">
          <p><strong>Employee:</strong> ${leave.employeeName ?? 'Unknown'}</p>
          <p><strong>Type:</strong> ${leave.leaveCategoryType ? getLabel(leave.leaveCategoryType) : 'N/A'}</p>
          <p><strong>Duration:</strong> ${leave.leaveDuration ?? 0} days</p>
          <p><strong>From Date:</strong> ${leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>To Date:</strong> ${leave.toDate ? new Date(leave.toDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Reason:</strong> ${leave.context ?? 'No reason provided'}</p>
          <p><strong>Status:</strong> ${leave.status ?? 'PENDING'}</p>
          ${leave.attachmentUrl
          ? `<p><strong>Attachment:</strong> <a href="${leave.attachmentUrl}" target="_blank" class="text-indigo-600 hover:underline">View Attachment</a></p>`
          : '<p><strong>Attachment:</strong> None</p>'
        }
          <div>
            <label for="reason" class="block text-sm font-medium text-gray-700">Comment (optional)</label>
            <textarea id="reason" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" rows="4" placeholder="Enter reason for approval or rejection"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      showConfirmButton: true,
      cancelButtonText: 'Cancel',
      denyButtonText: 'Reject',
      confirmButtonText: 'Approve',
      customClass: {
        popup: 'rounded-lg',
        confirmButton: 'bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700',
        denyButton: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700',
        cancelButton: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300',
      },
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value || '';
        return { action: 'approve', reason };
      },
      preDeny: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value || '';
        return { action: 'reject', reason };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { reason } = result.value;
        try {
          await leaveService.updateLeaveStatus(leave.leaveId!, 'APPROVED', reason);
          setConfirmation(`Leave ${leave.leaveId} approved successfully${reason ? ` with reason: "${reason}"` : ''}.`);
          updateLeaveStatus(leave.leaveId!, 'APPROVED');
        } catch (err: any) {
          setError(err.message || 'Failed to approve leave');
        }
      } else if (result.isDenied) {
        const { reason } = result.value;
        try {
          await leaveService.updateLeaveStatus(leave.leaveId!, 'REJECTED', reason);
          setConfirmation(`Leave ${leave.leaveId} rejected successfully${reason ? ` with reason: "${reason}"` : ''}.`);
          updateLeaveStatus(leave.leaveId!, 'REJECTED');
        } catch (err: any) {
          setError(err.message || 'Failed to reject leave');
        }
      }
      setTimeout(() => setConfirmation(null), 3000);
    });
  };

  const updateLeaveStatus = (leaveId: string, status: LeaveStatus) => {
    if (activeTab === 'pending') {
      setPendingLeaves((prev) =>
        prev.map((leave) => (leave.leaveId === leaveId ? { ...leave, status } : leave))
      );
    } else if (activeTab === 'all') {
      setAllLeaves((prev) =>
        prev.map((leave) => (leave.leaveId === leaveId ? { ...leave, status } : leave))
      );
    }
  };

  // Dynamic label generation for leave types
  const getLabel = (value: string): string => {
    const words = value.toLowerCase().split('_');
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-gray-600 mt-4">Loading leaves...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          {error.includes('403') ? 'You do not have permission to view this page. Please contact your administrator.' : error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Confirmation Message */}
      {confirmation && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex justify-between items-center mb-6">
          <span>{confirmation}</span>
          <button
            onClick={() => setConfirmation(null)}
            className="text-green-700 hover:text-green-900"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-0">
        <div className="relative flex items-center justify-center mb-0">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Leaves
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          onClick={() => {
            setActiveTab('pending');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
        >
          Pending Leaves
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          onClick={() => {
            setActiveTab('all');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
        >
          All Leaves
        </button>
      </div>

      {/* Filters for All Leaves */}
      {activeTab === 'all' && (
        <div className="mb-6 bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value as LeaveStatus)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Leave Category</label>
              <select
                value={filters.leaveCategory || ''}
                onChange={(e) => handleFilterChange('leaveCategory', e.target.value as LeaveCategoryType)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
              >
                <option value="">All</option>
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>{getLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Month</label>
              <input
                type="month"
                value={filters.month || ''}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
              />
            </div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-600">Future Approved</label>
              <input
                type="checkbox"
                checked={filters.futureApproved || false}
                onChange={(e) => handleFilterChange('futureApproved', e.target.checked)}
                className="mt-1 ml-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {activeTab === 'pending' ? 'Pending Leave Requests' : 'All Leave Requests'}
        </h3>
        {(activeTab === 'pending' ? pendingLeaves : allLeaves).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button onClick={() => handleSortChange('leaveCategoryType,desc')} className="flex items-center gap-1">
                      Category Type {pagination.sort.includes('leaveCategoryType,desc') ? '↓' : pagination.sort.includes('leaveCategoryType,asc') ? '↑' : ''}
                    </button>
                  </th>

                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button onClick={() => handleSortChange('leaveDuration,desc')} className="flex items-center gap-1">
                      Duration {pagination.sort.includes('leaveDuration,desc') ? '↓' : pagination.sort.includes('leaveDuration,asc') ? '↑' : ''}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Financial Type
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button onClick={() => handleSortChange('fromDate,desc')} className="flex items-center gap-1">
                      From Date {pagination.sort.includes('fromDate,desc') ? '↓' : pagination.sort.includes('fromDate,asc') ? '↑' : ''}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button onClick={() => handleSortChange('toDate,desc')} className="flex items-center gap-1">
                      To Date {pagination.sort.includes('toDate,desc') ? '↓' : pagination.sort.includes('toDate,asc') ? '↑' : ''}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    <button onClick={() => handleSortChange('status,desc')} className="flex items-center gap-1">
                      Status {pagination.sort.includes('status,desc') ? '↓' : pagination.sort.includes('status,asc') ? '↑' : ''}
                    </button>
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                      Remaining Leaves
                    </th>
                  )}
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Attachment
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(activeTab === 'pending' ? pendingLeaves : allLeaves).map((leave) => (
                  <tr key={leave.leaveId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                      {leave.employeeName ?? 'Unknown'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.leaveCategoryType ? getLabel(leave.leaveCategoryType) : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.leaveDuration ?? 0} days
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.financialType ? getLabel(leave.financialType) : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${leave.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : leave.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : leave.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {leave.status ?? 'PENDING'}
                      </span>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                        {(leave as PendingLeavesResponseDTO).remainingLeaves}
                      </td>
                    )}
                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                      {leave.attachmentUrl ? (
                        <a
                          href={leave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base">
                      {leave.status === 'PENDING' && (
                        <button
                          onClick={() => handleReviewLeave(leave)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeTab === 'all' && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 0) }))}
                  disabled={pagination.page === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
                >
                  <ChevronLeft size={20} />
                  <span>Previous</span>
                </button>
                <span className="text-sm text-gray-600">Page {pagination.page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= totalPages - 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No {activeTab === 'pending' ? 'pending' : 'leave'} requests found.</p>
        )}
      </div>
    </div>
  );
};

export default Leavespage;