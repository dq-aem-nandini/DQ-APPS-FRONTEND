'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { leaveService } from '@/lib/api/leaveService';
import { LeaveResponseDTO, PageLeaveResponseDTO, LeaveStatus, LeaveCategoryType, EmployeeDTO } from '@/lib/api/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';
import { employeeService } from '@/lib/api/employeeService';

const LeaveHistoryPage = () => {
  const router = useRouter();
  const { state: { user, accessToken } } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const hasHighlightedRef = useRef(false);
  const searchParams = useSearchParams();
  const highlightedLeaveId = searchParams.get("requestId");
  const [tempHighlightId, setTempHighlightId] = useState<string | null>(null);
  const pendingPageJumpRef = useRef<string | null>(null);

  const [leaveHistory, setLeaveHistory] = useState<PageLeaveResponseDTO>({
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    pageable: { paged: true, unpaged: false, pageNumber: 0, pageSize: 5, offset: 0, sort: { sorted: true, unsorted: false, empty: false } },
    size: 5,
    content: [],
    number: 0,
    sort: { sorted: true, unsorted: false, empty: false },
    empty: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Enum values
  const categoryTypes: LeaveCategoryType[] = ['SICK', 'CASUAL', 'PLANNED', 'UNPLANNED'];
  useEffect(() => {
    const loadEmployee = async () => {
      console.log("📌 [INIT] Fetching employee details...");

      try {
        const emp = await employeeService.getEmployeeById();

        console.log("🟢 [EMPLOYEE LOADED] EmployeeDTO:", {
          employeeId: emp.employeeId,
          reportingManagerId: emp.reportingManagerId,
          name: emp.firstName + " " + emp.lastName,
        });

        setEmployee(emp);
      } catch (error) {
        console.error("❌ [EMPLOYEE ERROR] Failed to load EmployeeDTO", error);
      }
    };

    loadEmployee();
  }, []);
  useEffect(() => {
    if (!highlightedLeaveId) return;
    if (hasHighlightedRef.current) return;

    console.log("Setting temporary highlight for:", highlightedLeaveId);

    setTempHighlightId(highlightedLeaveId);
    pendingPageJumpRef.current = highlightedLeaveId;
    hasHighlightedRef.current = true;


    // Clean up URL (you already have this — good)
    router.replace(window.location.pathname, { scroll: false });

    // Remove highlight after ~4 seconds
    const timer = setTimeout(() => {
      setTempHighlightId(null);
      console.log("Highlight removed via state");
    }, 4000);

    return () => clearTimeout(timer);
  }, [highlightedLeaveId, router]);

  useEffect(() => {
    const targetLeaveId = pendingPageJumpRef.current;
    if (!targetLeaveId) return;
    if (!employee?.employeeId) return;

    // Already on correct page → stop
    if (leaveHistory.content.some(l => l.leaveId === targetLeaveId)) {
      pendingPageJumpRef.current = null;
      return;
    }

    (async () => {
      try {
        const BIG_PAGE = 200;

        const res = await leaveService.getLeaveSummary(
          employee.employeeId,
          filters.month,
          filters.leaveCategory,
          filters.status,
          undefined,
          filters.futureApproved,
          undefined,
          0,
          BIG_PAGE,
          pagination.sort
        );

        if (!res.flag || !res.response?.content) return;

        const index = res.response.content.findIndex(
          l => l.leaveId === targetLeaveId
        );
        if (index === -1) return;

        const targetPage = Math.floor(index / pagination.size);

        console.log("🟢 PAGINATION JUMP →", targetPage);

        setPagination(prev => ({ ...prev, page: targetPage }));

        pendingPageJumpRef.current = null;

      } catch (err) {
        console.error("❌ Page jump failed", err);
        pendingPageJumpRef.current = null;
      }
    })();
  }, [
    employee,
    leaveHistory.content,
    filters.month,
    filters.leaveCategory,
    filters.status,
    filters.futureApproved,
    pagination.sort
  ]);

  useEffect(() => {
    console.log("📄 CURRENT PAGE:", pagination.page);
  }, [pagination.page]);



  // Fetch leave history
  const fetchLeaveHistory = useCallback(async () => {
    if (!user || !accessToken) {
      setError("Please log in to view leave history.");
      router.push("/auth/login");
      return;
    }

    if (!employee?.employeeId) {
      console.log("⛔ Employee not loaded yet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await leaveService.getLeaveSummary(
        employee.employeeId,         // ✅ FIXED
        filters.month,
        filters.leaveCategory,
        filters.status,
        undefined,
        filters.futureApproved,
        undefined,
        pagination.page,
        pagination.size,
        pagination.sort
      );

      if (!response.flag || !response.response) {
        throw new Error(response.message || "Failed to fetch leave history");
      }

      setLeaveHistory(response.response);
    } catch (err: any) {
      setError(err.message || "Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  }, [employee, user, accessToken, filters, pagination, router]);


  // Handle withdraw leave request with SweetAlert2
  const handleWithdrawLeave = async (leaveId: string) => {
    const result = await Swal.fire({
      title: 'Withdraw Leave Request',
      text: 'Are you sure you want to withdraw this leave request? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-lg shadow-xl p-6 bg-white',
        title: 'text-xl font-semibold text-gray-800 mb-4',
        htmlContainer: 'text-gray-600 mb-6',
        confirmButton: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-300',
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await leaveService.withdrawLeave(leaveId);
        console.log('🧩 Leave withdrawn successfully:', response);
        await fetchLeaveHistory();
        Swal.fire({
          title: 'Success',
          text: 'Leave request withdrawn successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-lg shadow-xl p-6 bg-white',
            title: 'text-lg font-semibold text-gray-800',
            htmlContainer: 'text-gray-600',
          },
        });
      } catch (err: any) {
        console.error('❌ Error withdrawing leave:', err);
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to withdraw leave request. Please try again.',
          icon: 'error',
          customClass: {
            popup: 'rounded-lg shadow-xl p-6 bg-white',
            title: 'text-lg font-semibold text-gray-800',
            htmlContainer: 'text-gray-600',
          },
        });
      }
    }
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= leaveHistory.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Initial fetch for leave history
  // useEffect(() => {
  //   fetchLeaveHistory();
  // }, [fetchLeaveHistory]);
  useEffect(() => {
    if (employee) {
      fetchLeaveHistory();
    }
  }, [employee, fetchLeaveHistory]);


  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };
  // Dynamic label generation from enum value
  const getLabel = (value: string, isCategory: boolean = false): string => {
    const words = value.toLowerCase().split('_');
    const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return isCategory ? `${capitalized} Leave` : capitalized;
  };
  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/auth/login');
    }
  }, [user, accessToken, router]);

  if (!user || !accessToken) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Redirecting to login...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-10 flex items-center justify-between">
        <BackButton to="/dashboard/leaves" />
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Leave History
        </h1>
        <div className="w-20" />
      </div>
      {/* Filters */}
      <div className="mb-6 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as LeaveStatus)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
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
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              <option value="">All</option>
              {categoryTypes.map((type) => (
                <option key={type} value={type}>{getLabel(type, true)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Month</label>
            <input
              type="month"
              value={filters.month || ''}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-600">Future Approved</label>
            <input
              type="checkbox"
              checked={filters.futureApproved || false}
              onChange={(e) => handleFilterChange('futureApproved', e.target.checked)}
              className="mt-1 ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Approver
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  From Date
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  To Date
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">Context</th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">Manager Comment</th>
                <th className="px-4 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveHistory.content.length > 0 ? (
                leaveHistory.content.map((leave: LeaveResponseDTO) => (
                  <tr
                    key={leave.leaveId}
                    id={`leave-${leave.leaveId}`}
                    className={`
    hover:bg-gray-50 transition-all duration-300
    ${tempHighlightId === leave.leaveId
                        ? "ring-4 ring-indigo-600 bg-indigo-100 shadow-lg scale-[1.015] z-10 relative"
                        : ""
                      }
  `}
                  >
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.approverName || '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.leaveCategoryType ? getLabel(leave.leaveCategoryType, true) : '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.status || '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.leaveDuration ? `${leave.leaveDuration} days` : '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.context || '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">
{leave.approverComment || '-'}</td>
                    <td className="px-4 py-5 text-base text-gray-900 text-center align-middle">

                      {
                      leave.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/leaves/applyleave?leaveId=${leave.leaveId}`)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => leave.leaveId && handleWithdrawLeave(leave.leaveId)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                          >
                            Withdraw
                          </button>
                        </div>
                        
                      ) || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-5 text-center text-base text-gray-500">
                    No leave history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <button
          disabled={leaveHistory.first}
          onClick={() => handlePageChange(pagination.page - 1)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-300"
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {pagination.page + 1} of {leaveHistory.totalPages || 1}
        </span>
        <button
          disabled={leaveHistory.last}
          onClick={() => handlePageChange(pagination.page + 1)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LeaveHistoryPage;

