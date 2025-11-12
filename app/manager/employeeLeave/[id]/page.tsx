'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { leaveService } from '@/lib/api/leaveService';
import { LeaveResponseDTO, LeaveStatus, WebResponseDTOPageLeaveResponseDTO, LeaveCategoryType, FinancialType } from '@/lib/api/types';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

const EmployeeLeavesPage: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = params?.id as string;
  const employeeName = searchParams.get('name') || 'Employee';

  const [leaves, setLeaves] = useState<LeaveResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<LeaveCategoryType | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | 'All'>('All');
  const [selectedFinancial, setSelectedFinancial] = useState<FinancialType | 'All'>('All');
  const [month, setMonth] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Filter options
  const categories: (LeaveCategoryType | 'All')[] = ['All', 'SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];
  const statuses: (LeaveStatus | 'All')[] = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
  const financials: (FinancialType | 'All')[] = ['All', 'PAID', 'UNPAID'];

  // Fetch employee leaves
  useEffect(() => {
    if (!employeeId) {
      router.push('/manager/employees');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all leaves with large size to get comprehensive data
        const leaveResponse: WebResponseDTOPageLeaveResponseDTO = await leaveService.getLeaveSummary(
          employeeId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          0,
          1000, // Large size to fetch all
          'fromDate,desc'
        );

        if (leaveResponse.flag && leaveResponse.response) {
          setLeaves(leaveResponse.response.content);
        } else {
          throw new Error(leaveResponse.message || 'Failed to fetch leaves');
        }
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch data';
        let errorStatus: number | undefined;
        if (err instanceof Error) {
          try {
            const parsedError = JSON.parse(err.message);
            errorMessage = parsedError.message;
            errorStatus = parsedError.status;
          } catch {
            errorMessage = err.message;
          }
        }
        setError({ message: errorMessage, status: errorStatus });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, router]);

  // Refetch leaves with filters
  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const leaveResponse: WebResponseDTOPageLeaveResponseDTO = await leaveService.getLeaveSummary(
        employeeId,
        month || undefined,
        selectedCategory !== 'All' ? (selectedCategory as LeaveCategoryType) : undefined,
        selectedStatus !== 'All' ? (selectedStatus as LeaveStatus) : undefined,
        selectedFinancial !== 'All' ? (selectedFinancial as FinancialType) : undefined,
        undefined,
        date || undefined,
        0,
        1000,
        'fromDate,desc'
      );

      if (leaveResponse.flag && leaveResponse.response) {
        setLeaves(leaveResponse.response.content);
      } else {
        throw new Error(leaveResponse.message || 'Failed to fetch leaves');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to apply filters';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject leave
  const handleLeaveAction = async (leaveId: string, status: LeaveStatus, comment: string) => {
    try {
      await leaveService.updateLeaveStatus(leaveId, status, comment);
      // Refetch leaves after action
      await applyFilters();
      return true;
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to ${status.toLowerCase()} leave: ${error}`,
        confirmButtonColor: '#2563eb',
      });
      return false;
    }
  };

  // Show action modal for approve/reject (simple confirmation)
  const showActionModal = (leave: LeaveResponseDTO, action: 'approve' | 'reject') => {
    if (leave.status !== 'PENDING' || !leave.leaveId) return;

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const title = action === 'approve' ? 'Approve Leave' : 'Reject Leave';

    Swal.fire({
      title,
      html: `
        <div class="p-4 text-left">
          <p class="text-sm text-gray-600 mb-1"><strong>Category:</strong> ${formatType(leave.leaveCategoryType)}</p>
          <p class="text-sm text-gray-600 mb-1"><strong>From:</strong> ${formatDate(leave.fromDate)}</p>
          <p class="text-sm text-gray-600 mb-1"><strong>To:</strong> ${formatDate(leave.toDate)}</p>
          <p class="text-sm text-gray-600 mb-1"><strong>Reason:</strong> ${leave.context || 'N/A'}</p>
          <div class="mt-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Comment (Optional)</label>
            <textarea id="comment-${leave.leaveId}" class="w-full p-2 border border-gray-300 rounded-lg" rows="3" placeholder="Enter comment"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: action === 'approve' ? 'Approve' : 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: action === 'approve' ? '#16a34a' : '#dc2626',
      cancelButtonColor: '#6b7280',
      width: '500px',
      preConfirm: () => {
        const comment = (document.getElementById(`comment-${leave.leaveId}`) as HTMLTextAreaElement)?.value || '';
        return handleLeaveAction(leave.leaveId!, 'APPROVED', comment);
      },
      preDeny: () => {
        const comment = (document.getElementById(`comment-${leave.leaveId}`) as HTMLTextAreaElement)?.value || '';
        return handleLeaveAction(leave.leaveId!, 'REJECTED', comment);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: `${title} Successfully`,
          text: `The leave request has been ${action}ed.`,
          confirmButtonColor: '#2563eb',
        });
      }
    });
  };

  // Format functions
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatType = (type?: string): string => {
    if (!type) return 'N/A';
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0">
          <BackButton to="/manager/leaves" />
        </div>
        <h1 className="text-3xl font-bold  text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Leaves for {employeeName}
        </h1>
      </div>
      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as LeaveCategoryType | 'All')}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {formatType(cat)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as LeaveStatus | 'All')}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            >
              {statuses.map((stat) => (
                <option key={stat} value={stat}>
                  {formatType(stat)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Financial Type</label>
            <select
              value={selectedFinancial}
              onChange={(e) => setSelectedFinancial(e.target.value as FinancialType | 'All')}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            >
              {financials.map((fin) => (
                <option key={fin} value={fin}>
                  {formatType(fin)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Month (YYYY-MM)</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date (YYYY-MM-DD)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStatus('All');
              setSelectedFinancial('All');
              setMonth('');
              setDate('');
              // Refetch without filters
              router.refresh();
            }}
            className="ml-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-lg mb-8 shadow-md">
          <p className="font-semibold">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Leaves Table */}
      {!loading && !error && (
        <div className="bg-white p-6 rounded-lg shadow-md border overflow-x-auto">
          {leaves.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No leaves found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">From</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">To</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.leaveId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatType(leave.leaveCategoryType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(leave.fromDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(leave.toDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{leave.leaveDuration?.toFixed(2) || '0.00'} days</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {formatType(leave.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => showActionModal(leave, 'approve')}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => showActionModal(leave, 'reject')}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeLeavesPage;