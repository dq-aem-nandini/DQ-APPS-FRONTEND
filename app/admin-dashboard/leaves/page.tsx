'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { leaveService } from '@/lib/api/leaveService';
import { adminService } from '@/lib/api/adminService';
import {
  LeaveResponseDTO,
  PendingLeavesResponseDTO,
  LeaveStatus,
  LeaveCategoryType,
  EmployeeDTO
} from '@/lib/api/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

const Leavespage: React.FC = () => {
  const router = useRouter();
  const { state: { accessToken, user } } = useAuth();
  const isHR = user?.role?.roleName === 'HR' || user?.role?.roleName === 'HR_MANAGER';
  const isAdmin = user?.role?.roleName === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'adjust'>('pending');
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeavesResponseDTO[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [adjustPage, setAdjustPage] = useState(0);
  const ADJUST_PAGE_SIZE = 6;
  const searchParams = useSearchParams();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const pendingHighlightLeaveId = useRef<string | null>(null);
  const autoOpenRef = useRef<{
    leaveId: string;
    type: "PENDING" | "WITHDRAWN" | null;
  } | null>(null);
  // Near other state declarations
  const [allEmployees, setAllEmployees] = useState<EmployeeDTO[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const openLeaveId =
    searchParams.get("open") ||
    searchParams.get("highlight") ||
    searchParams.get("requestId");

  const [filters, setFilters] = useState<{
    status?: LeaveStatus;
    leaveCategory?: LeaveCategoryType;
    month?: string;
    futureApproved?: boolean;
    employeeId?: string;
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

  const hasOpenedModal = useRef(false);

  const handleAdjustmentChange = (employeeId: string, value: string) => {
    setAdjustments((prev) => ({
      ...prev,
      [employeeId]: Number(value),
    }));
  };
  useEffect(() => {
    if (!openLeaveId) return;
  
    autoOpenRef.current = {
      leaveId: openLeaveId,
      type: null,
    };
  
    // 🔥 Clear URL so refresh does NOTHING
    router.replace(window.location.pathname, { scroll: false });
  
  }, []); // ⛔ DO NOT ADD DEPENDENCIES
  useEffect(() => {
    if (!openLeaveId) return;
  
    console.log("[INIT] Storing leaveId for auto-open/highlight:", openLeaveId);
  
    autoOpenRef.current = {
      leaveId: openLeaveId,
      type: null,
    };
  
    // Store persistently so it survives URL clear + loading
    pendingHighlightLeaveId.current = openLeaveId;
  
    router.replace(window.location.pathname, { scroll: false });
  }, []);

  useEffect(() => {
    if (!autoOpenRef.current) return;
    if (activeTab !== "pending") return;
    if (hasOpenedModal.current) return; // Prevent double open
  
    const found = pendingLeaves.find(
      l => l.leaveId === autoOpenRef.current!.leaveId
    );
  
    if (!found) return;
  
    console.log("✅ AUTO OPEN → PENDING MODAL");
  
    hasOpenedModal.current = true;
  
    setTimeout(() => {
      handleReviewLeave(found);
      autoOpenRef.current = null;
    }, 5000);
  
  }, [activeTab]); // Removed pendingLeaves to prevent re-trigger

const effectRunCount = useRef(0);

useEffect(() => {
  const targetLeaveId = pendingHighlightLeaveId.current;
  if (!targetLeaveId) return;

  if (hasOpenedModal.current) return;

  // ────────────────────────────────────────────────────────────────
  // Critical: do NOT early-return on loading here anymore
  // We want to keep running even during brief loading phases after page change
  // ────────────────────────────────────────────────────────────────

  const clearAfter = () => {
    pendingHighlightLeaveId.current = null;
    autoOpenRef.current = null;
  };

  // Pending modal (highest priority)
  const pending = pendingLeaves.find(l => l.leaveId === targetLeaveId);
  if (pending) {
    hasOpenedModal.current = true;
    setActiveTab("pending");
    setTimeout(() => {
      handleReviewLeave(pending);
      clearAfter();
    }, 200); // faster modal open
    return;
  }

  // Force tab switch (only once)
  if (activeTab !== "all") {
    setActiveTab("all");
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // Highlight if already visible (fast path)
  // ────────────────────────────────────────────────────────────────
  if (allLeaves.some(l => l.leaveId === targetLeaveId) && rowRefs.current[targetLeaveId]) {
    setTimeout(() => {
      scrollAndHighlight(targetLeaveId);
      hasOpenedModal.current = true;
      clearAfter();
    }, 120);
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // Only do BIG fetch if we haven't already started a jump
  // ────────────────────────────────────────────────────────────────
  if (pendingHighlightLeaveId.current !== targetLeaveId) return;

  (async () => {
    try {
      const BIG_PAGE = 60;

      const res = await leaveService.getLeaveSummary(
        selectedEmployeeId,
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

      const index = res.response.content.findIndex(l => l.leaveId === targetLeaveId);
      if (index === -1) return;

      const targetPage = Math.floor(index / pagination.size);

      // Only jump if we're not already on the correct page
      if (pagination.page !== targetPage) {
        setPagination(prev => ({ ...prev, page: targetPage }));
      }

      // Clear immediately after decision → stops duplicate calls
      pendingHighlightLeaveId.current = null;

      // Wait just long enough for most real APIs + React render
      setTimeout(() => {
        if (rowRefs.current[targetLeaveId]) {
          scrollAndHighlight(targetLeaveId);
        }
        hasOpenedModal.current = true;
        clearAfter();
      }, 800); // 800 ms — sweet spot for most real apps

    } catch {
      // silent in production
      pendingHighlightLeaveId.current = null;
    }
  })();
}, [
  loading,               // still needed — but we no longer early return on it
  activeTab,
  pendingLeaves,
  allLeaves,
  selectedEmployeeId,
  filters.month,
  filters.leaveCategory,
  filters.status,
  filters.futureApproved,
  pagination.sort,
]);

  const handleSubmitAdjustments = async () => {
    const payload = Object.entries(adjustments)
      .filter(([_, value]) => value !== 0 && !isNaN(value))
      .map(([employeeId, adjustment]) => ({
        employeeId,
        adjustment,
      }));

    if (payload.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Changes',
        text: 'Please enter leave adjustments before submitting.',
      });
      return;
    }

    try {
      setSubmitting(true);

      await leaveService.adjustLeaveCount(payload);

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Leave adjustments submitted successfully.',
        timer: 3000,
        showConfirmButton: false,
      });

      // Reset input fields
      setAdjustments({});

      // Refresh employee data
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err.message || 'Failed to adjust leave balances.',
      });
    } finally {
      setSubmitting(false);
    }
  };


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
      if (
        !accessToken ||
        !user ||
        !['ADMIN', 'HR', 'HR_MANAGER'].includes(user.role.roleName)
      ) {
        throw new Error('Unauthorized access. Please log in as an admin or HR.');
      }

      // ────────────────────────────────────────────────
      // Fetch employees when we are in 'all' tab
      // ────────────────────────────────────────────────
      if (activeTab === 'all' && allEmployees.length === 0) {
        try {
          const empRes = await adminService.getAllEmployees();
          if (empRes.flag && empRes.response) {
            // Optional: filter only ACTIVE employees
            const active = empRes.response.filter(e => e.status === 'ACTIVE');
            setAllEmployees(active);
          }
        } catch (err) {
          console.warn("Could not load employee list for filter", err);
          // don't block the whole page — just no dropdown
        }
      }
      if (activeTab === 'pending') {
        const response = await leaveService.getPendingLeaves();
        console.log('🧩 Pending leaves fetched:', response);
        setPendingLeaves(response);
        setTotalPages(1); // No pagination for pending leaves
      } else if (activeTab === 'all') {
        const response = await leaveService.getLeaveSummary(
          selectedEmployeeId, filters.month,
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
      } else if (activeTab === 'adjust') {
        let response;

        if (isHR ) {
          response = await leaveService.getAllEmployeesExceptLoginHR();
        } else if (isAdmin) {
          response = await adminService.getAllEmployees();
        } else {
          throw new Error('Unauthorized access');
        }

        if (!response.flag || !response.response) {
          throw new Error(response.message || 'Failed to fetch employees');
        }

        // Show only ACTIVE employees
        const activeEmployees = response.response.filter(
          (emp: EmployeeDTO) => emp.status === 'ACTIVE'
        );

        setEmployees(activeEmployees);
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
  }, [activeTab, filters, pagination, accessToken, user, selectedEmployeeId, allEmployees.length]);

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
 
  // Handle review leave
  const handleReviewLeave = (
    leave: LeaveResponseDTO | PendingLeavesResponseDTO
  ) => {
    // Close any existing SweetAlert
    if (Swal.isVisible()) {
      Swal.close();
    }

    // Small delay required for SweetAlert + DOM reset
    setTimeout(() => {
      Swal.fire({
        title: "Review Leave Request",
        allowOutsideClick: false,
        allowEscapeKey: false,

        html: `
          <div class="text-left text-sm text-gray-600 space-y-3">
            <p><strong>Employee:</strong> ${leave.employeeName ?? "Unknown"}</p>
            <p><strong>Type:</strong> ${leave.leaveCategoryType
            ? getLabel(leave.leaveCategoryType)
            : "N/A"
          }</p>
            <p><strong>Duration:</strong> ${leave.leaveDuration ?? 0} days</p>
            <p><strong>From Date:</strong> ${leave.fromDate
            ? new Date(leave.fromDate).toLocaleDateString()
            : "N/A"
          }</p>
            <p><strong>To Date:</strong> ${leave.toDate
            ? new Date(leave.toDate).toLocaleDateString()
            : "N/A"
          }</p>
            <p><strong>Reason:</strong> ${leave.context ?? "No reason provided"
          }</p>
            <p><strong>Status:</strong> ${leave.status ?? "PENDING"}</p>
  
            ${leave.attachmentUrl
            ? `<p><strong>Attachment:</strong>
                     <a href="${leave.attachmentUrl}" target="_blank"
                        class="text-indigo-600 hover:underline">
                       View Attachment
                     </a>
                   </p>`
            : "<p><strong>Attachment:</strong> None</p>"
          }
  
            <div>
              <label class="block text-sm font-medium text-gray-700 mt-4">
                Comment (optional)
              </label>
              <textarea
                id="reason"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                       focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows="4"
                placeholder="Enter reason for approval or rejection"
              ></textarea>
            </div>
          </div>
        `,

        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Approve",
        denyButtonText: "Reject",
        cancelButtonText: "Cancel",

        confirmButtonColor: "#4f46e5",
        denyButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",

        preConfirm: () => ({
          action: "approve",
          reason:
            (document.getElementById("reason") as HTMLTextAreaElement)
              ?.value?.trim() || "",
        }),

        preDeny: () => ({
          action: "reject",
          reason:
            (document.getElementById("reason") as HTMLTextAreaElement)
              ?.value?.trim() || "",
        }),
      }).then(async (result) => {
        if (!result.isConfirmed && !result.isDenied) return;

        const { action, reason } = result.value;
        const status = action === "approve" ? "APPROVED" : "REJECTED";

        Swal.fire({
          title: action === "approve" ? "Approving leave..." : "Rejecting leave...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          await leaveService.updateLeaveStatus(
            leave.leaveId!,
            status,
            reason
          );

          updateLeaveStatus(leave.leaveId!, status);

          Swal.fire({
            icon: "success",
            title: "Success!",
            text: `Leave request ${status.toLowerCase()} successfully.`,
            timer: 2500,
            showConfirmButton: false,
          });
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "Failed",
            text:
              err.message ||
              `Failed to ${action} leave request. Please try again.`,
          });
        }
      });
    }, 250); // ⛔ REQUIRED — DO NOT REMOVE
  };

  // Update leave status in state after review
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
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Leave';
  };
  const scrollAndHighlight = (leaveId: string) => {
    const row = rowRefs.current[leaveId];
    if (!row) return;
  
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
    // Strong visual feedback
    row.classList.add(
      'ring-4',
      'ring-indigo-600',
      'ring-opacity-70',
      'bg-indigo-50',
      'shadow-lg',
      'transition-all',
      'duration-700'
    );
  
    setTimeout(() => {
      row.classList.remove(
        'ring-4',
        'ring-indigo-600',
        'ring-opacity-70',
        'bg-indigo-50',
        'shadow-lg'
      );
    }, 8000); // 8 seconds — long enough to be noticed
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

  const paginatedEmployees = employees.slice(
    adjustPage * ADJUST_PAGE_SIZE,
    adjustPage * ADJUST_PAGE_SIZE + ADJUST_PAGE_SIZE
  );

  const adjustTotalPages = Math.ceil(employees.length / ADJUST_PAGE_SIZE);


  return (
    <div className="container mx-auto p-6">
      {/* Confirmation Message
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
      )} */}
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-0">
        <div className="relative flex items-center justify-center mb-0">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Manage Leaves
          </h1>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex space-x-0 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          onClick={() => {
            autoOpenRef.current = null;

            setActiveTab('pending');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
        >
          Pending Leaves
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          onClick={() => {
            autoOpenRef.current = null;
            setActiveTab('all');
            setPagination((prev) => ({ ...prev, page: 0 }));
          }}
        >
          All Leaves
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'adjust'
            ? 'border-b-2 border-indigo-600 text-indigo-600'
            : 'text-gray-600'
            }`}
          onClick={() => {
            setActiveTab('adjust');
            setAdjustPage(0); //  reset pagination
          }}
        >
          Adjust Leaves
        </button>
      </div>

      {/* Filters for All Leaves */}
      {activeTab === 'all' && (
        <div className="mb-6 bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-gray-600">Employee</label>
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  setSelectedEmployeeId(value);
                  setFilters(prev => ({ ...prev, employeeId: value }));
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
              >
                <option value="">All Employees</option>
                {allEmployees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
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
          {activeTab === 'pending'
            ? 'Pending Leave Requests'
            : activeTab === 'all'
              ? 'All Leave Requests'
              : 'Adjust Leaves'}
        </h3>

        {(activeTab === 'pending' || activeTab === 'all') && (
          (activeTab === 'pending' ? pendingLeaves : allLeaves).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                      Employee
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                        Type 
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                        Duration 
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                      Financial Type
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                        From Date 
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                      
                        To Date 
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                     
                        Status 
                    </th>

                    <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                      Attachment
                    </th>

                    {!isHR && (
                      <th className="px-6 py-5 text-center text-sm font-medium text-gray-900 uppercase tracking-wider">
                        Actions
                      </th>
                    )}

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-center">
                  {(activeTab === 'pending' ? pendingLeaves : allLeaves).map((leave) => (
                    <tr
                      key={leave.leaveId}
                      ref={(el) => {
                        if (leave.leaveId) rowRefs.current[leave.leaveId] = el;
                      }}
                      className={`hover:bg-gray-50 transition-colors text-center`}
                    >

                      <td className="px-6 py-5 text-base font-medium text-gray-900 text-center">
                        {leave.employeeName ?? 'Unknown'}
                      </td>

                      <td className="px-6 py-5 text-base text-gray-500 text-center">
                        {leave.leaveCategoryType ? getLabel(leave.leaveCategoryType) : 'N/A'}
                      </td>

                      <td className="px-6 py-5 text-base text-gray-500 text-center">
                        {leave.leaveDuration ?? 0} days
                      </td>

                      <td className="px-6 py-5 text-base text-gray-500 text-center">
                        {leave.financialType ? getLabel(leave.financialType) : 'N/A'}
                      </td>

                      <td className="px-6 py-5 text-base text-gray-500 text-center">
                        {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-6 py-5 text-base text-gray-500 text-center">
                        {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-6 py-5 text-base text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
                        ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}
                    `}
                        >
                          {leave.status ?? 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-base text-center">
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
                          <span className="text-gray-400">None</span>
                        )}
                      </td>

                      {!isHR && (
                        <td className="px-6 py-5 text-base text-center">
                          {leave.status === 'PENDING' ? (
                            <button
                              onClick={() => handleReviewLeave(leave)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                      )}

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
          )
        )}


        {/* ADJUST LEAVES */}
        {activeTab === 'adjust' && (
          <div>
            <p className="mb-4 text-gray-700">
              Adjust employee leave balances manually.
            </p>

            {employees.length === 0 ? (
              <p className="text-gray-500">No active employees found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-sm font-medium text-gray-700">
                        Employee Name
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-gray-700">
                        Available Leaves
                      </th>
                      <th className="px-6 py-4 text-sm font-medium text-gray-700">
                        Add/Sub Leaves
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {paginatedEmployees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {emp.companyEmail}
                        </td>

                        <td className="px-6 py-4 text-indigo-700 font-semibold">
                          {emp.availableLeaves}
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="+ / -"
                            value={adjustments[emp.employeeId] ?? ''}
                            onChange={(e) =>
                              handleAdjustmentChange(emp.employeeId, e.target.value)
                            }
                            className="w-24 text-center border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSubmitAdjustments}
                    disabled={submitting}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Adjustments'}
                  </button>
                </div>
                {adjustTotalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => setAdjustPage((prev) => Math.max(prev - 1, 0))}
                      disabled={adjustPage === 0}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </button>

                    <span className="text-sm text-gray-600">
                      Page {adjustPage + 1} of {adjustTotalPages}
                    </span>

                    <button
                      onClick={() =>
                        setAdjustPage((prev) =>
                          Math.min(prev + 1, adjustTotalPages - 1)
                        )
                      }
                      disabled={adjustPage >= adjustTotalPages - 1}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Leavespage;