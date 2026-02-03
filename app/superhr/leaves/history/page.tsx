'use client';

import { useState, useEffect, useCallback } from 'react';
import { leaveService } from '@/lib/api/leaveService';
import {
  LeaveResponseDTO,
  PageLeaveResponseDTO,
  LeaveStatus,
  LeaveCategoryType,
  ClientMinDTO,
  EmployeeMinDTO,
  ClientEmployeeMinResponseDTO,
} from '@/lib/api/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import BackButton from '@/components/ui/BackButton';
import { manualInvoiceService } from '@/lib/api/manualInvoiceService';

const LeaveHistoryPage = () => {
  const router = useRouter();
  const { state: { user, accessToken } } = useAuth();

  /* =========================
     STATE
  ========================= */
  const [clients, setClients] = useState<ClientMinDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeMinDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [leaveHistory, setLeaveHistory] = useState<PageLeaveResponseDTO>({
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    pageable: {
      paged: true,
      unpaged: false,
      pageNumber: 0,
      pageSize: 5,
      offset: 0,
      sort: { sorted: true, unsorted: false, empty: false },
    },
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
  }>({});

  const [pagination, setPagination] = useState({
    page: 0,
    size: 5,
    sort: 'fromDate,desc',
  });

  const categoryTypes: LeaveCategoryType[] = [
    'SICK',
    'CASUAL',
    'PLANNED',
    'UNPLANNED',
  ];

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    if (!user || !accessToken) {
      router.push('/auth/login');
    }
  }, [user, accessToken, router]);

  /* =========================
     LOAD CLIENTS
  ========================= */
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await manualInvoiceService.getAllClientsMin();
        setClients(res.response || []);
      } catch (e: any) {
        Swal.fire('Error', e.message || 'Failed to load clients', 'error');
      }
    }
    loadClients();
  }, []);

  /* =========================
     LOAD EMPLOYEES BY CLIENT
  ========================= */
  useEffect(() => {
    if (!selectedClientId) {
      setEmployees([]);
      setSelectedEmployeeId('');
      return;
    }

    async function loadEmployees() {
      try {
        const res = await manualInvoiceService.getEmployeesByClientId(selectedClientId);
        const data: ClientEmployeeMinResponseDTO | undefined = res.response || undefined;
        setEmployees(data?.employees || []);
      } catch (e: any) {
        Swal.fire('Error', e.message || 'Failed to load employees', 'error');
      }
    }

    loadEmployees();
  }, [selectedClientId]);

  /* =========================
     FETCH LEAVE HISTORY
     (FILTERED BY EMPLOYEE)
  ========================= */
  const fetchLeaveHistory = useCallback(async () => {
    console.log("🔄 fetchLeaveHistory called");
    console.log("👤 employeeId:", selectedEmployeeId);
    console.log("📄 pagination:", pagination);

    if (!selectedEmployeeId) {
      console.warn("⛔ No employee selected, skipping fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await leaveService.getLeaveSummary(
        selectedEmployeeId,
        filters.month,
        filters.leaveCategory,
        filters.status,
        undefined,
        undefined,
        undefined,
        pagination.page,
        pagination.size,
        pagination.sort
      );

      console.log("✅ leave-summary response:", response);

      if (!response.flag || !response.response) {
        console.error("❌ Invalid response structure");
        setLeaveHistory(prev => ({
          ...prev,
          content: [],
          empty: true,
        }));
        return;
      }

      setLeaveHistory(response.response);

    } catch (err: any) {
      console.error("❌ leave-summary failed:", err);
      setLeaveHistory(prev => ({
        ...prev,
        content: [],
        empty: true,
      }));
    } finally {
      setLoading(false);
    }
  }, [
    selectedEmployeeId,
    filters,
    pagination,
  ]);



  useEffect(() => {
    if (!selectedEmployeeId) return;
    fetchLeaveHistory();
  }, [selectedEmployeeId]);




  /* =========================
     DELETE (SUPER_HR)
  ========================= */
  const handleDeleteLeave = async (leaveId: string) => {
    const result = await Swal.fire({
      title: 'Delete Leave',
      text: 'Are you sure you want to delete this leave?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const backendMessage = await leaveService.deleteLeaveBySuperHR(leaveId);

      // ✅ REMOVE ROW LOCALLY
      setLeaveHistory(prev => {
        const updated = prev.content.filter(l => l.leaveId !== leaveId);

        return {
          ...prev,
          content: updated,
          totalElements: Math.max(prev.totalElements - 1, 0),
          empty: updated.length === 0,
        };
      });

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: backendMessage,
      });

    } catch (e: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message,
      });
    }
  };




  /* =========================
     HELPERS
  ========================= */
  const getLabel = (value: string, isCategory = false) => {
    const words = value.toLowerCase().split('_');
    const label = words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return isCategory ? `${label} Leave` : label;
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <BackButton to="/superhr/leaves" />
        <h1 className="text-3xl font-bold text-indigo-600">
          Leave History
        </h1>
        <div className="w-20" />
      </div>

      {/* Client & Employee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <select
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setPagination(p => ({ ...p, page: 0 }));
          }}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.clientId} value={c.clientId}>
              {c.companyName}
            </option>
          ))}
        </select>

        <select
          value={selectedEmployeeId}
          onChange={(e) => {
            setSelectedEmployeeId(e.target.value);
            setPagination(p => ({ ...p, page: 0 }));
          }}
          disabled={!selectedClientId}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">
            {!selectedClientId ? 'Select client first' : 'Select employee'}
          </option>

          {employees.map(emp => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.employeeName}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {leaveHistory.content.map(leave => (
              <tr key={leave.leaveId}>
                <td className="px-4 py-3">{leave.employeeName}</td>
                <td className="px-4 py-3">{getLabel(leave.leaveCategoryType!, true)}</td>
                <td className="px-4 py-3">{leave.status}</td>
                <td>{new Date(leave.fromDate!).toLocaleDateString()}</td>
                <td className="px-4 py-3">{leave.toDate}</td>
                <td className="px-4 py-3">{leave.leaveDuration} days</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDeleteLeave(leave.leaveId!)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {leaveHistory.content.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No leave history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveHistoryPage;
